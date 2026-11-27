# Plan: a steady 60 on the phone

Where we stand (2026-11-26): in the iOS shell (a `WKWebView` around
`web/`) on an iPhone Air the game does not hold 60 frames a second. It
does not stutter all the time, but in single moments, and most where a
lot is going on. The low power mode was off. The screen has 120 Hz; a
web view draws 60 of them, so a frame that comes late is seen at once.

The question behind it is whether the game has to be written again for
the phone (SpriteKit, or an engine for iOS and Android). That costs
weeks and the workshop we have (one code base, the simulator, previews).
So first: find out what the stutter is, and take it out where it is
ours. `docs/PORTING.md` (branch `docs/porting`) has the routes.

## The aim

On the iPhone Air, a round in stages up to 300 m, effects off:
no frame longer than 25 ms, 99 of 100 frames within 20 ms, fewer than
one frame in 200 late. Measured with `?perf=1`, not felt.

## How we go about it

One thing at a time: measure, change, measure again on the same device.
A step that does not show in the numbers is taken out again.

`?perf=1` (`web/src/perf.js`) shows on the device: frames a second, the
time between frames (mean, 99th percentile, longest), the share of late
frames, the time in the game's step (`upd`) and in its drawing (`draw`,
the CPU's part), the backing store's size, sprites and texts per frame
and how many texts were new (`new`: each is painted and uploaded
again), platforms, enemies, pickups, and the longest frame with what
was going on. The bars are the last 120 frames; the line is 60 a
second. A tap on the panel's numbers takes the next drawing
resolution (`?res=1.5` sets one); a tap on its graph scales the
picture up with hard pixels or smoothly (`?px=hard`). On the phone:
`tools/ios_run.sh Simmi -gameQuery "perf=1"`.

What a reading says:
- `draw` and the late frames fall with the resolution: too many pixels.
- `upd` is high or jumps: the game's own step (allocation, generation).
- `draw` is low and frames are late all the same: the GPU or the
  compositor, not our code on the CPU; resolution and texture size are
  what is left to us.
- the longest frames have `new txt` above 0: text.

## Readings

### 2026-11-26, iPhone Air, the screen's own resolution (1260 x 2736, x1.64)

One round in stages to 376 m, read from the panel:
- the title: 60.2 frames a second; `upd` 0.3 ms, `draw` 5.5 ms (longest
  13) for 989 sprites.
- the round, 5906 frames: 6.1 % longer than 20 ms, 1.5 % longer than
  25 ms, 2 longer than 50 ms, the longest 75 ms (at 0 m: 8 ms of it
  ours, 10 texts new). `upd` 0.3 ms (longest 7), `draw` 4.1 ms (longest
  61). Most sprites in a frame: 1584.
- at 311 m in the deep forest, 985 sprites: 55 frames a second, 18.2 ms
  a frame, while `draw` was 4.9 ms (longest 13).
- by eye (Simon): smooth most of the time; small hitches "when the
  screen scrolls and loads", now and then a moment like a dropout.

What it says:
- The game's step is nothing (0.3 ms). Allocation and the building of
  rows (suspects 4 and 6) are not what is seen; its longest frame is
  7 ms.
- Our drawing on the CPU is a quarter of a frame. The frames that come
  late are late outside it, or in the few frames in which `draw` jumps
  to 61 ms.
- Text fits the hitches: the height in the HUD has a new word with
  every metre climbed, about four times a second in a climb and never
  while he stands, which is "when the screen scrolls"; four frames in
  sixty is the 6 % of late frames; and the longest frame had 10 texts
  new, with a `draw` of 61 ms, some 6 ms a text.
- The deep forest holds 55 with a `draw` of 5 ms: there the GPU is
  what is late (the pixels), which is suspect 1. Rounds at 1.5 and at 1
  have not been read yet.

### Step taken: the letters come from sheets (suspect 2)

