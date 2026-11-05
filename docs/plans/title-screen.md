# Plan: title screen, countdown start and the name Sir Bouncealot

One branch, `element/title-screen`: the rename, the wordmark, the title
with the countdown, the docs; then the menus on a wooden sign and the
ride down on load.

## Why

The game started on a text screen ("RAPUNZEL" in the pixel font, hints,
two buttons) with the prince standing still, and a tap anywhere launched
him at full strength at once. There was no way back to the title and
"try again" dropped straight into the next round. The name Rapunzel is a
trademark minefield for a game; the knight on the pogo stick is ours.

Decisions: the hero is Sir Bouncealot in the game's texts too (game over,
manifest), Rapunzel stays the tale behind the tower in comments and this
document; the title is the procedural pixel wordmark (a drawn logo was
tried through `tools/pixelate.py` and read worse at 150 art px; the tool
and the source in `docs/art` stay for a picture drawn for the grid); the
title shows the game being cute before the first tap (the prince hops,
butterflies, fireflies, light shafts); PLAY starts a 3-2-1 countdown on
the prince's hops rather than a timer, so the start is soft but never
slow; a mode or tower selection comes later and gets a single entry point
now. Second round: text straight on the scene looked cheap, so every menu
hangs on a wooden sign (warm, fits the lawn and the tree, light text reads
on it) that is lowered in on ropes and pulled up for the round; the game
opens with a ride down the tower to the lawn so the first thing seen is
the climb ahead.

## What was built

- Rename: `index.html`, the manifest, the error texts in `main.js`, the
  game-over cause in `hud.js`, the doc headlines. `STORAGE_KEY` is
  `bouncealot.web.v1`; `LEGACY_STORAGE_KEY` is read as a fallback so the
  best height, the effects choice and mute survive.
- `art/logo.js`: a 5 x 7 glyph set on the art grid, bold strokes, bevel,
  outline, drop shadow; one sprite per letter of BOUNCEALOT so the title
  can hop them in a wave, SIR with a crown in ribbon pink.
- `sign.js`: `drawSign(g, art, x, y, w, h, o)` draws a sign of any size
  with rectangles on the 4-px grid (outline, bark band with a bevel and
  streaks, recess, boards of 72 px with grain, knots and nails, two
  twisted ropes from the top of the screen with knots) and blits the
  trimmings from `art/sign.js` (vines over two corners, a bow on the
  right rope). `signHeight(n)` gives the height for n boards;
  `signTravel(S)` how far it moves to come in from above the screen.
  `hud.js` holds the three signs (`SIGNS.title`, `pause`, `over`), the
  zones on them and `signButton()` (recessed, gold rim for the main one).
- `title.js`: `drawTitle(g, game, t, alpha, dy)` draws the title's sign
  (wordmark, best, PLAY, hints, effects / sound / tilt in the bottom row)
  moved by `dy`; `drawCount(g, world)` ("3", "2", "1" from `world.count`,
  "GO!" for the first 0.7 s of the round from `world.countT`).
- `world.js`: `phase` idle / countdown / play, `count`, `countT`. Before
  `start()` the player updates with a silent input, `collide()` stops
  after the platforms, `events()` is gated. `groundLanding()` sets the
  hop (`HOP_VY` by count, `SHOWOFF_VY` with a flip every 4th to 6th idle
  hop), counts down on the countdown's landings and calls `start()` on
  the last one. `start()` resets `maxY` so the hops do not count as a
  climb. `player.launch(vy)` takes the speed.
- `main.js`: modes intro, title, countdown, playing, paused, gameover.
  The intro (`startIntro`, `introLift`, `skipIntro`) draws the world with
  the camera lifted by `INTRO_FROM` easing to 0 over `INTRO_T` (the lift
  is applied around `world.draw()` only; the rows it passes are generated
  once), a tap eases the rest in half a second; `?at=` and `?spawn=` go
  straight to the title. The title lowers its sign over 0.7 s
  (`easeOutBack` with a small overshoot), the countdown pulls it up over
  0.55 s. `startRound(config)` is the one way in (reset after a game
  over, the `?at=` dev path without a countdown, else
  `world.countdown()`), `beginPlaying()` once the world has started,
  `toTitle()` back (records the height from pause). One `stepWorld(dt)`
  for the lawn phases and the round. Taps and boosts queued during the
  intro, the title or the countdown never reach the round's first step.
- `hud.js`: pause and game over on signs (the game over's is lowered in
  over 0.7 s, its buttons wake after that); TRY AGAIN and MENU on game
  over, MENU on pause; `button()` takes an alpha.
- `atmosphere.js`: two butterflies with a home at the lawn's flowers
  while the lawn is in view.
- `audio.js`: `count(n)` beats, `hop()` pat, a five-note `start()`.

## Status

Done on the branch. Headless Chrome: the ride down (branches, ribbons,
windows passing), a tap shortening it, the sign lowered in, the sound
button in its bottom row toggling mute, PLAY by click and by space, the
sign pulled up with "3" showing, GO with `boost` still 3 in the first
step, pause with MENU on its sign, game over with TRY AGAIN and MENU on
its sign, `?at=150&spawn=squirrel` without a ride or a countdown, Esc
during the countdown. Simulator unaffected: 20 good bold runs read the
same on master and the branch (median 423 m, 1.03 hits per 100 m); after
the sign, 10 runs at 0.99. Tunables: `HOP_VY`, `SHOWOFF_VY`,
`COUNT_MIN_T`, `INTRO_FROM`, `INTRO_T` in `config.js`; the sign's
geometry in `hud.js` (`SIGNS`) and `sign.js` (`BOARD`, `FRAME`,
`ROPE_IN`).

Open: the mode or tower selection between PLAY and the countdown (more
boards on the title's sign, or a second sign); the atlas is a single
2048-wide texture and will need a second page or a size check once it
passes 4096 px.
