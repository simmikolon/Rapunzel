# Plan: branch lengths (stub, short, normal, long)

Branch `element/branch-lengths` (on top of `element/tree-diversity`).
The first element whose difficulty sits in the platform geometry rather
than in an enemy: a short branch is a challenge a five-year-old reads at
a glance, long before it matters.

## Why

Today every branch has the same reach. All pressure comes from enemies
and crumbling branches, so the climb never asks for aim. Short branches
ask for aim; long branches give relief and a stage for other elements.

## The four classes

The prince lands when his 40 px body overlaps the branch box, so the
landing window is the box plus 40 px.

| Class | Box | Window | Sprite | Role |
|---|---|---|---|---|
| stub | 58 px | 98 px | 20 art px | "aim for it": a knob or a snapped stump, from 100 m, optional at first |
| short | 106 px | 146 px | 32 art px | mild precision, from 35 m |
| normal | 178 px ± 12 % | about 218 px | 50 art px | as today |
| long | 282 px ± 12 % | about 322 px | 76 art px | relief; reaches the centre; home for squirrels and lanterns |

Four shapes the player learns, not a slider: continuous lengths blur into
"some are a bit shorter" and nobody notices.

## Rules (challenge, never a trap)

1. Stub and short branches are never dry. A crumbling stub is unfair.
2. A stub stands alone in a row only from tier 2.5 (about 160 m), only
   when the last safe row is within 1.2 beats below it (a miss costs a
   bounce back, not a fall) and never twice in a row.
3. Below that, a stub is the optional target in a double row, and most
   of them carry a three-sun arc as the reward for aiming.
4. No stubs or shorts in the breather of a pacing wave; their chance
   rises with the wave like the dry chance does.
5. A long branch only appears in a single-branch row: never at a
   ribbon's height (it would cross the braid) and never two at one
   height (that is the cross branch barrier, a separate element). More
   of them in breathers.
6. Squirrels only patrol normal and long branches, long first. A lantern
   likes to sit on a long branch.
7. Spawn rule as always: tier chance x pacing x zone multiplier. Stubs
   start in the deep forest zone; the forest floor stays the warm
   welcome.

## Art

`drawBranch` takes the sprite length and places the tuft, shelf, nest
and knobs relative to the tip, so nothing is stretched. Stubs have two
drawings of their own (a leaf knob, a snapped stump); the dry branch
gets a normal and a long drawing. Same palettes, same surface height.

## Steps

1. **Platform**: a `len` class and its box width; `left`/`right` use the
   scaled width (tree diversity scaled `w` but not the box).
2. **Art** per class, style and side; sprite sheet.
3. **Generator**: tier columns `short`, `stub`, `long`; zone multipliers;
   pacing; the rules above; a `?len=stub|short|long` dev helper that
   forces the class so a class can be played on its own.
4. **Simulator**: report deaths by falling per band and the fall share;
   the bot already aims at the branch centre. Runs: good bold and kid
   bold, 20 each, against the baseline from the tree-diversity build.
5. **Docs**: catalogue entry, tunables, decision log with the numbers.

## Targets

- Good bold: median height not below the baseline by more than 10 %;
  0.8 to 1.5 hits per 100 m in every zone (unchanged target).
- Falls at most half the deaths in the deep forest band.
- Kid bold: median not collapsing (stays above 60 % of its baseline).

## Status

All five steps landed in one pass.

- `BRANCH_LEN` in `platforms.js` holds the classes; a `Platform` carries
  `len` and `boxW`, and `left`/`right` use the scaled box (tree diversity
  had scaled `w` only).
- `drawBranch(t, style, variant, rng, L)` in `art/trees.js` places tufts,
  shelf, nest and knobs by fraction of the length; stubs have a leaf knob
  and a snapped stump; the dry branch has a normal and a long drawing.
  Sprites per style: stub 2, short 6, normal 6, long 6, each side.
- Generator: tier columns `short`, `stub`, `long`; `stub` zone multiplier
  (0 on the forest floor, 0.7 above the trees); pacing `short` and `long`;
  `pickLen` applies the rules; stub sun arcs; squirrels prefer long
  branches; lanterns a little likelier on a long branch and placed on it.
- `?len=stub|short|normal|long` regenerates the round with one class.
- Simulator reports falls as a share of deaths and by band.

Numbers. The bot learned one thing for this element: in a row with two
platforms it aims for the bigger one, as a player does (a stub next to a
ribbon is the optional target, not the route). The same bot and the same
40 seeds (`tools/analyze.mjs ... 100`) on both builds, good skill, bold
policy, cap 1500 m:

| | baseline (tree diversity) | with branch lengths |
|---|---|---|
| median / mean height | 338 m / 400 m | 409 m / 405 m |
| hits per 100 m | 1.03 | 0.93 |
| falls, share of deaths | 42 % (17 of 40) | 50 % (20 of 40) |
| falls in the 100 m band | 3 | 6 |
| lanterns collected | 229 | 265 |

Falls rise where the stubs start (the 100 m band doubles) and stay at
half the deaths overall; height and hit rate are unchanged, so the
element adds a new kind of pressure without lowering the ceiling. The
kid bot (reaction 0.22 s) falls before 100 m in both builds, so it is
not a guard for this element yet; a kid model that steers earlier is a
small follow-up. A first version put an extra lantern on a quarter of
the long branches, which lifted lanterns collected by half; it is now a
placement preference, not an extra.
