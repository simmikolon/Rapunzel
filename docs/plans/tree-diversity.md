# Plan: tree diversity (branch variants, trunk life, a tree look per zone)

Branch `element/tree-diversity` (on top of `element/deep-forest-life`).
Visual only, no balance change; the simulator only needs a sanity run.

## Why

Two branch drawings per side, every branch the same length at the same x,
and trunks cycling four 192 px tiles with the same bark phase: the trees
read as a repeating pattern once the atmosphere stopped hiding it.

## Style rules

- 4 px art grid, chunky silhouettes, no anti-aliasing; procedural like
  everything else (`web/src/art/`), shown on `web/dev/sprites.html`.
- Palettes stay in the `bg.png` family: the bark browns, moss and leaf
  greens. A zone's tree species may add a few colours of its own (birch
  bark greys, bare-tree grey-browns) but keeps the same value structure
  (lit inner edge, deep shadow at the screen edge, dark outline).
- Collision boxes do not change shape: every branch variant shares the
  surface height and the 178 px box; only length scales (±12 %).

## Steps

1. **Branch variants** (`web/src/art/trees.js`): six drawings per side
   from one parametrised routine: straight, gnarled, forked, knobby,
   mossy with a mushroom shelf, with a nest. Each branch gets a hashed
   variant, a slight bark tint and a length scale from the generator.
   Branches are anchored at their root on the trunk, so a shorter branch
   is a shorter reach, not a floating one. Dry (crumbling) branches keep
   their universal grey look.
2. **Trunk overlays and tendrils** (`web/src/background.js`): small
   overlay sprites scattered at hashed offsets per tile (moss patches,
   cracks, woodpecker holes, fungus shelves, lichen, burls on the inner
   edge, roots on the bottom tile); climbing vines drawn as winding
   polylines that cross tile boundaries (ivy, thorny tendrils with dark
   red barbs, flowering creepers); lianas and hanging moss that sway in
   the gusts. Density and mix come from the zone's tree style.
3. **A tree look per zone** (`treeStyleAt` in `web/src/altitude.js`):
   - forest floor, 0–120 m: oak. Brown bark, round leaf tufts, a few moss
     patches, cracks and holes, roots at the lawn.
   - deep forest, 120–250 m: mossy giants. Darker, greener bark, moss
     everywhere, mushrooms, hanging moss, thorny tendrils, drooping
     branches.
   - windows, 250–400 m: birch-like. Pale bark with dark marks and
     peeling, sparse small yellow-green leaves, lichen.
   - above the trees, 400 m+: bare tops. Grey-brown bark, twigs instead of
     leaves, cracks and holes (these trees end once that zone is built).
   Trunk tiles crossfade between styles over ~30 m at each boundary;
   each branch takes the style of the height it was created at.
4. Screenshots at 60 / 160 / 300 / 450 m, sprite sheet, simulator sanity,
   docs.

## Status

All four steps landed in one pass.

- `web/src/art/trees.js` holds the tree art: `TREE_STYLES` (palettes,
  leaf type, overlay and vine mix, liana chance per style), six branch
  variants per side and style, four trunk tiles per style (variant 2
  keeps the owls' knot hole), the dry branch, and the overlay sprites.
  `art/tiles.js` and `art/platforms.js` lost their trunk and branch
  builders.
- `treeStyleAt(y)` in `altitude.js` returns `{a, b, t}` for the crossfade
  (±15 m around 120, 250 and 400 m); branches take the nearest style.
- Branches: `KIND.branchL/R` now carry `root` and `dir`; `Platform` takes
  `lenScale`, `variant`, `style`, `tint` from the generator and scales
  its width. `world.drawPlatform` scales the sprite along its length.
- Background: `drawTrees` blends trunk styles, then `drawTrunkOverlays`,
  `drawVines` (polylines per 5-tile slot, leaves or barbs every 42 px)
  and `drawLianas` (swaying with `atmo.gustEnv()`).
- Checked: screenshots at 0, 60, 120, 160, 250, 300, 400, 450 m, the
  sprite sheet (now walks nested art), simulator 10 bold runs: median
  431 m, 0.9 hits per 100 m (was 388 m / 0.99 with the same build
  tolerance), so no balance change.

Fixed on the way: the crossfade only covered the lower half of a boundary
(a tile just above it jumped to the pure new style); the giants' fungus
shelves lined up like a ladder (now two per tile at random insets).
