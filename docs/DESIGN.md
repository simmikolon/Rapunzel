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
  turns the next cloud into a storm cloud, `?spawn=bat` hangs one under
  the next branch, `?at=170&spawn=flock` builds a flock of starlings a
  dozen metres above the start, `?spawn=star` (or `cloak`,
  `spring`, `magnet`, `feather`) hangs that power-up above the prince,
  `?dev=1` shows altitude and zone, `?len=stub` makes every branch one
  length class. The simulator can
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
  (marker and cackle, crosses above you, dives, twice near the top); the
  later ones (squirrel, bat, guards, the witch with scissors, the flock
  of starlings) in section 7.
- Pickups: sun drops, lanterns (boost refill), hearts; five timed
  power-ups floating in soap bubbles (star, cloak, golden spring, sun
  magnet, feather; section 7), one at a time.
- Two places to climb, chosen on the title sign: outside (all of the
  above) and inside the tower (stone ledges, chandeliers and a bell on a
  chain, scaffold boards, galleries; bats and guards; section 7). A best
  height for each.
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
  Devlog: a sign on the landing page with the newest three episodes and
  `/devlog/` with all, from `site/devlog/episodes.json` (added with
  `tools/devlog_add.py`); the pictures are saved on the site and YouTube's
  player loads only on a click (two clicks, as German privacy law wants).
  Until the first episode the sign says it is on its way.

**Phase 1, the ceiling (✅ on branch `phase-1-ceiling`)**: boost shield
(0.5 s after a boost the prince knocks enemies away for three suns; the
witch is thrown off course), hearts restore all three hearts, difficulty
ramp stretched to 700 m with 90 m pacing cycles ending in a 15 m
breather, witch cooldown 75 to 105 m and a slower dive, pity heart, a
one-time hint for the shield. Plus the headless gameplay simulator.

