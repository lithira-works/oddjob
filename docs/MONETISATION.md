# How Oddjob earns

**Core rule: charge at the moment of contact.** A fee taken after the job can be dodged, because both sides already have what they need. A fee taken before contact cannot.

All figures below are starting assumptions to test with real users. They are not benchmarks.

| Stream | Who pays | When | Why it resists bypass | Phase |
| --- | --- | --- | --- | --- |
| Lead credits (main income) | Provider | To reply to a job, up to five providers per job | Paid before any contact | 1 |
| Protected Job fee | Household | At booking. Money is held until done | Guarantee, disputes and receipt exist only on-site | 2 |
| Pro subscription | Provider | Monthly | Pays for tools: invoices, calendar, client list, ranking boost | 2 |
| Verified badge | Provider | Yearly | Covers ID and background check costs | 2 |
| Household membership | Household | Monthly, for babysitting and recurring care | Repeat work leaks most, so charge for access | 3 |
| Sponsored slots, supplier referrals | Providers, hardware shops | Later | Needs traffic first | 3 |

## Starting prices to test

- Lead price: 3 to 8% of typical job value, set per trade.
- Protected Job commission: 10 to 15%. The code uses a 5% household fee in the demo (`lib/money.ts`). Decide the real split before Phase 2.
- Fake or unreachable leads: automatic credit refund.

## The main risk

Lead fees are unpopular when leads are bad. If providers pay and get nothing, they leave, and then households find no one. So lead quality decides whether this business survives:

- Cap replies at five, and fewer for small jobs.
- Verify household phone numbers before a job goes out.
- Refund fake leads quickly.
- Track provider earnings per credit, and treat a falling number as an emergency.

## Before first paying users

Check with a lawyer and an accountant in Sri Lanka: whether held payments need a licence or a licensed partner, tax on credits and commission, and consumer rules on refunds and guarantees.
