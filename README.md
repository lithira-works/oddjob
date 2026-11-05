# Oddjob

A marketplace where households say what is wrong at home in their own words, and nearby tradespeople reply. Households choose by the work, not by star ratings.

**Status: front-end preview.** Pages, flows and core rules work. All listings are samples, and there is no real login, database, payment or messaging yet. See [docs/STATUS.md](docs/STATUS.md).

## Run it

Needs Node 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Check it

```bash
npm run check
```

This runs the type check, unit tests and production build.

## Before your first commit

Turn on the privacy check. It blocks commits that hold secrets, personal data or logging of personal fields.

```bash
npm run hooks
```

## Pages

| Path | What it is |
| --- | --- |
| `/` | Homepage. The sentence is the search box |
| `/job` | The job card: describe, compare replies, chat, book, sign off |
| `/trades` | A to Z trade index with picture preview |
| `/pros/[slug]` | Provider profile with the work ledger |
| `/jobs` | Homes that need help: the worker's board, with credits. `/board` redirects here |
| `/workers` | People ready to work: the household's list |
| `/trades/[slug]` | One category, with homes asking beside people listed |
| `/deals` | Sample offers and deals |
| `/advertise` | Banner spaces and ad rules |
| `/safety` | Who sees what, and when |
| `/credits` | Picture credits |

## Docs

| File | Contents |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Rules for anyone, human or AI, working in this repo |
| [docs/PLAN.md](docs/PLAN.md) | The product plan and scope |
| [docs/STATUS.md](docs/STATUS.md) | What works, what is sample, what is missing |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases and launch gates |
| [docs/LAUNCH-SRI-LANKA.md](docs/LAUNCH-SRI-LANKA.md) | First market, open checks, and the checklist for later countries |
| [docs/DESIGN.md](docs/DESIGN.md) | Art direction and the anti-slop rules |
| [docs/COPY.md](docs/COPY.md) | Voice and approved wording |
| [docs/MONETISATION.md](docs/MONETISATION.md) | How Oddjob earns |
| [docs/ANTI-LEAK.md](docs/ANTI-LEAK.md) | Keeping jobs on the platform |
| [docs/SECURITY.md](docs/SECURITY.md) | Threats, controls and launch checks |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, structure and data model |
| [docs/SKILLS.md](docs/SKILLS.md) | Which Claude skills to use, and when |
| [docs/CREDITS.md](docs/CREDITS.md) | Licences for every picture and clip |