Texts in the game's own font are no longer painted by the browser word
by word. Each size has a sheet with its letters, painted once at the
backing store's resolution before the title; a text is put together
from them, and a new word is new positions, not a new picture
(`_sheet`, `_lettersAt` in `web/src/gfx/renderer.js`).
- Sheets ahead: 12, 14, 16, 18, 22 and 30 px with the outline, and
  40 px with only what a height is written with. A size in between
  takes the next bigger sheet, made smaller (a toast is as big as its
  length allows). Each sheet is one square picture as small as holds
  its letters: 17 MB in all at the Air's resolution, 9 MB at 1; making
  them takes some 35 ms, once. (As the engine makes them by default,
  one page of 1024 x 1024 or more per sheet and every size the game
  ever asks for, it was well over 100 MB.)
- Still painted by the browser: what has its own colours (the signs),
  what wraps, other fonts, and the countdown's big digits. None of it
  changes while he climbs.
- The sheets follow the resolution: made again when it has changed
  and stood still for 20 frames (a tap on the panel, a turned phone, a
  window being dragged).
- The look is the same: a text is where it was within a pixel
  (measured for every size and alignment; the sheets count the
  outline's width differently, which `SHEET_FIT` puts back). One
  thing differs: the browser joined "fl" and "fi" into one letter, the
  sheets do not, as the pixel font means it.
- Measured here (headless, software drawing, so only the CPU's part and
  no GPU to wait for): with the height counting up, texts painted anew
  75 → 0; the first frame of a round 13 to 18 ms instead of 18 to 59
  (five rounds each); the drawing's time otherwise the same within
  what the software renderer scatters (1.2 to 1.6 ms either way). What
  the sheets buy on the phone, where a new text is handed to the GPU,
  this cannot show.
- To read on the phone: a round with the sheets and one with
  `?letters=0` (painted as before), both at the screen's resolution:
  `>20ms` and `draw`'s longest say whether the text was it.

### 2026-11-26, later: the sheets and the resolutions, by eye

Simon played the variants on the Air (no panel pictures this time):
the hard stutter is gone with the letter sheets; at 1 it ran best and
smoothest; and between the screen's resolution (1.64) and 1 he saw no
difference in the picture, whichever step the panel was on. His
question: can it be smaller still before it shows?

### Step taken: smaller steps to try, and hard pixels

The panel's steps now go on to 0.75 and 0.5 (three and two backing
pixels to an art pixel; 21 % and 9 % of the screen's pixels, where 1
is 37 %), and a tap on the panel's graph (or `?px=hard`) has the
screen scale the picture up with hard pixels instead of smoothly.

What the same frame looks like here, on a screen shaped like the
Air's (pictures of each step, enlarged):
- Scaled up smoothly, as now: 1 is a touch softer than the screen's
  own, 0.75 is soft, 0.5 is blurred. That is the scaling, not the art.
- With hard pixels the art stays as sharp at 0.5 as at 1 (it is drawn
  on a grid twice as coarse still). What gives first is everything
  that is finer than an art pixel: the letters (a 12 px text is six
  pixels high at 0.5: legible, coarse), the thin vines, soft glows'
  edges. And 384 pixels do not go evenly into the screen's 1260, so
  an art pixel is six or seven screen pixels wide by turns; whether
  that shows as a shimmer in a slow scroll, the phone has to say.
- Smaller only helps while the pixels are what is late. A web view
  shows 60 frames a second at most; once a round has no late frames,
  a smaller picture is cooler and easier on the battery, not smoother.
  The panel's `>20ms` after a round at each step says where that is.

If below 1 is wanted for good, the way to keep the HUD sharp is to
draw the world small and the HUD and the letters at the screen's
resolution on top of it (two targets in the renderer), and to scale
the world up by a whole number first. Not built; it is the step after
the default is chosen.

### Decision: the game is drawn at 1 (suspect 1)

Simon, after playing the steps: 1 for everybody. `RESOLUTION` in
`web/src/config.js`: one backing pixel to a logical pixel, four to an
art pixel, on every screen; the screen scales the picture up, smoothly.
On the Air that is 768 x 1668 instead of 1260 x 2736, 37 % of the
pixels. A window with fewer pixels than that keeps its own; `?res=screen`
draws at the screen's own as before, and the panel still steps through
all of them. The letter sheets at 1 are 9 MB.

### Measured here: what is left in our own drawing

