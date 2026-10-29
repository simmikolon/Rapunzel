import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Balconies on the tower: 36 x 40 art px for the LEFT edge of the wall,
// drawn in the tower's own brick palette so they read as part of the
// masonry: a doorway cut into the wall like the tiles' windows, a stone
// slab course with corbelled bricks beneath, and a railing on top. The
// landing surface is the slab top (y = 30). Variants: stone, wooden,
// flowered, ivy, dilapidated (fragile).
const WOOD = { rail: C.plank, railHi: C.plankHi, post: C.plankDark };
const DRYWOOD = { rail: C.dry, railHi: C.dryLight, post: C.dryDark };

function masonry(t, broken) {
  const { p, line } = t;
  // slab: a light stone course with mortar joints
  p(0, 30, 36, 1, C.brickLight); p(0, 31, 36, 2, C.brickMid); p(0, 33, 36, 1, C.brickShade);
  for (let x = 5; x < 36; x += 7) line(x, 31, x, 32, C.mortar);
  // corbels: two stepped brick rows narrowing toward the wall
  p(4, 34, 32, 3, C.brickDark); p(4, 34, 32, 1, C.mortar); for (let x = 9; x < 36; x += 7) line(x, 35, x, 36, C.mortar);
  p(11, 37, 25, 3, C.brickShade); p(11, 37, 25, 1, C.mortar); for (let x = 16; x < 36; x += 7) line(x, 38, x, 39, C.mortar);
  if (broken) { p(0, 30, 3, 1, C.brickMid); p(14, 30, 4, 1, C.brickMid); line(7, 31, 9, 33, C.mortar); line(22, 30, 23, 33, C.mortar); p(4, 34, 6, 3, 'rgba(0,0,0,0)'); }
}

function doorway(t, boarded) {
  const { p, disc, line } = t;
  // cut into the wall like the tiles' arched windows, candle light inside
  p(24, 7, 12, 23, C.nightDeep); disc(29.5, 8, 6, C.nightDeep);
  if (boarded) { for (const y of [10, 17, 24]) { line(24, y, 35, y + 2, C.dryDark); line(24, y + 1, 35, y + 3, C.dry); } return; }
  p(28, 15, 4, 6, C.dusk); p(29, 13, 2, 3, C.lanternGlow); p(29, 12, 2, 1, C.sun1);
  p(24, 28, 12, 2, C.brickLight);   // threshold
}

function stoneRailing(t, broken) {
  const { p, line } = t;
  p(2, 18, 22, 2, C.brickLight); p(2, 28, 22, 2, C.brickMid);
  for (const x of [3, 12, 21]) { p(x, 18, 2, 12, C.brickMid); p(x, 18, 1, 12, C.brickLight); }
  const bal = broken ? [6, 18] : [6, 9, 15, 18];
  for (const x of bal) p(x, 20, 1, 8, C.brickLight);
  if (broken) { p(9, 24, 1, 4, C.brickLight); p(13, 18, 7, 2, 'rgba(0,0,0,0)'); line(21, 19, 23, 29, C.brickMid); p(21, 18, 2, 12, 'rgba(0,0,0,0)'); }
}

function woodRailing(t, k) {
  const { p } = t;
  p(2, 18, 22, 2, k.rail); p(2, 18, 22, 1, k.railHi); p(2, 28, 22, 2, k.rail);
  for (const x of [3, 12, 21]) p(x, 18, 2, 12, k.post);
  for (const x of [6, 9, 15, 18]) p(x, 20, 1, 8, k.rail);
}

function drawBalcony(t, variant) {
  const { p, line } = t;
  const dil = variant === 4;
  doorway(t, dil);
  masonry(t, dil);
  if (variant === 0 || variant === 2) stoneRailing(t, false);
  else if (variant === 1 || variant === 3) woodRailing(t, WOOD);
  else stoneRailing(t, true);
  if (variant === 2) {
    // flowered: a window box on the rail with geraniums, greens spilling over
    p(3, 15, 20, 4, C.plankDark); p(3, 15, 20, 1, C.plankHi);
    for (let i = 0; i < 7; i++) { const x = 4 + i * 3; p(x, 13, 2, 2, [C.heart, C.ribbonHi, C.sun2][i % 3]); p(x + 1, 12, 1, 1, i % 3 === 0 ? C.heartHi : C.white); }
    for (let i = 0; i < 6; i++) { const x = 3 + i * 4; p(x, 19, 1, 3 + (i % 2), C.leaf); p(x + 1, 20, 1, 2, C.grass); }
  }
  if (variant === 3) {
    // ivy: tendrils winding along the railing and up the doorway, with small flowers
    line(2, 29, 6, 22, C.leafDark); line(6, 22, 10, 26, C.leafDark); line(10, 26, 15, 19, C.leafDark); line(15, 19, 20, 24, C.leafDark); line(20, 24, 24, 20, C.leafDark);
    line(24, 30, 23, 10, C.leafDark); line(23, 10, 27, 2, C.leafDark);
    for (const [x, y] of [[4, 25], [8, 23], [12, 24], [16, 21], [19, 23], [22, 21], [23, 15], [23, 25], [26, 4]]) { p(x - 1, y, 3, 2, C.leaf); p(x, y - 1, 1, 1, C.grassLight); }
    for (const [x, y] of [[6, 27], [14, 20], [21, 26], [23, 11]]) p(x, y, 1, 1, C.white);
  }
  if (dil) {
    // a plank hanging off the broken slab, moss in the joints
    p(26, 34, 3, 1, C.dry); line(27, 34, 25, 40, C.dryDark); line(28, 34, 26, 40, C.dry);
    p(2, 31, 2, 1, C.mossDark); p(19, 32, 3, 1, C.mossDark); p(30, 35, 2, 1, C.mossDark);
  }
}

export function buildBalconies() {
  const L = [0, 1, 2, 3, 4].map((v) => makeSprite(36, 40, (t) => drawBalcony(t, v), undefined, { axPx: 18 * 4, ayPx: 30 * 4 }));
  return { L, R: L.map(flipH) };
}
