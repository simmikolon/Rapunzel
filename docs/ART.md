# Sir Bouncealot: sprite style

How the sprites drawn by code in `web/src/art/` look, and why. It describes
the art as it is, so a new sprite fits next to the old ones. The logo and
the sign lettering (`logo.js`, `sign.js`) have their own rules (outline,
bevel, drop shadow); hand-drawn pictures are not covered here.

Three levels: **fixed** (breaking it looks like a bug), **defaults**
(deviate with a reason) and **free** (where a new element should bring
something of its own). When a sprite breaks a rule and looks better for
it, change the rule here and log it in `docs/DESIGN.md`. Don't make the
sprite fit the rule.

## Reference and counterexample
- Reference: the prince, Rapunzel (the sign portrait), the braid, the bows
  and ribbons, the spider, the squirrel, the cloud platforms.
- Counterexample: the first stork and sky lanterns (redrawn on 2026-11-17,
  see the decision log). The stork had realistic proportions (long neck,
  long legs, thin wings), no face (a one-pixel eye), a big white body
  with almost nothing on it, loose colours outside the palette, and thin
  lines carrying the shape. The lantern was pillow-shaded (bright core,
  darker rim all around), ruled with a grid of thin ribs, exactly
  symmetric, and had no detail of its own. The clouds are objects too
  and fit: irregular lobes, lit on top, shaded below, varied by a seed.

## Fixed
- The grid: one art pixel is `PX` (4) logical pixels, sizes are given in
  art pixels, no smoothing, nothing between pixels. Draw with `p`, `rect`,
  `line`, `disc`, `ellipse`, `ring`, `poly`, `hatch` (`sprite.js`), all
  on the grid. `poly` fills an art pixel when its centre lies inside, so
  thin tips break into single pixels: draw thin shapes as row spans, as
  the stork is drawn.
- Every sprite reads against the dark teal and night backgrounds by its
  brightness and colour alone. A dark sprite (crow, spider, witch) needs a
  lighter highlight plane. A hazard must read as a hazard at a glance.
- The prince (26 x 58) is the scale. Creatures are smaller (squirrel
  18 x 15, crow 18 x 14, spider 16 x 12). Only a threat his own size (the
  guard, the witch) is as big as he is.
- One light per sprite: top edges lit, undersides shaded. Side light
  follows the scene: the tower is lit from the upper left, tree trunks from
  their inner edge. No pillow shading.
- Glow comes from the renderer (`glow` on draw calls), not painted halos.

## Defaults
- Colours come in named ramps of 3 to 5 steps per material: highlight,
  base, shade, dark (`braid/braidHi/braidShade/braidDark`, the bark).
  Shared ramps live in `palette.js`. A ramp only one element uses may live
  in its module as a named table (`LOOKS` in `clouds.js`, `TREE_STYLES`).
  No loose hex values in drawing calls.
- Warm, saturated, soft: royal blue, gold, pink, orange fur, creamy
  whites. Pure black only for eyes.
- No outline. Outline only where something would otherwise vanish (trees
  against the sky, the witches' edge markers on birch).
- Shading in flat planes: a highlight block and a shadow block, no
  gradients. `hatch` is for texture, not for shading.
- Characters are chibi: head about a third of the figure, round bodies,
  short limbs. Every face has eyes of 1 to 2 px (with white where there is
  room), cheek pixels on the humans, and one feature of its own
  (moustache, crown, the acorn in the squirrel's paws).
- Few frames (2 to 5), each one changing the silhouette. A knocked-out
  frame with X eyes. Hurt is a tint, not a new drawing.
- Detail grows with size: a big sprite with large empty areas looks
  unfinished.
- Hand-placed irregularity over geometry: lobes off centre, a seeded RNG
  for repeated things (clouds, branches, tiles). No ruled grids of thin
  lines, and no exact mirror symmetry for anything organic.

## Free
- Shape and silhouette of each element; new materials with their own
  ramps; a zone's own palette (birch, the storm clouds).
- The idea that makes a sprite charming: each new creature or object gets
  one of its own. Don't copy the squirrel; ask what this thing would do.
- How things move, squash and react (`bowSquash`, the knocked-out squirrel
  on its back).
- Anything not mentioned above.

## Checking a new sprite
- In `web/dev/sprites.html` next to the prince and the squirrel.
- In the game at its zone and its time of day (`?at=`, `?spawn=`): the
  background decides whether it reads.
- Squint: the silhouette and the light and dark areas must read when
  blurred.