Looked for what a frame does twice or for nothing (headless, one frozen
frame per place, a small window so that filling pixels costs nothing;
the median of the drawing's time on the CPU):

| place | sprites | as now | vines as sprites | glow layer skipped |
|---|---|---|---|---|
| 180 m, deep forest | 856 | 3.3 ms | 1.4 ms | 3.3 ms |
| 20 m, forest floor | 664 | 2.2 ms | 1.1 ms | 2.4 ms |
| stage 3, the rose wall | 699 | 2.0 ms | 1.0 ms | 1.9 ms |
| inside, 150 m | 246 | 0.7 ms | 0.8 ms | 0.7 ms |

- The vines and lianas on the trunks are drawn as vector lines, a few
  pixels of line between every two leaves. Each run of lines is a shape
  of its own that the engine builds again every frame (90 to 100 of
  them in the forest, none above the trees or inside). Drawn as turned
  sprites, like every rectangle already is, the drawing's time in the
  forest is halved. Built in the next step.
- Whatever glows is placed a second time, in the glow layer, which is
  only shown with bloom on, and bloom is off by default: 12 to 27 % of
  a frame's sprites are placed for nothing. Leaving them out is not
  measurable (they are never handed to the GPU). Not worth a change by
  itself.

### Step taken: lines are turned sprites (suspect 7)

`g.line` (`web/src/gfx/renderer.js`) no longer makes a vector shape. A
line is a white rectangle as long and as wide as the line, turned its
way: a sprite from the atlas like every rectangle, in the same batch as
its neighbours. That is every line the game draws: the vines and lianas
on the trunks, the ropes and chains of what hangs, the lights' wire,
threads and the web, the guard's pike, the rain and the lightning under
a storm cloud, a drifting cloud's streaks.

- The picture is the same to the pixel: the same frozen frame drawn
  both ways at five places with lines (forest floor, deep forest, 310 m,
  the rose wall, inside with its chains), and 400 made-up lines of
  every width from 2 to 14, every angle, whole and half positions,
  solid and see-through, at 1, at the Air's 1.64 and at 0.5: no pixel
  differs.
- Measured here as above (the drawing's time on the CPU, one frozen
  frame, median of alternating blocks):

| place | shapes a frame | before | after |
|---|---|---|---|
| 180 m, deep forest | 79 → 3 | 2.7 ms | 1.3 ms |
| 20 m, forest floor | 72 → 3 | 2.4 ms | 0.9 ms |
| 310 m | 36 → 3 | 1.5 ms | 1.0 ms |
| stage 3, the rose wall | 85 → 3 | 2.2 ms | 1.0 ms |
| 480 m, above the trees | 3 | 0.7 ms | 0.7 ms |
| inside, 150 m | 3 | 0.7 ms | 0.7 ms |

  A frame in the forest has 200 to 280 sprites more for it (the lines'
  pieces) and is still twice as fast to draw: a sprite is four corners
  in a list, a shape was built, cut into triangles and handed to the
  GPU as a buffer of its own, every frame.
- The three shapes left in a frame are the HUD's (round frames,
  rings); they do not change with the place.
