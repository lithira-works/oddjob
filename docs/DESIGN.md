# Design

## The idea

**On this site, the household's own problem becomes the layout.** The sentence "My pipe is leaking" splits around a picture of the leak, and typing rewrites the poster. Competitors cannot use the same page without giving up their category grids.

The live thing: type your problem, and the headline, picture and suggested trade change as you type.

Direction from the taste skill: "The sentence is the layout", seed 1806243002. The sheet is local working data and stays out of git.

## Tokens

All live in `app/globals.css`. Do not add colours or sizes outside them. Blue still marks the worker side; orange never does.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#FFFFFF` | Ground |
| `--ink` | `#0B0C0E` | Text, and the inverted close and job card |
| `--soft-ink` | `#4A4F57` | Secondary notes only |
| `--surface` | `#F2F4F7` | Tone step instead of lines |
| `--accent` | `#146EF5` | Actions, the footer and the pro board. White on it is about 4.59:1, which passes AA |
| `--accent-strong` | `#0E57C7` | Hover, and rows on the pro board |
| `--warm` | `#FF6A2B` | Second brand colour: the closing field, the price block, the current-page marker. Ink text on it (about 6.8:1), never white |
| `--warm-strong` | `#C2410C` | Orange as text on white or tone: deal amounts and the Deals link (about 5.2:1 on white) |
| `--alert` | `#FFD60A` | Emergencies and warnings only, with ink text |

**Type:** Archivo only. Display is weight 800 at width 62, uppercase, with leading near 0.88. Text is normal width, 400 and 500. Sizes are `--step-small`, `--step-body`, `--step-lead`, `--step-head`, `--step-poster` and `--step-giant`.

**Shape:** 4px radius on everything. Flat buttons. One primary action name: "Find someone".

## House rules

- Headlines at two lines or fewer, at every width.
- No small label above a heading, and no pill badges.
- No gradients, glass or glow. No shadows at rest.
- No thin decorative rules. Separate with tone or space. Real tables and form fields may have lines.
- No monospace. No 01/02/03. No emoji. No icon-topped cards, and no rows of identical cards.
- No styled accent word in a headline.
- Left-aligned by default. Running text in full ink, 16px or larger.

## Pages and their compositions

| Section | Composition |
| --- | --- |
| Hero | Sentence split around a pinned picture reel, with the form on the frame |
| Categories | Straight after the hero: four groups of icon, service and typical jobs |
| Two sides | Two full-height halves: "Need a hand?" on tone, "Need work?" on blue |
| Ad space | One wide band. A booked ad is always labelled with its advertiser |
| Deals | Heading left, list of offers right, with the amount set large |
| How it works | Four lines stepping down a staircase |
| Work ledger | Sticky heading, with video, figures and a photo passing by |
| Privacy | Full-height picture beside a table of who sees what |
| Pricing | One sentence, with the price as a blue block |
| FAQ | Wide heading, indented questions |
| Close | Orange band: "Still leaking?" echoes the hero. Sections hug their content, with no empty full-height blocks |
| Header | Sticks to the top of every page. A Categories menu holds every trade. Phones get bottom tabs instead, except on `/job` |
| Footer | Black directory: Need a hand, Need work, popular services, Oddjob |
| `/job` | Black job card held on the left, stage on the right |
| `/jobs` | Blue band with headline and tools, then categories beside job rows on tone. Blue always means the worker's side |
| `/workers` | The same shape with a tone band. Rows carry each person's three ledger figures |
| `/signup`, `/login` | Panel beside the form. The panel turns blue for a worker, tone for a household, ink for logging in |
| `/verify` | One calm column with three named stages, one job per screen, and each photo's preview in place |
| `/admin` | Black bar, with feedback on the left and a tone panel of site setup on the right. Items that need doing are in `--warm-strong`. Not linked from public pages |
| `/feedback` | Wide heading, a short promise on the left, the form on the right |
| `/trades` | Search, then trades in four groups, with a sticky picture |
| `/trades/[slug]` | Blue panel of homes asking beside a tone panel of people |
| `/deals` | One column of offers, filtered by kind |

## Category icons

Each trade has one line icon from Lucide, mapped in `lib/trade-icons.ts`. It always sits beside the trade's name, in a row, on no card or tile. Icon-topped cards stay banned.

## Ads

Ads are first-party pictures and links, listed in `lib/data/ads.ts`. No ad network, no tracking script, no household data. No ads in `/job`, chat, booking or payment, or beside emergency notices. No ads for care work while it is blocked.

## Motion

- Signature: the pinned hero reel. Words rise from a mask when the picture changes. Scrolling is never hijacked.
- Each section's parts arrive in reading order. Lists arrive row by row, and pictures open like a shutter.
- Every control responds to press, hover and focus.
- One moving picture: the planer clip.
- Reduced motion keeps all content and drops travel.

## Pictures

Current pictures are real and openly licensed, but they are stand-ins. Any retouching stays mild, generates nothing, and is noted in the credits. Replace them with commissioned photographs of real local workers and jobs before launch. Never use AI-generated or stock people, and never imply a found picture shows an Oddjob job.

## Checking a change

```bash
node <taste-skill>/scripts/lint.mjs app components lib
node <taste-skill>/scripts/inspect.mjs http://localhost:3000
```

Then look at the screenshots in `.taste-skill/inspect/`. Passing the checks does not mean the page is good.
