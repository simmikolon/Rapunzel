# Working on Sir Bouncealot

A prince on a pogo stick climbs Rapunzel's tower by her braid: he bounces
by himself, the player steers and boosts (or his son does, Lord
Springalot, with a rocket for the boost). What is on `master`, what is
open and what nobody has tried yet is at the end of this file (Where we
are, `docs/STATUS.md`): read it first.

Browser game (plain ES modules, WebGL via a vendored PixiJS, no build
step) in `web/`; its landing page is `site/`. Deployed, the landing page
is `/` and the game `/play/` (`vercel.json` runs `tools/build_site.sh`,
which only copies the two folders together). The design document
`docs/DESIGN.md` is the guide for what we build and why;
`docs/ANALYSIS-phase1.md` shows how we measure.

## How we work
- The endless game is the sandbox: every element (enemy, platform, trap,
  effect, mechanic) is built and tuned there first; levels come later.
- One short branch per element (`element/<name>`), merged into `master`
  when it is fun. `master` deploys to Vercel; branches get preview URLs.
- A branch's name says what is done on it, as the existing ones do
  (`element/weather`, `docs/atlas-budget`): Simon finds them again by
  name. Where a session is handed a made-up name (`claude/...`), open
  one with a telling name instead and work there.
- An element is a module: a spawn rule in `web/src/level.js` (tier chance
  x pacing x zone multiplier in `ZONES`), its art in `web/src/art/` (in
  the sprite style below), its sound in `web/src/audio.js`, and either bot
  support in `web/dev/sim.js` or a note that it is purely visual.
- "Done" means: in the game, in its zone, in the simulator, one line in
  `docs/DESIGN.md` (status mark plus decision log).

## Working with Simon
- Answer in German. Code, comments, commit messages and the documents
  stay in English.
- Merge into `master` only when Simon says so, each time anew (`master`
  is the live site). Use a merge commit, and never delete a branch: they
  and their preview URLs are kept for his videos (unless he says of one
  that it can go). No pull request unless he asks for one.
- He plays on his iPhone and says what he saw, often at length and by
  voice. Nothing here can be played on a phone, Swift cannot be compiled
  here, and sound cannot be heard: say plainly what was only seen in
  still pictures or not tried at all, and what he should look at.
- To a question, give an answer and a recommendation, then wait if the
  choice is his. Given a free hand, build it and say what was decided.
- Show pictures: the same frame before and after, enlarged where it
  matters.
- One chat per topic, as there is one branch per element: a new one when
  a branch is merged and something else begins. `docs/STATUS.md` is the
  handoff; bring it up to date with every merge.

## A session on this machine
- The checks need both servers, and a new session has neither:
  `python3 tools/serve.py` (the game, port 8000) and
  `python3 tools/serve.py --site 8002` (the landing page).
- `identity.sh`, `flow.mjs`, `stages.mjs`, `story.mjs` and `settings.mjs`
  take about ten minutes together: run them in the background and go on
  with the documents.
- Scripts and pictures for trying things out go to the scratch directory,
  never into the repository.
- Commit and push on the element's branch before a turn ends; if checks
  are still running then, say so in the commit message and report their
  result afterwards.

## Where things are (`web/src/`)
- `main.js` the game's loop and modes (intro, title, countdown, playing,
  paused, game over); `world.js` a round: platforms, enemies, pickups, the
  prince, the weather's choice, stages and retries; `level.js` what is
  built where (tiers, pacing, `ZONES`); `player.js` (who is played: the prince with his
  boost, Lord Springalot with his rocket; `FIGURES`), `chimney.js` (a hidden
  room), `enemies.js`,
  `platforms.js`, `pickups.js`, `powerups.js`.
- `background.js` sky, tower, forest, trees and the drawing order;
  `atmosphere.js` fog, leaves, forest life; `weather.js` rain, snow,
  storm, golden hour; `interior.js` the inside of the tower;
  `towerwall.js` (the wall in sections: what it is built of, what grows
  on it, what hangs on it and stands out from it, rolled for every round),
  `art/tower.js` the wall's looks, `art/cladding.js` more of them (slates, timber, wisteria),
  `art/hung.js` lanterns, torches, banners, gargoyles,
  `art/outline.js` the gallery round the tower and the oriel.
- `stages.js` the stages' themes and order; `story.js` the opening story;
  `settings.js` the settings and their sign; `input.js` keys, touch
  (hold, slide), tilt; `hud.js`, `title.js`, `sign.js` what is on screen
  beside the game.
- `gfx/renderer.js` the facade `g` (layers, pooled sprites, letter sheets,
  the effects), `gfx/atlas.js` the sprite atlas, `gfx/filters.js` the
  shaders; `art/` every sprite, drawn by code; `audio.js` every sound,
  synthesised; `platform.js` the iOS shell's bridge; `perf.js` the
  readout; `dev.js` the URL helpers.
- `web/dev/sim.js` the simulator's bots; `tools/checks/` the checks;
  `docs/DESIGN.md` is long (2800 lines): read the section that is needed,
  not all of it.

