# Roadmap

Time estimates are rough. Move to the next phase when its gate is met, not when its time runs out.

## Done: preview

Front end, core rules with tests, security headers, schema draft and docs. See [STATUS.md](STATUS.md).

## Phase 0: prove demand (2 to 3 weeks)

- Sign 20 to 30 providers in Colombo by hand. Match 50 real jobs manually.
- Write the threat model and privacy policy. Hold little data, in access-controlled accounts.

**Gate:** providers agree to pay per lead, and households come back.

## Phase 1: MVP (8 to 10 weeks)

- Apply the database schema, with automated tests that try cross-user access. Include visitors and unchecked providers trying to read open jobs.
- Phone sign-in, and passkeys for providers and admins.
- Real jobs, replies, realtime chat and credits, with payment by the chosen provider.
- Masked calling.
- Claude job cards from text, voice and photos.
- Photo upload: allow-listed types, malware scan, re-encoded, location data stripped.
- ID verification vendor.
- Backups, alerts and the incident plan.
- Commissioned local photography, and translation.

**Gate before public launch:** independent penetration test with all critical and high findings fixed, checked against OWASP ASVS Level 2. Most jobs get three replies within one hour.

## Phase 2: Protected Jobs (6 to 8 weeks)

- Held payments, guarantee, disputes, and the staff process behind them.
- Pro subscription.
- Second penetration test on held funds and payouts, payout fraud rules, and a PCI SAQ check with the payment provider.

**Gate:** leakage is measured and falling.

## Phase 3: expand (ongoing)

- New trades and cities, one at a time.
- Native apps, once the PWA shows the need.
- Care work, after safety checks and legal review.
- Yearly penetration test, private bug bounty, and SOC 2 or ISO 27001 if business customers require it.
