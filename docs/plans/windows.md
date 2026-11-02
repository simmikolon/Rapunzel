# Plan: tower windows, the window grabber and the braid cut

Three branches, one after the other, each built on the one before:
`element/tower-windows`, `element/window-grabber`, `element/braid-cut`.

## Why

The windows zone (250 to 400 m) had no element of its own after the
balconies moved above the treeline. Three things were missing or wrong:

1. The window was baked into tower tile variant 2 at the wall's centre,
   so the braid hid every window. The SpriteKit prototype had them left
   and right (x = ±150).
2. The prototype's `WindowPlatformEntity` had an "enemy appearing"
   animation: something in a window reached for the prince. Nothing like
   it exists in the browser game.
3. The scissors idea from the catalogue (the braid cut, ribbons below
   fall away) was never built.

Decisions: windows stay decoration (a landable sill would meet the same
problems the balconies had between the trees); the grabber is a tower
guard (helmet, gauntlet, the balcony guards' palette); the scissors are
the witch's (in the tale she is the one who cuts the braid); the cut
happens above the prince.

## 1. Windows (`element/tower-windows`)

- `src/windows.js`: pure placement. `windowAt(i)` gives window number i:
  its side (left and right in turn), its look (by hash, never the same as
  the one below), its sill height `ly = 260 + i · 440` in layer
  coordinates and x = ±114. `windowsBetween(lo, hi, blockers)` lists
  them for the level; `blockedBy` keeps them off a balcony's wall.
- `art/windows.js`: 22 × 30 art px, sill anchor, five variants (lit with
  a candle, dark, shuttered, flower box, curtains), mirrored for the
  right side. Lit ones get a flickering glow rect and a small halo at
  draw time.
- `background.js`: `drawWindows` after the tiles and before the dapple;
  `drawTower` and `drawBack` take `world` for the balcony blockers.
- Tile variant 2 lost its window and became a stone string course.
- Purely visual; the simulator is unaffected.

Status: done. A first version placed them per tile by hash with a
density per band (up to seven in view in the windows band); playing it
read as noise, "as if nobody had built the tower". Now one window per
storey of 440 layer px, left and right in turn, about three in view at
any height, looks by hash. Screenshots at 120, 274, 300 and 480 m:
windows sit beside the braid, none under a balcony, all five looks
appear.

## 2. Window grabber (`element/window-grabber`)

A guard pops up in a window ("!", the helmet rises behind the sill), then
his gauntleted arm shoots inward into the prince's plane; contact costs a
heart; the boost shield knocks the arm back (+3 suns); not stompable.

- `Grabber` in `enemies.js`: hidden (2.0–3.5 s) → peek 0.45 s → grab
  (0.22 s out, 0.28 s hold, hurtful) → retract 0.4 s. Trigger: the prince
  inward of the window within reach + 40 px and within 150 px of the arm's
  height. Reach 150 px, +40 at the top tiers. The arm's rect only while
  grabbing; `x` is the arm's middle so the knock-back points away from
  the window. Height follows the window's layer height every frame.
- Spawn rule in `level.js`: tier `grabber` 0 / 0 / 0.20 / 0.30 / 0.36 /
  0.40 × pacing × zone (windows 1.0, above the trees 0.6, else 0), rolled
  on a new `rngTower` stream so the tower's geometry stays identical on
  paired seeds; a free window within −60..+420 px (layer) of the row.
- Bot: a peeking or grabbing arm is a threat to step away from.
- `?spawn=grabber`; sounds `creak`, `grab`; `clank` on a punch.

## 3. Braid cut (`element/braid-cut`)

From 300 m, every 120–180 m, never in a breather: the witch flies in with
scissors at a layer height ~9 m above the prince, snips, and the braid
below the cut falls with its ribbons and bows. The generator planned the
stretch (`CUT_AHEAD` 900 px plus a 240 px margin) without braid-only rows
and without dry branches, so it stays reachable. A boost into her during
the approach or the snip aborts the cut.

- `level.js`: `cutPlan { from, yc, until }` rolled on `rngTower`; the
  layout filter in the stretch; `nextCutY` after a cut or an expired plan.
- `Scissors` in `enemies.js`: warn (edge marker, cackle, snips) →
  approach → snip → leave; `deflect` like the witch.
- `world.cutBraid(ly)`: braid pieces that fall (`braidCut`), ribbons and
  bows below the cut `fallAway()`; `drawBraid` draws the hanging braid
  only above the cut with a frayed end, falling pieces with `fallDist(t)`.
- `?at=300&spawn=scissors`; sounds `snip`, `braidFall`; particles
  `hairStrands`.

## Targets

Paired seeds (seedBase 100), 40 good bold runs, cap 800. Baseline on the
merged master: from 250 m mean climb 316 m, 1.05 hits per 100 m (0.62 in
the 300 m band), falls 52 % of deaths; from 300 m mean climb 246 m, 1.44
hits per 100 m (1.5 in the band), falls 48 %. Targets per element: 0.8 to
1.5 hits per 100 m in the band, falls not above half the deaths, mean
climb not more than 15 % below the baseline.