**Key files**: `web/src/config.js` (tunables and the `FX` block),
`web/src/level.js` (tiers, pacing, rows), `web/src/background.js` (layers,
sky, lighting), `web/src/enemies.js`, `web/src/platforms.js`,
`web/src/player.js`, `web/src/powerups.js` (the power-ups' table; their
rules sit in `config.js`, `level.js`, `player.js`, `world.js`),
`web/src/atmosphere.js` (leaves, fog, shafts, life), `web/src/lights.js`
(the deep forest's string lights), `web/src/altitude.js` (zone-keyed curves), `web/src/gfx/*`
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
   knot holes, acorns, gusts and passing clouds, string lights slung
   between the trunks; ✅ bats asleep under the branches, which take half
   of the spiders' places (spiders 0.5x); 🔜 thorny branches, the cross
   branch you must boost through; crows fade out (0.6x).
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
   prince passes below; ✅ the flock of starlings to boost through (a
   set piece from 160 m on, not only up here: see the enemies). 🔜 the
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
- ✅ bat: sleeps under a healthy branch, hanging by its feet, wrapped in
  its wings (a "z" drifts up). When the prince comes within its hearing
  (215 px, up to 275 at the top tiers) it wakes: eyes open, a squeak, a
  "!" for 0.45 s. Then it lets go and swoops once: a U-shaped pass
  through where he was (a little ahead of him), ending as far on the
  other side (1.2 s, 0.95 at the top tiers), and flies back to its roost
  in 0.9 s, where it hangs with its eyes open for 2.5 to 4 s before it
  can be woken again. Harmless while it hangs; in flight it costs a
  heart, and a pogo from above or the boost shield knocks it out. It
  does not hear a prince under the cloak. One thing per branch: never
  where a spider hangs or a squirrel lives, never under a stub or a dry
  branch; if its branch goes, it flutters off. The deep forest's second
  creature (tier 0.14 → 0.20 × pacing × zone: deep forest 1.0, windows
  and the last trees 0.5), where spiders step back to 0.5. Rolled on the
  fauna stream.
- ✅ the flock of starlings, the barrier that needs a boost: a stream of
  birds from one screen edge to the other, three lanes deep (130 px), in
  a gap the generator built for it. From 160 to 240 m on, then every 300
  to 450 m, never in a breather or a braid cut's stretch, a row becomes a
  floor across the whole width (two long branches that meet in the
  middle; above the trees three wide clouds), the row 500 px above it
  another, nothing on or between them crumbles, drifts or bites, and two
  lanterns that stay put stand on the lower floor (the boost it takes is
  always there). When the prince comes within 16 m below the birds'
  height they are announced (a marker with two birds at the edge they
  come from, calls, "A flock! Boost through!") and 1.3 s later stream in,
  so the stream is whole when it scrolls into view. It is a gate, not a
  bite: the boost shield or the star bursts through (+3 suns, the birds
  near him tumble away and the stream closes again within a lap); a
  prince who flies into it without a boost is turned back down without
  losing a heart, onto the floor (out beyond its ends the birds sweep
  him back over it); coming down on it from above is a pogo on a bird's
  back; under the cloak he slips through. When he stands above it the
  last birds fly out. The witches keep away while a flock is near.
- 💡 cross branches spanning the width, broken only by a boost. ⚠️ Only
  spawn with a guaranteed charge (a lantern just below or a generator
  check); the flock's floors and lanterns are the pattern.
- ✅ the spider's web (inside the tower; `Web` in `src/enemies.js`): a
  quarter web in the corner under a healthy ledge at its pillar, with
  its spider in the hub. It holds whoever flies into it with his head or
  chest: he hangs there by the shoulders, the pogo dangling. Every tap
  is a tug that tears it further, three free him (no boost is spent),
  and he is tossed up through the ledge the web hangs under and lands
  on it. The spider comes down from the hub for him, slowly at first,
  and bites after 2.2 s in the web (a heart); the web lets go all the
  same. So a web is never a fall and never for ever: it costs time, or
  a heart if ignored. The boost shield and the star tear straight
  through and knock the spider out (three suns); under the cloak the
  web still holds but the spider does not come. The way round is to
  rise beside the ledge's tip and land from above.
- ✅ ghost (inside the tower, from 120 m, in the crow's place; `Ghost` in
  `src/enemies.js`): a small round ghost with a candle drifts to and
  fro between the pillars. It comes and goes: there for two to three
  seconds (it bites; a pogo on its head sends it off), fading out, gone
  for about two, fading in over 0.8 s with a "!" and a flaring candle,
  harmless until it is all there. The candle never fades, with its
  pool of light, so one always knows where the ghost is. Close to the
  prince it says boo (arms up, mouth wide). Higher up it drifts toward
  his height while it is there. Under the cloak it notices nothing.
- 💡 vines / green zones that slow or stick (deep forest, jungle); prefer
  slowing.
- 💡 mushrooms (negative power-up): dizziness, wobbly or reversed controls
  for a few seconds. ⚠️ Frustrating for young players; clearly marked, short.
- 💡 the witch as a level boss defending the window.
- 💡 per-theme rosters: bees (summer), ice creatures (snow), knights and
  witches inside the tower. 💡 bats at night too, asleep under the
  balconies; a flock that crosses twice, or two flocks one above the
  other, for the highest tiers.

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
  sky lantern lit by the flame at its open bottom, a crown or a tulip
  painted on it (136 px box, never fragile), hovering with a slow bob
  around its row's height, glowing; landing crumples the paper. A cloud slot becomes
  a lantern with chance 0.6 x `lanternAmount`. A field of small lanterns
  rises behind and in front of the tower at night, purely visual.
- ✅ storks: once the clouds are fully in, every 400 to 700 px of climb a
  stork (a bundle in its beak) enters from one edge 380 to 640 px above
  the prince and crosses
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
- ✅ timed power-ups (plan in `docs/plans/power-ups.md`): five items
  floating in soap bubbles, one
  every 65 to 105 m of climb (the first at 15 to 25 m), each for a few
  seconds, **one at a time** (a new one ends the one that runs). Each
  shows on the prince, flickers through its last 1.5 s with three blips,
  and has its picture and a bar at the top of the HUD.
  - **Star** (12 s, a smiling shooting star with a rainbow tail):
    invincible. What he touches is knocked away like under the boost
    shield (+3 suns each, the witch is thrown off, a cut is fended off),
    lightning does nothing. A rainbow rim runs around him, a wash of
    colour over him, a rainbow trail behind; no halo around it.
  - **Cloak** (10 s, a hood with nobody in it but two eyes): invisible.
    Nothing with eyes notices him (crows do not home in, spiders do not
    lunge, squirrels do not dash, guards do not thrust, window guards
    stay down, pots do not wobble) and he passes through it; a pogo on
    a head still counts. Squirrels and guards stand puzzled with a "?",
    the witch does not set out and one who is crossing flies on with a
    "?"; birds and butterflies stay put. Lightning does not need to see
    him: the one thing the cloak does not stop. He is a pale glassy
    figure with a shimmering rim, so the player still sees him.
  - **Golden spring** (8.75 s, a toy launcher with a red cushion): every
    bounce 1.25 times as strong (648 → 1012 px), a boost 1900 instead of
    1500 px/s, a bow spring up to 3000 px/s; a somersault with each
    bounce and boost in the direction he faces, golden after-images.
  - **Sun magnet** (12.5 s, a red horseshoe): suns, lanterns and hearts
    within 380 px fly to him, leaving sparks; nothing is drawn around the
    prince for it, what flies to him is the sign. Never pulls
    another power-up; what is on its way keeps coming when it runs out.
  - **Feather** (8.75 s, the stork's): he comes down slowly (40 % gravity,
    at most 600 px/s while falling; the way up is untouched), with two
    small wings on his back. The one made for the youngest players:
    falls are how their runs end.
  When the star or the cloak ends he is safe for another 0.8 s. Which
  item comes is a weighted pick per zone and pacing (star and cloak with
  the enemies' pacing, never in a breather or below 30 m; the magnet
  with the suns'; never the same twice in a row; more feather and less
  spring on the forest floor, more cloak at the windows, more feather
  and star above the trees), rolled on a stream of its own.
- 💡 more power-ups: an hourglass that slows every enemy; a sun shower
  (suns worth double, or a trail of suns to follow); a bubble that
  carries him back up once when he falls out of the view. 💡 mushrooms
  as the negative one (see enemies).

**Tunnels and the inside of the tower**
- ✅ the inside of the tower as a second place (plan in
  `docs/plans/tower-interior.md`), chosen on the title sign; 🔜 reached
  through gates in the endless tower later. The room (`src/interior.js`,
  `src/art/interior.js`, `src/pillars.js`): stone pillars where the
  trunks stand, a violet-grey back wall on the tower layer with a tall
  arched window every third tile. The windows are holes in the wall
  tiles: the sky of that height, the stars and the moon, the far clouds,
  the distant forest and the braid (which hangs outside, on a layer of
  its own at 0.8) are drawn first and slide past the frames as he
  climbs. The round starts in the entrance hall: flagstones, the shut
  door, a torch on each pillar.
  - ✅ stone ledge: the branch in stone (the same four lengths, rules and
    bot), a pale slab on a stepped corbel; a cracked one (loose stones,
    one sagging) crumbles like a dry branch.
  - ✅ the chain: one long chain down the middle of the shaft, the
    inside's braid. It sways in a slow heavy wave, wider as the climb
    gets harder, and what hangs in the centre lane rides on it.
  - ✅ chandelier (the ribbon's place): a pewter ring with four candles
    on the chain, 112 px; it lights the room around it.
  - ✅ bell (the bow's place): a brass bell under a wooden headstock; a
    landing on the headstock rings it and throws him up like a bow.
  - ✅ scaffold board: the plank swing on chains.
  - ✅ gallery (the balcony's place, from 35 m): a wooden landing with a
    railing in front of a door in a pillar, 160 px, in the prince's
    plane. Never two rows running. A guard may stand on it.
  - ✅ who lives there: bats under the ledges, guards on the galleries,
    pike guards in the pillars' hatches (the window guard, thrusting from
    the pillar over the ledges; a ledge's tip is out of his reach). The
    hatches are a fixed map like the windows outside, so an empty one
    looks like a manned one until he peeks.
  - ✅ light: the room is dim (a violet multiply, a little deeper at
    night), and every lamp adds a pool of its colour after it: torches
    every third pillar tile, left and right in turn; the chandeliers;
    the windows, with a bloom on the wall and a stepped shaft with dust
    in it, in the colour of the sky outside, so the forest's dusk, the
    day, the sunset and the night show inside.
  - ✅ the spider's web under the ledges, ✅ the ghost with its candle
    (see enemies), ✅ the bat swarm: the flock's gate from 160 m, two
    long ledges that meet as floors, two lanterns on the lower one, a
    stream of bats between to boost through.
  - ✅ on the walls (purely visual, nothing for the bot): banners in the
    prince's blue and in violet (one each side of the hall's door),
    shields on crossed pikes, and gilt frames with Rapunzel's portrait,
    which blinks now and then. By hash, left and right of the window
    column, at most one a side per storey.
  - ✅ stairs: a flight of four stone treads (64 px each, 48 px higher
    each) built out from a pillar on a half arch, the top tread at the
    pillar under a door in it. A row of its own, wide and safe, a
    relief like the long ledge; most flights carry a sun over each
    tread. The next row is measured from the top tread, 170 to 300 px
    above it.
  - ✅ floors: the inside has zones in the outside's bands, each with its
    stone, its dusk, what hangs on its walls and who lives there, and it
    says its name when he gets there. The hall (0 m: gentle, banners);
    the guard rooms (120 m: cool stone, shields and banners, galleries
    with guards, pikes from the hatches, stairs); the library (250 m:
    warm stone, shelves of books and Rapunzel's portraits, webs and
    ghosts); the belfry (400 m: weathered stone, cog wheels turning in
    pairs, bells to bounce on, scaffold boards, the bats' home).
  - 🔜 more sounds (stone underfoot, chains), floors of the tower as zones, gates. ⚠️ A system, not an
    element: built in steps, each a branch.
- 💡 doors as short bonus rooms (enter, climb for suns, exit higher), once
  the gates exist.

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
- ✅ string lights in the deep forest (`src/lights.js`, art in
  `art/lights.js`): a wire slung from trunk to trunk with eight to ten
  fat round bulbs (28 px), wound two or three turns around each trunk
  with a bulb per turn. Three looks: warm white, a party mix (white,
  pink, mint, orange, sky blue), pink and white. In the prince's plane
  (the trunks are its posts) but drawn behind platforms and prince, so
  nothing to play with is hidden; nothing to land on, nothing that
  hurts. The wire sags 80 to 150 px, swings with the wind and far more
  in a gust; each bulb twinkles, one with a loose contact cuts out now
  and then on a third of the strings. Each bulb has a small halo and
  throws a pool of its colour over the forest's green shade (added in
  the light layer after the time-of-day multiply), so the wall, the
  trunks and the prince are lit by it. When the prince passes through a
  string he brushes it: the wire bounces, a wave of light runs out along
  it from where he crossed, sparks fly, and it rings one soft bell, each
  string its own step of a pentatonic scale, so a climb plays a little
  tune. Small life on them: one to three moths circle a bulb on every
  string (wider after a brush); on about a third two or three birds sit
  side by side until he comes near; on a quarter a dormouse sits on the
  wire warming its paws at a bulb and looks up when he passes. Where a
  string hangs is a hash of its height (at most one per 768 px of trunk,
  65 % of the slots at the zone's fullest, thinning with the deep
  forest's amount toward 70 and 290 m), so a height always shows the
  same string whatever the seed. Purely visual plus the bell: the
  simulator reads the same numbers with and without them.
- 💡 sound for all of it: ambience (wind in the leaves, birdsong, an owl),
  the gust whoosh, acorn plinks.
- 💡 seasons and weather: rain, snow; a Christmas edition (the string
  lights in red, green and gold on every zone's trees, snow on the
  bulbs); more animals living in the trees. 💡 for the string lights:
  fireflies drawn to the bulbs, lanterns or pennants between the bulbs,
  a string that lights up bulb by bulb as he climbs toward it.
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
- 💡 upgrades: fourth heart, fourth boost charge, longer shield, longer
  power-ups or a wider sun magnet, stronger springs, a helmet variant of
  boost protection.
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
| 3 | Deep forest zone | ✅ squirrels, fog, falling leaves, light shafts and motes, dapple, boughs, birds, butterflies, owls, acorns, gusts, cloud cover, fireflies' behaviour, zone-keyed sky and light, tree variety (branch variants, trunk life, a tree per zone), branch lengths (stub, short, normal, long), string lights with moths, birds and a dormouse, bats under the branches; 🔜 thorny branches, cross branch; sound later | in progress |
| 4 | Windows zone | ✅ windows spread across the tower, guards reaching out of them, the witch with scissors cutting the braid; 🔜 Rapunzel's cameo (balconies moved above the treeline) | in progress |
| 5 | Above the trees and the end of the tower | ✅ treeline, cloud platforms (thick, wispy, drifting, storm with lightning), sky lanterns, storks, updrafts, balconies with guards and flowerpots, the flock of starlings to boost through; 🔜 Rapunzel's window as a goal element; with it the forest tower exists, so a minimal campaign mode (play to the window, progress bar, stars) | in progress |
| 6 | Store and scenes | Suns as currency, upgrades, cosmetics; rescue, intro and kidnapping scenes; light bridge | 💡 |
| 7 | Tower two | Snow zones with their own roster; endless chains them automatically | 💡 |
| next | Inside the tower | A second place, chosen on the title sign. ✅ the switch, the room (pillars, windows with the outside behind them, the hall, ledges, chandeliers and the bell on the chain, scaffold boards, galleries, bats and guards, its light); 🔜 its own things (stairs, web, ghost, bat swarm), floors, gates. Plan in `docs/plans/tower-interior.md` | in progress |
| later | Weather and seasons as effects (rain, snow), vines in the deep forest, selectable worlds, Christmas, FX preset auto-fallback | 💡 |

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
| Windows band roster | crow 0.6, spider 0.5, squirrel 0.5 (were 0.8 / 0.7 / 0.6), window guard 1.0, bat 0.5 |
| Deep forest roster | crow 0.6, spider 0.5 (was 1.0), squirrel 1.0, bat 1.0 |
| Bat | tier 0 / 0 / 0.14 / 0.18 / 0.20 / 0.20 per row × pacing × zone; hearing 215–275 px; wake 0.45 s, pass 1.2–0.95 s, back 0.9 s, rest 2.5–4 s; 19 × 13 art px in flight, 9 × 15 hanging; box 56 × 36 px |
| Flock of starlings | first at 160–240 m, then every 300–450 m; floors 500 px apart, the birds 345 px above the lower one, band 130 px; 26 birds at 560 px/s in three lanes; announced 1600 px below, warn 1.3 s; a burst keeps him clear for 0.7 s; +3 suns |
| Braid cut | from 300 m, then every 120–180 m; stretch of 1600 + 240 px above the planning row without braid-only rows or dry branches; the witch sets out when the prince reaches the stretch and is still 1000 px below its top, rides 640 px above his highest point, warn 1.0 s, approach 850 px/s, snip 0.35 s; cut pieces fall 525·t² px |
| Guard / flowerpot sizes | guard 34 × 48 art px (the prince is 26 × 58), pot 12 × 13 |
| Guards / flowerpots per balcony | guard 0.25 → 0.45 × zone 0.5, pot 0.25 → 0.45 × zone 0.8 (tier 2 → 5), × pacing |
| Enemy onset | crows 22 m, spiders 65 m, witch 120 m (then every 75–105 m), squirrels 120 m, bats 120 m, the flock 160–240 m, window guards 250 m, the witch with scissors 300 m |
| Power-ups | one every 65–105 m of climb, the first at 15–25 m; x within ± 190 px between two rows; 88 px box (the bubble) |
| Power-up durations | star 12 s, cloak 10 s, golden spring 8.75 s, sun magnet 12.5 s, feather 8.75 s; the last 1.5 s flicker with three blips; 0.8 s of grace after star and cloak |
| Power-up weights | magnet 1.0, spring 1.0, star 1.0, cloak 0.9, feather 0.8 × zone (floor: star 0.5, cloak 0.3, spring 0.6, feather 1.3; windows: cloak 1.4, feather 0.8; sky: star 1.2, cloak 0.6, feather 1.5) × pacing (star, cloak: the enemies', 0 below 30 m; magnet: the suns') |
| Golden spring | bounce × 1.25 (1650 → 2062 px/s, apex 648 → 1012 px), boost 1900 px/s, capped at 3000 px/s off a bow; somersault 0.6 s per bounce, 0.42 s per boost |
| Sun magnet | reach 380 px around his middle; a pulled pickup flies at 500 → 1800 px/s |
| Feather | 40 % gravity and at most 600 px/s while falling |
| String lights | at most one per 768 px of trunk, 65 % of the slots × the deep forest's amount; knots 8 px inside the trunks' inner edge, the right one up to 120 px higher or lower; sag 80–150 px; 8–10 bulbs of 7 × 9 art px; bounce a damped spring (about 1.3 Hz); wave of light 1.3 s; birds on 30 %, a dormouse on 25 % |
| Inside the tower | floors: the hall 0 m (no stubs, long ledges × 2, bats × 0.8, gallery guards × 0.6, no pikes, no ghost), the guard rooms 120 m (galleries × 0.8, guards × 1.2, pikes × 2.4, bats × 1.2, ghost × 0.6, stairs × 1.5), the library 250 m (webs × 2.4, ghost × 1.9, bats × 1.5, pikes × 1.2, guards × 0.7), the belfry 400 m (bells × 3, boards × 2, bats × 1.9, pikes × 1.2, stairs × 0.5); a floor's stone tint, dusk and wall decor fade over 30 m; chandelier 112 px, bell 104 px (the bow's bounce), gallery 160 px at ± 204; the chain sways with the braid's amplitude (12–68 px) in a wave of 2640 px; a window every 576 px of wall, a torch every 576 px of pillar, a hatch in half of the tiles that may have one (one per 640 px of climb); the pike is 165–195 px inside (130–160 outside) |
| Spider's web | 120 × 136 px quarter under a ledge (normal or long, healthy, no bat on it), from 65 m; the spider's tier chance × pacing × 1.0 in the hall, × 1.6 above; 3 tugs free him, the spider bites after 2.2 s; freed he is tossed 320 px up, onto the ledge |
| Ghost | from 120 m, the crow's tier chance × pacing; 45 % of the crow's speed (60–190 px/s), turns 48 px before the pillars; there 2–3.2 s, out 0.5 s, gone 1.4–2.4 s, in 0.8 s; 56 × 64 px box; drifts toward his height at up to 46 px/s from tier 2 |
| Stairs (inside) | layout weight 0.3 a side (a branch is 1.0), never within two rows of a gallery; 4 treads of 64 px, 48 px rise, from 28 px beside the middle to the pillar; the next row 314–444 px above the lowest tread |
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
- 2026-11-17: The sprite style written down in `docs/ART.md`: what is
  fixed (grid, readability, the prince as the scale, one light), what is a
  default (colour ramps, no outline, chibi faces, few frames) and what is
  explicitly free (shape, a zone's palette, each element's own idea). It
  describes the art as it is and changes when a sprite breaks a rule for
  the better. `CLAUDE.md` imports it, so every session starts with it.
  Reference: the prince, Rapunzel, the braid, the bows, the spider, the
  squirrel, the cloud platforms; counterexample: the stork and the big sky
  lanterns. Measured on the way: `poly` fills anti-aliased between its
  corners, so 8 to 59 % of the 4 x 4 blocks in the bows, hearts, crows,
  stork, witch, branches and roots are off the art grid (the prince and the
  guard 4 %, every other sprite 0); left as it is until decided.
- 2026-11-17: The stork and the sky lanterns redrawn to the sprite guide
  (`element/sky-restyle`), same sizes and anchors, so play is unchanged.
  The stork is plump with a big head, a big eye and a blush, a long red
  beak, small wings (white coverts, black fingers) and the storybook
  bundle hanging from its beak; its colours are named ramps (a creamy
  white with a lilac shade, so it does not read as a cloud). The lantern
  is a sky lantern instead of a ball: a paper bag, darker under the top,
  bright in a dome above the flame at its open bottom, the right side
  turned away, a crown (gold) or a tulip (pink) painted on it, the wires
  and the fuel cake below; the game's halo moved down to the dome
  (+108 px instead of +74). The far lanterns got the same shape. Both are
  drawn from row spans without `poly`: 0 % of their 4 x 4 blocks off the
  art grid (the old stork 16 %).
- 2026-11-17: `poly` fills on the art grid (`element/poly-grid`): a
  scanline fill per art row, a pixel when its centre lies inside. Every
  sprite now sits on the 4 px grid (only the logo's drop shadow keeps
  partly transparent pixels, on purpose). The heart, the halberd and the
  branches got clean stair edges; the crow's wings, the witch's cape and
  the bows' tails turned ragged, accepted for now; they are the next to
  redraw as row spans.
- 2026-11-18: Power-ups (branch `claude/quirky-hawking-odhpnu`, plan in
  `docs/plans/power-ups.md`): the game had hearts and the boost refill
  and nothing that changes how a stretch plays. Five now, each for a few
  seconds, one at a time: the star (invincible), the cloak (invisible),
  the golden spring (stronger bounces and boosts), the sun magnet and
  the feather (slow fall). The first four were asked for; the feather is
  ours, because nothing helped with a fall, which is how the youngest
  players' runs end. Decisions on the way:
  the cloak is not a second star: enemies do not notice him and he
  passes through them, but nothing is knocked away, a pogo on a head
  still counts, and lightning strikes him all the same (it does not need
  to see him); to be played and judged, a kid may find that unfair.
  The items float in soap bubbles: a thin shell on purpose (the sprite
  guide warns of thin lines carrying a shape; a bubble is one), it makes
  the five one family and a bigger thing to catch. The star is a
  shooting star with a rainbow tail and shut smiling eyes, so it is ours.
  The rainbow on the prince was first three hues added over him and
  read as white; it is a rim now, drawn from a flat white copy of every
  pose (`art.prince.rightSil` / `leftSil`) a pixel or two to each side,
  each side its own hue. Glows are kept low: with bloom on, six seconds
  of full glow turned him into a white blob. Somersaults for the spring
  as on the title and the landing page. Power-ups roll on a stream of
  their own (the fifth), so the tower is identical with and without them
  (checked on three seeds: platforms, enemies and the other pickups
  match). Paired seeds, 120 runs each, before → after: good bold from
  0 m median 376 → 434 m, mean 404 → 505 m, 0.98 → 0.95 hits per 100 m
  (the bands from 100 to 800 m between 0.84 and 1.53), falls 45 → 41 %
  of deaths, 500 m reached by 27 → 41 %; from 450 m mean climb 231 →
  293 m, 1.78 → 1.44 hits per 100 m, falls 35 → 42 %; good cautious mean
  225 → 247 m; kid bold mean 70 → 77 m, 100 m reached by 23 → 28 %; kid
  cautious 62 → 70 m, 18 → 25 %. So good runs get about a quarter
  longer: catches go from 0.136 to 0.116 per 100 m and falls from 0.111
  to 0.081.
  The good bold bot collects 78 % of the items it passes and has one
  running 31 % of the time. No power-up kills the good bot: of 119
  deaths 92 came with none running, magnet 12, spring 9, feather 5,
  cloak 1, star 0, each near or under its share of the time (the spring
  9 where 7 would be its share). For the kid bot the feather protects (4
  of 34 pickups end in a death while it runs, where 7 s cost a kid run
  about 9) and the spring is the risky one (11 of 25, where about 7
  would be expected), so the forest floor leans to the feather (1.3) and
  away from the spring (0.6). A first spacing of 55 to 90 m
  had a power-up running 35 % of the time; 65 to 105 m now. Also: a toast
  that is already up is not shown twice (two lanterns the magnet brings
  in at once).
- 2026-11-19: Power-ups after playing them. The rings of dots closing in
  on the prince under the magnet got in the way and are gone: the suns
  flying to him are the sign, with the HUD's bar for the time left. The
  magnet reaches 380 px instead of 300. Every power-up lasts a quarter
  longer (star 6 → 7.5 s, cloak 8 → 10 s, spring and feather 7 → 8.75 s,
  magnet 10 → 12.5 s). The star keeps its rainbow rim and loses the soft
  halo behind it, which took away from the rim. Paired seeds, 120 runs
  each, without power-ups → first build → now: good bold from 0 m median
  376 → 434 → 422 m, mean 404 → 505 → 482 m, 0.98 → 0.95 → 0.89 hits per
  100 m, falls 45 → 41 → 48 % of deaths, a power-up running 31 → 37 % of
  the time; from 450 m mean climb 231 → 293 → 318 m, 1.78 → 1.44 → 1.43
  hits per 100 m; kid bold mean 70 → 77 → 81 m, 100 m reached by 23 → 28
  → 32 %. So the longer power-ups move the heights no further than the
  noise between two builds, but the deep forest band (100 to 200 m) now
  reads 0.62 hits per 100 m (0.84 in the first build, 0.90 without
  power-ups), under the 0.8 target: if it plays too easy there, the
  spacing (`POWER_EVERY`, 65 to 105 m) is the valve.
- 2026-11-19: The star lasts 12 s (was 7.5 s), asked for after playing.
  Not measured in the simulator.
- 2026-11-19: String lights in the deep forest (`element/string-lights`,
  on top of the power-ups), to try what they do for the atmosphere: a
  wire with fat glowing bulbs from trunk to trunk, wound around the
  trunks where it is tied. Behind the platforms and the prince, so it
  is scenery and reads as such (a thin sagging wire, bulbs with dark
  sockets in a row; suns have rays and hang in arcs that bulge upward).
  The bulbs really light the place: besides the halo each adds a pool of
  its colour in the light layer, after the forest's green multiply,
  which is what makes the wall and the trunks glow. So that it is more
  than a picture the prince brushes a string in passing (bounce, a wave
  of light, sparks, one bell note per string on a pentatonic scale).
  Life on the wire: moths on every string, birds that sit side by side
  and take off, and a dormouse warming its paws at a bulb: the one new
  creature, grey with pink ears so it is not a second squirrel, lit from
  the bulb in front of it. A first density of 80 % of the slots had two
  strings in view most of the time; 65 % now, about one. Where a string
  hangs comes from a hash, nothing rolls on a seeded stream: 40 good
  bold runs on the same seeds give the identical report with and without
  them. To be judged by playing: whether the warm white bulbs are told
  from suns at a glance, and whether the bell stays pleasant.
- 2026-11-19: Bats and the flock of starlings (`element/flock-and-bats`,
  on top of the string lights). The bat is the deep forest's second
  creature and the first that sleeps: it hangs under a branch, wakes when
  the prince comes near and makes one swooping pass, so it is a hazard
  you can see coming and leave alone. Spiders, which hang in the same
  place, step back to half there, so the zone's roster changes instead
  of growing. The flock is the barrier that needs a boost, the old "bird
  swarm" and "cross branch" ideas in one. First thought: birds that cost
  a heart. But a prince bounces 648 px, so he cannot wait under a flock
  without flying into it, and after a hit his invulnerability carries him
  through, which makes "boost through" a "pay a heart" instead. So the
  flock does not bite, it turns him back (like the plank swing's bonk,
  with a startled face instead of the hurt one), and the generator builds
  the place for it: a floor across the whole width below, so being turned
  back is a landing wherever he is, another floor above, so a burst lands
  too, and two lanterns that do not drift (the principle from section 1:
  a lantern precedes a barrier that needs a boost). The birds are
  announced 16 m below their height: with the first lead of 9.5 m the
  bot was past them before the stream had crossed the screen (at least
  29 of 68 flocks met nobody). Asked for as very rare: first every 200 to 300 m
  (1.7 per good run), now every 300 to 450 m (1.2). Bats and the flock's
  timing roll on a sixth stream; the flock's two floors change the tower
  above the first flock, so this is measured unpaired. 120 runs each,
  before → after: good bold from 0 m median 436 → 424 m, mean 496 →
  477 m (a second set of seeds: 428 and 524 m), 0.89 → 1.00 hits per
  100 m, falls 46 → 39 % of deaths; the deep forest band, which read
  0.61 since the longer power-ups, is at 0.90, the bands from 100 to
  800 m between 0.90 and 1.53; 61 bat hits against 173 by crows and 101
  by squirrels. Good cautious mean 285 → 254 m (it dodges bats, the bold
  one punches them); kid bold unchanged (median 71 m, 100 m reached by
  32 → 33 %). 142 flocks in 120 good bold runs: burst through 111 times,
  turned back 20 times, no fall at a flock; from 450 m (cloud floors)
  146 flocks, 127 bursts, 13 turned back, no fall. The kid bot meets 8,
  bursts through 3 and is turned back 8 times: its reaction is slower
  than the moment the birds are overhead; one of its runs falls there
  (it steers out past the floor's end through the screen edge). Found on
  the way: the bot could bounce into the edge of a plank swing for ever
  (a run that never ended); it steps out from under a plank now, and the
  generator treats a long branch as a centre platform, so no swing hangs
  right above one.
- 2026-11-19: Power-ups, string lights, bats and the flock merged into
  `master` after playing them; the three branches stay (the steps are to
  be shown in the devlog). The star's 12 s, entered as not measured, is
  in the "before" numbers of the bats and flock entry above. Tidied on
  the way: imports nothing used any more, two exports nothing imported.
- 2026-11-19: Next: the inside of the tower as a second place, planned
  in `docs/plans/tower-interior.md`. Of three ideas (webs and vines as
  more obstacles outside, weather and seasons as effects, the inside) it
  is the one that answers the long climb's sameness with a new place
  instead of a twelfth enemy. Decided with it: the braid hangs outside
  and is only seen through the windows, so the centre lane gets
  platforms of its own (chandeliers, a bell); the spider web moves
  inside, where it starts a roster of its own instead of adding to the
  outside's; it is a mode chosen on the title sign first, gates between
  outside and inside come last. Weather stays an effects branch for
  whenever, vines an idea for the deep forest.
- 2026-11-19: The inside, step 1: the switch (`element/interior-switch`).
  A round has a place (`places.js`: outside or inside); the world, the
  level and the background ask it instead of deciding themselves (sky
  rows, the witch and the storks are the outside's; zone multipliers
  come from the place's table). The title sign has two boards under
  PLAY, a tree and a door, the chosen one with the gold rim (O / I or
  left / right on a keyboard); the choice and a best height per place
  are saved; `?place=` and a simulator argument pick it too. The sprite
  atlas is 4096 wide now (4096 x 1958 instead of 2048 x 3810, which was
  close to the 4096 limit of older phones). Inside is a stub until the
  room is built: the forest's rows with only bats. The outside is
  unchanged: the simulator's report is identical on the same seeds
  before and after (40 good bold, 40 kid cautious, 40 good bold from
  450 m).
- 2026-11-19: The inside, step 2: the room (`element/interior-room`).
  The tower's inside is a place to play now. Decided while building:
  (1) The centre lane hangs on one chain down the shaft instead of a
  chain per chandelier: single chains to the top of the screen crossed
  each other and every platform above, and one swaying chain is the
  braid's mechanic in the room's own material, in the prince's plane,
  so nothing inside needs layer heights. (2) The chandelier is pewter,
  not brass: in gold it vanished in front of the braid, which hangs
  right behind the centre windows. The bell stays brass. (3) Nothing
  that only decorates is red in here (a red pennant under a ledge read
  as something that bites; it is the prince's blue now, the gallery's
  cloth too). (4) The balcony's drawing was not reused: a gallery is
  drawn new, a wooden landing at a pillar's door. (5) The window guard
  is the same class with a layer factor from his window, so a hatch in
  a pillar (the prince's plane) works like a window on the tower layer;
  his pike is 35 px longer inside because he thrusts from the edge.
  (6) What is outside goes into no bloom layer when seen from inside
  (the moon and the sky lanterns shone through the wall), and the moon
  stands where a window passes over it. (7) The first 120 m are a band
  of their own, the hall: without it the kid bot fell earlier than
  outside (median 66 m against 71 m) although nothing had bitten it,
  because inside nothing rides up with the camera as the ribbons do and
  a miss falls further; more long ledges and no stubs there made up for
  it. Measured on 120 seeded runs inside: good bold median 551 m, mean
  576 m, 1.17 hits per 100 m (0.16 in the hall, 1.08 to 1.47 per 100 m
  band from 100 to 600 m, just under 2 from 600 to 800 m), falls 6 % of
  the deaths; good cautious median 311 m; kid bold median 72 m, mean
  85 m (outside 71 m and 81 m); kid cautious 71 m. A good run gets
  further inside than outside (median 424 m there) because hardly
  anyone falls in here: there is no sky. That room is left for step 3's
  stairs, web and ghost on purpose. The outside is unchanged: its
  simulator report is identical on the same seeds before and after. The
  atlas is 4096 x 2502 now.
- 2026-11-19: The spider's web (`element/interior-web`), the first of
  the inside's own things. It hangs in the corner under a ledge, not on
  top of it and not free on a pillar: under the ledge it takes nothing
  away from the landing, asks for the way round the tip instead of
  straight up through the stone, and whoever is freed from it is
  tossed up through that very ledge and lands on it, which is what
  makes "never a fall" true without a rule in the generator. A tap in
  the web is a tug and spends no boost (three free him); "one boost"
  is flying into it with the shield on, which tears it and knocks the
  spider out for the usual three suns. The spider's walk is slow at
  first (the square of the time), so the 2.2 s are seen coming. Nothing
  else is drawn for it: the spider is the one the forest has. Measured
  on 120 seeded runs inside: a good bold run meets 2.4 webs (a third
  caught and torn free, the rest boosted through), nobody was bitten
  (the bots tap at once; a child who does not will lose a heart and
  still land on the ledge); good bold median 518 m, mean 617 m, 1.18
  hits per 100 m, falls 7 % of the deaths; kid bold median 72 m, mean
  84 m, as before. So the web costs time and a boost charge, not
  hearts; the room a good run has inside is left for the ghost and the
  stairs. The outside's report is identical on the same seeds.
- 2026-11-19: The ghost (`element/interior-ghost`): the inside's
  patroller. Its idea is the candle: it is drawn apart from the ghost
  and never fades, so the ghost that is "gone" is a candle floating by
  itself with its light on the wall, and the fade-in (0.8 s, a "!", the
  candle flaring) is a telegraph one can read from across the room.
  Solid is the only state that bites or can be pogoed. It keeps out of
  the hall: with ghosts below 120 m the kid bot lost five metres of
  median to dodging them. Measured on 120 seeded runs inside (webs and
  ghosts in): good bold median 476 m, mean 513 m, 1.13 hits per 100 m
  (1.05 to 1.66 per band from 100 to 1000 m), falls 19 % of the deaths
  (the ghost is what a good run steps aside for, and stepping aside is
  where falls come from); kid bold median 72 m, mean 79 m (outside 71 m
  and 81 m). The inside is now about as far a climb as the outside
  (median 424 m, mean 477 m there), without touching the other
  creatures' numbers. The outside's report is identical on the same
  seeds.
- 2026-11-19: The bat swarm (`element/interior-swarm`): the flock's
  gate inside, unchanged in its rules (two floors, the stream 345 px
  above the lower one, two lanterns that stay, turned back without
  losing a heart) and only different in who flies: the flock takes a
  flag and draws bats, squeaks instead of calls, sparks instead of
  feathers. Measured on 120 seeded runs inside: 180 swarms, 160 burst
  through, 19 turned back, no fall at one; good bold median 488 m, mean
  571 m, 1.04 hits per 100 m (0.99 to 1.57 per band from 100 to
  1100 m), falls 26 % of the deaths; kid bold median 72 m, mean 78 m.
  The outside's report is identical on the same seeds.
- 2026-11-19: On the walls (`element/interior-decor`): banners, shields
  on crossed pikes and framed portraits of Rapunzel on the back wall,
  so the room is somebody's and the wall between two windows is not
  bare. The suit of armour was left out: next to guards in helmets a
  standing armour reads as one more of them. No reds here either. The
  portrait is the sign's Rapunzel drawn into a frame, and she blinks.
  Purely visual: the simulator does not draw, its reports are unchanged.
- 2026-11-19: Stairs (`element/interior-stairs`), the last of the
  inside's own things for now. A pogo does not need stairs, so they are
  not a way up but a place to come down on: three treads and a gallery
  make a landing 350 px wide across the middle of the room, each tread
  an ordinary platform. They lead up to a gallery because a flight that
  ends at a blank pillar looks unfinished, and the gallery brings its
  door with it. The generator keeps one row for the whole flight (the
  lowest tread's height) and measures the next row from the gallery, so
  the next row is within a bounce of every tread. No guard at the top:
  with one the kid bot's hits in the hall doubled, and a relief should
  not bite. Measured on 120 seeded runs inside, with everything of step
  3 in: good bold median 523 m, mean 604 m, 1.01 hits per 100 m (0.81
  to 1.54 per band from 100 to 1200 m), falls 21 % of the deaths; good
  cautious median 347 m; kid bold median 74 m, mean 88 m (outside 71 m
  and 81 m); kid cautious 76 m. 189 bat swarms, none fallen at. The
  outside's report is identical on the same seeds. The atlas is 4096 x
  2584.
- 2026-11-19: The stairs rebuilt (still `element/interior-stairs`). The
  first flight hung in the middle of the room beside a wooden gallery
  and looked as if it floated (Simon, playing it). Now it is masonry
  that grows out of the pillar: four treads, the top one at the
  pillar's face under a door, the whole on a half arch that springs
  from the pillar below, in the pillar's stone with only the treads in
  the pale stone he stands on. Rule for anything built in here: it must
  be seen to be carried by a pillar, the chain or the wall. Measured on
  120 seeded runs inside: good bold median 486 m, mean 570 m, 1.02 hits
  per 100 m, falls 25 % of the deaths; kid bold median 73 m, mean 85 m.
  The outside's report is identical.
- 2026-11-19: The inside, step 4: floors (`element/interior-floors`).
  One band of "inside the tower" became four floors in the outside's
  bands (so a gate can lead across at a height later): the hall, the
  guard rooms, the library, the belfry. A floor is three things at
  once: a row in the painter's table (the stone's tint on wall and
  pillars, the room's dusk, the wall decor: shields, books, clockwork),
  a row in the level's zones (who lives there, what one stands on), and
  a name that is said when he arrives. The pieces were all there; the
  floors only lean on them differently, which is what makes 400 m in
  here not the same room as 100 m. New drawings: two shelves of books
  and a cog wheel (two turn in mesh). The first numbers were too easy
  (0.95 hits per 100 m, median 570 m), the second too hard in two
  places (23 of 52 falls in the library, where a bot stepping aside
  for three ghosts at once steps off; 1.6 to 1.7 hits in the belfry).
  Measured on 120 seeded runs as it is now: good bold median 486 m,
  mean 536 m, 1.01 hits per 100 m, every band from 100 to 800 m between
  1.06 and 1.47, falls 36 % of the deaths; good cautious median 305 m;
  kid bold median 73 m, mean 83 m; kid cautious 73 m. The outside's
  report is identical on the same seeds.
