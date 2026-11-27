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
gameplay code never touches PixiJS. Two effects, each a setting of its
own and off by default: a glow (selective bloom) and scan lines (F key,
the settings' sign, `?fx=`). The settings' sign (`web/src/settings.js`,
SETTINGS on the title) also holds how a touch steers (hold a side, slide
a finger, or lean the phone), sound, and in the app sound in silent mode
and haptics.

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
- Two places to climb: outside (all of the above) and inside the tower
  (stone ledges, chandeliers and a bell on a chain, scaffold boards,
  galleries, stairs; bats, guards, a ghost, spider webs; four floors;
  section 7). The title sign picks where a round starts, gates lead
  from one to the other between 120 and 400 m. A best height for each
  starting place.
- Three hearts; game over on zero hearts or falling off the bottom.
- Procedural level in rows (the original's beats) with difficulty by
  altitude and a stress-tested reachability guarantee.
- Parallax layers like the SpriteKit prototype: sky, the forest behind, tower
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
- ✅ the witch's cat (inside the tower, from the guard rooms up, most
  in the library; `Cat` in `src/enemies.js`, `src/art/cat.js`): the
  black cat from her portraits, in the squirrel's place on the ledges.
  It does not patrol. It sits, swishes its tail and watches; when the
  prince is on its ledge or just over it, within 210 px, it crouches
  and wiggles its rear for half a second with a meow and a "!", then
  pounces at where he is, a flat hop of at most 150 px along the ledge,
  and sits again. Touching it is a scratch; a pogo from above sends it
  off, puffed up and offended. If he leaves during the wiggle it sits
  back down; under the cloak it sees nothing. It is black all over, as
  in the portraits, with yellow eyes; a thin pale contour along its top
  and its sides keeps it a shape on a dark wall, and in the dark one
  sees its eyes.
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
  `docs/plans/tower-interior.md`), chosen on the title sign as the place
  a round starts in, and reached through gates from the other.
  ✅ Gates (from 120 m up to the trees' end at 400 m, every 100 to
  160 m): a row is a door in the tower's wall over a stone landing on
  one side and a healthy branch (a ledge) on the other, so going
  through is a choice. The fanlight over the door shows where it
  leads (a torch-lit room, or daylight and treetops). Landing on the
  landing opens the door, the picture closes in on the prince and
  opens again on the other side: the same landing at the same height,
  the other place's rows above, and below him every platform as its
  like on that side (branch and ledge, ribbon and chandelier, bow and
  bell). Nothing can touch him on the way; a gate leads through once.
  The round's best height counts for the place it started in. The room (`src/interior.js`,
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
    shields on crossed pikes, and the gallery. It is the witch's house,
    so the pictures are hers: herself (large, in dark wood, also over
    the hall), her grandmother, her cat, her raven, the rampion from
    her garden, the tower in its forest, and Rapunzel in a gilt frame.
    They hang one to three together in different sizes, some a little
    askew. A face that looks out of its frame follows the prince with
    its eyes; Rapunzel blinks. Small things between: old candles on
    iron sconces (lit ones light the wall, some are burnt down), the
    tower's keys on a board, bunches of herbs; niches with the witch's
    potions or her crystal ball, a wall clock with a swinging pendulum
    in the belfry. By hash, beside the window column; each floor has
    its own mix. And the witch's own things: a tapestry with the tale
    on it (the tower at night, the braid, the prince at its foot, the
    witch on her broom), rare; her spare hat and a broom on two pegs by
    the hall's door; a gilt mirror that is only glass until the prince
    comes near, then she looks out of it; and ivy that has come in at
    about half the windows below the trees' end, over the sill or up
    the wall.
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
  - ✅ the library's books (250 to 400 m). Every storey there has a
    wooden walkway across the whole back wall, just under the window's
    sill, its railing toward the room; the furniture stands on it left
    and right of the window, pictures and the rest hang above within
    reach of a ladder. The walkway is wood in shade
    with no lit top: it stands at the back wall and is nothing to land
    on. Tall bookcases in three
    fillings (a potion, an hourglass, a candle end or a scroll between
    the books), a third of them with a ladder leant against them; a
    rack of scrolls with one hung open; hung parchments and piles of
    books with inkwell and quill as the small things; the spell book
    open on a wall lectern, glowing, runes rising from it, a page
    going over by itself now and then; and books that have taken wing
    and drift about behind everything, the room's life as the
    butterflies are the forest's (paper-pale, so they are not bats).
    Its spring is not the bell but a great chained book on the chain
    (`tome`, the bell's slot and bounce): pages fly when he lands on it.
  - ✅ walkways on every floor above the hall, as in the library
    (`storeyOn` in `src/interior.js`): the guard rooms have a wall-walk
    of heavy planks on stone corbels with the racks, the watch's table,
    the helmets and the notice on it; the belfry a staging of rough
    boards with a rope for a rail, the bell ropes coming down to it
    and the clockwork beside it. In the hall the pegs with the hat and
    the broom hang by the door within reach from the floor.
  - ✅ the guard rooms' and the belfry's things (purely visual). Guard rooms: racks of pole arms
    (put away, so without the red collar of the one that thrusts),
    shelves of helmets (the captain's with a blue plume), the watch's
    table with a tankard, dice and a hand of cards, a notice with the
    prince's face and a purse under it, a signal horn. Belfry: roof
    timbers, on some an owl that blinks; bell ropes with striped grips,
    each swaying in its own time; the great clock's dial, its hands
    going round; a row of small bells on a beam; coils of rope and
    small wheels between.
  - ✅ where the lights are out (from 150 m, a stretch of 32 to 42 m
    every 140 to 220 m of climb, never in the hall): the torches are
    out, the windows walled up, and the picture goes down to nearly
    nothing, a ledge still a shape in it. What he sees he sees by his
    own light, which goes with him, and by whatever shines: suns,
    lanterns and power-ups glimmer, the spell book and a ghost's candle
    keep their light, and every creature has one (a bat's eyes, the
    lantern by a guard, the light behind a pike guard as he looks out,
    dew on a web). The chandeliers there are unlit and catch when he
    lands on them: he brings the light back as he climbs. To keep the
    dark tense but fair its rows have nothing that crumbles, nothing
    small, fewer creatures and more lanterns, and no gate or swarm.
    Said as he comes up to it. The renderer has a light map for this
    (`g.dark`, `g.lamp`).
  - ✅ the treasury (`src/vault.js`, `src/art/vault.js`): the witch's
    hoard behind a golden door. The door is a gate in gold (a landing
    on one side of a row, a healthy ledge on the other, so going in is
    a choice): its leaves carry a sun, its fanlight blazes, it shines
    and glints. The first stands in the hall, between 40 and 70 m, so
    the youngest find one; then one every 200 to 300 m above where the
    last lets him out. Behind it is a room of its own, 47 to 50 m high
    between the two pillars (three and a half pictures), in a warmer
    stone, with a floor and a ceiling: nobody lives in it, nothing
    crumbles, and nobody falls.
    The camera is the tower's (it only climbs; it starts with the floor
    where the lawn lies at a round's start and stops under the
    ceiling), and a prince who drops out of the bottom of the picture
    is taken by a golden bubble, carried back up to the lowest thing in
    the picture he can stand on and let down on it. A room is put
    together anew each time: the floor, then three of six sections one
    on top of the other, each mirrored or not (the stair, from side to
    side over the chain; the well, ledges on both sides; the magnet's,
    with the sun magnet over its first ledge and its suns where only
    that reaches; the chests, on a floor of two long ledges; the
    chain, chandeliers only, the best of it out by the pillars; the
    stairs, a flight up to a pillar's door), then the top with the
    door out. What there is to take: suns (rows over the ledges, a
    column over every chandelier, arcs, rings, a crown of suns under
    the ceiling), chests that open the first time he lands on them and
    throw eight suns out at once, and pieces of the hoard, which count
    as suns: cut stones (3), golden goblets (5) and, inside the crown
    of suns, the crown itself (10). One heart. A room holds what is
    worth some 220 suns. The way out is a second golden door about
    40 m up: he comes out into the tower that much higher, the climb
    counts, and a line says what he took. The power-up he brought in waits
    while he is in there (only the magnet's clock runs). On its floor
    the hoard is heaped in the corners (coins, a crown, a sword, a
    silver goblet, pearls), on its wall hang shelves with her cups and
    coin stacks, her portrait, a mirror; all of it stepped back toward
    the wall, so the suns one can take are the brightest gold in the
    room.
  - ✅ what furnishes the wall steps back into it: the walkways, the
    ladders, what stands on a walkway (bookcases, racks, the table, the
    clockwork, the timbers) and the wall's small things are taken
    between a third and a half of the way toward the wall's colour
    when they are drawn (`RECEDE` in `src/art/interior.js`), and the
    walkways take their floor's tint as the wall does. In full colour
    stay what hangs to be looked at (pictures, the mirror, the
    tapestry, shields, banners), whatever shines, and everything he
    stands on or meets.
  - 🔜 more sounds (stone underfoot, chains), floors of the tower as zones, gates. ⚠️ A system, not an
    element: built in steps, each a branch.
- ✅ the opening story (`src/story.js`, art in `art/story.js`): what
  the game is about, told in its own world before the title, in
  fourteen seconds. The top of the tower at night, a slate roof with
  a pennant, roses climbing to Rapunzel's window, her room lit; the
  witch circles the tower on her broom (behind it she is hidden,
  passing the window she makes Rapunzel duck); "Rescue me!"; then
  Rapunzel lets her braid down, and the picture follows its end, a
  pink bow, down the whole tower. It slows three times for a look:
  at the roses in the evening sky among the sky lanterns, at the ivy
  between the windows, at the white roses in the deep forest; the
  last stretch passes the masons' site and the red roses and comes to
  rest on the lawn, where the braid curls up and Sir Bouncealot
  answers "On my way!". Then the title's sign comes down as ever.
  It is told where the title's world is the outside of the tower (a
  start on INSIDE gets the plain ride): in a browser once per device,
  in the app (the iOS shell) at every start, there with its sounds
  from the first second. A tap skips the rest; "tap to skip" is
  written at the foot of the picture from the second telling on, the
  first has the picture to itself. A tap on Rapunzel on the title
  sign tells it again; `?story=1` tells it on a visit, `?story=0`
  does not.
  Nothing in it is a film. The ride goes down a world of its own that
  nobody plays in (the endless tower outside, built up to her
  window), with the round's first rows shown in it as guests, and for
  the last ten metres it is the round's world itself that is drawn,
  so the picture the title opens on is the one the story ended on.
  Purely for the eye: nothing in the simulator.
- 🔜 the weather outside (`src/weather.js`, sprites in
  `art/weather.js`), a first cut for the eye and the ear: rain (slanting
  streaks, a grey veil, a darker light, drops splashing on what one
  stands on), a storm (harder rain, gusts that come as white curls with
  a line of wind and lean the rain over, the colours taken half out of
  the picture, and lightning that turns it black and white for an
  instant, with thunder),
  snow (flakes swaying down, big ones close by, snow lying on branches,
  balconies, swings and the lawn) and the golden hour (a low sun behind
  the tower, its rays across the picture, dust shining in them). Each
  pulls the sky toward its colours and lays a light over everything,
  and what falls is in three depths that go by at different speeds when
  the camera climbs. A stage has its weather (the rose wall the golden
  hour, the ivy wall and the deep forest rain, the masons' site and the
  night sky snow), and from the third stage on a storm comes over an
  outside stage now and then, whatever its own weather (three in ten,
  never two running; the crumbling tower always has one). It is not
  there when the stage begins: it draws up once he has climbed a
  quarter to a half of the stage, is announced ("A storm is coming!",
  a first thunder), blends in out of the stage's own weather, and has
  passed 15 m under the stage's end, so that the door is found in
  peace. Where it snows the storm is a blizzard: the flakes thick and
  driven sideways, the same gusts, no lightning. After a storm the
  sun comes out: the golden hour, where the weather would be clear
  and it is not night. In the endless tower storms keep their own
  time: 35 to 60 s into a round the first draws up, announced, stays
  18 to 28 s and passes ("The storm has passed"), the sun is out for
  16 to 24 s, and after 50 to 100 s of calm the next one comes; a
  storm draws up and passes over 5 s. For the rest the endless tower
  has fronts, bands of 90 m with a weather or none, by the round's seed and
  by what the height is like. `?weather=rain|storm|snow|blizzard|golden|clear`
  for a visit. None inside the tower yet. Around Christmas (the first
  of December to Epiphany; `?season=winter` for a visit) the lawn is
  snowed in: the first stage, the endless tower's first band, the
  title, and the opening story all the way down her tower. For the eye
  and the ear but one thing: a storm's gust carries the prince
  sideways while it blows, up to 230 px/s (his own steering is 560),
  and the curls show 0.9 s before it does. That is in the game's world
  only: the simulator's bots are not blown about yet, on purpose, so
  its reports stand until the push has been played and is measured.
- 🔜 the tower in stages, a trial on `element/stages` (`src/stages.js`;
  the title's third board, TOWER, beside the endless climbs OUTSIDE
  and INSIDE): the climb is a row of stretches with a start and an
  end instead of one endless stretch in one place. A stage is climbed
  in one place and ends at a floor across the whole width with a door
  on a landing above it and nothing above that; the door shines, and
  "To the door!" is said as it comes into view. The camera stops with
  that floor in the picture, so one can bounce there until the door
  is found, and whoever drops out of the picture there is carried
  back up by the bubble. The door leads into the next stage in the
  other place, which says its number and its name ("Stage 3: the rose
  wall").
  **Themes.** What a stage is, is written down in one place:
  `THEMES` in `src/stages.js` says for each kind of stage its name,
  its place, the height of the endless tower it is taken from (`at`:
  the zone and its creatures, the trees, the forest behind, the sky
  and the light, the floor of the tower inside all come with that
  height), how long it is, the look of the tower's wall (one look for
  the whole stage; the looks no longer mix), whether the lights are
  out (inside: the dark is a stage of its own, the other stages stay
  lit) and whether a golden door stands in it. `STAGES.route` is the
  order of a round's first stages and `STAGES.loop` what follows,
  round and round. A stage is built at its theme's height in the
  world; the door takes the prince to another piece of the tower
  altogether, and what he has climbed is counted apart from the
  height he is at. How hard a stage is comes from how far he has come
  in all, so a theme that returns is harder then.

  | # | Stage | Place | Taken from | Long | Wall | |
  |---|---|---|---|---|---|---|
  | 1 | the forest floor | outside | 0 m | 60 m | plain, the stone foot | the lawn |
  | 2 | the hall | inside | 4 m | 114 m | | golden door |
  | 3 | the rose wall | outside | 18 m | 95 m | briar, red roses | |
  | 4 | the guard rooms | inside | 124 m | 100 m | | |
  | 5 | the deep forest | outside | 128 m | 105 m | moss | |
  | 6 | the dark rooms | inside | 136 m | 95 m | | the lights are out |
  | 7 | the masons' site | outside | 256 m | 100 m | mended | |
  | 8 | the library | inside | 254 m | 130 m | | golden door |
  | 9 | above the trees | outside | 468 m | 105 m | old stone | |
  | 10 | the belfry | inside | 404 m | 105 m | | |

  After these: the crumbling tower (outside, 262 m, crumbling wall),
  the hall, the deep forest, the dark rooms, the night sky (outside,
  705 m, briar with white roses), the guard rooms, the ivy wall
  (outside, 24 m), the library, above the trees, the belfry, the rose
  wall, the dark rooms, the masons' site, the guard rooms, and round
  again.
  **Hearts and lives.** The three hearts are the health inside a
  stage. A round has three lives on top (`STAGES.lives`, shown as
  three little princes under the stage's number): a fall or the last
  heart costs one, and with one left he goes on from the last door he
  came through (a golden door's way out counts) with all hearts, his
  suns and the height he had; the stage's rows are built anew. With
  the last life gone the round is over, as in the endless game. The
  height stays the score.
  No free gates in this mode. A stage has at most one braid cut (half
  of those whose zone has the witch's scissors) and one flock (a
  third of those whose zone has it). Inside a stage the pressure
  builds toward its end; the first 5 m behind a door and the last
  12 m before the next are calm.
  In the simulator: `tools/analyze.mjs ... on on on` (the eleventh
  argument: `on` with the game's lives, a number with that many,
  `inf` going on for ever), with a report of stages reached, seconds
  a stage took and where one went on from a door.
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
- ✅ the round's own controls in the signs' wood (`art/hud.js`,
  `drawBoost` in `hud.js`): the boost's charges bottom left as three
  flames, kin of the hearts (burning in two frames, a small flame at
  the foot of the unlit one at half a charge, out when spent; one that
  has just caught hops); on a touch screen the boost's button bottom
  right, a wooden hoop with a nail left and right around a dark glass
  the game shows through, the big flame in it, a gold rim while a boost
  is ready, pressed in for the moment after one, and a tap with none
  shakes what is empty; sound and pause on small boards with their
  symbols in ink (the title's sound board is the same one); the
  power-up that runs on a board rimmed in its colour, its time a bar in
  a slot. Purely visual: the simulator has no HUD.
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
- ✅ the forest behind the tower (`art/backdrop.js`, `background.js`
  drawForest): two layers at two speeds (0.42 and 0.62 of the prince's),
  the air between them taking the far one back. In the strips between
  the tower and the trees in front, tall trunks go by with a branch
  here, a clump of leaves there, moss hanging; the trunks of a layer
  stand in the same columns in every tile, so a tree goes on however
  the tiles are picked. By zone: on the forest floor and in the deep
  forest dark silhouettes tinted with that zone's air, at the windows
  pale birches in the dawn. Where the trees in front end (460 m) the
  forest has a roof: for the last 25 to 35 m one climbs through the
  mass of its leaves, then the picture opens at both sides and the
  canopy lies below, the nearer one green, the far one pale, each
  sinking more slowly than the trees in front did.
- ✅ falling leaves on a depth continuum (parallax 0.85 to 1.35, size and
  opacity by depth) with a shared slow wind, flutter, and staggered
  re-entry above the view. 💡 autumn colours by season.
- ✅ gusts every 14–24 s: stronger wind on leaves and fog, boughs rock,
  motes speed up, the braid swings a little wider (ribbons move with it).
- ✅ canopy dapple: soft dark blobs (multiply) scrolling with the bricks.
- ✅ the tower is round (`art/tiles.js` drawTower). Its wall is 440 px
  wide and reads as a drum by two things a round wall does: its bricks
  get narrower toward the edges (14 art px wide where they face us, 4
  at the edge), and the light from the upper left lies on it in five
  upright planes, each a mix of two or three steps of the brick ramp,
  brightest left of the middle, in shade on the right. A string course
  of dressed stone runs round it under every row of windows. Five
  kinds of tile: plain, moss and a crack, weather, vines, an old repair
  in stone. Windows, balconies and gates are where they were. The wall
  stands back: a veil of dark teal, 30 % strong, lies over it (and over
  its windows and string courses), which darkens it and draws its
  lights and darks together, so that it is one quiet plane behind the
  play. Balconies, gates, the braid and its ribbons are drawn after the
  veil and keep their colours: what one stands on is lighter than the
  wall it is on.
- ✅ the tower's wall has areas (`art/tower.js`, `src/towerwall.js`): it
  is not the same all the way up. Its foot is of old big stones; from
  there, stretches of plain wall (13 to 30 m) take turns with areas of
  17 to 30 m, each in one of four looks: overgrown (ivy: stems
  wandering up the wall and masses of leaves that cover the bricks,
  duller and bluer than the leaves on the branches in front),
  crumbling (bricks chipped, sunk and gone, a wound where the facing
  has come away and the core's rubble shows, cracks, the string course
  broken), old big stones (rough blocks two courses high), and mossy
  (moss in the joints in patches, cushions, water marks). Down in the
  forest it is mostly ivy and moss, higher up crumbling wall and old
  stone, and above the trees only the roses (below) still grow. The
  plan is fixed, like
  the windows: the tower is the same in every round. An area thins out
  into the plain wall at both ends; ivy and moss lie over the plain
  tiles, and the windows are cut into them.
- ✅ the masons' site, a fifth look of the wall (`mended`): somebody is
  mending the tower, or was. Holes where the facing has come away with
  boards nailed over them (two crossed, three that are none of them
  level, one that has come off at one end and hangs, and over the
  worst the red and white board of a barrier), patches already made up
  in new brick, paler and warmer than the old and bedded in fresh
  mortar that has run down the wall, the mason's chalk crosses on the
  bricks that come out next, the sawn-off ends of the beams a scaffold
  stood on, a ladder with a broken rung, a bucket of mortar that
  swings a little on its hoist, and signs: stones may fall (the yellow
  triangle, always the first thing at the site's lower end), no
  witches (her hat in the red ring, struck through), the master
  mason's notice with his seal, and an arrow board pointing up. Purely
  for the eye: nothing in the simulator.
  What hangs on the wall (the boards with their holes, signs, ladder,
  bucket) is sprites of its own, not part of the tiles: a thing that
  would meet a window slides up or down the wall until it is clear of
  it, each takes one flat tone from the plane of light it hangs in,
  and the signs hang in turn up the wall, so no two alike follow each
  other.
- ✅ briar roses, a sixth look of the wall (`briar`): three old canes
  that swing wide across the wall and cross each other, thorns all
  along them, young green shoots that leave a cane, arch over and
  hang, small dark glossy leaves, and roses: one at the end of most
  shoots, full-blown ones sitting on the canes, half-open ones, buds
  in their sepals, one that is losing its petals. The canes come out
  of a joint at the lower end and end in this year's green growth
  with a red tip at the upper one. Every stretch of briar has roses of
  one colour, the next stretch another: red first (from 26 m, the
  first thing on the wall one meets), then white with golden hearts
  (198 m), then old rose (544 m, above the trees, where the roses are
  the only thing that still grows). Petals fall down the wall in front
  of it, two to a tile, turning as they go. The roses are sprites laid
  on the wall like the signs, but a rose belongs where its shoot ends:
  beside a window it is left out, not moved. The canes and leaves lie
  over the plain tiles like the ivy. Purely for the eye: nothing in
  the simulator.
- ✅ low mist on the lawn at the start.
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
  A trunk is round the way the tower is: what one sees is the inner
  flank of a tree far thicker than the strip of it in the picture, so
  its bark's ridges get narrower toward the inner edge, and the light,
  which for a trunk comes from that edge, lies on it in upright planes.
  The bark is ridges between furrows, broken into plates (oak; wider
  and darker on the giants), smooth with dark marks and the eyes where
  branches were (birch), or dead wood with long cracks and bare
  patches (above the trees). At the lawn a trunk flares out into a
  buttress root.
- ✅ branches grow out of the tree (`art/trees.js` limb): a limb swells
  into a collar where it joins the trunk (the collar lies over the
  trunk's bark and casts a little shade on it), its top is flat on the
  row one stands on for nearly its whole length, and its underside
  does the tapering. Lit from above, furrows along it, the bark's
  plates on its top. Leaves in round masses lit on their upper left
  (oak), darker with moss hanging from the underside (the giants),
  thin twigs with leaves in pairs and catkins (birch), bare twigs
  above the trees. The six kinds are as before (plain, gnarled,
  forked, knobby, mossy with a mushroom, a nest with eggs), the stubs
  a tuft or a snapped stump. A dry one is the same limb in dead-wood
  greys, cracked through in two places, leafless.
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
- ✅ a glow (bloom, selective, via a glow layer) and scan lines (the CRT
  pass with its tube, the curvature, aberration, corner shading and
  flicker, set to nothing), each a setting of its own. Anything that
  should glow passes `glow` on its draw call. With WebGL in place, fog with depth of
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
| later | ✅ weather (rain, snow, storms that push, the golden hour, the lawn snowed in around Christmas: `weather.js`), ✅ vines in the deep forest; selectable worlds, FX preset auto-fallback | 💡 |

Mode-independent polish (super jump portal, god rays, hit-stop) slots in
wherever it fits.

## 10. Tunables snapshot

From `web/src/config.js` and `web/src/level.js` as of Phase 1.

| Parameter | Value |
|---|---|
| Gravity / bounce velocity | 2100 px/s² / 1650 px/s (~648 px bounce) |
| Dry branch / bow spring bounce | 1550 (~572 px) / 2650 (~1670 px) |
| Boost | +1500 px/s, 3 charges, 0.5 charge per landing, 0.5 s shield, 3 suns per punch |
| Horizontal speed (keys, a held side / tilt, a sliding finger) | 560 / 820 px/s |
| Tilt | the dip of the screen's right edge below its left; 2° do nothing, full speed at 22° (the setting SENSITIVITY: low 22°, mid 16°, high 12°) |
| Sliding finger | where it is set down is the middle; 8 px do nothing, full speed 110 px to either side, past that the middle comes along; a touch under 0.22 s that moved under 14 px is a boost, and so is a second finger |
| Effects | glow: bloom gain 0.5 (was 1.25); scan lines: depth 0.22, mask 0.06, no curvature; both off unless chosen |
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
| Inside the tower | floors: the hall 0 m (no stubs, long ledges × 2, bats × 0.8, gallery guards × 0.6, no pikes, no ghost), the guard rooms 120 m (galleries × 0.8, guards × 1.2, pikes × 2.4, bats × 1.2, ghost × 0.6, stairs × 1.5), the library 250 m (webs × 2.4, ghost × 1.9, bats × 1.5, pikes × 1.2, guards × 0.7, the chained book × 1.6 of the bow's chance), the belfry 400 m (bells × 3, boards × 2, bats × 1.9, pikes × 1.2, stairs × 0.5); a floor's stone tint, dusk and wall decor fade over 30 m; chandelier 112 px, bell 104 px (the bow's bounce), gallery 160 px at ± 204; the chain sways with the braid's amplitude (12–68 px) in a wave of 2640 px; a window every 576 px of wall, a torch every 576 px of pillar, a hatch in half of the tiles that may have one (one per 640 px of climb); the pike is 165–195 px inside (130–160 outside) |
| Spider's web | 120 × 136 px quarter under a ledge (normal or long, healthy, no bat on it), from 65 m; the spider's tier chance × pacing × 1.0 in the hall, × 1.6 above; 3 tugs free him, the spider bites after 2.2 s; freed he is tossed 320 px up, onto the ledge |
| Ghost | from 120 m, the crow's tier chance × pacing; 45 % of the crow's speed (60–190 px/s), turns 48 px before the pillars; there 2–3.2 s, out 0.5 s, gone 1.4–2.4 s, in 0.8 s; 56 × 64 px box; drifts toward his height at up to 46 px/s from tier 2 |
| Stairs (inside) | layout weight 0.3 a side (a branch is 1.0), never within two rows of a gallery; 4 treads of 64 px, 48 px rise, from 28 px beside the middle to the pillar; the next row 314–444 px above the lowest tread |
| Gates | the first between 120 and 170 m, then every 100–160 m of climb, none from 400 m up; the landing 180 px at ± 134 on the tower layer, a normal branch opposite; the door opens in 0.28 s, the picture closes and opens in 0.3 s each; 0.8 s without hits after it; the first row on the other side 270 px above the landing |
| The dark (inside) | the first stretch between 150 and 210 m, then every 140–220 m of climb, 32–42 m long, fading in and out over 5.2 m; the picture multiplied down by 86 % toward `#07061a`; the prince's light 340 px (and a faint 560 px); in its rows no dry or short ledges, creatures × 0.7, lanterns × 2.2; chandeliers unlit until landed on |
| The treasury | golden doors inside the tower only: the first between 40 and 70 m, then every 200–300 m above the last one's way out; never in the dark or at a swarm's floors, 15 m from a gate; a room is its floor, three of six sections (940 to 1250 px each) and its top: the door out 3950 to 4270 px above the floor, the ceiling 720 px over that (a bounce off the highest platform stays under it); some 80 suns, 20 cut stones (3 suns each), 8 goblets (5), the crown (10), three or four chests (8), one heart: about 220 suns' worth; the tower's camera, starting with the floor 100 px above the picture's bottom edge and stopping when 60 px of the ceiling show; the bubble takes a prince whose head is 10 px under the bottom edge (where the tower ends the round), carries him at 240–760 px/s to 130 px above the lowest platform that is at least 100 px above the edge and lets him go there |
| The witch's cat | the squirrel's tier chance × pacing × 0 in the hall, 0.5 in the guard rooms, 1.0 in the library, 0.6 in the belfry; on a healthy normal or long ledge without a bat or a web; sees him within 210 px on or up to 3 m over its ledge; wiggle 0.55 s (0.4 s at the top), pounce 0.3 s over at most 150 px, 1.7 s (1.2 s) before the next; 60 × 56 px box |
| The weather | rain: 90 / 96 / 30 streaks far, mid, near (a storm half as many again); snow: 200 / 160 / 42 flakes; layers go by at 0.7, 0.95 and 1.25 to 1.3 of the camera's climb; a weather fades out and in over 2.2 s; a storm's gust: 3.5 to 6.5 s calm, 0.9 s in which the curls already show, 1.8 to 2.8 s of blow that carries the prince at up to 230 px/s (200 to 320 px a gust, by its length, if he does not steer against it); a storm takes half the colour out of the picture; lightning every 5 to 14 s, black and white for some 0.2 s; a storm over an outside stage from the third on with a chance of 0.3, drawing up 25 to 50 % into the stage and gone 15 m under its end (some 45 to 50 m of storm); one weather goes over into the next in 3 s, a storm draws up and passes in 5; the endless tower's storms by the clock: first after 35 to 60 s, 18 to 28 s long, 16 to 24 s of sun after, 50 to 100 s calm between; winter: 1 December to 6 January; fronts in the endless tower are 90 m high, the first always clear |
| The opening story | the tower ends 342 tiles up (about 730 m), Rapunzel's sill 432 px below; the witch circles from 0.4 to 3.7 s, "Rescue me!" from 1.5 to 3.9 s, the braid is let down at 4.1 s; its end is at 700 m after 0.8 s, 564 to 551 m from 1.9 to 2.7 s, 314 to 302 m from 3.8 to 4.6 s, 214 to 202 m from 5.5 to 6.3 s, 13 m at 7.7 s and down at 8.6 s, kept 62 % down the picture; the prince answers 0.2 s later, the title follows 1.5 s after the braid is down (14.2 s in all); the last 10 m are the round's own world; told again at a start: in the app every start, in a browser never (`STORY.again`, hours since it was last told) |
| Stages (trial) | themes, route and loop in `src/stages.js` (the table in section 7); a stage's end is the first row from its length on that no flock or braid cut has a claim to, and neither begins in its last 15 m; the door 270 px above the last floor; the camera stops with that floor 110 px above the picture's lower edge; calm 5 m behind a door and 12 m before the next; a golden door (themes with `vault`) from 6 m into a stage up to where its treasury (41 m) lets him out 18 m below the stage's end; a dark stage is dark from 3 m in to 12 m before its end; a braid cut in 50 % and a flock in 35 % of the stages whose zone has them; 3 lives (`?lives=5`, `?lives=inf`; `?stage=3` starts there, `?stages=0\|1` picks the mode) |
| The tower's wall | 440 px (110 art px) on the tower layer; one sees 72° round it to each side, the light stands 36° to the left; bricks 14 art px facing us, 6 high; five planes at 0.93, 0.74, 0.44 and 0.14 of facing the light; a string course 24 px high under every storey's sill (440 layer px apart); a veil of `#14242b` at 30 % over the wall (`?veil=` tries another strength); areas: plain wall for 6–14 tiles (a tile is 192 px on the tower's layer, about 2.1 m of climb), then an area of its two end tiles and its loop once or more (ivy 6 tiles, 1–2 times; crumbling 4, 2–3 times; old stone and moss 3, 2–4 times; the masons' site 4, 1–2 times; briar 5, 1–2 times); what hangs on the wall keeps 8 px from a window's frame and 32 px below its sill (clear of the string course), and gets there by whole courses of 24 px; petals: 2 to a tile of briar, each falling 300 px in 6–10 s; `?wall=ivy|worn|stone|moss|mended|briar|plain` shows one look all the way up (the briar in each of its colours in turn) |
| The forest behind | two layers at 0.42 and 0.62 of the prince's speed, tiles 384 px high; strips 96 px wide from 80 px in from the picture's edge; the far roof in the middle of the picture when he is at 475 m, the near one at 465 m, four tiles of leaves under each; the air between the layers 34 % on the forest floor, 25 % in the deep forest, none above |
| Zone bands | forest floor 0 m, deep forest 120 m, windows 250 m, above the trees 400 m |
| Sky / light keyframes | floor 0, deep forest 120, dawn at the windows 250, open sky 400, sunset 550, night 700 m |
| 1 m | 100 px |

## 11. Tools

- Checks in `tools/checks/` (Playwright, headless Chromium), run before
  every push: the browser flow and the landing page, the atlas (its
  size, every sprite on the art grid, and a budget for the art),
  pictures at heights, the treasury's camera and way out, and
  `identity.sh`, which compares the simulator's reports on fixed seeds
  with the ones kept in `tools/checks/baseline/`. They catch exceptions
  and regressions, not feel.
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
- 2026-11-19: The inside, step 5: gates (`element/tower-gates`). The
  two places are one tower now: a door in its wall leads from one to
  the other. Decided: (1) A gate is a choice, never the only way up:
  its row has a branch on the other side, and a gate that was used is a
  plain landing afterwards. (2) The passage is a cut, not a seam: two
  painters on one screen would have needed a floor across the picture
  to hide where they meet, and a door one goes through is the honest
  picture anyway. The door opens, the picture closes in on him, the
  world is the other one, the picture opens. He waits meanwhile and
  nothing can touch him. (3) He comes out where he went in: the same
  landing, the same height (the floors inside are in the outside's
  bands for this), so a gate never costs or gives metres, and the
  round's best counts for the place it started in. (4) What was built
  above the gate is thrown away and built again as the other place;
  what is below becomes its like on that side, so there is still
  something under him. In the simulator nobody ever dropped back below
  a gate, so this is for players, not for the numbers. (5) No gates in
  the first 120 m (with one at 60 m the kid bot inside reached 100 m in
  28 % of its runs instead of 34 %) and none from 400 m up: above the
  trees the outside is sky, which the inside has no rows for. (6) The
  gates roll on a stream of their own and can be switched off in the
  simulator (`... outside off`): without them the outside's report is
  identical on the same seeds to the one before step 1, which stays
  the baseline to measure against. Measured on 120 seeded runs with
  gates: starting outside, good bold median 471 m, mean 533 m, 0.95
  hits per 100 m, falls 47 % of the deaths (39 % without gates: the
  runs now pass through the library, where one steps aside for
  ghosts), 95 passages; starting inside, median 408 m, mean 519 m,
  1.01 hits per 100 m, falls 32 %, 95 passages; kid bold median 71 m
  outside and 73 m inside, as without gates.
- 2026-11-19: The gallery (`element/interior-gallery`). Simon: the
  tower is where the witch keeps Rapunzel, so it should be the witch
  whose pictures hang there, in several kinds and sizes, and an old
  candle here and there, so it looks lived in and old. Decided: the
  pictures tell whose house it is (the witch, her grandmother with
  spectacles, her cat, her raven), where the tale began (the rampion
  her neighbours stole, which is what "Rapunzel" means) and where we
  are (the tower in its forest); Rapunzel's portrait stays as one of
  them. A hanging is one to three pictures of different sizes below
  one another, slightly off, landscapes and still lifes a little
  askew. The idea of its own: painted eyes are left white and the
  painter puts the pupils in toward the prince, so the witch watches
  him climb her tower. The big portrait hangs over the hall so it is
  the first thing a round passes. Candles are the small thing between
  the big ones: lit ones use the room's light pools, a third are burnt
  down. No reds, nothing that could be taken for a platform or a
  creature (no cage, no armour). Purely visual: the simulator does not
  draw.
- 2026-11-19: The witch's things (`element/interior-witch-things`),
  four pieces Simon picked from a list: a tapestry of the tale, ivy in
  at the windows, her hat and broom by the hall's door, a mirror she
  appears in. The mirror keeps no state: how plainly she shows is how
  near the prince is (full within 100 px, gone beyond 300 px), so she
  comes and goes as he bounces past and nothing can go out of step.
  The ivy stops where the trees stop outside (400 m): it is the forest
  coming in, so the belfry has none. Purely visual; the simulator does
  not draw, the atlas is 4096 x 2910.
- 2026-11-19: The library's books (`element/interior-library`). Simon:
  the floor is called the library, so do much more with books there:
  cases, old scrolls, a spell book. Decided: the library is the one
  floor whose walls are nearly full (92 % of the places instead of
  66 %, and a second place a side per storey), because a library is
  the room where the wall is the furniture. The bookcase is the staple
  there, the scroll rack and the lectern with the spell book the
  showpieces. Two ideas of its own: some books fly (five of them drift
  behind everything while the camera is in the library, beating their
  boards; first drawn violet, they read as small bats, so they are
  brown and cream), and the floor's spring is a great chained book
  instead of the bell, after the chained libraries of the time. At 2.5
  times the bow's chance the book made the library a lift (a good run's
  median went from 486 m to 558 m); at 1.6 it is about one a visit.
  Measured on 120 seeded runs inside without gates: good bold median
  460 m, mean 556 m, 1.01 hits per 100 m (1.03 to 1.54 per band from
  100 to 1000 m), falls 38 % of the deaths; kid bold median 73 m, mean
  83 m. With gates, starting inside: median 415 m, mean 533 m. The
  outside without gates is identical to the baseline. The atlas is
  4096 x 2954: about 1100 px are left before the 4096 limit.
- 2026-11-19: The guard rooms and the belfry furnished
  (`element/interior-guardrooms-belfry`), as the library was. Each
  floor now tells who uses it: the guard rooms are where the watch
  waits (arms in racks, helmets on a shelf, a game left on the table)
  and where the prince is looked for (the notice with his face); the
  belfry is the tower's machinery and roof (timbers, ropes, the dial,
  wheels) with one inhabitant who minds nobody, an owl. What moves does
  so slowly and in place (hands, ropes, small bells, a blink), so
  nothing on the wall is taken for something to dodge. Purely visual:
  the simulator does not draw. The atlas is 4096 x 2974, about 1100 px
  short of the limit.
- 2026-11-19: Walkways in the library (`element/library-walkways`).
  Simon, playing it: the bookcases look fine but are nailed to the back
  wall at random, and nobody could get to them; give them a wooden
  balcony across the wall to stand on. So the library is no longer
  furnished by the wall's places but by storey: a walkway across the
  whole back wall just under the window's sill (one can stand at the
  window), the bookcase, the lectern or the scroll rack on it either
  side of the window, what hangs (pictures, a mirror, a tapestry) above
  them where a ladder reaches, and a long ladder at one end up to the
  next walkway, left and right in turn. The rule the stairs brought
  ("it must be seen to be carried") gets its twin: furniture must be
  seen to be reachable. The risk is that a wooden floor across the
  whole picture looks like something to land on. Against that: it is
  the back wall's layer, wood in shade under a cool tint, its railing
  is on our side of it (a gallery he can stand on has its railing
  behind him), and it has no pale lit top, which every platform has.
  To be watched when played. Purely visual; the simulator does not
  draw. The atlas is 4096 x 2990.
- 2026-11-19: Walkways on the other floors (`element/floor-walkways`,
  a branch of its own so it can be judged apart from the library's).
  The library's layout by storey became the layout of every floor
  above the hall, each with a walkway of its own make and its own
  split between what is used (on the walkway, or hung at a hand's
  height: racks, the table, helmets, the notice; bell ropes, wheels, a
  clock) and what is looked at (above, where a ladder reaches: shields,
  banners, pictures; timbers, the dial, the row of bells). The hall
  keeps its open wall: nothing there is used but the pegs by the door,
  which came down to where a hand reaches from the floor. What this
  costs is quiet: from 120 m up there is a walkway across the back wall
  every 6.4 m, three in view at a time. If that is too much structure
  behind the play, the guard rooms and the belfry can go back to the
  open wall by taking `galleried` off their rows in FLOORS. Purely
  visual; the simulator does not draw. The atlas is 4096 x 3014.
- 2026-11-19: The ladders between the walkways are gone, here as on
  the library's branch. Simon, having
  played the library: a great deal goes on behind the play now, enough
  to lose sight of the prince, and the ladders from one walkway up to
  the next are the worst of it. They were the only thing on the wall
  that ran the whole height of the picture, right beside the pillars
  where the ledges are. The walkways, the furniture on them and the
  ladders leant against the bookcases stay; whether that is calm enough
  is to be played next.
- 2026-11-19: `?at=` starts the prince over the start branch. A browser
  check with a prince nobody steers failed now and then: with `?at=`
  he started in the middle while the branch put there for him hangs at
  the left trunk, so he dropped past it and, in a tower with nothing
  under the middle, out of the picture (and a power-up he had just
  taken went with him). In the browser he now starts over that branch.
  The simulator keeps its start in the middle, so its reports from a
  start height are the ones they were (the sky's baseline is identical).
- 2026-11-19: Where the lights are out (`element/interior-dark`).
  Simon's idea: a section inside that is dark, or very dark. A good one
  on one condition: the dark must never hide what bites. Decided:
  (1) Not a floor of its own but stretches, announced and about 40 m
  long, from the guard rooms up, so that the dark is an event one comes
  out of again and every floor can have it. (2) Real darkness, not a
  darker tint: the renderer got a light map (a texture at half
  resolution, the dark's colour as its ground, every lamp added to it,
  multiplied over the picture under the HUD). The lamps are for the
  most part the light pools the room already registered for its
  ordinary lighting, so whatever shone before lights the dark now
  without knowing of it. (3) The prince carries his own light, big
  enough to see the next row as he rises to it. (4) The mechanic of
  its own: chandeliers are out and catch when he lands on them, so the
  way he came is lit behind him. (5) Fair: every creature has a light,
  the picture never goes to black (a pale ledge stays a shape), and
  the rows there are the kind ones (nothing crumbles, nothing small,
  fewer creatures, more lanterns); torches out and windows walled up
  say where it begins before it is dark. Measured on 120 seeded runs
  inside without gates: 306 dark stretches entered; good bold median
  507 m, mean 641 m (460 m and 556 m before), 0.97 hits per 100 m,
  falls 34 % of the deaths; kid bold median 73 m, mean 84 m. The bot
  sees in the dark, so these numbers show only the kinder rows, not
  what the dark asks of a player: that is to be played, and the rows'
  kindness taken back if it is too easy. The outside without gates is
  identical to the baseline. The atlas is 4096 x 3064.
- 2026-11-20: The wall's furniture steps back (`element/interior-muted`).
  Simon, after playing the library with its walkways: what is in the
  background is still as present in colour as what is in front; less
  contrast and a little of the wall's colour in it would keep the
  atmosphere and disturb less, but not for the pictures, the mirror,
  the tapestry and the shields, which are right as they are. So there
  are two classes on the wall now. What furnishes it is the room: it is
  drawn in full colour and then moved 30 to 48 % of the way toward the
  wall's own violet-grey (the walkways, ladders and timbers furthest,
  the spell book's lectern and the owl least), which lowers contrast
  and saturation at once and costs no second sprite. What hangs to be
  looked at is a picture in the room and keeps its colour, as do the
  lights. The walkways lost their own cool tint and take the floor's,
  like the wall behind them. The side effect wanted: ledges,
  chandeliers and creatures now are the brightest and most coloured
  things on the screen without having changed. Purely visual; to be
  judged by playing, and the one table of amounts is where to turn it
  up or down.
- 2026-11-20: `?at=` does not start in the dark any more (fixed on
  `element/interior-dark`): a dark stretch that was due below the start
  height began with the first row built.
- 2026-11-20: The witch's cat (`element/interior-cat`). The inside had
  nothing that lives on a ledge as the squirrel lives on a branch, and
  the cat was already in the witch's pictures. It is not the squirrel
  in black: a squirrel patrols and dashes, a cat sits and pounces. Its
  telegraph is the one every child knows, the wiggle before the jump,
  and it only goes for a prince who is on its ledge or just above it,
  so the far end of a long ledge is a safe place to land and look at
  it. Stomped it is not knocked out but sent off, puffed up. Drawn
  first all black with violet lights it was a pair of eyes on the wall
  and little else, so it got white socks, a bib and a tail tip, which
  is also its feature. The art has a file of its own; the inside's
  drawing file is long enough. Measured on 120 seeded runs inside
  without gates: good bold median 500 m, mean 589 m (507 m and 641 m
  before), 1.06 hits per 100 m, every band from 100 to 1300 m between
  1.09 and 1.61, the cat 67 of 747 hits, falls 24 % of the deaths; kid
  bold median 74 m, mean 87 m, three scratches in 120 runs. With gates,
  starting inside: median 467 m, mean 563 m. The outside without gates
  is identical to the baseline. The atlas is 4096 x 3096.
- 2026-11-20: The cat is black (`element/interior-cat`). Simon, after
  playing it: in the portraits the cat is black, in the game it had come
  out grey-blue, the colour of the room; a witch's cat should be really
  black, with some contrast and a contour, and yellow eyes. So the fur
  is nearly black now, a dark violet only where the light from above
  catches the crown, the back and the tail, and the white socks, bib and
  tail tip are gone again: they made it a house cat. What keeps it from
  being a hole in the wall is a contour, one of the few the style
  allows (`docs/ART.md`: only where something would otherwise vanish).
  It is drawn by a pass over the finished sprite: every empty pixel with
  fur beside it or under it takes a pale violet, so the line runs along
  the top and both sides and not underneath, as a rim of light from
  above would. The eyes are the sun's yellow with a lighter pixel, the
  brightest thing on it. Only the drawing changed; the numbers above
  stand.
- 2026-11-20: The treasury (`element/treasure-room`). Simon picked it
  from the ideas for the inside: a golden door into a room full of
  suns, out of which one comes a little higher; a moment that shows well
  in a video and a reward to play for. He asked for the room to be
  larger than "small", with hearts in it. Decisions:
  - It is a room, not a stretch of the tower: a third place the world
    is in while he is there (`TREASURY` in `places.js`, not among the
    places a round is climbed in), furnished at once from a plan
    instead of built row by row, at the height he went in at. So the
    gates' technique carries it both ways (the door opens, the picture
    closes in on him and opens again), and since the door out is 20 m
    above the floor, he is simply that much higher when he is back.
  - Nobody can lose anything in it. A bonus room that can kill is a
    trap for a child. It has a floor, and the camera, which everywhere
    else only climbs, rests there on what he stands on and goes down
    with a prince who drops, so the fall off a ledge that ends a round
    in the tower costs a moment here. That is also why the room can be
    two pictures high instead of one.
  - The hoard is counted in suns, the game's own gold, so there is no
    new currency. The chests are the one new verb: a platform that
    opens the first time he lands on it. A heart is in every room; it
    restores all three, as every heart does.
  - Gold is the braid's ramp (the witch hoards what Rapunzel's hair is
    the colour of), and what only furnishes is stepped back as in the
    tower, after what the library taught: the suns to take have to be
    the brightest thing in the picture.
  - The first door stands in the hall, so that the youngest see one
    (the kid bot's median inside is 74 m). The doors were first spaced
    150 to 220 m apart; a good bold run then met 3.4 of them and went
    through 2.5, so every round had two or three. At 200 to 300 m apart
    it meets 2.4 and goes through 1.7: a door is rarer and the room an
    event.
  - The ceiling is 27.6 m up. At 24.4 m a bounce off the highest
    chandelier ended at it every time, a bump and a shake per bounce;
    now only a boost reaches it.
  Measured on three sets of 120 seeded runs inside without gates,
  against the same seeds without treasuries. One set is not enough
  here: the door in the hall sends nearly every run down another path,
  and two builds that differed only in the height of the ceiling were
  80 m apart in the median of one set. Good bold: mean 602 m against
  536 m, the three medians 483, 510 and 499 m against 500, 413 and
  435 m, so about a tenth more, 35 m of it the rooms themselves (1.7
  visits of 20 m), the rest the heart; 1.03 hits per 100 m against
  1.02; falls 22 to 29 % of the deaths. Kid bold: mean 88 m against
  81 m, medians 83, 84 and 66 m against 74, 74 and 59 m. The good bot
  goes through 610 of 879 doors, stays 5.4 s (longest 9.7 s) and takes
  37 of a room's 72 suns: it climbs straight through and hardly ever
  lands on a chest, so that is the least a player gets; in one visit
  in five the heart restored something. The kid bot goes through 109
  of 239 doors and stays 7 to 8.5 s (longest 17.3 s). Nobody dies in a
  treasury and nobody stays in one. With gates (one set of 120):
  starting inside median 489 m, mean 565 m (467 m and 563 m); starting
  outside median 522 m, mean 626 m (491 m and 554 m), falls 43 % of
  the deaths. With treasuries switched off the inside is identical to
  the cat's report and the outside to the baseline. The atlas is
  4096 x 3206.
- 2026-11-20: The treasury's camera is the tower's
  (`element/treasure-room`). Simon, after playing it: the rooms are
  great, but the camera does not feel good because it is so different;
  it hurts in the head. It was a camera of its own in there: it rested
  on what he stood on, a third up the picture, stepped up when he
  landed on the next thing, and went down with a prince who dropped.
  Each of the three was a difference to the eye: he stood higher in
  the picture than anywhere else, the picture moved after his jump
  instead of with it, and it moved down, which nothing in this game
  does. So the room has the tower's camera now: it only climbs, with
  his rise. It starts with the floor where the lawn lies at a round's
  start, and its one rule of its own is that it stops under the
  ceiling. What the downward camera was there for, that nobody falls in
  the treasury, is a golden bubble instead: a prince whose head has
  gone out of the bottom of the picture (where the tower ends the
  round) is taken by it, carried back up to the lowest thing in the
  picture he can stand on and let down just above it. The camera does
  not move for it. What hangs below the picture is gone, as in the
  tower; that is all one can lose in there.
  Measured on the same three sets of 120 seeded runs inside without
  gates: good bold mean 602 m against 536 m without treasuries (medians
  513, 485 and 499 m against 500, 413 and 435 m), 1.01 to 1.05 hits per
  100 m, falls 25 to 28 % of the deaths; kid bold mean 88 m against
  81 m (medians 91, 84 and 66 m against 74, 74 and 59 m). The good bot
  goes through 605 of 886 doors, stays 5.4 s (longest 8.7 s), takes 37
  of a room's 72 suns and never needs the bubble; the kid bot goes
  through 109 of 239, stays 6.5 to 7.5 s (longest 17 s) and is carried
  back up 16 times. A check in the browser climbs each of the three
  rooms and counts the frames in which the camera goes down: none.
  With gates (one set of 120): starting inside median 489 m, mean
  565 m; starting outside median 510 m, mean 605 m, falls 43 % of the
  deaths. With treasuries off, inside and outside are identical to the
  reports before. The atlas is 4096 x 3238.
- 2026-11-20: The treasury is twice as high and holds more to take
  (`element/treasure-room`). Simon, after playing it with the tower's
  camera: really good now; the rooms could be twice as high and hold
  more treasure, of the kind one can collect. Decisions:
  - A room is put together from sections now instead of drawn up as a
    whole: the floor, three of six sections, the top. The old room
    made twice as long would have been the old room twice; three of
    six in any order, each mirrored or not, are rooms one does not
    know by heart, and a new section is a dozen lines. Every section
    ends with a chandelier in the middle, so the next one knows what
    it stands over.
  - More to take, and not only more suns: pieces of the hoard as
    pickups (a cut stone, a goblet, the crown inside the crown of
    suns). They are what stands on the shelves, but in full colour,
    bobbing, with a glint and a glow, where the shelves' are stepped
    back: what one can take moves and shines. There is no new counter
    for them. They count as suns (3, 5 and 10) and say so as they are
    taken. A room is worth some 220 suns now, 72 before.
  - The doors stay 200 to 300 m apart, counted from where a room lets
    him out. A visit is 40 safe metres now instead of 20, and it takes
    twice as long.
  Measured on the same three sets of 120 seeded runs inside without
  gates: good bold mean 581 m against 536 m without treasuries (602 m
  with the rooms half as high, which three sets cannot tell apart),
  medians 561, 494 and 498 m; 0.97 to 1.04 hits per 100 m; falls 23 to
  28 % of the deaths. Kid bold mean 92 m against 81 m, medians 94, 96
  and 66 m against 74, 74 and 59 m. The good bot goes through 530 of
  783 doors, stays 9 s (longest 13.3 s) and takes 118 of a room's 224
  suns' worth; the kid bot goes through 110 of 237, stays 14 s
  (longest 34 s) and is carried back up by the bubble 41 times. Nobody
  dies or stays in a treasury. With gates (one set of 120): starting
  inside median 553 m, mean 647 m; starting outside median 509 m, mean
  591 m, falls 44 % of the deaths. With treasuries off, inside and
  outside are identical to the reports before. In the browser the
  camera stops exactly under the ceiling and the door out hangs where
  it was planned. The atlas is 4096 x 3242.
- 2026-11-21: The checks are in the repository (`tools/checks`). The
  scripts that every branch of the tower's inside was checked with (the
  browser flow, the atlas, pictures at heights, the treasury's camera)
  and the simulator's reports that a change for the eye must leave
  untouched lived in one session's scratch folder. They are in
  `tools/checks/` now with a page that says what each does, so that a
  change can be checked the same way whoever makes it and wherever.
  `identity.sh` on master: all five reports the same.
- 2026-11-21: The tower is round and wider (`element/round-tower`).
  Simon, once the inside was done: next to it the outside looks simple;
  the tower seems thin, and square where it should be round. Decisions:
  - Wider, 380 to 440 px. More is not to be had: the trees leave 568 px
    between them, and the strips beside the tower are where the sky and
    the time of day show (64 px each now). The room inside is 568 px
    between its pillars: a tower 380 wide could not have held it.
  - Round by what a round wall does, not by a gradient: bricks
    foreshortened toward the edges, and the light in upright planes of
    flat colour. One small picture of the drum says where a point at an
    angle round it stands and how squarely it faces the light; the
    bricks, the string course and the vines all ask it. Where two
    planes meet, the bricks' offset from course to course toothes the
    border. The haze that used to lighten both edges is gone: it made a
    flat wall with soft edges.
  - A string course under every row of windows gives the tower storeys.
  - Nothing one plays on moved (windows at 114, balconies at 210, gates
    at 134 from the middle), so the change is for the eye only:
    `tools/checks/identity.sh` reports all five the same.
  - The landing page draws the tower with the game's tiles; its width
    follows them now, and the roof at the top is a little wider.
  The atlas is 4096 x 3254.
- 2026-11-21: The forest behind the tower (`element/forest-backdrop`).
  What stood there was the prototype's tile: upright bands of dark
  colours, the part of the outside that looked most like a placeholder.
  Decisions:
  - One sees the forest behind in two places only: in the strips between
    the tower and the trees in front, 64 px a side, and at the top,
    where the trees in front end. So it is drawn for those two places
    and not as a picture across the screen: narrow strips of trunks all
    the way up, and a roof of leaves across each side for the top.
  - Depth by two layers at two speeds and by their tones, the far one
    nearer the colour of the air, with a veil of that air drawn between
    them. No detail to speak of: after the library the rule is that
    what is behind the play is calm. A strip holds two trunks, a
    branch, a few clumps of leaves.
  - The dark forest's tiles are drawn in greys and tinted by the
    painter, so the forest floor and the deep forest share them; the
    birches and the canopies have their own colours.
  - The treeline is a place now. The forest's roof is set so that it
    comes into view as the tops of the trees in front sink: one climbs
    through leaves, then stands above them, and the forest stays below
    for another 20 to 35 m of climb. The old tile faded out between 270
    and 400 m instead.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same. The landing page keeps the old tile for the texture at its
  lower end. Inside the
  tower the two columns stand in the middle, behind the windows. The
  atlas is 4096 x 3422.
- 2026-11-21: The trunks (`element/tree-trunks`). They were a brown
  band with a light strip at the inner edge and some twenty thin lines
  of two colours thrown down it at random: the "thin lines carrying
  the shape" the style warns of. Redrawn on the tower's idea of
  roundness, with the trunk's middle 16 art px outside the picture: one
  sees its flank from 24° round to its edge. The furrows stand where
  ridges 9° wide (12° on the giants, 7.5° on dead wood) put them, 6 px
  apart at the picture's border and 1 px at the inner edge, and five
  planes of the bark's ramp (with a half step either side of its
  middle) go from the lit edge to the border. Furrows stray a pixel on
  their way and are back in their columns where a tile ends, so the
  bark runs on. A lit top edge on every plate was tried and was too
  much. The birch keeps what it had (pale, marks across), now round;
  its marks get shorter toward the edge. The roots at the lawn are a
  buttress now, 136 px into the lawn, instead of a low wedge. For the
  eye only: `tools/checks/identity.sh` reports all five the same. The
  atlas is 4096 x 3460.
- 2026-11-21: The branches (`element/branches`). A branch was a
  straight log, thicker at the trunk, its top sloping across the row
  one stands on (two pixels over it at the trunk, one under it at the
  tip), stuck against the trunk. Decisions:
  - A branch grows out of the tree: the sprite reaches 5 art px further
    into the trunk than before and swells into a collar there.
  - The top is flat on the row he stands on. He stands on what one
    sees; the taper is the underside's.
  - The first collar was a funnel (the limb doubled its thickness in
    its last sixth) and the first limbs were sticks next to the new
    trunks; the limb is 5 art px at the tip and 11 at the trunk now.
  - Only the drawing changed: the box one lands on, the lengths and
    the six kinds are the same, and a dry branch is still told from a
    healthy one at a glance (grey, cracked, no leaves).
  - One drawing for both sides. The bigger canvases of the new limbs
    took the atlas to 4096 x 3936, with 4096 the limit, because every
    branch, ledge and trunk was in it twice, once mirrored. The
    renderer can mirror as it draws, so the mirrored copies are gone
    (the left tree's branches, the left pillar's ledges, the right
    trunk, its top and its root): the atlas is 4096 x 3084, less than
    before the outside was touched.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same.
- 2026-11-21: The tower stands back (`element/tower-back`). Simon,
  after playing the new outside: much better, but the tower is very
  bright; everything seems to be in the foreground, the colours lie on
  top of one another and one does not know at once where the player
  is. The round wall had been drawn in the brick ramp's light colours
  with only a 12 % veil over it, so it was as light and as contrasty as
  what is played in front of it. The inside's lesson again: what is
  behind the play is dark and calm. Tried at 12, 30, 42 and 55 % on
  the forest floor, among the birches and above the trees: from about
  42 % on the prince, the leaves, the ribbons and the suns come
  forward; at 55 % crows and spiders begin to sink into the wall. It
  is 45 %. A veil of one colour rather than a darker palette, because
  it also draws the wall's lights and darks together, which is half of
  what sets it back, and because the balconies and gates, which are
  drawn in the brick palette and after the veil, stay light: one sees
  what one can stand on. `?veil=0.3` (0 to 0.9) tries another strength
  on any build. For the eye only: `tools/checks/identity.sh` reports
  all five the same.
- 2026-11-22: The veil is 30 %, and the wall has areas
  (`element/tower-areas`). Simon tried the veil on the preview: at 30 %
  the tower sits right, at 45 % it was too far back. Then: the tower
  looks the same all the way up; parts of it could be old and
  crumbling, parts overgrown. Decisions:
  - Four looks to begin with: ivy, crumbling, old big stones, moss.
    They take turns with plain wall, so that each is a place one comes
    to and leaves again, and the plain wall stays the rule.
  - The plan is fixed, not rolled per round, as the windows are: a
    tower one climbs often should be a place one gets to know ("the ivy
    after the first branches"). Which of the plans the rules allow was
    chosen by looking: ivy comes first, from 21 m, and all four looks
    come before the trees end.
  - An area is a column of tiles of its own: two end tiles and a loop
    that closes on itself. The ivy is planned once as one strip six
    tiles high, so its masses of leaves go across the tiles' edges; a
    crack reaches a tile's edge in a fixed column and runs on.
  - Everything follows the round wall: leaves and stones get narrower
    toward the edges and take the tones of the plane of light they are
    in. The ivy's greens are duller and bluer than the leaves on the
    branches, after the first try, in which the two could be taken for
    each other. The old stone's ramp was taken a step darker after the
    first try for the same reason the veil exists.
  - What grows lies over the bricks and the string courses, and the
    windows are drawn after it: an ivy that hid a window would hide a
    guard's warning.
  - The wall's code moved out of `art/tiles.js` into `art/tower.js`.
  Above the trees there are only two looks so far (crumbling, old
  stone), which therefore alternate; more for up there are to come.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same. The atlas is 4096 x 3594.
- 2026-11-22: The masons' site (`element/tower-repairs`). Simon: where
  the wall is broken, boards in front of it, as if somebody had tried
  to repair it, and signs as on a building site. Decisions:
  - A look of its own beside the crumbling wall, not boards added to
    that one: the crumbling wall is the tower left alone, the site is
    the tower looked after, and the two tell more apart than together.
  - Building-site signs in a fairy tale are a joke the game can afford
    (it has a prince on a pogo stick): a red and white barrier and a
    yellow triangle are read at once as "work going on" by anyone who
    has passed a road works, which no medieval sign would be.
  - No exclamation mark on any sign: `!` is what the game shows before
    an enemy does something, and the wall must not cry wolf. The signs
    are pictures (falling stones, the witch's hat struck through, an
    arrow) and a notice nobody can read.
  - Nothing that looks as if one could stand on it: no scaffold
    planks, no hanging platform (the plank swing is a platform of the
    game). The ladder is the one thing that invites; it lies flat on
    the wall under the veil, has a rung missing, and stands at the
    wall's far edge.
  - What hangs on the wall is sprites of its own that background.js
    lays on the tiles. A tile cannot know where the windows are, and a
    sign with a window cut into it looks like a mistake, so a thing
    that would come within 8 px of a window's frame is left out whole
    (the hole under missing boards is then simply a hole). It also
    costs less of the atlas than baking each thing into tiles, and the
    bucket can swing.
  - The first sign tried for "this way" was a board with a pointed
    top and an arrow on it; it looked like a gravestone with a cross.
    It is now a board sawn into the shape of an arrow.
  - The plan was chosen again (the rules have a look more): ivy from
    26 m, the masons' site from 55 m, so the youngest see both; moss
    92, ivy 122, old stone 156, ivy 203, crumbling 235, old stone 284,
    crumbling 326, ivy 371, and above the trees three looks in turn
    (crumbling, old stone, the site) where there were two.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same; the tiles of the four older looks are pixel for pixel what
  they were. The atlas is 4096 x 3772 (679 sprites).
- 2026-11-22: What hangs on the wall gets out of a window's way
  (`element/tower-repairs`). The first rule was to leave a thing out
  where it would meet a window. Counted on the plan, that took a third
  to a half of every site's things, and at the first site both
  barriers, the piece that says "building site" loudest: a window on
  one side every 880 px and things 70 to 90 px high leave little
  room. Decisions:
  - A thing slides up or down the wall, whichever is nearer, until it
    is 8 px clear of the window's frame, or 32 px under its sill and so
    clear of the string course too. It may reach into the next tile,
    so the wall is drawn a tile further at each end.
  - For that the hole has to go with its boards: it is now in the
    boards' sprite (dark, the core's rubble in it, its ends ragged),
    not in the tile, and the sprite moves by whole courses, so the
    hole's courses stay the wall's. A hole's end cuts whole bricks
    wherever it comes to lie, which is what a hole does.
  - Tried and dropped: mirroring a thing to the other side of the
    wall (two things at one height then get in each other's way), and
    choosing a plan in which the first site happens to be clear (none
    of the plans that were otherwise good was).
  - The signs go in turn up the wall (witches, notice, arrow,
    triangle, ...), counted through the rounds of the loop: by a hash,
    two alike had come to hang 270 px apart.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same. The atlas is unchanged (4096 x 3772).
- 2026-11-22: Briar roses (`element/tower-roses`). Simon: thorny
  tendrils with flowers or roses on them, so that it looks pretty,
  with love for the detail. Decisions:
  - A briar, not flowers in the ivy: thick canes and thorns are what
    sets it apart from the ivy's masses of leaves at a glance, and the
    tower of a girl shut in by a witch may well have a rose hedge
    climbing it.
  - The canes are placed by hand (three, none the mirror of another,
    no two crossings at one height). The first try rolled them and
    they came out as a regular plait.
  - A stretch of briar has one colour of roses and the next stretch
    another: the tiles are the same, the roses are sprites laid on
    them, so three colours cost nine small sprites more and not two
    more sets of tiles. Red is deeper than the hearts one collects;
    the white rose's heart is golden, since a grey one made it a grey
    ring under the veil; the third colour is old rose, paler and more
    to salmon than the bows on the braid, which are what one bounces
    on and must stay the only pink of their kind. No yellow roses:
    yellow on the wall is a sun to collect.
  - Roses climb on above the trees (weight 2 there), where the rule
    was that nothing grows: ivy and moss want shade and damp, a rose
    wants sun, and against the morning sky it is the prettiest place
    for them. Up there the wall now has four looks in turn.
  - The plan was chosen again: roses first (26 to 41 m), the masons'
    site second (60 to 81 m), so the youngest see both new things;
    moss 107, ivy 143, white roses 198, crumbling 245, ivy 297, old
    stone 346, ivy 388; above the trees old stone, the site, old rose
    briar at 544 m, and so on. The colour goes by how many stretches
    of briar came before, not by the area's number, so the first is
    red whatever lies between.
  - A rose does not get out of a window's way as the masons' things
    do: it belongs at the end of its shoot, so beside a window it is
    left out.
  - Petals fall from the roses (two to a tile, stateless: where a
    petal is follows from the time alone). They are drawn under the
    veil like the wall, so they never look like something to collect.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same; the tiles of the five older looks are pixel for pixel what
  they were. The atlas is 4096 x 3922 (701 sprites): 174 px under the
  4096 that older phones can take, so the next thing on the wall
  needs the atlas made smaller first.
- 2026-11-23: The tower in stages, a trial (`element/stages`). Simon,
  from playing it while the outside was rebuilt: the game has much
  more flow when the scene changes (out before the tower, in through
  a door, into the treasury, out again), so every part should be a
  stretch of its own with a start and an end, procedural in between,
  and the door the only way on. Asked what a death does, whether the
  tower ends and what the score is: on from the last door for now
  (to be made a setting, perhaps with a number of retries), the
  stages follow each other without end for now (a finale and further
  towers later), the height stays the score. First it is to be tried
  whether the principle works at all. Decisions:
  - A mode beside the endless game, not instead of it: the title has
    a third board, and the endless climbs are what the stages are
    compared with. On this branch a save without a choice plays the
    stages; `?place=`, `?at=` and `?spawn=` still mean the endless
    tower, so every helper and check works as it did.
  - The cheapest cut that tests the principle: a stage is a stretch
    of the tower we have, between two heights, in one place. Looks,
    creatures and difficulty keep coming from the height, and the
    list of stages follows the zones' bands, so the outside is
    another zone every time one comes out again (forest floor, deep
    forest, windows, sky) and the inside another floor. Stages with a
    theme of their own, whatever the height (and weather), need the
    look and the difficulty taken off the height first; that is the
    step after this one, if the principle holds.
  - The end is a floor one cannot fall through and a door an easy
    jump above it. The camera, which only ever climbs, would have
    left that floor below the picture after the first bounce, and a
    missed door would have been a fall back to the stage's start; so
    it stops there, and what the prince does above the picture's top
    edge after a boost it does not follow. There is no lid over the
    door yet: outside nothing is there to bump into. If the stages
    stay, the end of a stage wants a piece of building of its own (a
    gallery round the tower, a ceiling inside).
  - Going on from a door is the gate's passage run again: the picture
    closes, opens on the landing, he bounces on. No game-over tune.
    The score is the highest he ever was; what happens in the tower
    goes by where he is now.
  - A treasury's way out is a door to go on from too: nobody climbs
    the hall again because he fell after the gold.
  Measured (40 runs each, going on as often as it takes): the good
  bold bot reaches 700 m in 189 s, through nine doors, going on from
  a door 0.6 times a run; a stage takes it 10 to 25 s, so the scene
  changes about every 20 s. The kid reaches 300 m in 179 s and goes
  on from a door 7.7 times a run, nine times in ten after a fall,
  most often in the deep forest (stage 3: 115 of 309). In the endless
  game the same kid's median is about 85 m. The endless game itself
  is untouched: `tools/checks/identity.sh` reports all five the same,
  `flow.mjs` passes, and `stages.mjs` is the new check for the mode.
  Not measured and not known: whether it is more fun. That is what
  the branch is for.
- 2026-11-23: Stages get themes, more length and lives
  (`element/stages`). Simon played the trial: it is really good, the
  passages work cleanly, the direction is right. Three things: some
  stages are much too short; a stage should have a theme that is
  fixed somewhere (the mossy tower or the broken tower belonging to
  one stage and not turning up between all of them; inside, the dark
  not coming over a stage suddenly but being a stage of its own that
  returns), written down as a description or a configuration; and the
  round never ends, so one is forced to quit while still alive: three
  hearts as the health inside a stage and three lives on top.
  Decisions:
  - A theme is a piece of the endless tower with a face of its own:
    `THEMES` in `src/stages.js` gives it a name, a place, the height
    it is taken from, a length, a wall, the dark or not, a golden door
    or not. That file is the configuration asked for; the table in
    section 7 is its description.
  - A stage is built at its theme's height in the world. Everything
    that goes by the height (zone, creatures, trees, forest, sky,
    light, the tower's floors) is there already and need not be
    taught about stages; the door carries the prince to that height,
    the landing staying where it was in the picture, and nothing else
    comes along. The first cut of the stages had kept the heights
    running on and so could only ever show the zones in their old
    order and at their old lengths.
  - The score is counted apart: what he climbed in the stages before
    plus how far up this one he has been. Difficulty follows the
    score, not the theme's height, so the forest floor can come back
    at 900 m and be hard.
  - The wall has one look per stage, laid in stretches with two to
    four plain tiles between them: one look all the way up is a
    pattern, a wall with gaps is a wall something happened to.
  - The dark is a stage (the dark rooms), dark from three metres
    behind its door to twelve before the next one, where the lights
    are on again so that the door is seen. No other stage goes dark.
  - What the endless game plans along the height is planned from a
    stage's start: at most one braid cut and one flock per stage, and
    not in every one (a flock in each stage was what the first
    measurement showed: eight a run).
  - Stages are 95 to 130 m, the first 60 m: the good bot needs about
    30 s for one where it needed 10 to 25 s.
  - Three lives. A life is lost by a fall or the last heart; the
    lives are shown as little princes. Not built: winning lives back
    (a hundred suns for a life would give the suns a use; to be
    decided after playing).
  Measured (40 runs each, three lives, to 1500 m): the good bold bot's
  median is 1182 m (14 of 40 reach 1500 m), a run lasts 316 s, a
  stage 26 to 36 s, 1.13 hits per 100 m; the kid's median is 206 m
  (about 85 m in the endless game), 55 % get into the third stage, a
  run lasts 88 s, and every life is lost by a fall. The endless game
  is untouched: `tools/checks/identity.sh` reports all five the same,
  `flow.mjs` and `stages.mjs` pass.
- 2026-11-26: The opening story (`element/story-intro`). Simon: the
  short videos do well on Instagram, and to tell the story there the
  game needs an opening: Rapunzel up in her tower, caught, the witch
  about, "rescue me", she throws her hair down, and it goes once
  quickly through the levels, as a teaser; not rendered but in the
  game, so that the game can use it too and everybody sees at once
  what it is about. Decisions:
  - It grows out of what was there: the ride down to the lawn before
    the title. The story is that ride from much higher, with a
    reason: the braid is let down and the picture follows its end.
    The bow at the braid's end is the thing the eye holds on to while
    the tower rushes by.
  - A steady fall showed streaks, not levels. The end therefore
    slows three times for under a second, each time at a place worth
    a look, and falls fast in between.
  - The ride needs a tower with things in it, up to 730 m, and the
    round's world has only its first rows (and in stages ends at the
    first door). Building the whole tower into the round's world
    would have changed the round (rows built before he is there get
    no pity hearts). So the ride has a world of its own, silent, in
    which nothing is made, met or culled; the round's rows are its
    guests, and the last stretch is drawn from the round's world, at
    a height where both show the same wall.
  - The tower got a top for it (the background's `top`): a cornice,
    a roof, Rapunzel's window with her room behind it. She is the
    title sign's portrait, at her size there; the scene is not
    enlarged, so the pixels stay one size.
  - The braid's upper end and the end that is let down are two
    fields more on the braid's cut (`top`, `loose`): the same code
    that ends the braid where the witch cut it. Bows on the braid
    are not shown below the end that is still coming down.
  - The masons' site happened to stand at the tower's top in the
    wall's plan, boards beside her window. The top of the ride's
    tower has briar with red roses instead.
  - Told once per device and skippable, because fourteen seconds
    before every round would be in the way; Rapunzel on the title
    sign tells it again, so it is not lost after the first time.
  For the eye only: `tools/checks/identity.sh` reports all five the
  same; `story.mjs` is its check, `flow.mjs` and `stages.mjs` pass.
  The atlas is 4096 x 3970 (706 sprites), 126 px under the limit.
- 2026-11-26: Letters from sheets (`tools/perf`, `docs/plans/performance.md`).
  The first reading on the iPhone Air: the game's step 0.3 ms, its
  drawing 4 ms, and still 6 % of a round's frames longer than 20 ms,
  the longest with ten texts new. A text the browser paints is painted
  and handed to the GPU again whenever its words change, and the height
  changes with every metre climbed: the hitches come "when the screen
  scrolls". Decisions:
  - Texts in the game's own font are put together from letter sheets
    made before the title (one per size, with the outline painted in);
    signs, wrapped text and the countdown stay painted, they do not
    change in a climb.
  - The sheets are as small as hold their letters (17 MB at the Air's
    resolution) and follow the drawing resolution. The engine's own
    way (a big page per size, every letter of every size) was over
    100 MB next to an atlas that is already large.
  - The look stays: positions put back to within a pixel; the browser's
    "fl" and "fi" ligatures are gone. `?letters=0` paints as before, so
    that the phone can say what it bought.
- 2026-11-26: The game is drawn at 1 (`tools/perf`). On the iPhone Air
  Simon stepped through the drawing resolutions: at one backing pixel
  to a logical pixel it ran smoothest, and he saw no difference to the
  screen's own 1.64 in the picture. Decisions:
  - `RESOLUTION = 1` in `config.js`, for every screen, not only the
    phone: 37 % of the Air's pixels, and an art pixel is still four
    pixels wide. The screen scales the picture up smoothly, as before.
  - Smaller was tried (0.75 and 0.5 are in the readout's steps):
    scaled up smoothly it blurs, with hard pixels the art holds and
    the small letters do not. Going below 1 would mean drawing the
    world small and the HUD at the screen's resolution on top; left
    until a reading asks for it.
- 2026-11-26: Lines are turned sprites (`tools/perf`). Looking for what
  a frame draws twice or for nothing: the vines and lianas on the
  trunks were vector lines, 70 to 85 shapes a frame in the forest that
  the engine built again every frame, and half of the drawing's time
  there. `g.line` now places a white rectangle, turned: the drawing in
  the forest takes half the time (2.7 to 1.3 ms at 180 m, measured
  headless), and no pixel differs, in the game's own frames or in 400
  made-up lines at three resolutions. What glows being placed a second
  time in the hidden glow layer was measured too and left: it does not
  show in the time.
- 2026-11-26: The atlas keeps the sprites at art size (`tools/perf`).
  The sheet had grown to 4096 x 3970, 126 px under the limit of older
  phones and 62 MB on the GPU, because every sprite was stored as it is
  painted, four times its art each way. Simon's questions: does making
  it smaller mean drawing everything again, or could it be split?
  Decisions:
  - Neither. The sprites are drawn by code on the art grid; 704 of 705
    are on it exactly. The atlas packs them at a quarter each way and
    the texture says it is four times coarser, so nothing that draws
    changes: 1024 x 1009, 3.9 MB, room for sixteen times today's art.
  - Splitting would have lifted the limit and left the memory. It is
    used for the exceptions only: a sprite that is not on the grid
    (today the lives' little prince) goes onto a second sheet at full
    size.
  - The rule that was a matter of style is now one the atlas depends
    on, so it is checked: `tools/checks/atlas.mjs` names a sprite that
    is off the grid.
  - The picture is the same to the eye, not to the pixel: at the
    game's resolution 14 to 157 pixels of a million sit one pixel
    off, at art pixels' edges inside sprites that are scaled, turned
    or stand between pixels.
- 2026-11-26: The opening story at every start of the app
  (`element/story-always`). Simon: it is good as it is, the beginning
  above all; should it not be shown at every start, at least on iOS?
  Decisions:
  - In the app, yes. A start there is a launch: the app stays in
    memory between rounds and through the background, so it is about
    once a day, a tap skips it, and it gives the app an opening like a
    game's. In a browser it stays once per device: there every page
    opened is a start, and who comes back from a link wants to play.
  - `STORY.again` holds it as hours since the story was last told (app
    0, browser never), so that "at most once a day" is one number if
    every start turns out too much on Simon's own phone.
  - "tap to skip" is offered from the second telling on and has a dark
    edge now, to read over the roses; the first telling keeps the
    picture free (a tap skips it all the same).
  - The app starts its sound at launch instead of at the first tap
    (the shell allows it, and the silent switch still mutes it): the
    story's sounds would otherwise be missing every time. Not heard
    on a phone yet.
  - His other thought, to fade the three looks in instead of riding to
    them, is left: he likes the ride as it is.
- 2026-11-26: Settings, steering, effects, sound (`element/settings`).
  Simon, from playing on the phone: a settings dialog for the phone;
  tilt runs away when the phone is held upright, is inverted when it
  is tipped towards the player, and hardly answers when it is tipped
  far back; somebody wished for steering with a sliding finger; the
  shaders bring little (the scan lines are nice, the tube's curvature
  does not fit, the bloom is far too much), make them options and
  switch them off; and the app has sound only with the silent switch
  off. Decisions:
  - Tilt was DeviceOrientation's gamma, atan2 of the gravity along the
    screen's width and the gravity through the screen. Held upright
    the second is nearly nothing and the angle runs away; past upright
    it changes its sign. The lean is now the dip of the screen's right
    edge below its left (the arcsine of the gravity along the width),
    in the shell and in a browser: the same in every pose, never
    inverted. What it cannot do is physics: a phone lying flat that is
    turned like a wheel does not change its gravity at all.
  - A third way to steer, SWIPE: the finger's first touch is the
    middle, sliding steers by degrees, a tap or a second finger
    boosts. It has the higher top speed of tilt, being as fine.
  - One sign for all of it, hung in the title's place, instead of the
    three boards (effects, sound, tilt) the title had: SETTINGS, and
    sound on or off beside it. The same sign in a browser, without the
    app's rows.
  - The effects are two switches, GLOW and SCANLINES, both off; an old
    save's preset is not read. The glow's gain goes from 1.25 to 0.5,
    the tube's curvature, aberration, corner shading and flicker to
    nothing.
  - Sound: the shell kept the audio session ambient on purpose, so the
    silent switch muted the game. A browser has always made it sound
    regardless. The app now does the same by default, as a setting (IN
    SILENT MODE); the price is that another app's music stops when the
    game sounds, which the setting switched off avoids.
  - Not tried on a phone yet: the lean, the slide's reach (110 px),
    the sound in silent mode. The Swift is one line and was not
    compiled here.
- 2026-11-26: Tilt's sensitivity, low, mid, high (`element/settings`).
  Simon on the phone: tilt is good now, the effects look much better;
  the sensitivity should be a switch of three, with what it is now as
  the lowest. The row is called SENSITIVITY and its boards LOW, MID and
  HIGH: full speed at 22 degrees of lean (as it has always been, and the
  default), at 16 and at 12. The first cut of the row had 22 in the
  middle, between a gentler 30 and a quicker 15, under names that did
  not say what they set.
- 2026-11-26: Weather (`element/weather`). Simon: weather outside, and
  something like the golden hour; rain, a storm, perhaps one that
  blows the player about, with wind drawn in pixel art; and snow, with
  Christmas coming, falling in parallax as in the old pixel art games.
  It has to look beautiful and fit the game; a free hand. Decisions:
  - A weather is a look of the whole picture and something in the air:
    the sky pulled toward the weather's colours, a light over
    everything, and what falls in three depths (behind the tower,
    before the wall, before everything; the nearest few and thin, so
    that nothing hides a hazard).
  - What falls is not kept as particles. A drop's place is worked out
    each frame from the clock and the camera, from tables made once:
    nothing is allocated, nothing has to be stepped, and it costs some
    250 sprites in the rain and 400 in a storm (the first cut was half
    of that and could hardly be seen).
  - The wind is a white line that ends in a curl, as the old games drew
    it. The curls already show a moment before a gust blows: that is
    the warning the push will need when it comes.
  - Snow lies: on what one stands on and on the lawn. That, more than
    the flakes, makes it winter.
  - Where: a stage has its weather, written in `stages.js` beside its
    wall. The endless tower has fronts by height and seed. The first
    stage and the first 90 m are always clear: the game opens as
    everybody knows it.
  - Sound: a bed of rain and one of wind, and thunder after the
    lightning. Written without hearing them.
  - Left for the next step: the gust pushing the prince (with the
    simulator, measured), weather seen through the windows inside, and
    whether the lawn is snowed in around Christmas.
- 2026-11-26: The gust's push, denser snow, a white Christmas
  (`element/weather`). Simon, having seen it move: fine; yes, let the
  gust push the prince, without the simulator for now, he tries it
  himself; yes, snow the lawn in around Christmas; and the snow may be
  denser. Decisions:
  - The gust carries the prince sideways while it blows: its envelope
    times 180 px/s, added to where he is, not to his speed, so it does
    not build up and steering against it works at once. Left alone he
    is 160 to 250 px further over after a gust, by its length; holding
    against it costs a third of his steering. The curls 0.9 s ahead are the warning.
  - It is in the game's world only (`world.gusts`). The simulator's
    worlds have none, so its reports stand and `identity.sh` is still
    the same: the push is to be played first, then measured and the
    bots taught, before it counts as done. Until then a storm is
    harder for a player than the numbers say.
  - Snow: 200 / 160 / 42 flakes where there were 120 / 96 / 26.
  - Winter is the first of December to Epiphany. The first stage and
    the endless tower's first 90 m, clear all year, are snowed in
    then, and so are the title and the opening story, which takes the
    weather of the lawn it ends on. A thin white edge on a green lawn
    did not read as snow: the whole lawn is white, with humps along
    its edge, hollows, and a few tufts of grass still showing.
- 2026-11-27: The storm is the weather that plays (`element/weather`).
  Simon, after playing it at length: the storm is the best of them,
  because it is part of the game; it should come at random among the
  stages now and then. Rain, snow and the rest stay. The wind on the
  prince was right and could be a little more. When lightning strikes
  the picture could go black and white for a moment; and a storm
  should take the colour down, as grey weather does. Are the raindrops
  single sprites? Decisions:
  - A storm comes over an outside stage with a chance of three in ten,
    from the third stage on, by the round's seed, never over two
    outside stages running; so most rounds that get five outside
    stages far meet one (77 of 100). In the endless tower storms are
    in the fronts of every zone from 180 m on.
  - The push goes from 180 to 230 px/s.
  - The mood is a pass over the whole frame (`MoodFilter`): it takes
    half the colour out while a storm is there, and in the lightning's
    instant it turns the picture black and white and bright. Graded,
    not stark: a first cut pulled light and dark apart so far that
    nothing could be told for those frames. The pass is in the chain
    only while a storm is, so it costs nothing the rest of the time;
    during a storm it is one more full picture drawn, to be watched
    on the phone.
  - The rain: yes, every streak is a sprite, a white rectangle turned
    the wind's way, in one batch with the rest (some 250 a frame, 400
    in a storm). If the phone shows it, the streaks can be painted
    once onto a few tiles that scroll, three sprites a layer.
- 2026-11-27: The storm inside a stage (`element/weather`). Simon:
  all of it stays as it is; the storm now has to be built into the
  stages so that it does not come right at the beginning but later,
  and a little at random; a free hand. Decisions:
  - A stormy stage was stormy from its door. Now a stage begins in
    its own weather and the storm draws up when he has climbed 25 to
    50 % of it (by the round's seed), and it has passed 15 m under
    the stage's end: calm, then the storm, then relief and the door.
    That is the stage's own arc (calm behind the door, pressure
    toward the end, a breather before the door) with the weather laid
    over it. Some 45 to 50 m of storm in a stage of 100.
  - It is keyed to how high he has climbed in the stage, not to the
    clock: who stands still is not caught by it, and after a fall he
    is at the door again in the weather the stage begins with.
  - It is announced: a line, a first thunder, and the weather takes
    3 s to go over; the first gust comes some seconds after that, with
    its curls ahead of it as before.
  - For the storm to draw up out of the rain and not replace it, a
    change of weather is now a blend from one to the next (sky, light,
    how much falls, how grey), where before one faded out to nothing
    and the next in: snow lying on the branches went and came back.
  - Where it snows the storm is a blizzard, not rain: thicker flakes
    driven sideways and down faster in a gust, the same push, no
    lightning.
  - Which stages: unchanged, three in ten from the third on, never two
    outside stages running, the crumbling tower always.
- 2026-11-27: The endless tower's storms (`element/weather`). Simon:
  the endless mode was forgotten; there a storm should turn up at
  random now and then, with a short line that it is drawing up, come,
  and after a while move off again, and the sun or the normal mood
  comes back; the storm's grey should fade in and out, gently, and
  perhaps the golden hour after it. Decisions:
  - In the endless tower a storm had been a front like the others: a
    band of 90 m, there as long as he was in it. It now keeps its own
    time, from the round's start: calm, a storm, the sun, calm. It
    comes whatever he does and it can be waited out, which a band of
    height cannot; in stages it stays bound to the stage, where the
    arc of the stage is the point.
  - No storm in the first 35 s of a round; then one every minute or
    two, 18 to 28 s long. The fronts keep rain, snow and the golden
    hour and have no storms of their own any more.
  - Said twice: "A storm is coming!" with a first thunder, and "The
    storm has passed". A storm draws up and passes over 5 s where
    other weathers change in 3: sky, light, the grey and the rain go
    over together.
  - After a storm the sun comes out (the golden hour) where the
    weather would be clear, in the endless tower for 16 to 24 s and
    in a stage for its last stretch to the door. Not at night, and
    not where it rains or snows anyway.
  - `?storm=8` brings the round's first storm after 8 s.
- 2026-11-27: A budget for the art (`docs/atlas-budget`). Simon: the
  atlas was brought down, and the documents on the sprites' style
  should say what keeps it from growing out of hand again. What was
  there: the grid as a fixed rule, and a check that names a sprite off
  it. What was missing: what a sprite costs, and a limit before the
  hard one. Decisions:
  - The atlas itself is no longer what grows (1024 x 1009 at art size,
    room for sixteen times as much). The sprites' own canvases are:
    drawn four times their art size and kept, 64 bytes to an art
    pixel, 55 MB today. The budget is on those: 80 MB, and two sprites
    off the grid. `tools/checks/atlas.mjs` fails past it and says where
    the size goes; raising it is a line in that file and a line here.
  - Where the size is today: the tower's wall areas 22 %, the trees'
    styles 15 %, the inside's wall 6 %, then the logo's letters, the
    backdrop and the prince at 5 % each. Variants and whole tiles, not
    characters.
  - `docs/ART.md` has it as a short section (What a sprite costs): a
    piece over a shared tile, a tint or a flip at draw time, before a
    second sprite.
  - Freeing the canvases after the atlas is packed (the open point of
    the performance plan) would take most of the 55 MB away; the
    budget is to be set anew then.
- 2026-11-27: The sprites' canvases are given back
  (`claude/dazzling-hopper-ytoqgp`). The open point of the performance
  plan and of the budget above. Simon: plan it and do it. Decisions:
  - The small way, not the big one. Once the atlas is packed,
    `buildAtlas` sets every sprite's canvas to no size and its `canvas`
    to null. Drawing the sprites at art size from the start would also
    take the start's peak away, but reaches into the drawing tools, the
    landing page and the social pictures: only if a phone shows the
    start to be a problem.
  - The size is set, not only the reference dropped: that frees the
    pixels at once and does not wait for a collection.
  - Nothing in the game read a canvas after the start; the pages that
    do (landing page, social pictures, sprite sheet, simulator) build
    their own art and are not touched. Packing the same art twice
    throws.
  - Measured in a headless browser only: the page's process 229 MB to
    126 MB on the title, 103 MB where 55 MB were counted. The atlas is
    the same to the byte, so the picture is. The phone's figure is
    Simon's to read in Xcode.
  - The budget, set anew as said: 80 MB stays, now as what the start
    may take (the canvases are all there until the atlas is packed, and
    no older phone has been tried), and the check also fails if a
    sprite still holds a canvas afterwards. Raising it is cheaper than
    it was, and still a line in the check and a line here.
  - `tools/checks/atlas.mjs` builds its own art to compare, in a frame
    of its own: `art/tower.js` keeps one random generator for the
    page's life, so a second build in the same page has other bricks.
    Left as it is: the game builds once.
  - Simon played it on the iPhone Air: everything as before. The
    memory's reading in Xcode is put off. Merged; the branch, whose
    name says nothing, is not kept, and branches are named after what
    is done on them from here on (`CLAUDE.md`).
- 2026-11-27: The round's controls in pixels (`element/hud-pixel`).
  Simon: the boost's button and its charges are not pixel art and do
  not look like the game; look, think, be creative, a free hand. They
  were vector shapes (a smooth circle, a flame of curves, boxes with
  round corners), and so were sound, pause and the power-up's box.
  Decisions:
  - The flame stays the boost's sign (it is what comes out of the pogo
    stick, and the title says "tap the flame"), now drawn on the grid:
    pale core, yellow, orange, a red foot (`flame4`, a fourth step of
    the flame's ramp), the tip leaning one way and the other in two
    frames, a lick off one side.
  - The charges are flames beside nothing, as the hearts are hearts
    beside nothing: no boxes. A landing brings half a charge and a
    boost takes a whole one, so a charge has exactly three states and
    each is a sprite: burning, a small flame at the foot of the unlit
    one, out. The unlit flame is the HUD's dark with an edge (`uiMid`
    between `uiDark` and `uiLine`), brighter where the light falls; the
    empty heart's mesh was tried first and was noise at this shape.
  - The button is of the signs' wood, a hoop (light planks, the dark
    outline, nails as the small boards have them), and what it holds is
    a dark glass at 60 %: it stands where things are played, so the
    game shows through as it did. "Ready" is the gold rim a chosen
    board has. No fourth display on the button: with less than a whole
    charge it shows what the next one lacks (out, or the small flame).
  - Sound, pause and the power-up's box are the title's small boards
    (`drawPlankTag`, now also without nails and with a rim in any
    colour) with symbols in ink as sprites; the title's sound board
    takes the same sprite. `g.roundRect`, `g.path` and `g.circle` are
    gone from the HUD: every piece is a sprite of the one atlas.
  - Feedback that was missing: a flame that has just caught hops, the
    button is pressed in while the next boost has to wait
    (`boostCooldown`), and a tap with no boost shakes what is empty and
    reddens the label (`boostDenied` on the player, a timer nothing in
    the game reads: the simulator's reports are as they were).
  - Seen in still pictures of a headless browser only (a phone's shape,
    outside by day, inside, in stages). Not played, and nothing moving
    was seen: the flicker's pace, the hop and the shake are Simon's to
    judge on the phone. The atlas grew from 1024 x 1009 to 1024 x 1021.
