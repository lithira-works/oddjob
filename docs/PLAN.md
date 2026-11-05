# Product plan

## The idea

Households rarely know the name of the trade they need, but they always know what is wrong. On Oddjob you say it in your own words, up to five nearby people reply, and you choose by the work they have done.

**Core decision: charge when contact is made, not when the job finishes.** You cannot fully stop people going direct, so the money is designed around it. Once Oddjob is paid before numbers are shared, a private deal costs far less. See [MONETISATION.md](MONETISATION.md) and [ANTI-LEAK.md](ANTI-LEAK.md).

## Scope

"All the services in the world" fails as a launch, because a household that finds no plumber nearby never returns. So:

- Build the trade list to hold any trade. It already does: add a row to `lib/data/trades.ts`.
- Launch in Colombo, Sri Lanka, with five trades: plumber, electrician, carpenter, mason, tree cutter.
- Open a new trade or city only when most jobs there get three replies within one hour.

Expansion is planned in this order: more trades in that city, the rest of Sri Lanka, then other countries one at a time. Each new country goes through the checklist in [LAUNCH-SRI-LANKA.md](LAUNCH-SRI-LANKA.md).

Babysitting and elder care open later, after dedicated safety checks. Children and vulnerable adults carry risks that ordinary trades do not.

## Who it serves

- **Households:** a problem, little time and no trusted contact. They need the right person, safely, without handing their address to strangers.
- **Providers:** skilled, often working alone, and short of steady jobs. They need jobs nearby, a fair price per job, and a way to prove good work.

## What makes it different

| Usual marketplace | Oddjob |
| --- | --- |
| Pick a category from an icon grid | Say the problem in a sentence |
| Star ratings | Work ledger: jobs booked, redone, homes that called back |
| Address shared early | Rough area until you book |
| Profile cards | Rows on a job card, compared by quote and record |
| Pay a fee on completion, easy to dodge | Pros pay to reply, before contact exists |

## The job card

The household's words become a printed work order. It moves through Sent, Quoted, Booked, Done and Guaranteed, then becomes the receipt.

## Success measures, tracked weekly

- Reply rate within one hour
- Contact-to-hire rate
- Leakage rate, from the follow-up question
- Provider earnings per credit spent
- Repeat bookings
- Security: blocked scraping attempts, account takeovers, fraud losses, time to patch critical issues

## Open decisions

- Starting prices. Figures in the docs are assumptions to test, not benchmarks
- Claude model for the job card. The code defaults to `claude-opus-5-5`; compare `claude-haiku-5-5` on cost and accuracy with real job text
