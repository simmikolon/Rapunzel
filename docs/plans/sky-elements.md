# Plan: sky elements: lanterns, storks, updrafts

Three short element branches stacked on `element/clouds`:
`element/sky-lanterns`, `element/sky-birds`, `element/updrafts`. Each
adds a motion the climb does not have yet: a floating perch that glows,
a one-shot mover that crosses the screen, and a lift without a landing.

## 1. Sky lanterns (`element/sky-lanterns`)

Paper lanterns, the Tangled image, as the night's staple while the
clouds go dark.

- **Where**: from the sunset band on (`lanternAmount(y)` rises 520 to
  600 m), strongest at night. In the sky layouts a cloud slot becomes a
  lantern slot with probability `0.6 x lanternAmount`, in the same three
  lanes.
- **Platform**: kind `skyLantern`, 112 px box, normal bounce, never
  fragile. It hovers: a slow vertical bob (± 28 px, about 6 s) and a
  slight sway, so the reachability model is untouched (its rest height
  is the row's height). The surface is the top of the paper.
- **Look**: 28 x 36 art px, warm paper with a lit band, bamboo frame,
  flame, tassel; two colourways (gold, rose); a bloom halo. Landing
  crumples the paper (squash) with a few sparks; a soft paper thump.
- **Backdrop**: a field of small lanterns rising behind the tower and a
  few in front of it, from sunset into the night. Purely visual.
- **Bot**: nothing new (a slow-moving platform).
- **Measure**: 40 good bold runs from 600 m, cap 1100.

## 2. Storks (`element/sky-birds`)

A friendly stork crosses the screen once at a platform height; you can
ride its back for one bounce.

- **Where**: the sky (clouds fully in). Spawned like the witch, relative
  to the prince: every 400 to 700 px of climb a stork enters from one
  edge 380 to 640 px above him and flies across at 150 to 210 px/s. It
  leaves at the other edge and is gone.
- **Platform**: kind `stork`, 150 px box on its back, normal bounce. A
  stork is never part of the row structure, so it is never the only way
  up; it is a timing reward: landing on it gives +3 suns and the usual
  boost refill, the stork squawks and dips.
- **Look**: 42 x 22 art px, two flap frames, white with black wing tips,
  red beak and legs; mirrored for the other direction.
- **Bot**: the drifting-cloud prediction already aims at a moving
  platform.
- **Measure**: 40 good bold runs from 450 m.

## 3. Updrafts (`element/updrafts`)

A visible column of rising air that lifts the prince, no landing
needed: the "wind" from the zone sketch.

- **Where**: the sky. A row has a chance (tier 4 to 5: 0.12 to 0.20,
  x 1.6 in breathers) of an updraft under the next row's first lane,
  from 60 px above this row to 90 px below the next, 150 px wide.
- **Mechanics**: inside the column the prince gets 3400 px/s² of lift
  (gravity is 2100) up to 900 px/s upward, so a fall turns into a rise
  and a bounce reaches further. A soft whoosh on entering.
- **Rules**: the next row's cloud in that lane is never a storm cloud
  (an updraft into a bolt would be a trap). Columns never overlap a
  storm's column.
- **Look**: feathers and leaves swirling up inside, faint vertical
  streaks, a soft puff at the base. Strength pulses with the gusts.
- **Bot**: nothing new; it benefits.
- **Measure**: 40 good bold runs from 450 m; falls should drop.

## Dev helpers

`?spawn=stork` sends a stork across now; `?spawn=updraft` puts a column
under the next platform.

## Status

**Sky lanterns: landed.** `lanternAmount(y)` in `altitude.js`; kind
`skyLantern` hovers in `Platform.update`; `art/lanterns.js` (34 x 40 art
px big lantern, two colourways, a tiny far one); a cloud slot becomes a
lantern in `makeRow`; glow halo, crumple and `audio.paper()` in the
world; `Background.skyLanterns` rise behind and in front of the tower.
Measured from 600 m, 40 good bold runs: the first version (112 px box,
± 28 px bob) raised falls from 41 % (lanterns off) to 53 % of deaths; at
136 px with a ± 20 px bob: 29 % falls, 1.14 hits per 100 m, mean climb
315 m (321 without).

**Storks: landed.** Kind `stork` in `platforms.js` (flies at `vx`, a
flap bob, gone past the far edge); `drawStork` in `art/creatures.js`
(42 x 22, two frames, both directions); `World.spawnStork()` from
`events()` every 400 to 700 px of climb once `cloudAmount` is 1; riding
one gives +3 suns, white feathers and a squawk; `?spawn=stork`. The
bot first chased storks it could not reach (54 % falls from 450 m); it
now chases only a stork that will still be on screen and within 320 px
when it gets there: 33 % falls, 1.09 hits per 100 m, mean climb 330 m
(40 good bold runs from 450 m). Updrafts: next.
