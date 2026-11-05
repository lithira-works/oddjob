-- Identity checks. Run after 0001_init.sql. Written but never run.
-- Rules this enforces:
--   * ID photos sit in a private bucket with no visitor access. Only the server reaches them.
--   * The same ID can't open two accounts: a keyed hash of the number is unique.
--   * Visitors can't write checks or approve themselves. Approval only happens through review_identity().
--   * Only a checked person can post a job, and answer_job already requires a checked provider.

create type identity_status as enum ('pending', 'approved', 'rejected');

alter table profiles add column id_checked_at timestamptz;

create table identity_checks (
  user_id uuid primary key references profiles on delete cascade,
  doc_type text not null check (doc_type in ('nic', 'licence', 'passport')),
  legal_name text not null check (char_length(legal_name) between 3 and 100),
  id_number_hmac text not null unique,
  id_last4 text not null check (char_length(id_last4) = 4),
  front_path text not null,
  back_path text,
  selfie_path text not null,
  status identity_status not null default 'pending',
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  purge_after timestamptz
);

alter table identity_checks enable row level security;
create policy "own identity status" on identity_checks for select using (user_id = auth.uid());

-- A person sees their status. Their stored name, number hash and file paths stay with the server.
revoke all on identity_checks from anon, authenticated;
grant select (user_id, doc_type, status, rejection_reason, submitted_at, reviewed_at) on identity_checks to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-documents', 'id-documents', false, 8388608, array['image/jpeg']);
-- Deliberately no policies on storage.objects for this bucket: signed-in users and visitors get nothing.

drop policy "household creates job" on jobs;
create policy "checked household creates job" on jobs for insert with check (
  household_id = auth.uid()
  and exists (select 1 from profiles p where p.id = auth.uid() and p.id_checked_at is not null)
);

-- For the reviewer, from the SQL Editor or a future admin server. No visitor can call it.
-- Approving a check also schedules the ID photos for deletion, 30 days on.
create function review_identity(person uuid, approve boolean, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not approve and coalesce(trim(reason), '') = '' then raise exception 'a rejection needs a reason'; end if;
  update public.identity_checks
    set status = case when approve then 'approved'::public.identity_status else 'rejected'::public.identity_status end,
        rejection_reason = case when approve then null else reason end,
        reviewed_at = now(),
        purge_after = now() + interval '30 days'
    where user_id = person and status = 'pending';
  if not found then raise exception 'no pending check for this person'; end if;
  if approve then
    update public.profiles set id_checked_at = now() where id = person;
    update public.providers set id_checked_at = now() where id = person;
  end if;
  insert into public.audit_log (action, target) values (case when approve then 'identity-approved' else 'identity-rejected' end, person::text);
end;
$$;
revoke all on function review_identity(uuid, boolean, text) from public, anon, authenticated;
