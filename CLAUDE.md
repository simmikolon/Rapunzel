# Working on Rapunzel

Browser game (plain ES modules, WebGL via a vendored PixiJS, no build
step) in `web/`. The design document `docs/DESIGN.md` is the guide for
what we build and why; `docs/ANALYSIS-phase1.md` shows how we measure.

## How we work
- The endless game is the sandbox: every element (enemy, platform, trap,
  effect, mechanic) is built and tuned there first; levels come later.
- One short branch per element (`element/<name>`), merged into `master`
  when it is fun. `master` deploys to Vercel; branches get preview URLs.
- An element is a module: a spawn rule in `web/src/level.js` (tier chance
  x pacing x zone multiplier in `ZONES`), its art in `web/src/art/`, its
  sound in `web/src/audio.js`, and either bot support in `web/dev/sim.js`
  or a note that it is purely visual.
- "Done" means: in the game, in its zone, in the simulator, one line in
  `docs/DESIGN.md` (status mark plus decision log).

## Run and test
- Serve: `python3 -m http.server 8000 --directory web` (or `http-server web`).
- Dev helpers: `?at=150` starts at 150 m, `?spawn=squirrel` puts one on the
  next branch, `?spawn=storm` turns the next cloud into a storm cloud,
  `?len=stub|short|long` makes every branch that class, `?dev=1` shows
  altitude and zone, `?fx=off|bloom|full`.
- Sprite sheet: `web/dev/sprites.html`.
- Simulator: `node tools/analyze.mjs http://localhost:8000/dev/sim.html 40 good bold`
  (also `kid`, `cautious`; then `<cap> <seedBase> <startM>`, e.g.
  `... 40 good bold 1100 100 450` measures the sky from 450 m). Target for
  a good bold run: 0.8 to 1.5 hits per 100 m in every zone, median height
  not collapsing, falls not above half the deaths.
- Headless browser checks need Playwright (on this machine:
  `/opt/node-tools/node_modules/playwright`, Chromium with
  `--enable-unsafe-swiftshader` for WebGL). Software WebGL is slow, so
  screenshots are reliable but the climb bot is not; use the simulator for
  gameplay numbers.

## Conventions
- Logical resolution 768 x 1364, world y up, 100 px = 1 m, `beat` = 300 px.
- Drawing goes through the renderer facade `g` (`web/src/gfx/renderer.js`);
  gameplay code never touches PixiJS. Pass `glow` on draw calls for bloom.
- Keep kids in mind: hazards telegraphed, no trap without a way out.
- Commit messages describe the change and the measured effect; no model
  names in commits, code or docs.
