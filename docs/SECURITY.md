# Security

No site is unhackable. The goal is to make attacks hard, limit the damage and recover quickly. Oddjob will hold home addresses, ID documents, phone numbers and payments, so a breach could put people in physical danger, not only cost money.

**Status key:** Built means it exists in this repo. Drafted means written but never run. Planned means not started.

## Threats and defences

| Threat | Defence | Status |
| --- | --- | --- |
| Stealing the provider list or customer numbers | Rate limits and bot detection. Contact details never sent to the browser before unlock | Rate limits built on API routes. Rest planned |
| Viewing another user's job, chat or address | Row Level Security on every table, with tests that try cross-user access. Permission check on each realtime channel | Policies drafted. Tests planned |
| Burglars or stalkers using job posts | Job words and rough area only for signed-in, ID-checked providers. Visitors see a count per trade. Exact address to the booked provider only, removed from view after the job | Policies, `open_job_counts()` and separate `job_addresses` table drafted. Pages still show sample jobs openly |
| Account takeover | Phone OTP with short expiry and attempt limits. Passkeys for providers. Passkey or hardware key for admins. Re-check before changing a phone or payout account | Planned |
| SIM swap and SMS fraud | Hold payouts after a phone change. Limit OTP sends per number, IP and country | Planned |
| Payment and credit fraud | Hosted payment pages. Verified, idempotent webhooks. Server-side ledger | Ledger rules built and drafted in SQL. Payments planned |
| Fake providers and leads | ID and liveness checks, device and duplicate signals, review queue | Planned |
| Malicious uploads | Allow-listed types, malware scan, re-encoded images, stripped location data, separate domain | Planned |
| Injection and XSS | Parameterized queries, Zod validation, output escaping, strict CSP | Zod, React escaping and CSP built |
| Clickjacking and sniffing | `frame-ancestors`, `X-Frame-Options`, `nosniff`, HSTS | Built in `proxy.ts` |
| Prompt injection in AI features | User text and photos are untrusted. No tools or other users' data. Fixed schema, slug checked against the list. Claude never alone bans or moves money | Built in `/api/interpret`, not yet run against the live API |
| Stolen admin access | Least-privilege roles, audited actions, separate admin app, second approver for refunds and exports | Planned. `audit_log` table drafted |
| DDoS and bots | CDN and WAF, edge rate limits | Planned at deployment |
| Compromised npm packages | Lockfile, Renovate or Dependabot, secret scanning, CI security checks. Patch critical Next.js releases within 48 hours | Lockfile built. Rest planned |

## Content Security Policy

`proxy.ts` sets a per-request nonce with `strict-dynamic` for scripts. `style-src` allows `unsafe-inline`, because React style attributes need it. That is the policy's known weak point. Moving remaining inline styles into CSS classes would allow removing it.

Every page renders dynamically because the nonce needs it. Use a CDN for images and static files to keep this fast.

## Data protection

- **Collect less:** keep only what is needed, and delete on a fixed schedule.
- **ID documents:** use a verification vendor and store only the result. If files must be stored, use a private bucket, short-lived signed URLs and logged access.
- **Encryption:** TLS and HSTS everywhere, encryption at rest, field-level encryption for addresses and ID numbers.
- **Secrets:** use a secrets manager, never the code. The Supabase `service_role` key stays on the server only.
- **Backups:** encrypted, stored separately, with a restore test each quarter.
- **Children's data:** none in the first launch.

## Care work gate

Before babysitting or elder care opens: identity checks, police clearance, reference checks, in-person interviews, a reporting and safeguarding process with named staff, and legal advice on liability. All of it, not most of it.

## Detection and response

- **Alerts:** log logins, contact unlocks, admin actions and payout changes. Alert on spikes. Keep personal data and OTPs out of logs.
- **Incident plan:** written before launch. Who decides, how to revoke access, how to force logouts, how to notify users.
- **Breach rules:** a lawyer confirms reporting deadlines under Sri Lanka's Personal Data Protection Act, and each new country's law before entering it.

## Keeping secrets and personal data out of git

`scripts/privacy-check.mjs` scans everything staged for git. It runs on pre-commit and again in GitHub Actions, because a local hook can be skipped. It blocks secret files, API keys and tokens, emails, Sri Lankan phone and ID numbers, local user paths, server-only values with a `NEXT_PUBLIC_` prefix, and logging of personal fields.

It uses patterns, so it can miss things. If a real secret is ever committed, **replace the secret first**. Deleting the file does not remove it from git history.

## Automated checks on every change

Row Level Security tests, dependency scan, secret scan, `npm run check`, and the `security-review` and `code-review` skills.

## Launch gates

| When | Requirement |
| --- | --- |
| Before public launch | Independent penetration test, all critical and high findings fixed, OWASP ASVS Level 2 |
| Before held payments | Second penetration test, payout fraud rules, PCI SAQ check with the payment provider |
| Ongoing | Yearly penetration test, private bug bounty, SOC 2 or ISO 27001 if business customers require it |
