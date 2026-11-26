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
second. A tap on the panel takes the next drawing resolution;
`?res=1.5` sets one. On the phone:
`tools/ios_run.sh Simmi -gameQuery "perf=1"`.

What a reading says:
- `draw` and the late frames fall with the resolution: too many pixels.
- `upd` is high or jumps: the game's own step (allocation, generation).
- `draw` is low and frames are late all the same: the GPU or the
  compositor, not our code on the CPU; resolution and texture size are
  what is left to us.
- the longest frames have `new txt` above 0: text.

## The suspects, in the order we take them

1. **Resolution.** The backing store is the screen's own pixels
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
   GPU. That fits "where a lot is going on". To do: confirm with `new`
   in the longest frames; then letters from one prepared sheet (a
   bitmap font), so that changing words costs nothing.
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
   everything that exists, seen or not. Small; last.

If the phone holds 60 after this, the shell is the app, and Android is
the same build in its own shell. If it does not, the numbers say why,
and the choice between SpriteKit and an engine is made with them.
