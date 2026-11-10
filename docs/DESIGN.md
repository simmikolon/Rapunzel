# Sir Bouncealot: design document

The living guide for the browser version of Sir Bouncealot, the pogo climb
up Rapunzel's tower (the game carried her name until 2026-11-03; the knight
on the pogo stick gives it his now, so the name is ours alone). It records the
vision, the concepts we work with, every idea collected so far, how we
work, and the order we currently intend to build things in.

**This document guides, it does not restrict.** Anything in it can change
when playing the game teaches us something; when that happens, update the
document and add a line to the decision log at the end. Ideas are kept
even when they are not planned, so nothing gets lost.

Legend: ✅ exists · 🔜 planned next · 💡 idea · ❓ open question · ⚠️ caveat

---

## 1. Vision

A pogo-stick climb up Rapunzel's tower, inspired by a five-year-old's
drawings. The prince bounces up branches of the two trees and ribbons
tied to Rapunzel's braid while the witch and the forest try to stop him.
Audience: kids first (the author's daughter), adults for high scores.

**Where it is going**: a campaign of towers, each with Rapunzel waiting at
the window at the top, each in its own land (forest, snow, rain, summer,
jungle, night, space), with an upgrade store between towers and short
scenes that tell the story. Until then, and alongside it forever, an
**Endless Tower** mode: the same world without an end, for high scores.

Principles:

- Readable, friendly, charming. Hazards are telegraphed; nothing is unfair.
- Short sessions with a clear goal; a tower takes two to four minutes.
- Traps never kill without a way out (taps break webs, a lantern precedes
  a barrier that needs a boost).
- Core defensive abilities are part of the base game, never store-gated.
- Variety over difficulty: a long climb needs new things to see and do,
  not just higher probabilities.

## 2. The three concepts: zone, tower, scene

- **Zone**: the unit of content. About 100 m of climb with its own small
  roster of elements (two or three active, one carried over from the zone
  before, one new), its own look (sky, trees, weather, atmosphere) and
  usually one set piece. Zones are what we build and test.
- **Tower**: a sequence of zones with Rapunzel's window at the top. The
  forest tower is zones 1 to 4 of the sketch in section 6. Zone length and
  difficulty are tower parameters (a kids' first tower might use 60 to 80 m
  versions of the same zones, about 300 m in three minutes).
- **Scene**: the glue between towers. The intro at the foot of the tower,
  the rescue at the window, the witch's kidnapping gag, the light bridge to
  the next tower. Scenes do not touch gameplay code and can be added one at
  a time.

How the two modes share the content:

| | Campaign (later) | Endless Tower (now) |
|---|---|---|
| Zones | play a tower's zones up to the window | the same zones |
| At the window | rescue scene, stars, next tower unlocks | no window; the zones continue |
| Beyond | the next tower with its own zones | zones loop with harder variants; later chains every tower's zones as they are built |
| Zone boundaries | portal warp and checkpoint | portal warp |

Endless mode stays available from the start and keeps getting longer as
towers are built, with no separate work.

## 3. How we work: the sandbox approach

The current endless game is the sandbox: every new element (enemy,
platform, trap, tunnel, effect, mechanic) is built and iterated there,
where it can be felt the day it lands, instead of building a campaign
shell first and filling it later. Conditions that make this hold up:

- **An element is a module, not a patch.** Each carries a spawn rule for
  endless, a "place it at height X" hook for authored towers later, its
  art, its sound, and either support in the simulator's scripted player or
  a note that it is purely visual. Then the campaign is assembly, not
  rework.
- **Elements land in zones, not on top of each other.** Sameness made the
  long climb boring; piling every hazard into the same stretch would make
  it unplayable. Zones keep "iterate in endless" honest.
- **The simulator is the guard rail.** After each element: hits per 100 m
  per zone, fall rate, median height. A good, bold scripted run should sit
  around 0.8 to 1.5 hits per 100 m in every zone; a zone that spikes gets
  tuned before the next one starts.
- **Dev helpers** that grow with need: ✅ `?at=150` starts at an altitude,
  `?spawn=squirrel` puts an element on the next branch, `?spawn=storm`
  turns the next cloud into a storm cloud, `?dev=1` shows altitude and
  zone, `?len=stub` makes every branch one length class. The simulator can
  start at an altitude (`tools/analyze.mjs ... <cap> <seedBase> <startM>`)
  to measure one zone. 💡 later: toggle invulnerability, freeze the witch,
  show hitboxes.

Workflow: one short branch per element or zone; Vercel gives each branch a
preview URL; play it on the phone, run the simulator and the bot, merge
when it is fun, drop it when it is not. "Done" for an element means: in
the game, in its zone, in the simulator, and one line in this document.

## 4. The game today

**Phase 0, the port (✅)**: plain JavaScript, 768 x 1364 logical portrait
resolution, deployed from `master` via Vercel. Rendering is WebGL through
PixiJS behind a small immediate-mode facade (`web/src/gfx/renderer.js`);
gameplay code never touches PixiJS. Selective bloom and a CRT pass with
presets full / bloom / off (F key, title button, `?fx=`), off by default.

- Prince on a pogo stick: automatic bounce, tap to boost (three charges,
  refilled by landings and lanterns), keys, touch halves or phone tilt,
  screen wrap-around.
- Platforms: healthy branch, dry branch (crumbles after one bounce),
  ribbon on the braid (moves with the hair's sway), bow (spring), plank
  swing between the trees (land on top, bonk from below).
- Enemies: crow (patrols, homes in with altitude, stompable), spider
  (hangs on a thread, lunges when you pass below, stompable), witch
  (marker and cackle, crosses above you, dives, twice near the top).
- Pickups: sun drops, lanterns (boost refill), hearts.
- Three hearts; game over on zero hearts or falling off the bottom.
- Procedural level in rows (the original's beats) with difficulty by
  altitude and a stress-tested reachability guarantee.
- Parallax layers like the SpriteKit prototype: sky, distant forest, tower
  with windows, braid and ribbons (0.9x), trees with branches and swings
  and the prince (1.0x), fireflies, vignette. Altitude-graded sky and
  lighting (forest, open sky, sunset, night). Squash and stretch,
  particles, screen shake, toasts. Synthesized sound with iOS unlock and
  silent-switch handling. Title screen with the prince hopping on the
  lawn and a 3-2-1 countdown on his landings, pause and game over with a
  way back to the menu; best height saved; web app manifest and icons.
  The prince follows the original app icon.
- ✅ Landing page (`site/`, served at `/`; the game moved to `/play/`):
  the page is the tower from the night sky down to the lawn, with the
  game's own signs on ropes, the hopping wordmark, Rapunzel peeking over
  the first sign, the prince bouncing on a cloud, a cast of friends and
  foes, the controls and a note on the iPhone app. Drawn by the game's
  art code at runtime, PLAY leads to the full-screen game everywhere.
  Three planes with parallax like in the game: sky and forest at 0.3 of
  the scroll, tower, braid, the prince and the creatures (witch, stork,
  crow, a spider) at 0.7, the signs at 1.0; none with reduced motion.
  Footer on the lawn with the Impressum (`/impressum/`) and the privacy
  policy (`/datenschutz/`), pages of the same kind kept out of search
  results; the site's address is www.bouncealot.de (bouncealot.de forwards).
  Twinkling stars in the sky, and a secret above where the page opens: the
  top of the tower (pointed roof with a pennant, Rapunzel waiting at her
  window, her braid over the sill and down the tower, a speech bubble),
  found by scrolling up; the first sign hangs from a beam under it. Down to
  the opening position the tower's plane moves with the page, so roof,
  window and beam stay together; the parallax starts below. The story is
  Simon's letter, with Emma's drawing and the first game design from back
  then taped into it (`site/img/`, a tap opens them large).

**Phase 1, the ceiling (✅ on branch `phase-1-ceiling`)**: boost shield
(0.5 s after a boost the prince knocks enemies away for three suns; the
witch is thrown off course), hearts restore all three hearts, difficulty
ramp stretched to 700 m with 90 m pacing cycles ending in a 15 m
breather, witch cooldown 75 to 105 m and a slower dive, pity heart, a
one-time hint for the shield. Plus the headless gameplay simulator.

**Key files**: `web/src/config.js` (tunables and the `FX` block),
`web/src/level.js` (tiers, pacing, rows), `web/src/background.js` (layers,
sky, lighting), `web/src/enemies.js`, `web/src/platforms.js`,
`web/src/player.js`, `web/src/atmosphere.js` (leaves, fog, shafts,
life), `web/src/altitude.js` (zone-keyed curves), `web/src/gfx/*`
(renderer facade, atlas, filters),
`web/src/art/*` (procedural sprites), `web/dev/sprites.html` (sprite
sheet), `web/dev/sim.html` + `tools/analyze.mjs` (simulator).

## 5. What playing has taught us so far

- **The 300 m ceiling was attrition** (details in `docs/ANALYSIS-phase1.md`):
  the ramp peaked at 210 m and stayed there while recovery could not keep
  up. Phase 1 moved the scripted bold player's median from 142 to 434 m and
  the author reaches almost 600 m.
- **Longer became boring.** With attrition gone, the climb is the same
  twenty seconds repeated for six minutes: three enemies, five platforms,
  one rhythm. Probabilities are not novelty. A long climb needs three
  things: something new to see and deal with every minute or two (zones),
  small goals inside the run, and a few spectacle moments (the portal, a
  swarm, the witch as a boss, the window at the top).
- **Kids die by falling, adults by attrition.** Platform reading is the
  kid's limit; shorter, fixed towers and the store are the planned answer,
  possibly with an easy mode.

## 6. Zone sketch for Endless Tower (and the forest tower)

Mostly existing art plus small additions, in the order we intend to
build them. Each zone: elements, look, set piece.

1. **Forest floor, 0 to 120 m** (✅ as is): crows, spiders, ribbons and
   branches, fireflies, kept light.
2. **Deep forest, 120 to 250 m** (in progress): ✅ squirrels on branches
   (the first platform-bound enemy); ✅ the look: green shade, mist and
   falling leaves on a depth continuum, light shafts with dust motes,
   canopy dapple on the wall, boughs with birds, butterflies, owls in the
   knot holes, acorns, gusts and passing clouds; 🔜 thorny branches, the
   cross branch you must boost through; crows fade out (0.6x), spiders stay.
3. **The tower's windows, 250 to 400 m** (in progress): ✅ windows left
   and right of the braid on the tower layer (lit with a candle, dark,
   shuttered, flower box, curtains) in a steady storey rhythm, with stone
   string courses in the wall; ✅ guards reaching out of the windows for
   the prince, with crows, spiders and squirrels stepping back (0.6 / 0.5
   / 0.5x) to make room; ✅ the witch more present: from 300 m on she
   comes with scissors and cuts the braid above the prince, the ribbons
   below fall away; 🔜 Rapunzel's cameo. Balconies were built for this band first and
   moved above the treeline: with trees on both sides a balcony made no
   sense (decision log, 2026-10-29). Doors later.
4. **Above the trees, 400 to 550 m** (in progress): ✅ the trees end at a
   treeline (bare tops, crown tiles at 460 m) and cloud platforms take over
   in three lanes: thick, wispy (weak bounce, dissolves), drifting (patrols
   its lane) and storm clouds with lightning striking below them; the
   braid with ribbons and bows runs on; spiders, squirrels and swings end
   with the trees; ✅ sky lanterns take over from the clouds at sunset and
   night; ✅ storks cross the sky to ride for one bounce; ✅ updrafts lift
   the prince to the next row; ✅ balconies on the tower's edges in five
   looks (stone, wooden, flowered, ivy, dilapidated and fragile), with
   guards who lunge with a halberd and flowerpots that fall when the
   prince passes below. 🔜 bird swarms to boost through; the
   tower rises out of the forest with Rapunzel's window at the top. When
   this exists, the forest tower exists.
5. **Beyond**: storm and night (rain, wind, bats, lightning), then space
   (stars, asteroid platforms, the witch's territory), then zones repeat
   with harder variants or palette swaps.

## 7. Element catalogue

Everything proposed so far, by family. Status marks what exists; the rest
is a pool to draw from, not a promise.

**Enemies**
- ✅ crow, ✅ spider, ✅ witch (dodge; deflected by a boost).
- ✅ squirrel: sits on a healthy branch nibbling an acorn, patrols it,
  dashes at the prince when he comes within reach (chirp and "!"). Landing
  on it from above stomps it; it bites if it reaches him while crouched on
  the branch or passing through it; falls with a crumbling branch. From the
  deep forest band (~120 m).
- ✅ lightning under a storm cloud: the cloud is safe on top; rain streaks
  mark a narrow column under its middle, the cloud flickers and rumbles
  for a second, then one bolt strikes 420 px down for a quarter second.
  Not stompable; the boost shield protects. Storm clouds are never alone in
  a row and never small, so their edges are a safe approach. From about
  480 m, growing toward the storm zone.
- ✅ guard on a balcony: patrols inside the railing, lunges with his
  halberd when the prince is within 230 px (0.35 s wind-up with a "!",
  0.45 s thrust reaching 70 px past the railing, 1.2 s cooldown), bites on
  contact like the squirrel, stompable from above (he sinks back through
  the door). Never on a dilapidated balcony; one thing per balcony.
- ✅ flowerpot on a balcony's railing: wobbles with a rattle for 0.7 s when
  the prince is 120 to 620 px below within 90 px, then falls; hurtful only
  while falling; shatters on him, on a platform or below the view; the
  shield smashes it. One shot.
- ✅ window guard (grabber): hidden in one of the tower's windows until the
  prince is inward of it and about level with it, then his bust rises
  behind the sill with his pike upright ("!", a creak, 0.5 s), he leans
  out and the pike sweeps down into a thrust aimed at the prince (130 px
  long, up to 160 at the top tiers, aimed up to 20° above or below level,
  0.15 s down, held 0.4 s, hurtful only once it is past the sweep), then
  comes back up; then 2 to 3.5 s of quiet. The pike costs a heart and
  throws the prince away from the window; the boost shield knocks it back
  (he keeps his head down for 5 s); nothing to stomp, he stands behind
  the plane. Rolled per row on the tower stream (tier 0.09 → 0.20 × pacing
  × zone: windows 1.0, above the trees 0.6) into a free window within
  −60..+420 px of the row. In the windows band crows, spiders and
  squirrels step back (0.6 / 0.5 / 0.5x) to make room for him.
- ✅ the witch with scissors (braid cut): from 300 m on, every 120–180 m,
  never in a breather, she comes for the braid 6.4 m above the prince's
  highest point (edge marker with snapping scissors and a cackle for
  1 s, level flight to the braid, 0.35 s of snipping) and cuts it there,
  in the upper fifth of the view; the braid below the cut falls away with
  every ribbon and bow on it, the hanging part ends in a frayed end. The
  generator planned a 16 m stretch ahead whose rows hold no braid-only
  layout and no dry branch; she only sets out while the prince is in its
  lower 6 m, so the cut always lands inside it and the climb stays
  possible without ribbons. A boost into her
  on the way in or while snipping throws her off and saves the braid
  (+3 suns like any punch). She is hurtful on the way in and while
  snipping, never stompable. Rolled on the tower stream.
- 💡 cross branches spanning the width, broken only by a boost. ⚠️ Only
  spawn with a guaranteed charge (a lantern just below or a generator check).
- 💡 a bird swarm to boost through (set piece).
- 💡 spider webs and nets that hold or slow. ⚠️ Must break on a few taps
  or a boost.
- 💡 vines / green zones that slow or stick (jungle); prefer slowing.
- 💡 mushrooms (negative power-up): dizziness, wobbly or reversed controls
  for a few seconds. ⚠️ Frustrating for young players; clearly marked, short.
- 💡 the witch as a level boss defending the window.
- 💡 per-theme rosters: bees (summer), ice creatures (snow), bats (night),
  knights and witches inside the tower.

**Platforms**
- ✅ healthy branch, ✅ dry branch, ✅ ribbon, ✅ bow spring, ✅ plank swing.
- ✅ branch variety: six drawings per side (straight, gnarled, forked,
  knobby, mossy with a mushroom shelf, with a nest) in the look of the
  zone's tree, a slight bark tint and a length of 88–112 %. Branches are
  anchored at their root on the trunk, so a short branch is a short reach;
  the surface height and the collision box are unchanged. Dry branches
  keep one universal grey look so they stay readable.
- ✅ branch lengths, the first difficulty that sits in the geometry: stub
  (58 px box, a leaf knob or a snapped stump), short (106 px), normal
  (178 px) and long (282 px, reaching the centre). The prince's 40 px body
  must overlap the box, so the landing window is the box plus 40 px.
  Rules: stubs and shorts are never dry and never in a breather; a stub
  stands alone in a row only from tier 2.5 with the last safe row within
  1.2 beats below it, never twice within two rows, and most stubs carry a
  three-sun arc as the reward for aiming; long branches only in
  single-branch rows (never crossing the braid at a ribbon, never two at
  one height), more of them in breathers, squirrels and lanterns prefer
  them. Stubs start in the deep forest zone.
- 💡 thorny branch (do not land), icy branch (slides), cross branch
  (barrier).
- 💡 more ribbon and bow types on the hair: swinging bow, sticky bow that
  stops you, tiny bow, a bow that changes the braid color.
- ✅ cloud platforms above the treeline, in three lanes (left, right, a
  centre lane that never shares a row with a ribbon) and three sizes
  (small 150, normal 225, wide 325 px). Thick: the staple. Wispy:
  translucent, the dry branch's weak bounce, dissolves into puffs after
  one bounce, follows the dry rules. Drifting: patrols its lane on a slow
  sine (45 to 105 px/s at most), always fully on screen; small or normal
  only. Storm: the lightning's carrier (see enemies). The handover from
  branches runs from 420 to 460 m.
- ✅ sky lanterns from the sunset band on, the night's staple: a paper
  lantern (136 px box, never fragile) hovering with a slow bob around its
  row's height, glowing; landing crumples the paper. A cloud slot becomes
  a lantern with chance 0.6 x `lanternAmount`. A field of small lanterns
  rises behind and in front of the tower at night, purely visual.
- ✅ storks: once the clouds are fully in, every 400 to 700 px of climb a
  stork enters from one edge 380 to 640 px above the prince and crosses
  at 150 to 210 px/s (every 1200 to 2000 px, so a stork stays an event);
  its back is a 150 px perch. Never part of a row, so
  never the only way up: a timing reward worth +3 suns and a squawk.
- ✅ updrafts (sky): a little cloud with puffed cheeks blows a 150 px
  column of wind under the next row's lane, from just above a row to
  just below the next, with chance 0.10 to 0.16 per row (x 1.6 in
  breathers). Inside it the prince is thrown into the sky like off a bow
  spring (9000 px/s² up to 2300 px/s), flying past the next rows; wind
  curls, petals, feathers and leaves ride up with him, a whoosh and the
  spring sound on entering. After carrying him out of the top the air
  rests 1.6 s, so a missed landing is a fall back to the row below, not
  an endless ride. The cloud above an updraft is never a storm cloud.
- 💡 star and asteroid platforms (space).
- ✅ balconies on the tower layer (0.9x like the ribbons) at the wall's
  left and right edge, 120 px box; alone, with a ribbon, with a branch on
  the other side, or two at one height; never with a branch on the same
  side, at most one balcony row in two. Stone, wooden, flowered and ivy
  variants; the dilapidated one is fragile under the dry rules. Drawn in
  the tower's own brick palette (doorway like the tiles' windows, a stone
  course with corbels), and stone does not dip on a landing. Only where
  the tower stands alone, above the treeline (zone 0.4 there, 0 below).

**Pickups, power-ups, portals**
- ✅ sun drops, ✅ lanterns (boost refill), ✅ hearts (restore all).
- 💡 super jump portal: a rare pickup that fires the prince 20 m up with
  light trails and speed-line blur. The best single "get higher" device.
- 💡 zone portals: at a zone boundary, a wormhole / light-bridge warp into
  the next zone (the campaign's tower transition, reused).
- 💡 timed power-ups: invulnerability star, jump power / speed-up.
- 💡 magnet for suns and lanterns (store).

**Tunnels and the inside of the tower**
- 💡 doors and openings lead inside; the game continues on stairs, steps
  and ledges with knights and witches; from outside the hair is visible at
  the windows. ⚠️ A system, not an element: interior tiles, its own
  enemies, an exit. Start with windows; do doors as short bonus rooms
  (enter a window, climb for suns, exit higher) once zones and the dev
  menu exist.

**FX and atmosphere**
- ✅ title screen (`src/title.js`, `src/sign.js`): the game loads with a
  ride down the tower (the camera is drawn 40 m up and eases down to the
  lawn in 2.6 s; a tap shortens it), then a wooden sign is lowered in on
  two ropes: bark frame, nailed boards, a vine over two corners, a bow on
  the right rope, drawn with rectangles on the art grid so one routine
  serves every menu at any size. Rapunzel peeks over its top-right corner
  (blinking, bobbing), hands on the edge, her braid running down behind
  the sign and out under it with a bow swinging at its end. On the boards
  the pixel wordmark SIR BOUNCEALOT (`art/logo.js`, the letters hopping
  in a wave), the best height on a brass plate with a crown, PLAY on a
  pink ribbon banner with fluttering tails and the word in the game's
  gold lettering, the controls painted in ink with a light edge, and
  effects, sound and tilt as light boards nailed on with symbols (a
  sparkle, the speaker, a tilted phone) in its bottom row; under it the
  prince hops in place (a flip with sparkles every few hops), two
  butterflies at the flowers. PLAY (or a tap anywhere, or space) pulls the sign up and starts
  a countdown on his landings: 3 at the tap, 2 and 1 on the next two
  hops, GO is the launch at full strength. Pause and game over hang on
  smaller signs of the same kind with the same pieces (PAUSED in the
  pixel lettering, TRY AGAIN on a ribbon, MENU on a board). The game
  over is a summary that counts: a row per board with a symbol, a label,
  a dotted leader and the value in gold letters; the height counts up
  with ticks once the sign hangs, then the suns with a chime each, then
  the stomps with a thud each, then the best height on its brass plate or
  NEW BEST! popping in with sparkles and a jingle; the buttons wake after
  that, and a tap while it counts finishes it; MENU on both leads back
  (the sign is lowered again, no ride). `Game.startRound(config)` is the one way into
  a round, so a mode or tower selection can sit between PLAY and the
  countdown later.
- ✅ light shafts through the canopy (additive soft beams, slow sway) on
  the forest floor and in the deep forest, with dust motes drifting down
  the beams; passing clouds dim and restore the sun over 10–20 s.
- ✅ fog in three depths: behind the tower (only the gaps show it), in
  front of the wall but behind the trees and the prince (greys the wall,
  never covers gameplay), and thin wisps over everything. Wisps are three
  overlapping plateau puffs, tilted, pulsing in place, drifting. Fog
  banks: dense bands that roll down through the view every 26–46 s with a
  clear hole kept around the prince. Fog thickens under cloud cover and
  thins in a gust; mist near the shafts glows a little; a front wisp the
  prince passes through is pushed aside and thins out (wake). Only in the
  deep forest band; the far clouds stay for the sky zones.
- ✅ falling leaves on a depth continuum (parallax 0.85 to 1.35, size and
  opacity by depth) with a shared slow wind, flutter, and staggered
  re-entry above the view. 💡 autumn colours by season.
- ✅ gusts every 14–24 s: stronger wind on leaves and fog, boughs rock,
  motes speed up, the braid swings a little wider (ribbons move with it).
- ✅ canopy dapple: soft dark blobs (multiply) scrolling with the bricks.
- ✅ tower haze along the wall's edges; low mist on the lawn at the start.
- ✅ tower windows left and right of the braid (`src/windows.js`, art in
  `art/windows.js`): 88 × 120 px sprites on the tower layer with the sill
  at a layer height, one per storey (440 layer px), left and right in
  turn, so the tower reads as built rather than scattered and a height
  always shows the same windows whatever the seed. Five looks (lit with a
  flickering candle and a small glow, dark, shuttered, flower box,
  curtains), never the same look twice in a row, none where a balcony
  sits. The old centred window tile is a stone string course now.
- ✅ near leaves and fog drift slightly against the prince's motion.
- ✅ boughs hanging from the trunks; birds perch on them and take off when
  the prince comes near; acorns drop from them now and then.
- ✅ owls blink in the trunks' knot holes (deep forest and night).
- ✅ a tree per zone (`treeStyleAt`): oak on the forest floor, mossy
  giants in the deep forest, birch-like trunks at the windows, bare tops
  above the trees; trunk tiles crossfade over 30 m at each boundary.
- ✅ trunk life: moss, cracks, woodpecker holes, fungus shelves, lichen
  and burls scattered per tile; roots at the lawn; climbing vines (ivy,
  thorny tendrils with red barbs, flowering creepers) winding across tile
  boundaries; lianas and hanging moss that sway with the gusts. Mix and
  density come from the zone's tree.
- ✅ butterflies loop around branch tips and flee a landing (floor and
  deep forest).
- ✅ fireflies gather around lanterns and scatter from the prince.
- 💡 sound for all of it: ambience (wind in the leaves, birdsong, an owl),
  the gust whoosh, acorn plinks.
- 💡 seasons and weather: rain, snow; a Christmas edition with light chains
  along the trees; more animals living in the trees.
- 💡 shake and motion effects when things happen: more shake, hit-stop,
  zoom punch on bow springs and the witch, speed lines on boost.
- 💡 more particles and atmosphere in general.
- ✅ bloom (selective, via a glow layer) and a CRT pass (curvature,
  scanlines, aberration, flicker) with presets. Anything that should glow
  passes `glow` on its draw call. With WebGL in place, fog with depth of
  field, god rays and the portal's light trails are straightforward.
- 💡 an automatic preset fallback for slower phones (drop to bloom, then
  off, when frames run long); a bitmap font for the score text.

**Themes, worlds, hair**
- 💡 towers in snow, rain, summer, jungle, night, space; a parallel
  universe palette; selectable worlds on a map once unlocked.
- 💡 alternative braids and changing hair colors (also store cosmetics).

**Store and meta progression**
- 💡 suns as persistent currency, bought between towers or from the title.
- 💡 upgrades: fourth heart, fourth boost charge, longer shield, lantern /
  sun magnet, stronger springs, a helmet variant of boost protection.
- 💡 cosmetics: braid colors and styles, capes and crowns, palettes.
- Principle: base defenses stay free; the store is also a difficulty valve
  for kids (collect suns on easy towers, buy a heart).
- ❓ pricing; suns inflate with boost punches (+3 each).

**Scenes (campaign)**
- 💡 intro at the foot of the tower (the witch cackles from the window),
  the rescue (she pulls him up by the braid, lanterns rise, a cheer), the
  kidnapping gag ("she is in another tower"), the light bridge.

## 8. Campaign vision (later)

- Each tower: seed, height, theme, zones with their rosters, difficulty
  curve with breathers, hand-placed set pieces, boss, star criteria.
  Fixed seed so towers are learnable.
- Narrative engine: every rescue, the witch whisks Rapunzel to a new tower
  in another land; the last tower is the showdown.
- The braid ends at Rapunzel's window: the tower's height is her hair's
  length. A vertical progress bar with her window at the top.
- Portals between towers (travel animation) and mid-tower warps as
  checkpoints: restarting a four-minute tower from zero after dying at
  90 % is what makes kids quit.
- Stars for replay without grinding: reach her; enough suns; no heart lost.
- Suns persist; the store sits between towers.

❓ Open: retry rules and whether suns survive a death (suggestion: keep
them); endless unlocked from the start (suggestion: yes); theme order and
launch count (suggestion: forest, snow, night sky); exact star criteria.

## 9. Roadmap (intended order, not a contract)

| Phase | Goal | Content | Status |
|---|---|---|---|
| 0 | Browser port | Section 4 | ✅ |
| 1 | Fix the ceiling | Boost shield, full-heal hearts, pacing waves, longer ramp, witch cooldown, pity heart, simulator | ✅ on `phase-1-ceiling` |
| 2 | Zone bands and dev helpers | ✅ minimal: `ZONES` altitude bands with per-element multipliers in `level.js`; `?at`, `?spawn`, `?dev`. More only when elements need it | ✅ |
| 3 | Deep forest zone | ✅ squirrels, fog, falling leaves, light shafts and motes, dapple, boughs, birds, butterflies, owls, acorns, gusts, cloud cover, fireflies' behaviour, zone-keyed sky and light, tree variety (branch variants, trunk life, a tree per zone), branch lengths (stub, short, normal, long); 🔜 thorny branches, cross branch; sound later | in progress |
| 4 | Windows zone | ✅ windows spread across the tower, guards reaching out of them, the witch with scissors cutting the braid; 🔜 Rapunzel's cameo (balconies moved above the treeline) | in progress |
| 5 | Above the trees and the end of the tower | ✅ treeline, cloud platforms (thick, wispy, drifting, storm with lightning), sky lanterns, storks, updrafts, balconies with guards and flowerpots; 🔜 bird swarm, Rapunzel's window as a goal element; with it the forest tower exists, so a minimal campaign mode (play to the window, progress bar, stars) | in progress |
| 6 | Store and scenes | Suns as currency, upgrades, cosmetics; rescue, intro and kidnapping scenes; light bridge | 💡 |
| 7 | Tower two | Snow zones with their own roster; endless chains them automatically | 💡 |
| later | Tunnels / tower interior, selectable worlds, seasons and Christmas, FX preset auto-fallback | 💡 |

Mode-independent polish (super jump portal, god rays, hit-stop) slots in
wherever it fits.

## 10. Tunables snapshot

From `web/src/config.js` and `web/src/level.js` as of Phase 1.

| Parameter | Value |
|---|---|
| Gravity / bounce velocity | 2100 px/s² / 1650 px/s (~648 px bounce) |
| Dry branch / bow spring bounce | 1550 (~572 px) / 2650 (~1670 px) |
| Boost | +1500 px/s, 3 charges, 0.5 charge per landing, 0.5 s shield, 3 suns per punch |
| Horizontal speed (keys / tilt) | 560 / 820 px/s |
| Hearts / invulnerability after a hit | 3 / 1.6 s |
| Row gaps (tier 0 → 5) | 0.75–1.0 → 1.3–1.9 beats (beat = 300 px) |
| Safe gap guarantee | 520 px between non-crumbling platforms |
| Tier altitudes | 0, 35, 100, 220, 400, 700 m (interpolated) |
| Pacing | 90 m cycles, last 15 m a breather |
| Branch lengths (box) | stub 58, short 106, normal 178, long 282 px; normal and long ± 12 % |
| Branch length chances (tier 0 → 5) | short 0 → 0.28, stub 0 → 0.20 (from tier 2, deep forest on), long 0.10 → 0.12 |
| Treeline | branches hand over to clouds 420 → 460 m; trunks end at 460 m |
| Cloud sizes (box) | small 150, normal 225, wide 325 px; surface 16 px below the sprite top |
| Cloud chances (tier 4 → 5) | small 0.16 → 0.26, wide 0.24 → 0.18, drifting 0.26 → 0.40, storm 0 → 0.20 (× pacing); wispy uses the dry chance |
| Lightning | calm 2.5–4.5 s, charge 1 s, strike 0.25 s; column 70 × 420 px |
| Sky lanterns | from 520–600 m on; 136 px box; bob ± 20 px, sway ± 12 px |
| Storks | every 1200–2000 px of climb above the treeline; 380–640 px above the prince; 150–210 px/s; 150 px perch |
| Updrafts | chance 0.10 → 0.16 per sky row (× 1.6 in breathers); 150 px wide; launch 9000 px/s² to 2300 px/s; rest 1.6 s |
| Balconies | x = ±210, 160 px box (the whole slab), 44 × 72 art px; only above the treeline, zone 0.4 |
| Windows | x = ±114, 22 × 30 art px, sill at a layer height; one per storey of 440 layer px, left and right in turn (same side every 880 px), the first at 260 |
| Window guard | tier 0 / 0 / 0.09 / 0.13 / 0.17 / 0.20 per row × pacing × zone (windows 1.0, sky 0.6); pike 130–160 px from hands 48 px above the sill, aim ± 0.35 rad; peek 0.5 s, thrust 0.15 s down + 0.4 s held, back 0.35 s, quiet 2–3.5 s (5 s after a punch) |
| Windows band roster | crow 0.6, spider 0.5, squirrel 0.5 (were 0.8 / 0.7 / 0.6), window guard 1.0 |
| Braid cut | from 300 m, then every 120–180 m; stretch of 1600 + 240 px above the planning row without braid-only rows or dry branches; the witch sets out when the prince reaches the stretch and is still 1000 px below its top, rides 640 px above his highest point, warn 1.0 s, approach 850 px/s, snip 0.35 s; cut pieces fall 525·t² px |
| Guard / flowerpot sizes | guard 34 × 48 art px (the prince is 26 × 58), pot 12 × 13 |
| Guards / flowerpots per balcony | guard 0.25 → 0.45 × zone 0.5, pot 0.25 → 0.45 × zone 0.8 (tier 2 → 5), × pacing |
| Enemy onset | crows 22 m, spiders 65 m, witch 120 m (then every 75–105 m), squirrels 120 m, window guards 250 m, the witch with scissors 300 m |
| Zone bands | forest floor 0 m, deep forest 120 m, windows 250 m, above the trees 400 m |
| Sky / light keyframes | floor 0, deep forest 120, dawn at the windows 250, open sky 400, sunset 550, night 700 m |
| 1 m | 100 px |

## 11. Tools

- Climb bot and phone-flow checks (Playwright, headless Chromium): run
  before every push; catch exceptions and regressions, not feel.
- Gameplay simulator (`web/dev/sim.html`, `tools/analyze.mjs`): real game
  logic, scripted players (kid / good, bold / cautious), heights, deaths,
  hits per 100 m by band. See `docs/ANALYSIS-phase1.md`. A seed replays
  exactly (enemies, pickups and the gusts that swing the braid roll on
  seeded streams), so two builds are compared on paired seeds; a batch of
  the same seeds gives the same numbers every time.
- Generator stress test: ~3900 rows, every consecutive pair reachable even
  with the camera far above the model.
- Real-device checks stay manual (iOS audio, tilt, performance). The iOS
  shell in `ios/` runs any checkout on the phone from Xcode, with the dev
  helpers as the launch argument `-gameQuery "at=150&dev=1"`.

## 12. Decision log

- 2026-10-22: Browser port on plain canvas, no framework; procedural art
  because the original atlases were never committed.
- 2026-10-23: Deploy on Vercel; prince restyled after the original app
  icon; tower, windows and braid on a slower layer, trees in front.
- 2026-10-24: `master` is the browser game, `swift-prototype` keeps the
  Xcode project.
- 2026-10-26: The 300 m ceiling analysed as attrition; Phase 1 fixes
  agreed, implemented and measured (bold median 142 → 434 m).
- 2026-10-26: Levels later: a campaign of towers with Rapunzel at the top,
  portals as transitions and checkpoints, store between towers, Endless
  Tower kept.
- 2026-10-27: The longer climb is boring; cure is variety in zones, not
  difficulty. Zone / tower / scene as the three concepts; the forest
  tower is zones 1 to 4 of endless mode. The sandbox approach: build and
  iterate every element in endless mode first, with the element-module
  rule, the simulator as guard rail and a dev menu.
- 2026-10-27: Phase 1 merged into `master`. The WebGL renderer (PixiJS
  facade, selective bloom, CRT presets) from `preview/webgl-pixi` merged as
  well; the "no shaders in 2D" caveat is gone.
- 2026-10-27: Sandbox batch starts with the squirrel (`element/squirrel`):
  first platform-bound enemy, zone bands as a small multiplier table,
  `?at` / `?spawn` / `?dev` helpers, `CLAUDE.md` with the working rules.
  Simulator: bold median 388 m, 0.99 hits per 100 m, squirrel hits on par
  with crows; the bot learned to stomp or sidestep squirrels on its branch.
- 2026-10-27: Deep forest look (`element/deep-forest-atmosphere`): sky,
  lighting and distant-forest fades re-keyed to the zone bands (they were
  set for 300 m runs); mist and falling leaves in two depths, light shafts,
  boughs; renderer gained puffs, beams and blend modes. Purely visual, the
  simulator is unaffected.
- 2026-10-27: Deep forest, part two (`element/deep-forest-life`, plan in
  `docs/plans/deep-forest-2.md`): atmosphere moved into its own module;
  dust motes, cloud cover, gusts, dapple, tower haze, lawn mist, fog wake,
  sideways nudge, owls, birds, butterflies, acorns, firefly behaviour.
  Sound for all of it deferred. Purely visual; simulator unaffected.
- 2026-10-27: Fog was barely visible: reworked into three depths with a
  plateau puff texture, fog banks, weather coupling and a wake hole.
- 2026-10-28: Trees looked like a repeating pattern (two branch drawings,
  fixed length, four trunk tiles). `element/tree-diversity`, plan in
  `docs/plans/tree-diversity.md`: tree art moved into `art/trees.js` with
  a tree style per zone (oak, mossy giant, birch, bare), six branch
  variants per side with length and tint, trunk overlays, vines and
  lianas drawn by hash so they are stable. Branch boxes keep the surface
  height; length varies ±12 %, anchored at the trunk. Simulator sanity
  (10 bold runs): median 431 m, 0.9 hits per 100 m, unchanged.
- 2026-10-28: Branch lengths (`element/branch-lengths`, plan in
  `docs/plans/branch-lengths.md`): stub, short, normal and long classes
  with their own drawings, generator rules that keep a stub a challenge
  rather than a trap, and `?len=` to play one class. Simulator, same bot
  and seeds, good bold, 40 runs: median 409 m (baseline 338), 0.93 hits
  per 100 m (1.03), falls 50 % of deaths (42 %), doubling in the 100 m
  band where stubs begin. The bot now aims for the bigger platform of a
  row; the analyzer takes a seed base. The kid bot falls before 100 m in
  both builds and needs a better model before it can guard this. The
  branch box now really scales with the length (tree diversity scaled
  only the drawn width).
- 2026-10-28: Engine hardening (`fix/engine-hardening`) after a technical
  review. A thrown error no longer ends the frame loop: the frame is
  dropped and a persistent error stops the game with a message instead of
  a frozen picture; a failing boot shows a message instead of a blank
  page. The fixed 1/120 s step became a semi-fixed step (each frame is
  split into equal steps no longer than 1/120 s), which removes the
  skipped or doubled frames at 90 and 144 Hz and the boost taps that were
  lost in frames without a step (measured: 17 % of taps at 144 Hz, 49 % at
  240 Hz, now 0 %); the boost queue survives a frame instead of being
  cleared every frame. Enemies, pickups and the gusts draw their random
  values from seeded streams, and hearts and the witch have streams of
  their own, so a seeded round lays out the same tower however it is
  played and the simulator is reproducible (40 of 40 seeds identical,
  before 1 of 40; the measured deltas in the two entries above were within
  that noise and should be re-read with paired seeds). The pixel font is
  served from `web/fonts/` (OFL) instead of Google Fonts, and the canvas
  keeps out of the phone's safe areas (notch, home indicator) in
  full-screen mode. Verified in headless Chrome: WebGL context loss and
  restore, WebGL1 shader fallback, 40 s heap flat.
- 2026-10-28: Above the trees, part one (`element/clouds`, plan in
  `docs/plans/clouds.md`): the trees end at a treeline (handover 420 to
  460 m, crown tiles), cloud platforms in three lanes and sizes with
  thick, wispy, drifting and storm behaviours, lightning as the sky's
  first new enemy, thunder and poof sounds, `?spawn=storm`, a simulator
  that can start in a zone. Drifting clouds first wandered and wrapped
  around the screen edge, which caused most sky falls; they now patrol
  their lane. Crows above the trees went from 1.2x to 1.0x. Good bold,
  40 runs from 450 m: mean climb 328 m, 1.17 hits per 100 m, falls 39 % of
  deaths. Whole game: mean 415 m (405), 0.86 hits per 100 m, falls 55 %.
- 2026-10-29: Two fixes from playing the sky. The far layer (stars and the
  distant clouds) scrolled the wrong way: screen y was computed from world
  y without the flip, so the far clouds rose while the prince climbed and
  looked faster than the foreground; the forest and tower layers were
  right. And the cloud platforms were a quarter too small for the eye:
  repainted (not scaled) at 150 / 225 / 325 px with lobes that follow the
  sprite height; wide clouds sit a little further in to stay on screen.
  Sky from 450 m, 40 good bold runs: mean climb 381 m (328), 1.07 hits per
  100 m (1.17), falls 48 % of deaths (39 %).
- 2026-10-29: Sky lanterns (`element/sky-lanterns`, plan in
  `docs/plans/sky-elements.md`): hovering paper lanterns as platforms
  from sunset on, with a field of small lanterns rising at night. A first
  112 px box took falls from 600 m from 41 % to 53 % of deaths; at 136 px
  with a calmer bob the sky from 600 m measures 29 % falls, 1.14 hits per
  100 m, mean climb 315 m (321 without lanterns), 40 good bold runs.
- 2026-10-29: Storks (`element/sky-birds`): a one-shot moving perch that
  crosses the screen, spawned relative to the prince like the witch.
  The bot first chased storks it could not reach (falls from 450 m 54 %
  of deaths); taught to chase only a stork that will still be on screen
  and within 320 px when it gets there: 33 % falls, 1.09 hits per 100 m,
  mean climb 330 m, 40 good bold runs.
- 2026-10-29: Updrafts (`element/updrafts`): the sky's lift without a
  landing. Same seeds with and without them, 40 good bold runs from
  450 m: falls 53 % → 43 % of deaths, mean climb 337 → 390 m, 1.21 → 1.1
  hits per 100 m. A first version let the bot ride a column forever when
  the cloud above had dissolved; the air now rests after carrying the
  prince out of the top.
- 2026-10-29: Playing feedback on the sky: updrafts were ugly and too
  gentle, storks too frequent. The updraft is now a little blowing cloud
  with wind curls, petals and feathers, and it throws the prince up like
  a bow spring (2300 px/s), a little rarer (0.10 to 0.16); storks every
  1200 to 2000 px of climb instead of 400 to 700. Sky from 450 m, 40 good
  bold runs: falls 37 % of deaths, 1.21 hits per 100 m, mean climb 338 m.
- 2026-10-29: Balconies, guards and flowerpots (`element/balconies`, plan
  in `docs/plans/balconies.md`): the windows zone gets its face. Paired
  seeds, 40 good bold runs from 250 m: before 0.85 hits per 100 m (0.62 in
  the 300 m band), falls 61 % of deaths, mean climb 313 m; after 1.15
  (1.26 in the band), falls 55 %, climb 281 m. A first guard chance of
  0.4 put the band at 1.49, so it was trimmed to 0.35. The flowerpot
  rarely hits the bot (1 hit in 40 runs); it is a telegraph test for
  people, not for the bot.
- 2026-10-29: Balconies reworked after playing: they looked bolted on,
  they dipped like wood on a landing, and they stood between trees. Now
  drawn in the tower's brick palette with a doorway like the tiles'
  windows and corbelled stone beneath, the slab no longer dips, and they
  appear only above the treeline where the tower stands alone (the
  windows zone goes back to 🔜). Paired seeds, 40 good bold runs from
  450 m: master 1.1 hits per 100 m, falls 42 %, mean climb 361 m; with
  balconies at zone 0.7 and guards at 1.0 the sky overloaded (1.59, climb
  200 m); at balconies 0.4, guards 0.5, pots 0.8 and the whole slab
  landable: 1.24 hits per 100 m, falls 50 %, mean climb 312 m.
- 2026-10-29: The guard stood a third of the prince's height. Repainted
  at 48 art px (helmet with a plume, moustache, red tunic, halberd; a
  thrust and a dazed frame), the balcony at 72 art px so the doorway fits
  him, the flowerpot larger and really on the railing. Paired seeds, 40
  good bold runs from 450 m: 1.28 hits per 100 m, falls 44 %, mean climb
  337 m (master 361 m).
- 2026-11-02: Tower windows (`element/tower-windows`, plan in
  `docs/plans/windows.md`): the window was baked into a tile variant at
  the wall's centre, where the braid hid it. Windows are now their own
  sprites left and right of the braid (x = ±114, 40 px from the wall's
  edge) in five looks, never under a balcony; the tile variant became a
  stone string course. A first version scattered them per tile by hash
  with a density per band (up to seven in view in the windows band);
  playing it showed that as noise, so they sit one per storey of 440
  layer px, left and right in turn, about three in view, looks still by
  hash. Purely visual, the simulator is unaffected. Also fixed a
  misplaced draw block in `World.onPlayerJump`
  (a ReferenceError waiting for a fragile stork).
- 2026-11-02: Window guards (`element/window-grabber`): the prototype's
  "enemy appearing" at a window, now a guard whose bust rises behind the
  sill and whose arm shoots into the prince's plane. The guard's height
  follows the window's layer height every frame like a ribbon's; a
  freshly spawned one starts in plane coordinates because the cull runs
  before his first update (the first build lost every guard spawned
  during the climb that way). His rolls run on a fourth seeded stream
  (`rngTower`), so the tower's geometry is the same with and without him
  and paired seeds compare only the hazard. Paired seeds, 40 good bold
  runs from 250 m: before 1.05 hits per 100 m (0.62 in the 300 m band),
  falls 52 % of deaths, mean climb 316 m; a first build at tier 0.20 →
  0.40 and 150–190 px reach gave 1.66 (1.72), 53 %, 192 m, far too much;
  at tier 0.12 → 0.25 and 130–160 px: 1.36 (1.23 in the band), 39 %,
  281 m. Forty runs turned out too noisy for this (the same build read
  281 and 255 m), so the tuning was settled on 120 paired runs: tier
  0.10 → 0.22, and the windows band's crows, spiders and squirrels
  stepped back to 0.6 / 0.5 / 0.5x so the zone's roster changes instead of
  growing: 1.37 hits per 100 m (1.38 in the band, 82 guard hits in 120
  runs), falls 40 % of deaths, mean climb 268 m against 299 m on master
  (−10 %); from 300 m 239 m against 275 m. The bot steps away from a
  window whose guard is up unless it is about to land on a branch on that
  side, and only punches an arm that is really out; the analyzer now
  lists hits per band and enemy. Playing it: the arm read as a red bar
  sliding out of the wall. It became a pike: the bust rises with the pike
  upright (that is the telegraph), leans out, and the pike sweeps down into
  a thrust aimed at the prince, hurtful only once past the sweep; the
  world lets an enemy refine its box with a `hits` test so the slanted
  shaft, not its box, does the hitting. The aimed thrust hits the bot
  more than the level arm did (about 90 against 80 guard hits in 120
  runs), so the chance went to tier 0.09 → 0.20: from 250 m 1.40 hits per
  100 m (1.30 in the band), falls 43 %, mean climb 257 m (master 299 m);
  from 300 m 1.68 (1.49), 33 %, 244 m (master 275 m).
- 2026-11-02: The braid cut (`element/braid-cut`): the scissors idea,
  given to the witch (in the tale she is the one who cuts the braid).
  The cut is planned by the generator before it happens, so the rows
  below it have something that is not on the braid and nothing that
  crumbles; the witch then comes when the prince is 900 px below the
  planned height and snips at a layer height she keeps level with, so
  the braid she cuts is the braid she flies next to. Ribbons and bows
  below the cut ride the falling piece down (`fallAway`, shared
  `fallDist` and `fallSwing` with the background's pieces). A first lead
  of 1300 px put her above the view: the cut happened unseen. Paired
  seeds, 120 good bold runs: from 250 m 1.35 hits per 100 m (1.48 in the
  300 m band), falls 48 % of deaths, mean climb 262 m (master 299 m,
  guards alone 268 m); from 300 m 1.49 (1.41), 39 %, 237 m (master 275 m,
  guards alone 239 m). 171 scissors events in 120 runs from 250 m, 116
  cuts, 55 fended off by a boost; six falls in the 15 m above a cut. The
  bold bot takes the cut almost for free because it reads branches well;
  for people it is the spectacle and the lost ribbons that count. Both
  witches' edge markers got an outline (invisible on the birch trunks
  before). Re-measured once the windows moved into their storey rhythm
  (the guards sit in different windows now): from 250 m 1.43 hits per
  100 m (1.40 in the band), falls 42 %, mean climb 251 m (−16 % against
  master); from 300 m 1.56 (1.71), 40 %, 243 m (−12 %). The two readings
  bracket the targets; between builds that differ only in where the
  windows are, a band moves by 0.2 to 0.3, so that is the noise floor
  even at 120 runs.
- 2026-11-02: Playing the cut: it came too low, sometimes below the
  prince and scrolling out of the bottom of the view, because the witch
  aimed at the planned height while the prince kept climbing for the two
  seconds she needs. She now rides 640 px above his highest point (the
  upper fifth of the view) like the diving witch does while she warns,
  snips where she is once she reaches the braid, and only sets out while
  he is still 1000 px below the stretch's top (the stretch grew to 1600 +
  240 px); a plan another witch blocked for too long is dropped. Warn
  1.0 s, approach 850 px/s, snip 0.35 s. Measured over 148 cuts: the cut
  lands a median 560 px above his feet (tenth percentile 235), at 80 % of
  the view's height (tenth percentile 62 %); 5 % still land below him
  when he boost-chains past her, down from 25 % before. Paired seeds, 120
  good bold runs: from 250 m 1.32 hits per 100 m (1.23 in the band), falls
  37 %, mean climb 276 m (master 299 m); from 300 m 1.50 (1.49), 42 %,
  259 m (master 275 m).
- 2026-11-03: The game is called Sir Bouncealot (`element/title-screen`,
  plan in `docs/plans/title-screen.md`): the knight on the pogo stick gives
  it his name so the name is ours alone; Rapunzel stays the tale behind
  the tower. Saved data moved to a new key with the old one read as a
  fallback. A real title screen: the prince hops on the lawn by himself
  (the world runs its physics before the round with a silent input, the
  ground landing sets a small hop instead of the bounce, pickups and
  enemies are skipped until the round starts), the drawn logo brought onto
  the art grid by `tools/pixelate.py` (a first procedural pixel wordmark
  was replaced by it), PLAY, and a countdown on his landings instead of an
  abrupt launch (3 at the tap, 2 and 1 on the hops, GO is the launch; a
  landing within 0.3 s of the tap does not count twice). `startRound`,
  `beginPlaying` and `toTitle` replace the ad-hoc mode switches; MENU
  from pause records the height first; `?at=` skips the countdown.
  Purely visual and UI: the simulator calls `start()` directly and reads
  the same numbers on the same seeds (20 good bold runs: median 423 m,
  1.03 hits per 100 m on both master and the branch).
- 2026-11-05: Menus on a wooden sign, and a ride down on load (same
  branch). Text straight on the scene looked cheap, so the title, the
  pause and the game over hang on a sign (`src/sign.js`: frame, boards,
  nails and ropes as rectangles on the art grid, vines and a bow as
  sprites in `art/sign.js`) that is lowered in on its ropes and pulled up
  when the round starts; a later mode or tower menu gets the same boards.
  The drawn title picture went back out: at 150 art px it lost too much
  and the procedural wordmark reads better; `tools/pixelate.py` and the
  source stay for a picture drawn for the grid. On load the camera starts
  40 m up and eases down to the lawn in 2.6 s before the sign comes
  (`INTRO_FROM`, `INTRO_T`; the lift is a drawing offset only, the world
  keeps running on the lawn, and the rows the ride passes are generated
  once at its start); `?at=` and `?spawn=` skip it, a tap shortens it,
  MENU does not repeat it. The show-off hop is a little lower (`SHOWOFF_VY`
  960) so the prince's head stays under the sign. Simulator untouched
  (10 good bold runs: 0.99 hits per 100 m).
- 2026-11-06: The menus' text and buttons looked like a prototype on the
  sign, so they are made of game material now. The lettering of the
  wordmark (`art/logo.js`) grew into a full glyph set (A to Z, digits, !
  and m) with per-character sprites in gold at two sizes and pink at one;
  `drawWord()` sets PLAY, TRY AGAIN, PAUSED, the height and NEW BEST!
  from them, so no heading uses the font any more. The main button is a
  pink ribbon banner with forked, fluttering tails (the ribbons on the
  braid, the banner in the first logo sketch); the small ones are light
  boards nailed on with a symbol instead of a technical label (sparkle,
  speaker, tilted phone, gold rim when tilt is on); the best height sits
  on a brass plate with a crown; suns and stomps show their symbols. Small
  text is painted in ink on the boards with a thin light edge baked into
  the text texture (`paint` option of the renderer's text; a tinted stroke
  would go dark with the ink), so it reads over the grain. Rapunzel peeks
  over the title sign's corner with her braid behind it and out under it:
  doubled with the tower's braid on purpose, for the cuteness. The sign
  did not stand off the scene enough, so once it hangs the scene behind
  it dims to a third over 1.4 s (`TITLE_DIM`), never fully, and the dim
  lifts with the sign when the countdown starts. Atlas 2048 x 3518.
  The game over looked untidy (a stack of differently styled lines, the
  small stats hard to see), so it became a counting summary on the wide
  sign: `summaryPlan()` in `hud.js` schedules a row per board (height
  with ticks, suns with the pickup chime each, stomps with the stomp
  thud each, then the best or NEW BEST! with the milestone jingle), the
  rows slide in one after the other, a finished value pops, the buttons
  wake at the end; a tap during the count finishes it (`skipSummary`),
  the next one restarts. Row heights follow the boards (72 px), so the
  sign reads as a scoreboard. The tower, sun and star symbols are the
  row icons; a small tower sprite joined `art/sign.js`.
- 2026-11-06: A native iOS shell (`ios/`, WKWebView in Swift, no Capacitor)
  in this repository, aimed at TestFlight first; the game talks to it only
  through `web/src/platform.js` (storage in UserDefaults, tilt from
  CoreMotion without a prompt, haptics, pause when the app resigns active).
  The ring/silent switch mutes the game there. See `docs/PORTING.md`.
- 2026-11-06: Haptics as part of the feel on the phone: every landing and
  every pickup taps (a landing firmer with the combo), the boost kicks and rushes, bonk, helmet, stomp
  and hurt hit hard, game over falls in three. The game names the event
  (`platform.haptic('bounce')`), the shell owns the Core Haptics pattern.
- 2026-11-06: The picture fills a phone screen: the logical height follows
  the screen's shape (`H` in `config.js`, 1664 on an iPhone 17, 1364 in a
  9:16 window and in the simulator), the HUD keeps out of the safe area and
  the sign screens sit centred. About 3 m more world is visible on a phone.
- 2026-11-10: A landing page in front of the game, in the same Vercel
  project (not a subdomain): one deploy, one origin, so the page can show
  the best height from the game's own save, and preview URLs keep working
  per branch. The game moved to `/play/`; `web/` stays as it is (the iOS
  shell bundles it, the simulator runs it), the deploy copies `site/` and
  `web/` together. The game is not embedded in the page: PLAY opens it
  full screen on phone and desktop alike, because a game inside a
  scrolling page fights the touch steering, the collapsing toolbars, the
  safe area and the tilt prompt. The page draws its art with the game's
  own modules, so it cannot drift from the game; it reads without them.
  The same day: parallax in three planes. The signs stay at the scroll's
  pace (text that moves against the finger is hard to read); the scene's
  planes are fixed to the window and moved by the scroll, each long enough
  to reach the lawn at the end and to stay on it when scrolling back. The
  creatures sit in the gaps between the signs, where the tower shows,
  computed for the moment the gap is in the middle of the window; on a
  phone the signs cover almost the whole width, so the gaps are where the
  middle plane is seen.
- 2026-11-10: Screen effects off by default: the plain picture looks
  better, bloom and CRT stay a choice (F, the title's button). Only a
  preset the player picks is saved (`fxPick`); the old saves wrote 'full'
  with every best height whether chosen or not, so an old `fx: 'full'` is
  ignored and an old 'bloom' or 'off' is kept as a pick.
