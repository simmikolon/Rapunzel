# Rapunzel: design document

A living document for the browser version of Rapunzel: what the game is
today, where it is going, every idea collected so far, and the order we
plan to build things in. Update it as decisions are made.

Legend: ✅ exists · 🔜 agreed next · 💡 idea, not yet decided · ❓ open question · ⚠️ caveat

---

## 1. Vision

A pogo-stick climb up Rapunzel's tower, inspired by a five-year-old's
drawings. The prince bounces up branches of the two trees and ribbons
tied to Rapunzel's braid; the witch and the forest try to stop him.
Audience: kids first (the author's daughter), adults for high scores.

Design principles that follow from that:

- Readable, friendly, charming. Hazards are telegraphed; nothing is unfair.
- Short sessions (a tower in two to four minutes) with a clear goal.
- Traps must never be a death without a way out (taps break webs, a
  lantern precedes a barrier that needs a boost).
- Core defensive abilities are part of the base game, never store-gated.

## 2. The game today (Phase 0, ✅)

Deployed from `master` via Vercel; plain JavaScript on a 2D canvas, no
build step, 768 x 1364 logical portrait resolution.

**Mechanics**
- Prince on a pogo stick: automatic bounce on landing, tap to boost
  (three charges, refilled by landings and lanterns), steer with keys,
  touch halves or phone tilt, screen wrap-around.
- Platforms: healthy branch, dry branch (crumbles after one bounce),
  ribbon on the braid (moves with the hair's sway), bow (spring),
  plank swing between the trees (land on top, bonk from below).
- Enemies: crow (patrols, homes in at altitude, stompable), spider
  (hangs on a thread, lunges when you pass below, stompable), witch
  (telegraphed by a marker and a cackle, crosses above you, dives,
  twice near the top; dodge only).
- Pickups: sun drops (score), lanterns (boost refill), hearts (+1).
- Three hearts with invulnerability flashes after a hit; game over on
  zero hearts or falling off the bottom.
- Procedural level in rows (the original's beats) with difficulty tiers
  by altitude and a reachability guarantee (stress-tested).

**Presentation**
- Parallax layers like the original SpriteKit prototype: sky, distant
  forest, tower + windows + braid + ribbons (0.9x), trees + branches +
  swings + prince (1.0x), fireflies, vignette.
- Altitude-graded sky and lighting: forest → open sky → sunset → night
  with stars and moon.
- Squash and stretch, particles (dust, leaves, petals, crumble, flames,
  feathers, sparkles), screen shake, toasts for milestones.
- Synthesized WebAudio sound effects (no audio files), iOS unlock and
  silent-switch workaround.
- Title, pause and game-over screens; best height in `localStorage`;
  web app manifest and icons; the prince's look follows the original
  app icon (blue uniform, hobby-horse pogo stick).

**Key files**: `web/src/config.js` (tunables), `web/src/level.js`
(tiers, row generation), `web/src/background.js` (layers, sky, lighting),
`web/src/enemies.js`, `web/src/platforms.js`, `web/src/player.js`,
`web/src/art/*` (all procedural sprites; `web/dev/sprites.html` shows them).

## 3. The 300 m problem (analysis)

Best scores sit around 300 m and it is hard to go beyond. Causes, from
the numbers in `level.js`:

- The difficulty ramp peaks at 210 m and never relents: 33 % crumbling
  branches, crows homing at full strength on 28 % of rows, lunging
  spiders on 24 %, widest braid sway, the witch diving twice every
  45 to 70 m.
- Recovery is weak: a heart only spawns once a heart is lost, one at a
  time, roughly every 90 m. Past ~250 m the hit rate exceeds the heal
  rate and runs bleed out. The ceiling is attrition, not one hazard.

Agreed fixes (✅ implemented in Phase 1, numbers in `docs/ANALYSIS-phase1.md`):

- Boost makes the prince invulnerable for its duration and knocks enemies
  away (feathers, sun bonus). Boost becomes the game's "go through" verb.
  The charge economy keeps it from trivializing enemies.
- Collecting a heart restores all three hearts.
- Pacing waves instead of a plateau: intense stretches alternate with
  ~15 m breathers (no enemies, healthy platforms); the ramp stretches to
  ~800 m; the witch gets a longer cooldown; a pity timer guarantees a
  heart when stuck at one heart for long.
- Measure before and after with the bot: hits per 100 m, deaths by cause.

## 4. Game structure: towers with Rapunzel at the top (decided)

Decision: the main game becomes a **campaign of towers**. Each tower has
Rapunzel waiting at the window at the top; reaching her completes the
level and unlocks the next tower. The current endless climb stays as a
separate **Endless Tower** mode for high scores.

Why: it is the fairy tale's goal; it fixes the 300 m problem at the root
(a tower is a fixed height tuned to be beatable, difficulty lives between
towers); fixed-seed levels are learnable and can be authored with set
pieces; the store gets a natural rhythm between towers.

**Narrative engine**: every time the prince reaches her, the witch
cackles and whisks Rapunzel away to a new tower in another land (snow,
rain, jungle, night, space...). The last tower is the showdown.

**Portals** (both of the discussed variants, combined):
- Between towers: a light bridge / wormhole (Bifröst style) travel
  animation to the next tower.
- Inside long towers: a mid-tower warp works as a checkpoint and a
  setting change (e.g. forest floor → canopy). Restarting a four-minute
  tower from zero after dying at 90 % is what makes kids quit, so
  checkpoints matter more than any enemy.

**A tower is a spec** (`LevelSpec`): seed, height, theme (tile palette,
weather, trunks, sky), enemy roster, platform mix, difficulty curve with
breathers, hand-placed set pieces (a swarm at 60 %, a barrier, the boss
at 90 %), boss, star criteria. The generator already runs on a seed and
parameters, so this is a refactor of `level.js`, not a rewrite.

**Tower details**
- Height ~150 m for the first tower, growing to 400 to 500 m; two to four
  minutes each. A vertical progress bar with her window at the top.
- The braid ends at Rapunzel's window instead of running up forever: the
  hair comes from her, so the tower's height is her hair's length.
- The rescue moment must land: she pulls him up by the braid, lanterns
  rise, a short cheer, then the witch's kidnapping gag and the bridge to
  the next tower.
- Star ratings for replay value without grinding: reach her; collect
  enough suns; lose no heart (or finish under a time). ❓ exact criteria.
- Suns persist across towers as store currency.

❓ Open questions
- Lives and retries: restart from the last checkpoint; do suns collected
  before death stay? (Suggestion: keep them, they are the kid's progress.)
- Is Endless Tower available from the start or unlocked after a few
  towers? (Suggestion: from the start, as a second button.)
- Fixed seed per tower (learnable, classic) vs. slight variation per
  attempt. (Suggestion: fixed.)
- Theme order and how many towers at launch. (Suggestion: launch with
  three: forest, snow, night sky; add more later.)

## 5. Themes, worlds and stages

Themes for towers (each with its own palette, weather, trunks, enemies
and platform twists):

- 💡 Forest (the current look), with internal stages: ground → dense
  forest → clouds → space as sections of the tallest towers.
- 💡 Snow: icy branches slide you, icicles you bonk, snowfall, lights on
  the trees (also the Christmas edition).
- 💡 Rain: wind gusts push sideways, rain streaks, darker palette.
- 💡 Summer: bees, flowers, bright palette.
- 💡 Jungle: vines that slow you, dense foliage, different animals.
- 💡 Night / space: stars, moon, the witch's territory, the showdown.
- 💡 Parallel universe: palette-swapped world and alternative braids
  (also usable as store cosmetics).
- 💡 Selectable worlds instead of automatic progression: once a tower is
  unlocked it can be replayed from a world map / tower-select screen.
- 💡 Seasons and weather as date-driven variants (autumn leaves, snow in
  December, Christmas lights), see FX.

## 6. Enemies and hazards

Existing: ✅ crow, ✅ spider, ✅ witch.

Ideas, with notes on fit and cost:

- 💡 **Squirrels on branches** that attack: runs along the branch; stomp
  it or time the landing. Adds a platform-bound enemy; all current
  enemies are airborne or hanging. Cheap.
- 💡 **Arms reaching out of the tower windows** to grab the prince; windows
  spread left and right across the tower. Lives on the tower layer like
  the ribbons, so the machinery exists. Cheap and thematic (the witch's
  hands).
- 💡 **Scissors cutting the braid** from below a certain height: ribbons
  below the cut fall away. This is a rising death line, a strong pacing
  tool but harsh; keep it to late towers and telegraph it loudly.
- 💡 **Cross branches** spanning the width that can only be broken with a
  boost. ⚠️ Never spawn one unless a charge is guaranteed (a lantern just
  below, or the generator checks the charge).
- 💡 **Bird swarm** you must boost through (works once boost grants
  invulnerability). A set piece.
- 💡 **Spider webs and nets**: sticky, slow you or hold you. ⚠️ Must break
  on a few taps or a boost; a trap must never be a death without an out.
- 💡 **Vines / green zones** that slow the prince strongly or stick (jungle).
  Gentler than webs; prefer slowing over trapping for kids.
- 💡 **Mushrooms** (negative power-up): dizziness, wobbly or reversed
  controls for a few seconds. ⚠️ Frustrating for young players; make it
  look clearly different and keep it short.
- 💡 **Thorn / spiked branches**: a normal-looking branch with thorns; do
  not land. Adds reading skill; cheap.
- 💡 **Witch as a level boss** defending the window near the top of a tower.
- 💡 Per-theme rosters: bees (summer), ice creatures (snow), knights and
  witches inside the tower, etc.

## 7. Platforms

Existing: ✅ healthy branch, ✅ dry (crumbling) branch, ✅ ribbon, ✅ bow
spring, ✅ plank swing.

- 💡 More branch types: thorny (see hazards), icy (slides), cross branch
  (barrier), double-length, tiny.
- 💡 More ribbon / bow types on Rapunzel's hair: besides the spring bow,
  e.g. a swinging bow, a sticky bow that stops you, a tiny bow, a bow
  that changes the braid color.
- 💡 Cloud platforms for the cloud stage, star / asteroid platforms for
  space (needed once trees end or themes change).

## 8. Pickups, power-ups and portals

Existing: ✅ sun drops, ✅ lanterns (boost refill), ✅ hearts.

- 🔜 Hearts restore all three hearts (Phase 1).
- 💡 **Super jump portal**: a rare pickup that fires the prince 20 m up
  with light trails, speed-line blur and a light-speed feel. The best
  single "get higher" device and a wow moment. (Phase 2)
- 💡 Timed power-ups (a few seconds each): invulnerability star, jump
  power / speed up.
- 💡 Negative power-up: mushroom (see hazards).
- 💡 Magnet for suns and lanterns (store upgrade).

## 9. Store and meta progression

Currency: suns collected (persisted). Bought between towers (and from
the title / tower-select screen).

- 💡 Upgrades: fourth heart, fourth boost charge, longer boost
  invulnerability window, lantern / sun magnet, stronger spring bows,
  a helmet variant of boost protection (boosting through enemies yields
  extra suns).
- 💡 Cosmetics: braid colors and styles, prince capes and crowns,
  parallel-universe palette.
- Principle: base defensive mechanics (boost invulnerability, hearts)
  stay in the base game; the store sells upgrades and looks. If the core
  fix for the ceiling were store-gated, new players would hit the wall
  before they could buy it.
- The store doubles as a difficulty valve for kids: if a tower is too
  hard, collect suns on easier towers and buy a heart.
- ❓ Pricing: suns currently drop on ~40 % of rows in arcs of three to
  five; balance once the store exists.

## 10. FX and presentation wishlist

- 💡 **Title / menu screen**: the tower in the background, the prince
  bouncing happily in place (idle animation), flowers on the lawn, light
  rays falling through the forest.
- 💡 **God rays** (sunbeams) behind the tower and trees: translucent
  rotated quads with additive blending, animated slowly. Cheap in 2D.
- 💡 **Foreground clouds and fog**: pixel-art clouds with translucency,
  blurred because they are close (depth of field), like wisps of mist in
  the forest; the existing far clouds stay. Pre-blurred sprites at ~1.3x
  parallax cost nothing at runtime.
- 💡 **Falling leaves as particles** with parallax (some faster, some
  slower); green leaves or autumn foliage depending on the season.
- 💡 **Seasons and weather**: rain, snow; a Christmas edition with light
  chains along the trees; cute animals living in the trees (owls, birds in
  knot holes).
- 💡 **Shake and motion effects** when things happen: more shake, hit-stop
  (freeze frames), zoom punch on bow springs and the witch, speed lines
  on boost.
- 💡 **More particles and atmosphere** in general.
- 💡 **CRT lines**: cheap as an overlay; make it a toggle.
- 💡 **Shaders and bloom**: ⚠️ Canvas 2D has no shaders. Glow can be faked
  per object (lanterns and suns already glow) and scanlines are an overlay,
  but true bloom and screen-wide blur mean moving rendering to WebGL
  (e.g. PixiJS), a multi-day rewrite. Defer until the game design has
  settled; most of the wishlist above is achievable in 2D.

## 11. Bigger ideas (later, maybe)

- 💡 **Inside the tower**: openings lead inside; the game continues on
  stairs, steps and ledges with knights and witches; from outside the hair
  is visible at the windows. ⚠️ A whole second mode. Cheaper variant: a
  short bonus room (enter a window, climb for suns, exit higher up).
- 💡 Alternative braids and changing colors; a parallel universe.
- 💡 Selectable worlds on a map.
- 💡 WebGL renderer for bloom, CRT, blur and light shafts (see FX).

## 12. Roadmap

| Phase | Goal | Content | Status |
|---|---|---|---|
| 0 | Browser port | Everything in section 2 | ✅ done |
| 1 | Fix the ceiling | Boost shield + knockback, full-heal hearts, pacing waves, longer ramp, witch cooldown, pity heart; measured with the simulator (see `docs/ANALYSIS-phase1.md`) | ✅ on branch `phase-1-ceiling` |
| 2 | "Get higher" items | Super jump portal with light trails, thorny branches, squirrels | 🔜 |
| 3 | Campaign framework | `LevelSpec`, forest tower with Rapunzel at the top, braid ending at her window, progress bar, rescue scene, mid-tower warp checkpoint, between-tower light bridge, tower-select screen, save data; keep Endless Tower mode | 🔜 |
| 4 | Store and meta | Suns as currency, upgrades, cosmetics, pricing | 🔜 |
| 5 | Themes and set pieces | Snow and night-sky towers, per-theme enemies and platform twists, swarm / barrier / scissors set pieces, witch boss | 💡 |
| 6 | FX pass | Title idle scene, god rays, foreground fog, falling leaves with parallax, hit-stop and motion effects, animals in the trees, seasons / Christmas | 💡 |
| 7 | Later / maybe | WebGL renderer (bloom, CRT, blur), tower interior bonus rooms, selectable worlds | 💡 |

Phases 1 and 2 are mode-independent and stay useful in both the campaign
and Endless Tower.

## 13. Tunables snapshot (for reference)

From `web/src/config.js` and `web/src/level.js` at the time of writing.

| Parameter | Value |
|---|---|
| Gravity / bounce velocity | 2100 px/s² / 1650 px/s (bounce height ~648 px) |
| Dry branch / bow spring bounce | 1550 (~572 px) / 2650 (~1670 px) |
| Boost | +1500 px/s, 3 charges, 0.5 charge per landing, 0.5 s shield |
| Horizontal speed (keys / tilt) | 560 / 820 px/s |
| Hearts / invulnerability after a hit | 3 / 1.6 s |
| Row gaps (tier 0 → 5) | 0.75–1.0 → 1.3–1.9 beats (beat = 300 px) |
| Safe gap guarantee | 520 px between non-crumbling platforms |
| Tier altitudes | 0, 35, 100, 220, 400, 700 m (interpolated) |
| Pacing | 90 m cycles, last 15 m a breather |
| Enemy onset | crows 22 m, spiders 65 m, witch 120 m (then every 75–105 m) |
| 1 m | 100 px |

## 14. Testing tools

- Automated climb bot and phone-flow checks (Playwright, headless
  Chromium): run before every push; they catch exceptions and basic
  regressions but do not judge feel.
- Gameplay simulator (`web/dev/sim.html`, `tools/analyze.mjs`): runs the
  real game logic headlessly with scripted players (skill presets, bold
  vs cautious policy) and reports heights, deaths and hits per 100 m.
- Generator stress test: generates ~3900 rows and checks that every
  consecutive pair is reachable, including with the camera far above the
  model (two boosts).
- Real-device checks remain manual (iOS audio, tilt, performance).

## 15. Decision log

- 2026-10-22: Browser port on plain canvas, no framework; procedural
  art because the original atlases were never committed.
- 2026-10-23: Deploy on Vercel; prince restyled after the original app
  icon; tower, windows and braid on a slower layer, trees in front
  (matches the original prototype's layers).
- 2026-10-24: Repository restructured: `master` is the browser game,
  `swift-prototype` keeps the Xcode project.
- 2026-10-26: Analysis of the 300 m ceiling; agreed Phase 1 fixes.
- 2026-10-26: Phase 1 implemented and measured on `phase-1-ceiling`:
  bold-player median 142 → 434 m, 83 % of runs pass 300 m.
  Decided on a campaign of towers with Rapunzel at the top, portals as
  travel animation and mid-tower checkpoints, Endless Tower kept as a
  mode, store between towers.
