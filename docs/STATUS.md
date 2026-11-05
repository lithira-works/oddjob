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
- Unit tests for matching, screening and credits.

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
| Sign-in and accounts | None |
| ID checks | None. The profile "checks" are sample text |
| Photo upload | Not built |

## Written but not run

- `supabase/migrations/0001_init.sql`: never applied to a database. Its Row Level Security needs automated tests before use.
- `/api/interpret` with Claude: tested only in its keyword fallback, because no API key was set. The Claude path compiles but has never run. The job form does not call this route yet.

## Promises on the site that must be true before launch

The site describes planned behaviour as fact, so the design can be judged. Each of these needs the real system first, or the wording must change: masked lines, held payments, the 30-day guarantee, ID checks, address removal after a job, deletion schedules, fake lead refunds, and a privacy policy (linked from `/safety`, not written yet).

## Blocks launch

1. Clear the open checks for Colombo, Sri Lanka, the first market before going worldwide. See [LAUNCH-SRI-LANKA.md](LAUNCH-SRI-LANKA.md).
2. Check `oddjob` availability: domain, handles, trademark. A lawyer should also confirm the James Bond character creates no conflict.
3. Finish Phase 1 in [ROADMAP.md](ROADMAP.md).
4. Have a lawyer write the terms and privacy policy.
5. Pass an independent penetration test.
6. Replace the placeholder pictures with commissioned local photographs.

## Known gaps

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
