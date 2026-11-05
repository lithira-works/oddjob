# Status

Last updated 2026-11-05. This is a working front-end preview, not a launch-ready product.

## Works now, and has been tested

- Homepage sentence search: typing rewrites the headline, finds a trade and changes the picture.
- Gas, fire and electric shock wording shows an emergency notice first.
- Babysitting and elder care are blocked with a clear explanation.
- Job card flow: describe, compare replies, chat, book, sign off, receipt.
- Chat screening on a server route: phone numbers, spelled-out numbers, emails, links, messaging apps and offers to avoid fees. Measurements, prices and years pass through.
- Credit rules: derived balance, no overdraft, no double charge, one refund per fake lead.
- Security headers with a per-request CSP nonce, input validation and per-IP rate limits on API routes.
- Unit tests for matching, screening, credits, market filters and ad rules.
- Two separate lists: `/jobs` (homes that need help, blue) and `/workers` (people ready to work, white), each with category, search and sort filters. Choosing a category carries across both.
- Category pages at `/trades/[slug]`, showing homes asking and people listed side by side.
- Header that stays on screen, with a Categories menu of all 27 trades, and bottom tabs on phones except on `/job`. Footer directory for households, workers and popular services.
- Feedback at `/feedback`: validated, rate limited, and saved to `user-data/feedback.jsonl`, which git ignores. It keeps the note and time, with no IP address. Hosting without a lasting disk answers with an error until this moves to the database.
- Admin at `/admin`: one account, created with `npm run admin:create`. It shows saved feedback and which parts of the site are set up, and changes nothing. Tested against forged cookies, cross-site logins and repeated guesses on a production build. No public page links to it. On a host with no lasting disk there is no feedback to show, for the reason above.
- Banner spaces with date windows, on the homepage, both lists, deals and category pages. `lib/data/ads.ts` holds the bookings, and there are none yet, so each space offers itself for hire.

## Simulated: looks real, does nothing real

| Feature | What is missing |
| --- | --- |
| Replies, providers, jobs, ledger figures | All fictional, from `lib/data/`. Labelled on screen |
| Sending a job | Nothing is sent to anyone |
| Booking and payment | No money moves. No payment provider connected |
| Guarantee and disputes | Text only. No process or staff behind them |
| Masked phone line | Not connected to a telephony provider |
| Chat | Held in the browser only. Lost on reload |
| Credit balance on the board | Held in the browser. The real one must come from the database |
| Offers and deals | All fictional, from `lib/data/offers.ts`. Labelled on screen. None can be redeemed |
| Ad booking | Not open. No prices, no payment, no contact route on `/advertise`. Ads are added by editing `lib/data/ads.ts` |
| Worker listing | Sample profiles only. Nobody can list themselves until accounts exist |
| Sign-in and accounts | `/signup` and `/login` run the full phone-code flow on preview rules, and say so on screen. No text is sent, no account is stored, and the code is random and shown on screen. The header's signed-in state lives in the browser tab and unlocks nothing. Real accounts need Supabase and an SMS provider, as planned in `docs/SECURITY.md` |
| ID checks | `/verify` runs after sign-up, with every rule and hostile-file check, but uploads nothing and says so. No person reviews anything. The profile "checks" are sample text. `/api/identity` stays closed until `ID_CHECKS_OPEN=true`: see `docs/SECURITY.md` for what must exist first |
| Job form | `/api/jobs` validates each job on the server, then saves nothing |
| Photo upload | Not built |

## Written but not run

- `supabase/migrations/0001_init.sql` and `0002_identity_checks.sql`: never applied to a database. Their Row Level Security needs automated tests before use. The site has Supabase keys in `.env.local`, and no page reads from it yet.
- `/api/identity`: its rules and image handling are tested, but the route has only been seen refusing requests. Saving a real check has never run.
- `review_identity()` is the only way to approve someone, from the SQL Editor. There is no reviewer screen, and nothing deletes ID photos at `purge_after` yet.
- `/api/interpret` with Claude: tested only in its keyword fallback, because no API key was set. The Claude path compiles but has never run. The job form does not call this route yet.

## Promises on the site that must be true before launch

The site describes planned behaviour as fact, so the design can be judged. Each of these needs the real system first, or the wording must change: masked lines, held payments, the 30-day guarantee, ID checks, job details shown only to checked workers, address removal after a job, deletion schedules, fake lead refunds, and a privacy policy (linked from `/safety`, not written yet).

## Blocks launch

1. Clear the open checks for Colombo, Sri Lanka, the first market before going worldwide. See [LAUNCH-SRI-LANKA.md](LAUNCH-SRI-LANKA.md).
2. Check `oddjob` availability: domain, handles, trademark. A lawyer should also confirm the James Bond character creates no conflict.
3. Finish Phase 1 in [ROADMAP.md](ROADMAP.md).
4. Have a lawyer write the terms and privacy policy.
5. Pass an independent penetration test.
6. Replace the placeholder pictures with commissioned local photographs.

## Known gaps

- Admin login has a password but no second factor, and only one account. A stolen session cookie works until it expires, up to 4 hours, unless `npm run admin:create` replaces the account. Add a second factor, one account per person and an audit log before the dashboard can see personal data or change anything. Login limits are per server, like other rate limits.
- `/jobs`, the homepage and `/trades/[slug]` show job words to anyone, which is fine only for sample data. Decided: real job words and rough areas go only to signed-in, ID-checked workers and the household itself. Visitors get a count per trade from `open_job_counts()`. These pages must follow that rule when they move to the database.
- Checked workers can read `household_id` on open jobs, which links one household's jobs together. Serve the board through a view or server route without that column.
- `/job?q=` puts the household's own words in the URL, which can reach logs and browser history. Change to POST when real jobs exist.
- The rate limiter is per-server memory. It needs a shared store on serverless hosting, and the first `x-forwarded-for` value should only be trusted behind your own proxy.
- Screening is English-only. It handles Sri Lankan number formats, but not numbers or contact offers written in Sinhala, Tamil or Singlish.
- The site is English-only, and Archivo has no Sinhala or Tamil letters. Local languages need matching typefaces and a design pass.
- Emergency wording stays general until the numbers are confirmed with official sources.
- Sample provider names are not localised for Sri Lanka.
- Thirteen trades have no fitting picture, listed in `lib/data/trades.ts`. They keep the current picture rather than show a wrong one.
- Provider profiles show one trade picture. Real profiles need the provider's own job photos.
- The word list covers common cases only. The Claude path is meant to handle the rest.
- This folder sits in OneDrive, which syncs `node_modules` and `.next`. That can slow builds and lock files. Moving the project outside OneDrive, or excluding those folders from sync, avoids it.
