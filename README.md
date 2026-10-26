# Rapunzel

Rapunzel is a game heavily inspired by some of the drawings made by my five year old daughter. At her age she has already some incredible drawing skill - at least in my opinion. During the last year she fell in love with Rapunzel. For those who don’t know. Rapunzel is a fairy tale / story of a princess kept in a tower by an evil queen. In order to rescue her a prince tries to climb up that tower using Rapunzels hair as a ladder.

## The game (`web/`)

The game runs in any modern browser, phone or desktop, with the same
portrait aspect ratio as the original iOS scene (768 x 1364, about 9:16).
It is plain JavaScript (ES modules) on a 2D canvas: no build step, no
dependencies, nothing to install.

The original Swift / SpriteKit prototype it grew out of lives on the
[`swift-prototype`](../../tree/swift-prototype) branch. Ideas, decisions
and the roadmap are collected in [`docs/DESIGN.md`](docs/DESIGN.md).

### Run it locally

```sh
# any static file server works; for example:
python3 -m http.server 8000 --directory web
# then open http://localhost:8000
```

or `npx serve web`. Opening `index.html` directly from the file system
will not work because ES modules need an HTTP origin.

### Deploy on Vercel

The repo is a static site with no build step. `vercel.json` at the root
points Vercel's output directory at `web/`, so nothing needs configuring:

1. Import the GitHub repository at <https://vercel.com/new> and keep the
   defaults (framework "Other", root directory `.`, no build command).
2. Every push to the production branch redeploys; other branches get
   preview URLs.

Or from the command line: `npx vercel` in the repo root (`npx vercel --prod`
for production). Tilt steering needs HTTPS, which Vercel provides. The game
ships a web app manifest and icons, so on a phone it can be added to the
home screen and runs full-screen in portrait.

### Controls

| | Steer | Boost | Pause |
|---|---|---|---|
| Keyboard | ← → or A D | Space, ↑, W or click | P / Esc |
| Touch | hold the left or right half of the screen | the flame button | ⏸ |
| Tilt | tilt the phone (enable on the title screen) | tap anywhere | ⏸ |

`M` toggles sound. The best height is kept in `localStorage`.

### What was ported from the prototype

The web version re-implements the SpriteKit prototype's ideas with a small
custom engine instead of SpriteKit physics and GameplayKit:

* **The prince on a pogo stick** with the same state machine: standing,
  jumping, falling, bouncing down/up, boost, bottom collision (bonk), plus
  new hurt and dead states. Screen wrap-around, the fall speed cap, the
  tap-to-boost input and the 104 x 232 sprite size are the original's.
* **Platforms**: branches growing from the two trees, ribbons tied to
  Rapunzel's braid and (new) plank swings hung between the trees. The
  original `breakable` and `bottomCollidable` flags became dry branches
  that crumble after one bounce and swings that bonk you from below.
* **Beat / pattern level system**: rows are generated ahead of the camera
  from platform slots, like `RPPatternControllerComponent` did with
  300-pt beats, but with altitude-based difficulty (gaps, crumbling
  branches, enemies, pickups) and a reachability guarantee.
* **Camera** that follows upward only, with smoothing, and the layered
  parallax scene like the original's layer entities: far sky, distant
  forest, then the tower layer (bricks, windows, Rapunzel's braid and the
  ribbons tied to it), then the tree layer in front (trunks, branches,
  swings) which the prince shares, fireflies (`RPParticleLayerEntity`),
  vignette (`SSVignette.fsh`). Ribbons scroll with the tower layer, so
  like the original their contact position is converted into the prince's
  plane each frame; the generator places them for the camera height at
  arrival and caps branch-to-ribbon gaps so they stay reachable.

### What is new

* **Enemies** (the prototype had none): crows patrol between the trees and
  start homing in on the prince higher up; spiders dangle from branches and
  lunge when he passes underneath; the witch arrives on her broom from a
  marked side, crosses above him and dives, twice near the top. Crows and
  spiders can be stomped with the pogo; the witch must be dodged.
* **Hearts and a boost meter**: three hearts, invulnerability flashing after
  a hit; three boost charges refilled by landings and floating lanterns.
* **Pickups**: sun drops, lanterns (boost refill) and hearts.
* **FX**: squash and stretch, landing dust / leaves / petals, crumble
  debris, boost flames, feathers, screen shake, a swaying braid that moves
  the ribbons (harder with altitude), altitude-graded sky and lighting
  (forest → open sky → sunset → starry night), toasts for milestones.
* **Audio**: every sound is synthesized with WebAudio, so there are no
  audio files; mute is remembered.
* **Screens**: title with controls, pause, game over with best height.

### Art

The original texture atlases were never committed (they lived in a
`Game Assets` folder next to the repo), so all sprites and tiles are drawn
procedurally in `web/src/art/` in the chunky 4-px style of the prototype's
background mock-up, kept as `web/dev/bg.png`, using its palette. The
prince's colors and his hobby-horse pogo stick follow the original app
icon, which also serves as the web icon (`web/icons/`). `web/dev/sprites.html` shows every generated sprite with its
anchor. To use hand-drawn art instead, replace the sprite objects returned
by the `build*` functions in `web/src/art/index.js` with
`{ canvas: <image>, w, h, ax, ay }` entries of the same anchors.

### Testing and analysis

`web/dev/sprites.html` shows every generated sprite. `web/dev/sim.html`
runs the game logic headlessly with a scripted player; drive it with
`node tools/analyze.mjs <url> <runs> <kid|good> <bold|cautious>` to get
heights, deaths and hits per 100 m (see `docs/ANALYSIS-phase1.md`).

### Tuning

All gameplay numbers live in `web/src/config.js`; difficulty tiers are at
the top of `web/src/level.js`; sky and lighting keyframes are in
`web/src/background.js`.
