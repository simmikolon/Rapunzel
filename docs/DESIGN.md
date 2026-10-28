# Rapunzel: design document

The living guide for the browser version of Rapunzel. It records the
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
  `?spawn=squirrel` puts an element on the next branch, `?dev=1` shows
  altitude and zone, `?len=stub` makes every branch one length class. 💡 later: toggle invulnerability, freeze the witch,
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
presets full / bloom / off (F key, title button, `?fx=`).

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
  silent-switch handling. Title, pause, game over; best height saved; web
  app manifest and icons. The prince follows the original app icon.

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
3. **The tower's windows, 250 to 400 m** (🔜): windows spread left and
   right with guards' arms reaching out, window ledges on the tower layer,
   Rapunzel's cameo window, the witch more present. Doors later.
4. **Above the trees, 400 to 550 m** (🔜): the trees end, cloud platforms,
   bird swarms to boost through, wind gusts; the tower rises out of the
   forest with Rapunzel's window at the top. When this exists, the forest
   tower exists.
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
- 💡 arms reaching out of windows to grab the prince; guards at the windows.
- 💡 scissors cutting the braid from below a certain height: ribbons below
  the cut fall away. A rising death line; strong pacing, harsh; late zones
  only, loudly telegraphed.
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
- 💡 cloud platforms (above the trees), star and asteroid platforms (space).
- 💡 window ledges on the tower layer.

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
- 💡 title screen: the tower behind, the prince bouncing happily in place,
  flowers on the lawn (light rays already shine through the forest).
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
| 4 | Windows zone | Guards' arms, window ledges, Rapunzel's cameo, windows spread across the tower | 🔜 |
| 5 | Above the trees and the end of the tower | Trees end, cloud platforms, bird swarm, wind, Rapunzel's window as a goal element; with it the forest tower exists, so a minimal campaign mode (play to the window, progress bar, stars) | 🔜 |
| 6 | Store and scenes | Suns as currency, upgrades, cosmetics; rescue, intro and kidnapping scenes; light bridge | 💡 |
| 7 | Tower two | Snow zones with their own roster; endless chains them automatically | 💡 |
| later | Tunnels / tower interior, selectable worlds, seasons and Christmas, FX preset auto-fallback | 💡 |

Mode-independent polish (super jump portal, god rays, hit-stop, title
idle scene) slots in wherever it fits.

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
| Enemy onset | crows 22 m, spiders 65 m, witch 120 m (then every 75–105 m), squirrels 120 m |
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
- Real-device checks stay manual (iOS audio, tilt, performance).

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
