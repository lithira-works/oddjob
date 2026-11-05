-- Oddjob schema with Row Level Security. Not applied yet: needs a Supabase project (Phase 1).
-- Rules this enforces:
--   * Visitors see only how many jobs are open per trade, never a job's words or area.
--   * Only an ID-checked, unsuspended provider sees open jobs: words and rough area.
--   * A provider sees the rough area until they answer, and the exact address only when booked.
--   * Credit balance comes from an append-only ledger with idempotency keys.
--   * Contact details live apart from public profiles.

create extension if not exists postgis;
create extension if not exists vector;

create type user_role as enum ('household', 'provider', 'admin');
create type job_status as enum ('open', 'quoted', 'booked', 'done', 'guaranteed', 'cancelled', 'disputed');
create type ledger_kind as enum ('top-up', 'answer-job', 'refund-fake-lead', 'admin-adjustment');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'household',
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Private: never exposed through a public view.
create table contact_details (
  user_id uuid primary key references profiles on delete cascade,
  phone_e164 text not null unique,
  masked_number text
);

create table providers (
  id uuid primary key references profiles on delete cascade,
  trade_slugs text[] not null,
  about text not null default '',
  service_area geography(point, 4326),
  service_radius_km int not null default 10 check (service_radius_km between 1 and 200),
  id_checked_at timestamptz,
  suspended_at timestamptz
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references profiles on delete cascade,
  words text not null check (char_length(words) between 2 and 500),
  trade_slug text,
  rough_area geography(point, 4326) not null,
  rough_area_label text not null,
  needed_by text not null default 'flexible',
  status job_status not null default 'open',
  booked_provider_id uuid references providers,
  embedding vector(1024),
  created_at timestamptz not null default now()
);

-- Separate table, so a policy mistake on jobs cannot expose an address.
create table job_addresses (
  job_id uuid primary key references jobs on delete cascade,
  address_ciphertext bytea not null,
  purge_after timestamptz
);

create table job_answers (
  job_id uuid not null references jobs on delete cascade,
  provider_id uuid not null references providers on delete cascade,
  quote_minor bigint check (quote_minor >= 0),
  created_at timestamptz not null default now(),
  primary key (job_id, provider_id)
);

create table messages (
  id bigint generated always as identity primary key,
  job_id uuid not null,
  provider_id uuid not null,
  sender_id uuid not null references profiles,
  body text not null check (char_length(body) between 1 and 500),
  flagged_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  foreign key (job_id, provider_id) references job_answers on delete cascade
);

-- Append-only. Balance = sum(amount).
create table credit_ledger (
  id bigint generated always as identity primary key,
  provider_id uuid not null references providers on delete restrict,
  idempotency_key text not null,
  kind ledger_kind not null,
  amount int not null check (amount <> 0),
  job_id uuid references jobs,
  created_at timestamptz not null default now(),
  unique (provider_id, idempotency_key)
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

create index jobs_area_idx on jobs using gist (rough_area);
create index jobs_status_idx on jobs (status, created_at desc);
create index ledger_provider_idx on credit_ledger (provider_id);

-- Helpers
create function provider_answered(target_job uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.job_answers a where a.job_id = target_job and a.provider_id = auth.uid());
$$;

create function credit_balance(target_provider uuid) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(l.amount), 0) from public.credit_ledger l where l.provider_id = target_provider;
$$;

-- All a visitor may learn about jobs: a count per trade. No words, areas or people.
create function open_job_counts() returns table (trade_slug text, open_jobs bigint)
language sql stable security definer set search_path = '' as $$
  select j.trade_slug, count(*) from public.jobs j
  where j.status in ('open', 'quoted') and j.trade_slug is not null
  group by j.trade_slug;
$$;

-- Atomic: locks the provider, refuses overdraft, full jobs and repeat charges.
create function answer_job(target_job uuid, cost int, max_replies int default 5) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null or cost <= 0 then raise exception 'not allowed'; end if;
  perform 1 from public.providers p where p.id = me and p.suspended_at is null and p.id_checked_at is not null for update;
  if not found then raise exception 'provider not eligible'; end if;
  if exists (select 1 from public.job_answers a where a.job_id = target_job and a.provider_id = me) then return; end if;
  perform 1 from public.jobs j where j.id = target_job and j.status in ('open', 'quoted') for update;
  if not found then raise exception 'job closed'; end if;
  if (select count(*) from public.job_answers a where a.job_id = target_job) >= max_replies then raise exception 'job full'; end if;
  if public.credit_balance(me) < cost then raise exception 'insufficient credits'; end if;
  insert into public.credit_ledger (provider_id, idempotency_key, kind, amount, job_id)
    values (me, 'answer:' || target_job::text, 'answer-job', -cost, target_job);
  insert into public.job_answers (job_id, provider_id) values (target_job, me);
end;
$$;

-- Row Level Security: deny by default.
alter table profiles enable row level security;
alter table contact_details enable row level security;
alter table providers enable row level security;
alter table jobs enable row level security;
alter table job_addresses enable row level security;
alter table job_answers enable row level security;
alter table messages enable row level security;
alter table credit_ledger enable row level security;
alter table audit_log enable row level security;

-- Provider profiles are public. A household's name goes only to the person they booked.
create policy "profiles readable" on profiles for select using (
  id = auth.uid()
  or role = 'provider'
  or exists (select 1 from jobs j where j.household_id = profiles.id and j.booked_provider_id = auth.uid())
);
create policy "own profile update" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select p.role from profiles p where p.id = auth.uid()));

create policy "own contact details" on contact_details for select using (user_id = auth.uid());

create policy "providers readable" on providers for select using (suspended_at is null or id = auth.uid());
create policy "own provider update" on providers for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "household sees own jobs" on jobs for select using (household_id = auth.uid());
create policy "providers see open jobs" on jobs for select using (
  status in ('open', 'quoted') and exists (
    select 1 from providers p where p.id = auth.uid() and p.suspended_at is null and p.id_checked_at is not null
  )
);
create policy "answering provider sees job" on jobs for select using (provider_answered(id));
create policy "household creates job" on jobs for insert with check (household_id = auth.uid());
create policy "household updates job" on jobs for update using (household_id = auth.uid()) with check (household_id = auth.uid());

-- The exact address: the household, or the booked provider while the job is live.
create policy "address visible" on job_addresses for select using (
  exists (
    select 1 from jobs j where j.id = job_id and (
      j.household_id = auth.uid()
      or (j.booked_provider_id = auth.uid() and j.status = 'booked')
    )
  )
);
create policy "household adds address" on job_addresses for insert with check (
  exists (select 1 from jobs j where j.id = job_id and j.household_id = auth.uid())
);

create policy "answers visible to both sides" on job_answers for select using (
  provider_id = auth.uid() or exists (select 1 from jobs j where j.id = job_id and j.household_id = auth.uid())
);

create policy "messages visible to both sides" on messages for select using (
  provider_id = auth.uid() or exists (select 1 from jobs j where j.id = job_id and j.household_id = auth.uid())
);
-- Inserts go through a server route that screens the text with the service role, so none here.

create policy "own ledger" on credit_ledger for select using (provider_id = auth.uid());
-- Ledger and audit log have no client write policies. Writes happen only in answer_job or on the server.

revoke update (id_checked_at, suspended_at) on providers from authenticated;
revoke all on function answer_job(uuid, int, int) from public;
grant execute on function answer_job(uuid, int, int) to authenticated;
revoke all on function open_job_counts() from public;
grant execute on function open_job_counts() to anon, authenticated;
