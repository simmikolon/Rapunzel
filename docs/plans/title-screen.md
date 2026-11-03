# Plan: title screen, countdown start and the name Sir Bouncealot

One branch, `element/title-screen`, four commits: the rename, the
wordmark, the title with the countdown, the docs.

## Why

The game started on a text screen ("RAPUNZEL" in the pixel font, hints,
two buttons) with the prince standing still, and a tap anywhere launched
him at full strength at once. There was no way back to the title and
"try again" dropped straight into the next round. The name Rapunzel is a
trademark minefield for a game; the knight on the pogo stick is ours.

Decisions: the hero is Sir Bouncealot in the game's texts too (game over,
manifest), Rapunzel stays the tale behind the tower in comments and this
document; the drawn logo (`docs/art/title-source.png`) is brought onto
the game's art grid by a small tool so it sits next to the procedural
sprites without looking pasted on; the title shows the game being cute before the first
tap (the prince hops, butterflies, fireflies, light shafts); PLAY starts
a 3-2-1 countdown on the prince's hops rather than a timer, so the start
is soft but never slow; a mode or tower selection comes later and gets a
single entry point now.

## What was built

- Rename: `index.html`, the manifest, the error texts in `main.js`, the
  game-over cause in `hud.js`, the doc headlines. `STORAGE_KEY` is
  `bouncealot.web.v1`; `LEGACY_STORAGE_KEY` is read as a fallback so the
  best height, the effects choice and mute survive.
- `tools/pixelate.py` (Pillow): trims the margins, scales to `--width`
  art pixels with box filtering, hard alpha, median-cut palette of
  `--colors`; writes `web/img/title.png` at one image pixel per art pixel
  (150 x 112). `art/ui.js` loads it at boot (2.5 s timeout, text fallback)
  and scales it up by PX without smoothing into a sprite the atlas packs
  (atlas now 2048 x 3382, under the 4096 of older phones). A first
  procedural wordmark (`art/logo.js`) was replaced by the picture.
- `title.js`: `drawTitle(g, game, t, alpha)` (title picture, best,
  PLAY, hints, effects and tilt buttons on the lawn; `alpha` fades it out
  while the countdown runs) and `drawCount(g, world)` ("3", "2", "1" from
  `world.count`, "GO!" for the first 0.7 s of the round from
  `world.countT`).
- `world.js`: `phase` idle / countdown / play, `count`, `countT`. Before
  `start()` the player updates with a silent input, `collide()` stops
  after the platforms, `events()` is gated. `groundLanding()` sets the
  hop (`HOP_VY` by count, `SHOWOFF_VY` with a flip every 4th to 6th idle
  hop), counts down on the countdown's landings and calls `start()` on
  the last one. `start()` resets `maxY` so the hops do not count as a
  climb. `player.launch(vy)` takes the speed.
- `main.js`: modes title, countdown, playing, paused, gameover.
  `startRound(config)` is the one way in (reset after a game over, the
  `?at=` dev path without a countdown, else `world.countdown()`),
  `beginPlaying()` once the world has started, `toTitle()` back (records
  the height from pause). One `stepWorld(dt)` for the lawn phases and the
  round. Taps and boosts queued during the title or the countdown never
  reach the round's first step; a hidden tab during the countdown returns
  to the title.
- `hud.js`: zones `play`, `again`, `menu`, `pauseMenu`; `fx` and `tilt`
  moved to the lawn; `button()` takes an alpha; TRY AGAIN and MENU on game
  over, MENU on pause.
- `atmosphere.js`: two butterflies with a home at the lawn's flowers
  while the lawn is in view.
- `audio.js`: `count(n)` beats, `hop()` pat, a five-note `start()`.

## Status

Done on the branch. Headless Chrome: title (hops, flip, butterflies),
PLAY by click and by space, countdown with the title fading, GO with
`boost` still 3 in the first step, pause with MENU, game over with TRY
AGAIN and MENU, `?at=150&spawn=squirrel` without a countdown, Esc during
the countdown. Simulator unaffected: 20 good bold runs read the same on
master and the branch (median 423 m, 1.03 hits per 100 m). Tunables:
`HOP_VY`, `SHOWOFF_VY`, `COUNT_MIN_T` in `config.js`.

Open: the mode or tower selection between PLAY and the countdown; the
atlas is a single 2048-wide texture and will need a second page or a
size check once it passes 4096 px.