## Run and test
- Serve: `python3 tools/serve.py` (port 8000, caching off). A plain
  `python3 -m http.server` lets the browser keep a stale module next to a
  fresh one after a change; if that happens, hard-reload (Cmd+Shift+R).
- Landing page: `python3 tools/serve.py --site` serves `site/` at `/` and
  `web/` at `/play/`, as deployed. `site/landing.js` draws with the game's
  modules (`art/*.js` builders, `sign.js` drawSign / drawRibbon /
  drawPlankTag / drawPlaque, `art/logo.js` drawWord): renaming or
  reshaping those breaks the landing page's pictures (the page then falls
  back to plain CSS), so check `/` after such a change. On a deployed URL
  the dev helpers go after `/play/`; `/?at=150` forwards there.
  A devlog episode: `python3 tools/devlog_add.py <youtube-url> "Title" "Text"`.
  Pictures for social media (Instagram profile pictures, from the game's
  own sprites): `node tools/social.mjs` saves the canvases of
  `site/dev/social.html` to `docs/social/instagram/` (needs `--site 8002`).
- Dev helpers: `?at=150` starts at 150 m (and skips the ride down and the title's countdown), `?spawn=squirrel` puts one on the
  next branch, `?spawn=storm|stork|updraft` for the sky elements,
  `?spawn=guard|pot` on the next balcony, `?spawn=grabber` in the nearest
  window above, `?at=300&spawn=scissors` brings the witch with scissors at once,
  `?spawn=star|cloak|spring|magnet|feather` hangs that power-up above the prince,
  `?spawn=bat` hangs a bat under the next branch, `?at=170&spawn=flock` builds a
  flock of starlings a dozen metres above the start,
  `?len=stub|short|long` makes every branch that class, `?dev=1` shows
  altitude, zone and the wall's recipe, `?fx=off|bloom|lines|full` (the glow, the scan lines, both), `?veil=0.3` sets how strongly the
  tower's wall is set back outside (0 to 0.9), `?wall=stone+ivy+lanterns+gargoyles+both` shows one
  recipe of the tower's wall all the way up (what it is built of, `stone|worn|mended|slate|timber`, what
  grows on it, `ivy|moss|briar|wisteria`, what hangs on it, `lanterns|banners|torches`, what stands out at its
  edges, `gargoyles`, its landmarks, `rings|oriels|both`; any of them alone, or `plain`;
  `web/src/towerwall.js`), `?place=inside|outside` picks
  where the round is climbed whatever the title's selector says (inside,
  `?spawn=guard` stands on the next gallery, `?spawn=grabber` in the
  nearest hatch of a pillar, `?spawn=bat` hangs under the next ledge,
  `?spawn=web` spins a spider's web under it, `?spawn=cat` sits the witch's cat on it, `?spawn=ghost` sends a ghost, `?at=150&spawn=stairs` builds a flight
  of stairs above the start). `?at=150&spawn=gate` puts a gate to the
  other place above the start, in either place;
  `?place=inside&at=50&spawn=vault` puts a golden door to the treasury
  above the start (`vault1` to `vault6` pick the room's first section);
  `?place=inside&at=200&spawn=dark` puts the lights out above the start;
  outside, `?at=150&spawn=dark` puts the dark wood there (no light through the
  leaves, the prince carries a lantern; `world.js` WOOD, `art/darkwood.js`).
  `?weather=rain|storm|snow|blizzard|golden|clear` sets the weather outside for a
  visit (`web/src/weather.js`), `?season=winter|summer` whether the lawn
  is snowed in as around Christmas, `?storm=8` brings the endless tower's
  first storm after 8 s.
  The tower in stages (a trial; the title's TOWER board): what each stage is
  (place, the height it is taken from, length, wall, weather, dark, golden door) and
  their order are written down in `web/src/stages.js` (`THEMES`, `STAGES`).
  `?stages=1|0` picks the mode or the endless game for a visit, `?stage=3`
  starts at that stage's door, `?lives=5` (or `inf`) sets the lives of a
  round (`?place=`, `?at=` and `?spawn=` mean the endless tower).
  The opening story (`web/src/story.js`, told before the title: once per
  device in a browser, at every start in the iOS shell): `?story=1` tells
  it on a visit, `?story=0` does not.
  Performance (`docs/plans/performance.md`): `?perf=1` shows frame times,
  where they go and the longest frames (`web/src/perf.js`; a tap on its
  numbers takes the next drawing resolution, a tap on its graph hard or
  smooth pixels), `?res=1.5|1.25|1|0.75|0.5|screen` sets the resolution in
  backing pixels per logical pixel, `?px=hard` scales the picture up
  with hard pixels, `?letters=0` has the browser paint every text as
  before the letter sheets (to compare).
  Who climbs (`web/src/player.js` FIGURES; the title's switch): `?who=lord`
  has Lord Springalot climb the tower on a visit, with the prince's jump and
  a rocket for the boost (hold it); `?who=prince` the prince.
  The chimney (a hidden room, `web/src/chimney.js`):
  `?place=inside&at=50&spawn=chimney` puts a fireplace above the start;
  through it somebody small is played, up the shaft and out by its soot door.
- Sprite sheet: `web/dev/sprites.html`. A drawn picture can be brought onto
  the art grid with `python3 tools/pixelate.py <src.png> <out.png> --width 150`
  (one image pixel = one art pixel); the title uses the procedural wordmark
  in `web/src/art/logo.js` for now.
- Simulator: `node tools/analyze.mjs http://localhost:8000/dev/sim.html 40 good bold`
  (also `kid`, `cautious`; then `<cap> <seedBase> <startM> <place> <gates> <vaults>`, e.g.
  `... 40 good bold 1100 100 450` measures the sky from 450 m and
  `... 40 good bold 1500 1 0 inside` the inside of the tower; `off`
  for `<gates>` runs the tower without gates, a second `off` without
  treasuries: `... inside off off` is the inside's baseline; an eleventh argument
  `on` (or a number of lives, or `inf`) climbs the tower in stages:
  `... 40 kid bold 300 1 0 outside on on on`; a twelfth says who climbs,
  `prince` or `lord`: `... 40 good bold 1500 1 0 outside off on off lord`,
  and `TUNE='{"rocket":{"accel":2500}}'` before it tries other numbers for him). Target for
  a good bold run: 0.8 to 1.5 hits per 100 m in every zone, median height
  not collapsing, falls not above half the deaths.
- Checks before a push: `tools/checks/` (its README says what each does).
  `tools/checks/identity.sh` runs the simulator on fixed seeds against the
  reports in `tools/checks/baseline/`: a change that is only for the eye
  must leave them exactly as they are. `flow.mjs` plays through the
  browser flow and the landing page, `stages.mjs` through a stage's end,
  its door and a fall, `story.mjs` through the opening story, `settings.mjs` through the
  settings' sign and the ways to steer, `shots.mjs outside 20,180,420` takes
  pictures at heights. After any change to the art, `atlas.mjs`: every
  sprite on the art grid, and the art within its budget (it says where
  the size goes).
- Headless browser checks need Playwright (on this machine:
  `/opt/node-tools/node_modules/playwright`, Chromium with
  `--enable-unsafe-swiftshader` for WebGL). Software WebGL is slow, so
  screenshots are reliable but the climb bot is not; use the simulator for
  gameplay numbers.

## iOS shell
- `ios/` wraps `web/` in a native WKWebView app (Swift, UIKit, no
  Capacitor). The project references `../web` as a folder, so the current
  checkout is what runs on the phone. `ios/README.md` has the details and
  the TestFlight steps.
- Phone first, TestFlight later: changes are played on Simon's own iPhone
  ("Simmi") from the checkout, `tools/ios_run.sh [device] [launch args]`
  builds, installs and launches (or Run in Xcode). TestFlight is for a
  first version worth handing out, not for every change.
- The project is generated: edit `ios/project.yml`, run `xcodegen generate`
  in `ios/`, commit both. Version and build number are in
  `ios/Version.xcconfig` (bump the build before every upload).
- The game talks to the shell only through `web/src/platform.js` (storage,
  tilt, haptics, pause, safe area); in a browser every call there is the
  plain web API, so the web version must stay byte-for-byte the same in
  behaviour. Platform workarounds stay in `audio.js`, `input.js`, `main.js`.
- Debug builds take launch arguments `-gameQuery "at=150&dev=1"` (the URL
  helpers above) and `-gameEval "<js>"` (a script after load).

## Conventions
- Logical width 768; the height is 1364 in a 9:16 window and in the
  simulator and follows the screen on phones (`H` in `config.js`, read live;
  `SAFE` keeps the HUD out of the notch and the home indicator; the sign
  screens are laid out for 1364 and centred). World y up, 100 px = 1 m,
  `beat` = 300 px. The picture is drawn at one backing pixel per logical
  pixel on every screen (`RESOLUTION` in `config.js`) and scaled up by
  the screen.
- Drawing goes through the renderer facade `g` (`web/src/gfx/renderer.js`);
  gameplay code never touches PixiJS. Pass `glow` on draw calls for bloom.
  `g.dark(amount)` makes a frame dark and `g.lamp(x, y, r)` lights it.
  A rectangle, a line and a letter are sprites from the one atlas (one
  draw call); a vector shape (`g.path`, `g.circle`) is built again every
  frame, so none in anything that is drawn in numbers.
- What a frame costs matters on the phone (`docs/plans/performance.md`):
  nothing allocated per frame for what there is much of, no text whose
  words change outside the game's font, no new full-screen pass that runs
  all the time.
- Keep kids in mind: hazards telegraphed, no trap without a way out.
- Commit messages describe the change and the measured effect; no model
  names in commits, code or docs.

## Sprite style
The procedural sprites follow `docs/ART.md`, imported here so every
session starts with it (keep it to about a page, it costs context each
time):

@docs/ART.md

## Where we are
The handoff, imported so every session starts with it (keep it to a page):

@docs/STATUS.md
