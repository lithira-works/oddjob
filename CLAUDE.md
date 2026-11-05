# Oddjob

Marketplace connecting households with tradespeople. Next.js 16, React 19, TypeScript, Tailwind 4, GSAP. Read `docs/STATUS.md` first: this is a preview, and much of the data is sample data.

## Commands

- `npm run dev`: development server
- `npm run check`: type check, tests and production build. Run before saying work is done
- `npm test`: unit tests only
- `npm run admin:create -- your-email`: creates or replaces the admin account. Prints the password once, so run it in your own terminal
- `npm run privacy`: scans files staged for git for secrets and personal data. Runs on pre-commit after `npm run hooks`, and in CI

## Rules that are easy to break

**Design.** Use the `oddjob-design` skill for any UI change. No gradients, shadows at rest, glass, icon cards, pill badges, labels above headings, monospace, numbered steps or emoji. Headlines stay at two lines or fewer at every width. Colours and sizes come only from tokens in `app/globals.css`.

**Pictures.** Every picture needs an entry in `lib/data/credits.json` and `docs/CREDITS.md`. A found picture never poses as an Oddjob customer, worker or job. No AI-generated or stock people.

**Honesty.** Never invent customers, reviews, ratings, user counts or press. Sample data stays labelled on screen as sample data. Do not claim a feature works if it is only simulated.

**Privacy.** Real job words and rough areas go only to signed-in, ID-checked providers and the household itself. Visitors get a count per trade. A provider sees a rough area until booked. The exact address goes only to the booked provider, and only while the job is live. Never log job text, messages, addresses or phone numbers. Never put personal data in URLs, except the household's own job words in `/job?q=`.

**Money.** The credit balance is always derived from the ledger and never trusted from the browser. Every credit movement needs an idempotency key. Card data never touches our servers.

**Secrets.** Only `.env.example` is committed. `SUPABASE_SERVICE_ROLE_KEY`, `ID_HASH_SECRET`, `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` stay on the server: never prefix them with `NEXT_PUBLIC_`.

**Admin.** Every page under `app/admin/` calls `requireAdmin()` before reading any data. Never link to `/admin` from a public page, and never show a key's value on the dashboard.

**Identity.** ID photos and numbers never reach logs, URLs or browser storage. Every API route uses `readJson` or the same checks. Do not set `ID_CHECKS_OPEN=true` until the list in `docs/SECURITY.md` is met. Never claim a check proves a document is genuine.

**AI input.** User text and photos sent to Claude are untrusted. Claude gets no tools and no other users' data, its output is validated against a schema, and it never alone bans anyone or moves money.

**Care work.** Babysitting and elder care stay blocked until the checks in `docs/SECURITY.md` exist and a lawyer has reviewed them. Do not remove `gated: true` to make a demo look fuller.

## Where things live

- `app/`: pages and API routes
- `components/`: UI. `HeroSearch` is the signature piece
- `lib/match.ts`: words to trade, and emergency detection
- `lib/contact-screen.ts`: chat screening
- `lib/credits.ts`: credit ledger rules
- `lib/market.ts`: filters for the jobs and workers lists
- `lib/data/ads.ts`: banner spaces and booked ads
- `lib/data/`: sample data, to be replaced by the database
- `proxy.ts`: CSP and security headers
- `supabase/migrations/`: schema and Row Level Security, not applied yet
