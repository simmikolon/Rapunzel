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
  forest is halved. Not built yet: the lines have to look the same.
- Whatever glows is placed a second time, in the glow layer, which is
  only shown with bloom on, and bloom is off by default: 12 to 27 % of
  a frame's sprites are placed for nothing. Leaving them out is not
  measurable (they are never handed to the GPU). Not worth a change by
  itself.

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
3. **The atlas.** Every sprite is stored four times as large as its art
   (16 texels to an art pixel): 4096 x 3970, some 64 MB on the GPU, and
   126 px under the limit of older phones. Stored at art size it is
   about 1024 x 1000. To do: sprites drawn at one texel per art pixel
   and enlarged by the renderer; pictures before and after must be the
   same (`tools/checks/shots.mjs`).
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
   are half of the drawing's time in the forest (see Readings). To do:
   `g.line` as a turned sprite; pictures before and after the same.

If the phone holds 60 after this, the shell is the app, and Android is
the same build in its own shell. If it does not, the numbers say why,
and the choice between SpriteKit and an engine is made with them.
