---
name: oddjob-design
description: Oddjob's design system and anti-slop rules. Use for any change to Oddjob's pages, components, styles, copy, pictures or motion.
---

# Oddjob design

Read `docs/DESIGN.md` and `docs/COPY.md` first.

## The idea

The household's own problem is the layout. Every new screen should carry it: their words set large, the job card as the object, and proof from real work. If a competitor could use the screen unchanged, it is not finished.

## Always

- Use tokens from `app/globals.css`. Add no new colours, sizes, radii or fonts.
- Archivo only: display at weight 800, width 62, uppercase. Body in normal width.
- White ground, ink text. `#146EF5` on actions, or as one deliberate full field. `--alert` only for warnings.
- Separate with tone steps and space.
- Neighbouring sections use different compositions.
- One primary button per screen, named "Find someone" for households.
- Every state: hover, press, focus, disabled, empty, error.
- Phone layout is its own composition, usable with a thumb.
- Content stays visible without JavaScript and under reduced motion.

## Never

Gradients, glass, glows, shadows at rest, pill badges, labels above headings, monospace, numbered steps, emoji, icon cards, rows of identical cards, a styled word in a headline, headlines over two lines, grey running text, invented proof, AI-generated or stock people.

## Honesty

Sample data stays labelled on screen. Found pictures need a credit in `lib/data/credits.json` and `docs/CREDITS.md`, and never pose as Oddjob's own customers or jobs.

## Before saying it is done

1. `npm run check`
2. Run `lint.mjs` and `inspect.mjs` from the taste skill. Fix every FAIL.
3. Open the screenshots at 1440, 768 and 390 pixels, and judge what they show.
4. Click through the real flow in a browser.
5. Update `docs/STATUS.md` if what works has changed.