- To read on the phone: `draw` in the forest (it was 4 to 5 ms at the
  screen's resolution), and whether the deep forest still falls below
  60.

### 2026-11-26, iPhone Air, after the three steps (letter sheets, drawn at 1, lines as sprites)

Simon: "really very smooth now, much better than before." The panel in
the forest at 157 m, half a minute into a round (768 x 1668, x1):

| | first reading (screen's resolution) | now |
|---|---|---|
| frames of the round | 5906 (to 376 m) | 1791 (to 157 m) |
| longer than 20 ms | 6.1 % | 1.8 % |
| longer than 25 ms | 1.5 % | 0.6 % |
| longer than 50 ms | 2 | 0 |
| the longest | 75 ms | 32 ms |
| `upd` mean / longest | 0.3 / 7 ms | 0.4 / 3 ms |
| `draw` mean / longest | 4.1 / 61 ms | 4.1 / 22 ms |
| most sprites in a frame | 1584 | 1623 |

The last 120 frames in the forest: 60 a second, 99th percentile 23 ms,
longest 26, `draw` 4 (longest 5) for 970 sprites, no text painted anew.
The round's longest frame (32 ms at 120 m) had 7 ms of ours in it and
two texts painted.

What it says:
- Late frames are down to under a third, and the long ones (over
  50 ms) are gone. Against the aim (none over 25 ms, 99 of 100 within
  20 ms) it is close, not there: 1.8 % and 0.6 %.
- What is left is mostly frames of 23 to 26 ms, which is a callback
  that came late, not a picture left out (that would be 33 ms), and
  one frame of 32 ms of which three quarters were not our code.
- Our drawing is 4 ms for some 1000 sprites, a quarter of a frame. It
  is the number of sprites that sets it now, not shapes or text.
- The reading is a short one and ends at 157 m: the deep forest around
  300 m, where the first reading fell to 55 a second, is not in it.

Where this leaves the question the plan began with: the web view holds
60 on the Air, and nobody playing sees what is left. A port to
SpriteKit or an engine is not needed for smoothness. Open for later,
none of it urgent: a whole round's reading to 300 m and beyond; the
atlas at art size (suspect 3, taken in the next step), which is about
memory and the 126 px left under the limit, not about frames.

### Step taken: the atlas keeps the sprites at art size (suspect 3)

Nothing had to be drawn again. The sprites are drawn by code in art
pixels and only painted four times as large; of the 705, 704 are on the
art grid exactly (every block of 4 x 4 pixels one colour). The one that
is not is the little prince of the lives in the HUD, a cut of his
sprite 93 pixels high.

`web/src/gfx/atlas.js` now packs every sprite on the grid at a quarter
each way, one texel to an art pixel, and tells the texture that it is
four times coarser (its resolution is 1/4): a sprite's frame, size and
anchor are in logical pixels as before, and the renderer and the game
do not know the difference. What is not on the grid goes onto a second
sheet at full size. The landing page, the social pictures and the
sprite sheet page use the sprites' own canvases, not the atlas, and
are as they were.

| | before | after |
|---|---|---|
| the atlas | 4096 x 3970 | 1024 x 1009, and 108 x 97 for the one |
| on the GPU, and again as its canvas | 62 MB each | 3.9 MB each |
| room under the limit of 4096 | 126 px | sixteen times today's art |
| packing it at start-up (headless) | 58 ms | 10 ms |
| the first frame with it, which hands it to the GPU (headless) | 204 ms | 9 ms |
| a frame's drawing after that | 1.1 ms / 0.6 ms | 1.2 ms / 0.6 ms |

- The picture: the same frozen frame with the atlas as it was and as
  it is, at 17 places. At 1, the game's resolution, 14 to 157 pixels of
  a million differ; at 1.25 0.06 %, at 0.5 0.03 %, at the Air's own
  1.64 0.1 to 0.4 %. They are single rows of pixels where an art
  pixel's edge inside a sprite that stands between pixels, is scaled
  or turned falls one screen pixel higher or lower; in the enlarged
  crops no difference is to be seen. Not the same to the pixel, as
  the lines were.
- `tools/checks/atlas.mjs` now looks at every sprite: one kept at art
  size has to be on the grid, and the atlas has to hold it as it is
  drawn. A sprite drawn off the grid by mistake is named there before
  a push (tried with a planted dot: it fails and names the sprite). A
  sprite that is meant to be finer says `fine: true`.
- Left for a step of its own, and taken (the next one): the 705
  canvases the sprites are drawn on stayed in memory after the atlas
  was packed (55 MB in the web view).
- To read on the phone: that it starts and looks as it did; the frames
  should not change.

### Step taken: the sprites' canvases are given back

About memory, not about frames: the canvases were never drawn after
the start. Each sprite is painted on a canvas of its own, four times
its art size each way; the atlas is packed from them, and from then on
the game draws from the atlas only. The 709 canvases stayed, because
every sprite object held its own: 14.4 million pixels, 55 MB as
counted.

`buildAtlas` (`web/src/gfx/atlas.js`) now gives them back once both
sheets are painted: each canvas is set to no size, which frees its
pixels at once, and the sprite's `canvas` is null. A sprite keeps its
size, its anchor and `tex`, which is all the renderer reads.

- Who read the canvases: nobody in the game after the start. What
  works on a sprite's pixels (`flipH`, `tint`, the cut-out for the
  lives, the inside's `recede`) does so while the art is built. The landing
  page, the social pictures, the sprite sheet page and the simulator
  build the art themselves and pack no atlas: they keep theirs and are
  as they were (all four loaded, no errors).
- The atlas's own canvas (3.9 MB) is kept: the check reads it, and
  PixiJS holds it as the texture's source.
- The start is as it was: all canvases are there together until the
  atlas is packed. Drawing the sprites at art size from the beginning
  would take that away too, and reaches into every drawing tool, the
  landing page and the social pictures; not done, and only worth it if
  the start shows up as a problem on a phone.

| headless Chromium on Linux, the title, after a collection | before | after |
|---|---|---|
| sprites holding a canvas | 709 (55.2 MB as counted) | 0 |
| the page's process | 228 to 230 MB | 125 to 127 MB |
| all of the browser's processes | 411 to 418 MB | 309 to 311 MB |

- The browser gives back about 103 MB, near twice what the pixels
  count to; why it held two for one was not looked into. Three runs
  before, three after, and two more of each later: the same within
  2 MB.
- Only letting go of the canvases (null, no size set) gives the same
  figure here, after a collection that the measurement forces. The
  game sets the size as well, because nothing forces a collection on a
  phone, and a canvas's object is small however many pixels hang on it.
- Not measured on a phone. To read there: the app's memory in Xcode
  (the Debug navigator's Memory gauge) on the title and in a round,
  with `master` and with this.
- The picture cannot change: the atlas's two sheets are the same to
  the byte before and after, and every sprite's frame, size and anchor
  (hashed on both). The simulator's five reports are as they were.
- `tools/checks/atlas.mjs` builds the art a second time for the pixels
  it compares (in a frame of its own: `art/tower.js` draws from one
  random generator for as long as a page lives, so a second build in
  the same page has other bricks), and fails if a sprite of the game
  still holds a canvas (run against `master`, it names all 709).
- Packing art that has been packed before throws and says so.
- The budget of 80 MB in the check stays, as what the start may take.

## The suspects, in the order we take them

1. **Resolution.** (Taken: the game is drawn at 1, see Readings. Open:
   the panel's numbers of a round at 1.) The backing store was the
   screen's own pixels
   (1260 x 2736 on the Air), and several layers are blended over the
   whole of it. Pixel art gains nothing from that: an art pixel is four
   logical pixels. At 1.5, 1.25 or 1 backing pixels to a logical one the
   art pixels come out even, and the screen scales the picture up. At 1
   it is 37 % of the pixels. To do: read the numbers at each, look at
   each on the phone, make the best one the phone's default.
2. **Text.** The renderer keeps one text object per place in a frame
   and sets its words every frame. Where the words change (the height
   four times a second while climbing, the suns with every sun, a toast
   coming or going, which moves every text after it to another object)
   the browser paints the text again and hands a new texture to the
   GPU. That fits "where a lot is going on". Confirmed by the first
   reading and taken (see Readings): letters from prepared sheets, so
   that changing words costs nothing. To do: read a round with and
   without them on the phone.
3. **The atlas.** Every sprite was stored four times as large as its
   art (16 texels to an art pixel): 4096 x 3970, some 62 MB on the GPU,
   and 126 px under the limit of older phones. Taken (see Readings):
   kept at art size it is 1024 x 1009. The sprites' own canvases
   (55 MB) are given back after the start (taken too, see Readings);
   they are still all there while the game starts.
4. **Allocation in the frame.** The step and the drawing build small
   lists and closures every frame (`filter`, `map`, `sort`); the
   collector's pauses are single late frames. To do: if `upd` or `draw`
   jump without text being new, take the lists out of the frame, the
   hot ones first.
5. **Overdraw and count.** Some 600 sprites a frame in the deep forest,
   fog and light over the whole picture. To do: after 1 to 3, if frames
   are still late where the picture is full.
6. **Rows and creatures far away.** Building rows and stepping
   everything that exists, seen or not. Small; last. (The first reading
   says the step is 0.3 ms: nothing to fetch here.)
7. **Vector lines.** Found while looking at 5: the vines on the trunks
   were half of the drawing's time in the forest. Taken (see
   Readings): `g.line` is a turned sprite, the picture the same to the
   pixel.

If the phone holds 60 after this, the shell is the app, and Android is
the same build in its own shell. If it does not, the numbers say why,
and the choice between SpriteKit and an engine is made with them.
