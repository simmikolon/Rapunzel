# Sir Bouncealot

Sir Bouncealot is a game heavily inspired by some of the drawings made by my five year old daughter. At her age she has already some incredible drawing skill - at least in my opinion. During the last year she fell in love with Rapunzel. For those who don’t know: Rapunzel is a fairy tale / story of a princess kept in a tower by an evil witch. In order to rescue her a prince tries to climb up that tower using Rapunzel’s hair as a ladder. That prince on his pogo stick is Sir Bouncealot, and the game carries his name; the fairy tale stays the backdrop.

## The game (`web/`)

The game runs in any modern browser, phone or desktop. The picture is 768
logical pixels wide like the original iOS scene and as tall as the screen:
1364 (9:16) in a desktop window, taller on a phone so it fills the screen
edge to edge. There is also a native iOS shell in [`ios/`](ios/README.md).
It is plain JavaScript (ES modules) rendered with WebGL through
[PixiJS](https://pixijs.com) (vendored in `web/vendor/`, MIT): no build
step, nothing to install, nothing to compile.

The original Swift / SpriteKit prototype it grew out of lives on the
[`swift-prototype`](../../tree/swift-prototype) branch. Ideas, decisions
and the roadmap are collected in [`docs/DESIGN.md`](docs/DESIGN.md).

### Run it locally

```sh
# any static file server works; for example:
python3 tools/serve.py        # http://localhost:8000, caching off
# then open http://localhost:8000
```

or `npx serve web`. Opening `index.html` directly from the file system
will not work because ES modules need an HTTP origin.

`python3 tools/serve.py --site` serves the site as it is deployed: the
landing page (`site/`) at <http://localhost:8000> and the game at
<http://localhost:8000/play/>.

### Deploy on Vercel

One Vercel project serves the landing page at `/` and the game at
`/play/`, at <https://www.bouncealot.de>; the Impressum is `site/impressum/`, the
privacy policy `site/datenschutz/`. Nothing is compiled: `vercel.json` runs `tools/build_site.sh`,
which copies `site/` and `web/` into `dist/` (the game under `play/`), and
serves that. `web/` stays the one folder the game lives in, for the iOS
shell and the simulator alike. The landing page draws its pictures with
the game's own art code from `/play/src/`, so it always looks like the
current game; `site/og.png`, the picture link previews show, is made from
`site/dev/og.html`.

1. Import the GitHub repository at <https://vercel.com/new> and keep the
   defaults (framework "Other", root directory `.`); `vercel.json` sets the
   build command and the output directory.
2. Every push to the production branch redeploys; other branches get
   preview URLs.

**Devlog.** Episodes live in `site/devlog/episodes.json`; one command adds
one (it saves the video's picture next to it, so visitors load nothing from
YouTube until they click a video):

```sh
python3 tools/devlog_add.py https://youtu.be/<id> "Episode 1: The tower" "One or two sentences."
python3 tools/devlog_add.py --channel https://www.youtube.com/@<channel>
```

Commit the JSON and the picture: the landing page shows the newest three,
`/devlog/` all of them, and the footer gets its Devlog link. Until the first
episode the landing page says the devlog is on its way.

The game's URL helpers work on the deployed site as `/play/?at=150`;
`/?at=150` (and the other helpers) forwards there. A home screen install
made before the landing page existed opens it and is sent on to the game.

Or from the command line: `npx vercel` in the repo root (`npx vercel --prod`
for production). Tilt steering needs HTTPS, which Vercel provides. The game
ships a web app manifest and icons, so on a phone it can be added to the
home screen and runs full-screen in portrait.

### Run it on an iPhone

`ios/` is a small native shell (Swift, one `WKWebView`) around the same
`web/` folder: open `ios/SirBouncealot.xcodeproj` in Xcode and Run on your
phone. It loads the game from the app bundle, steers by CoreMotion without
a permission prompt, keeps the best height and the settings in
`UserDefaults`, adds haptics, tells the opening story at every launch, and
sounds in silent mode unless the settings say otherwise. See
[`ios/README.md`](ios/README.md) for the dev launch arguments and the
TestFlight steps.

### Controls

| | Steer | Boost | Pause |
|---|---|---|---|
| Keyboard | ← → or A D | Space, ↑, W or click | P / Esc |
| Touch: TAP | hold the left or right half of the screen | the flame button | ⏸ |
| Touch: SWIPE | slide a finger from where it was set down | a tap, or a second finger | ⏸ |
| Touch: TILT | lean the phone (three sensitivities) | tap anywhere | ⏸ |

PLAY on the title screen (or a tap anywhere, or space) starts a short
countdown on the knight's hops; MENU on the pause and game-over screens
leads back to the title. SETTINGS on the title opens a sign with how a
touch steers, the two screen effects (a glow and scan lines, both off to
begin with; `F` goes through them), sound, and in the iOS app sound in
silent mode and haptics. `M` toggles sound. The best heights and the
settings are kept in `localStorage`. Development helpers in the URL: `?at=150` starts at 150 m,
`?spawn=squirrel` puts one on the next branch, `?spawn=star` (or `cloak`,
`spring`, `magnet`, `feather`) hangs that power-up above the knight,
`?dev=1` shows altitude and zone.

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
  lunge when he passes underneath; squirrels sit on branches and dash at
  him when he comes close; the witch arrives on her broom from a marked
  side, crosses above him and dives, twice near the top. Crows, spiders and
  squirrels can be stomped with the pogo (or punched through with a boost);
  the witch must be dodged or deflected with a boost. In the deep forest
  bats sleep under the branches and swoop when woken; and now and then a
  flock of starlings streams across between two floors, which only a
  boost gets through (it turns him back, it does not hurt).
* **Hearts and a boost meter**: three hearts, invulnerability flashing after
  a hit; three boost charges refilled by landings and floating lanterns.
* **Pickups**: sun drops, lanterns (boost refill) and hearts.
* **Power-ups** (new in the browser version): five that float in soap
  bubbles and last a few seconds, one at a time: a shooting star
  (invincible, in a rainbow), a cloak (invisible to everything with
  eyes), a golden spring (stronger bounces and boosts, with somersaults),
  a sun magnet (suns, lanterns and hearts fly to him) and a stork's
  feather (he comes down slowly).
* **Inside the tower**: a second place to climb. The title sign picks
  where a round starts, and gates (doors in the tower's wall, between
  120 and 400 m) lead from one to the other. Stone pillars instead of
  trees, windows through which the forest, the sky and Rapunzel's braid
  go by, stone ledges, chandeliers and a bell on a long chain, scaffold
  boards, galleries, stairs; bats, guards, a ghost with a candle, spider
  webs that hold; four floors (hall, guard rooms, library, belfry);
  torches, candles and the windows' light in a dim room. Behind a
  golden door lies the witch's treasury: a room with a floor, full of
  suns, chests and pieces of the hoard to take, and a second door out
  of it 40 m higher.
  `web/src/interior.js` paints it, `web/src/places.js` says what differs
  between the places.
* **The tower in stages**: the title's first choice. The climb is a row
  of stretches, each with a look of its own (the rose wall, the deep
  forest, the masons' site, the dark rooms, the library ...), a floor at
  its end and a door that leads to the next, outside and inside by turns.
  Three hearts within a stage and three lives on top: a fall goes on from
  the last door. `web/src/stages.js` says what each stage is.
* **The opening story**: before the title, told in the game's own world:
  Rapunzel at her window at the top of the tower at night, the witch on
  her broom, "Rescue me!", and the braid let down, the picture following
  its end all the way to the lawn. `web/src/story.js`.
* **Weather**: rain, snow that lies on the branches, the golden hour, and
  storms: gusts that come as white curls and carry the prince sideways,
  the colours half gone, lightning that turns the picture black and white
  for an instant. In stages a storm draws up inside a stage now and then;
  in the endless tower storms keep their own time. Around Christmas the
  lawn is snowed in. `web/src/weather.js`.
* **FX**: squash and stretch, landing dust / leaves / petals, crumble
  debris, boost flames, feathers, screen shake, a swaying braid that moves
  the ribbons (harder with altitude), sky and lighting keyed to the zones
  (forest floor → deep forest with mist, falling leaves, light shafts and
  string lights between the trunks → dawn at the windows → open sky →
  sunset → starry night), toasts for milestones.
* **Audio**: every sound is synthesized with WebAudio, so there are no
  audio files; mute is remembered.
* **Shaders**: a glow on everything that shines (lanterns, sun drops,
  fireflies, flames, stars, the moon), scan lines, and the storm's mood.
  The first two are settings and off to begin with. See below.
* **Screens**: a ride down the tower on load, then the title, pause and
  game over on a wooden sign lowered in on ropes; best height saved.

### Art

The original texture atlases were never committed (they lived in a
`Game Assets` folder next to the repo), so all sprites and tiles are drawn
procedurally in `web/src/art/` in the chunky 4-px style of the prototype's
background mock-up, kept as `web/dev/bg.png`, using its palette. The
prince's colors and his hobby-horse pogo stick follow the original app
icon, which also serves as the web icon (`web/icons/`). `web/dev/sprites.html` shows every generated sprite with its
anchor. The pixel font, Press Start 2P (SIL Open Font License, see
`web/fonts/OFL.txt`), is served from `web/fonts/`, so the game has no
runtime dependency on a font CDN. To use hand-drawn art instead, replace the sprite objects returned
by the `build*` functions in `web/src/art/index.js` with
`{ canvas: <image>, w, h, ax, ay }` entries of the same anchors; the atlas
builder picks them up unchanged.

### Rendering and effects (WebGL)

Drawing goes through a small immediate-mode facade over PixiJS
(`web/src/gfx/renderer.js`): the game still draws everything every frame
with calls like `g.blit(sprite, x, y)`, `g.rect(...)` or `g.text(...)`, and
the facade hands out pooled PixiJS sprites, vector shapes and text objects in
call order (a rectangle and a line are sprites too, and text in the game's
font is put together from letter sheets, so that almost everything is one
draw call) (every object gets an increasing `zIndex`, so draw order is
z-order even when the three kinds interleave). Gameplay code never touches
PixiJS directly. The stage is a stack of layers:

| layer | content |
|---|---|
| `bg` | sky gradient, stars / moon / clouds, distant forest, tower, braid, lawn, trunks |
| `world` | platforms, pickups, enemies, the prince, particles, fireflies |
| `light` | altitude lighting (multiply blend) and the vignette |
| `glow` | emissive copies of glowing things, blurred by the bloom filter and added over the scene |
| `hud`, `overlay` | score, hearts, boost meter, buttons, toasts; pause / game over / notices |

Everything sits in a root container that carries the passes over the whole
frame: the scan lines, and the weather's mood while there is a storm.

* **Bloom** (`web/src/gfx/filters.js`, `BloomFilter`) is selective: a draw
  call with a `glow` option is drawn a second time into the `glow` layer,
  which is rendered at half resolution, blurred with a separable 9-tap
  Gaussian (two iterations) and composited additively. There is no luminance
  threshold, so a bright daytime sky does not haze over.
* **Scan lines** (`CRTFilter`) darken every other art-pixel row and add a
  faint phosphor triad. The pass can also bend the picture into a curved
  tube with colour fringes, shaded corners and flicker; those are set to
  nothing (`FX.crt` in `web/src/config.js`).
* **The mood** (`MoodFilter`) takes the colours half out of the picture
  under a storm and turns it black and white for the instant of lightning.
  It is in the chain only while a storm is.
* **Two switches**, the glow and the scan lines, both off to begin with: on
  the settings' sign, with `F`, or `?fx=off|bloom|lines|full` for a visit.
* **Art** stays procedural: at start-up `web/src/gfx/atlas.js` packs every
  sprite into one texture at art size (one texel to an art pixel, 1024
  wide) with nearest-neighbour sampling, so the whole scene batches into a
  handful of draw calls and the chunky pixels stay crisp. A sprite therefore
  has to be on the art grid; `tools/checks/atlas.mjs` names one that is not.
  Once it is packed the sprites' own canvases are given back (55 MB);
  `web/dev/sprites.html`, the landing page and the social pictures build
  the art themselves and keep theirs.
* The logical resolution is 768 wide and as tall as the screen's shape
  asks for. The picture is drawn at one backing pixel per logical pixel on
  every screen (`RESOLUTION` in `web/src/config.js`) and scaled up by the
  screen: on a phone that is a third of the pixels to fill, and it shows no
  difference. `docs/plans/performance.md` has the measurements.
* Browsers without WebGL get a short message instead of the game. The
  vendored `web/vendor/pixi.min.mjs` is the unmodified ESM bundle from the
  `pixi.js` npm package (sourcemap pointer stripped); see
  `web/vendor/README.md`.

### Testing and analysis

`web/dev/sprites.html` shows every generated sprite. `web/dev/sim.html`
runs the game logic headlessly with a scripted player; drive it with
`node tools/analyze.mjs <url> <runs> <kid|good> <bold|cautious>` to get
heights, deaths and hits per 100 m (see `docs/ANALYSIS-phase1.md`). Runs
are reproducible: the same seed gives the same round, so builds are
compared on paired seeds. `tools/checks/` holds the checks run before a
push (its README says what each does): the simulator's reports against
kept ones, and a headless browser playing through the title, a stage's
end, the opening story, the settings and the landing page. `?perf=1` puts
a frame-time readout on the screen.

### Tuning

All gameplay numbers live in `web/src/config.js`, with the glow's and the
scan lines' amounts in its `FX` block; difficulty tiers are at the top of
`web/src/level.js`; the stages and their order in `web/src/stages.js`; the
weather's numbers at the top of `web/src/weather.js`; sky and lighting
keyframes are in `web/src/background.js`. Which things glow, and how much, is the `glow`
option on their draw calls (pickups, particles, background, HUD).
