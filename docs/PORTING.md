# Porting guide: from the browser to the app stores

How the browser game in `web/` could reach iOS (preferred) and Android,
which routes we considered, and what to keep doing now so a port stays
cheap later. Like `DESIGN.md`, this guides and does not restrict.

## Summary

| Route | Effort | Platforms | Verdict |
|---|---|---|---|
| Native shell around `web/` (Capacitor or a plain `WKWebView`) | days | iOS + Android | **first step** for TestFlight and the stores |
| Expo / React Native | a rewrite | iOS + Android | **not recommended** |
| Native Swift + SpriteKit | weeks | iOS only | **later**, once the gameplay has settled |

Order: keep building in the browser (the endless game is the sandbox),
ship through a native shell when the first tower is fun, and port to
Swift only when there is a concrete reason (performance on old devices,
deep iOS integration, a product decision for "truly native").

## Why the code base ports well

- **Own physics.** `player.js`, `world.js` and `level.js` use no physics
  engine: gravity, bounce, bonk, screen wrap and the fall cap are plain
  arithmetic on the constants in `config.js`. They translate almost line
  by line to Swift.
- **A narrow drawing interface.** All drawing goes through the renderer
  facade `g` (`web/src/gfx/renderer.js`, about 420 lines); gameplay code
  never touches PixiJS. A port replaces this one layer.
- **Procedural art.** Sprites in `web/src/art/` are drawn pixel by pixel
  into canvases and packed into one atlas (`gfx/atlas.js`). They can be
  exported once as PNGs (`web/dev/sprites.html` already shows the sheet)
  or the draw functions can be translated to CoreGraphics.
- **Synthesized audio.** `audio.js` generates every sound with WebAudio,
  there are no audio files to license or convert.
- **Same frame as the original.** The logical resolution 768 x 1364 is
  the original SpriteKit scene size; the prototype lives on the
  `swift-prototype` branch.

Size at the time of writing: about 6,400 lines of JavaScript.

## Route 1: native shell (recommended first)

Wrap `web/` unchanged in Capacitor (iOS and Android) or a hand-written
`WKWebView` app (iOS only).

Gains:
- One code base; the simulator, Vercel previews and the element workflow
  stay as they are.
- Native plugins fix the browser workarounds: the silent-WAV trick that
  gets Web Audio past the iOS ring/silent switch, the motion permission
  prompt and the HTTPS requirement for tilt.
- Access to Game Center, in-app purchases (the planned store), haptics,
  and native storage instead of `localStorage`.

Things to check:
- Performance on the oldest device we want to support, with `?fx=full`
  and `?fx=off`.
- Load the game from the app bundle, not from Vercel, so it works offline
  and passes review (Apple guideline 4.2 asks for an app experience, not
  a wrapped website; a full-screen game with offline play qualifies).
- Safe areas (notch, home indicator) around the 9:16 canvas.
- Pause on app background and resume (audio context, timers).

## Route 2: Expo / React Native (not recommended)

React Native is built for app UIs, not 60 fps game loops. The game would
either run in a WebView anyway (then Capacitor is the leaner shell) or be
rewritten on `expo-gl` / `react-native-skia`, a full rewrite without the
benefits of native Swift. The extra layer buys nothing for this game.

## Route 3: Swift + SpriteKit (later)

### Mapping

| Web | iOS |
|---|---|
| Game loop in `main.js` | `SKScene.update(_:)` splitting each frame into equal sub-steps of at most 1/120 s, as `main.js` does |
| Physics and gameplay (`player.js`, `world.js`, `level.js`, `enemies.js`, ...) | Swift structs/classes, same constants; **no** `SKPhysicsBody`, it would change the feel |
| Renderer facade `g` (`blit`, `rect`, `box`, `halo`, `puff`, `beam`, `sky`, `lighting`, `vignette`, `line`, `circle`, `path`, `text`) | pooled `SKSpriteNode` / `SKShapeNode` / `SKLabelNode` with increasing `zPosition`, or a retained node tree per entity |
| Layers `bg`, `world`, `light`, `glow`, `hud`, `overlay` | one `SKNode` per layer; HUD attached to the `SKCameraNode` |
| Sprite atlas (`gfx/atlas.js`) | `SKTextureAtlas` from exported PNGs, `filteringMode = .nearest` |
| Bloom and CRT (`gfx/filters.js`, GLSL) | `SKEffectNode` with CoreImage filters, or `SKShader`; bloom is the hardest single piece |
| WebAudio synth (`audio.js`) | `AVAudioEngine` with `AVAudioSourceNode` oscillators and envelopes |
| Tilt (`input.js`, `DeviceOrientationEvent`) | CoreMotion (`CMMotionManager`), same dead zone and full-tilt angle |
| Touch steering and tap to boost | `touchesBegan` / `touchesMoved` on the scene |
| `localStorage` (best score, fx preset, mute) | `UserDefaults`, later Game Center leaderboards |
| Seeded `RNG` (`util.js`) | the same algorithm in Swift, so seeds produce the same towers |

### Suggested order

1. Constants and level data (`config.js`, `ZONES`) as JSON, read by both.
2. Player state machine and physics, verified against the web version
   with identical seeds and inputs.
3. Level generation with the reachability guarantee.
4. Rendering: sprites first, then lighting, sky and vignette, bloom last.
5. Audio, input, persistence, then store features.

### Costs to plan for

- Two code bases drift apart. Every tuning change has to be made twice
  unless the shared data (step 1) carries it.
- The simulator (`web/dev/sim.js`, `tools/analyze.mjs`) is JavaScript.
  Either keep tuning in the browser and treat the Swift game as a player
  of the same data, or port the simulator as a headless Swift target.
- SpriteKit gets few new features from Apple, but it is stable and a
  good fit for a 2D pixel-art game. Metal directly is the fallback if
  SpriteKit's effects are not enough.

## What to keep doing now

- Gameplay code never touches PixiJS; everything visual goes through `g`.
- Tunables stay plain data (`config.js`, `ZONES`), no logic mixed in.
- Randomness only through the seeded `RNG`, so runs are reproducible on
  any platform.
- Platform workarounds (iOS audio unlock, tilt permission) stay inside
  `audio.js` and `input.js`.
- Later: an export of the sprite atlas as PNG files from
  `web/dev/sprites.html`.
