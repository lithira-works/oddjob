# Architecture

## Stack

| Layer | Choice | Status |
| --- | --- | --- |
| Framework | Next.js 16, React 19, TypeScript 5.9 | In use |
| Styling | Tailwind 4 with custom tokens and hand-written component classes. No default component look | In use |
| Motion | GSAP ScrollTrigger for the hero, CSS for everything else | In use |
| Validation | Zod | In use |
| Tests | Vitest | In use |
| AI | Claude API through `@anthropic-ai/sdk`. Default `claude-opus-5-5`, at low effort | Code ready, not run live |
| Data | Postgres with PostGIS and pgvector, through Supabase | Schema drafted |
| Sign-in, chat | Phone OTP, Supabase Realtime | Planned |
| Payments | Sri Lanka first: PayHere is the candidate, with split payments and holds still to confirm. See [LAUNCH-SRI-LANKA.md](LAUNCH-SRI-LANKA.md). Later countries choose their own provider behind one interface | Planned |
| Other | Installable PWA, MapLibre, PostHog, Sentry | Planned |

TypeScript is held at 5.9 for compatibility. npm's latest major at build time was 7.

## Request flow today

```
Browser -> proxy.ts (nonce, CSP, headers) -> server-rendered page
JobFlow -> POST /api/messages/screen -> contact-screen.ts
```

Job, reply and credit state lives in the browser, and `lib/data/` supplies the samples.

## Request flow after Phase 1

```
Browser -> proxy.ts -> page -> Supabase with the user's token -> Row Level Security
Household text -> /api/interpret -> Claude -> validated job card
Chat message -> server route -> contact-screen -> messages table
Reply to a job -> answer_job() -> ledger and answer in one transaction
Payment provider -> signed webhook -> ledger with idempotency key
```

## Replacing the sample data

1. Apply `supabase/migrations/0001_init.sql`.
2. Write Row Level Security tests that sign in as two users and try to read each other's data.
3. Replace imports from `lib/data/providers.ts` and `lib/data/jobs.ts` with queries.
4. Move `lib/credits.ts` checks to the `answer_job` function. Keep the file for showing the ledger.
5. Change `/job?q=` to POST once real jobs are stored.
6. Remove "sample" notes only when the data they describe is real.

## Key decisions

- **Exact addresses have their own table,** so a mistake in a `jobs` policy cannot expose one.
- **The ledger is append-only.** Balance is a sum, so it cannot drift from history.
- **The keyword matcher stays after Claude arrives.** It is the fallback when the API fails or refuses, and emergency wording should never depend on a network call.
- **Refusals fall back locally.** The code handles a Claude refusal with the keyword matcher instead of the API's server-side `fallbacks` option. Review that choice when the route goes live.
