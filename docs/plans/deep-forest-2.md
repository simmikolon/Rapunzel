# Plan: deep forest, part two (life, light and air)

Branch `element/deep-forest-life`. Everything here is visual; no sound
(ambience, gust whoosh, acorn plink are deferred). Nothing drawn in front
of the prince may hide a hazard: fog, dapple and mist stay translucent.

## Steps

0. **Refactor**: move the atmosphere (leaves, fog, shafts, boughs) out of
   `background.js` into `web/src/atmosphere.js` as an `Atmosphere` class
   with draw hooks at the same points. Behaviour unchanged; screenshot to
   confirm.
1. **Sun and wind dynamics** (share the shafts):
   - *Dust motes*: ~40 specks that live inside the light shafts in screen
     space, drift slowly down the beam with jitter, twinkle, glow through
     the bloom. Follow the shaft's sway.
   - *Cloud cover*: a slow random walk (new target every 12–30 s, eased
     over 6–10 s) that dims the shafts, motes and dapple together, so the
     sun comes and goes.
   - *Gusts*: every 14–24 s a 3 s gust with a smooth envelope: stronger
     wind on leaves and fog, boughs rock around their trunk attachment,
     motes speed up, the braid swings a little wider (ribbons move with
     it, a mild gameplay touch).
2. **Light and air statics**:
   - *Canopy dapple*: ~8 soft dark blobs (multiply blend) in the tower
     layer's coordinates so they scroll with the bricks, swaying slowly,
     fading with cloud cover.
   - *Tower haze*: a soft bluish band along each edge of the wall so it
     reads further away than the trees.
   - *Lawn mist*: low flat wisps hugging the lawn at the start (title
     screen look), behind the prince.
3. **Reactions to the prince**:
   - *Fog wake*: a wisp the prince passes through is pushed aside and thins
     out, then recovers over ~2 s.
   - *Sideways nudge*: near leaves and fog drift slightly against the
     prince's horizontal velocity (smoothed, so screen wrap does not pop).
4. **Life** (new sprites: bird x2 frames, butterfly x2 frames x3 colours,
   acorn; owl eyes are drawn as glowing rects):
   - *Owls* blink in the trunk knot holes (tile variant 2) in the deep
     forest and at night.
   - *Birds* perch on bough tips and take off, flapping, when the prince
     lands or passes nearby; despawn off screen.
   - *Butterflies* loop around branch tips, flee a landing nearby, settle
     on a new branch above. Forest floor and deep forest.
   - *Acorns* drop from a random visible bough now and then, tumble, and
     fall out of view.
5. **Fireflies** gather in a loose orbit around lanterns and scatter when
   the prince comes close.
6. Screenshots at 60 / 160 / 220 m, sprite sheet, simulator sanity, docs.

## Budget

Roughly 200 extra batched sprites at most (leaves 60, fog 30 puffs,
motes 40, dapple 8, life < 20, mist 4). All in the existing layers.

## Status

All steps landed on `element/deep-forest-life` (2026-10-27): the
atmosphere lives in `web/src/atmosphere.js`, the zone curves in
`web/src/altitude.js`; owls, haze and firefly behaviour sit in
`web/src/background.js` next to the trunks and fireflies they belong to.
Verified with screenshots at 0 / 60 / 160 / 170 / 220 m, the sprite
sheet and a simulator sanity run. Sound deferred.
