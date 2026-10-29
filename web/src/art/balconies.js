import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Balconies on the tower: 44 x 72 art px for the LEFT edge of the wall,
// drawn in the tower's own brick palette so they read as part of the
// masonry: a doorway cut into the wall like the tiles' windows, a stone
// slab course with corbelled bricks beneath, and a railing on top. The
// landing surface is the slab top (y = 60); the doorway is tall enough for a guard. Variants: stone, wooden,
// flowered, ivy, dilapidated (fragile).
const WOOD = { rail: C.plank, railHi: C.plankHi, post: C.plankDark };
const DRYWOOD = { rail: C.dry, railHi: C.dryLight, post: C.dryDark };

function masonry(t, broken) {
  const { p, line } = t;
  // slab: a light stone course with mortar joints
  p(0, 60, 44, 1, C.brickLight); p(0, 61, 44, 2, C.brickMid); p(0, 63, 44, 1, C.brickShade);
  for (let x = 6; x < 44; x += 7) line(x, 61, x, 62, C.mortar);
  // corbels: two stepped brick rows narrowing toward the wall
  p(5, 64, 39, 4, C.brickDark); p(5, 64, 39, 1, C.mortar); for (let x = 11; x < 44; x += 7) line(x, 65, x, 67, C.mortar);
  p(13, 68, 31, 4, C.brickShade); p(13, 68, 31, 1, C.mortar); for (let x = 18; x < 44; x += 7) line(x, 69, x, 71, C.mortar);
  if (broken) { p(0, 60, 3, 1, C.brickMid); p(17, 60, 4, 1, C.brickMid); line(9, 61, 11, 63, C.mortar); line(27, 60, 28, 63, C.mortar); p(5, 64, 7, 4, 'rgba(0,0,0,0)'); }
}

function doorway(t, boarded) {
  const { p, disc, line } = t;
  // cut into the wall like the tiles' arched windows, candle light inside
  p(28, 13, 14, 47, C.nightDeep); disc(34.5, 14, 7, C.nightDeep);
  if (boarded) { for (const y of [20, 32, 44]) { line(28, y, 41, y + 3, C.dryDark); line(28, y + 1, 41, y + 4, C.dry); } return; }
  p(33, 36, 4, 7, C.dusk); p(34, 33, 2, 4, C.lanternGlow); p(34, 32, 2, 1, C.sun1);
  p(28, 58, 14, 2, C.brickLight);   // threshold
}

function stoneRailing(t, broken) {
  const { p, line } = t;
  p(2, 42, 26, 2, C.brickLight); p(2, 58, 26, 2, C.brickMid);
  for (const x of [3, 14, 25]) { p(x, 42, 2, 18, C.brickMid); p(x, 42, 1, 18, C.brickLight); }
  const bal = broken ? [7, 21] : [7, 10, 18, 21];
  for (const x of bal) p(x, 44, 1, 14, C.brickLight);
  if (broken) { p(10, 50, 1, 8, C.brickLight); p(15, 42, 9, 2, 'rgba(0,0,0,0)'); p(25, 42, 2, 18, 'rgba(0,0,0,0)'); line(25, 43, 27, 59, C.brickMid); }
}

function woodRailing(t, k) {
  const { p } = t;
  p(2, 42, 26, 2, k.rail); p(2, 42, 26, 1, k.railHi); p(2, 58, 26, 2, k.rail);
  for (const x of [3, 14, 25]) p(x, 42, 2, 18, k.post);
  for (const x of [7, 10, 18, 21]) p(x, 44, 1, 14, k.rail);
  p(2, 50, 26, 1, k.post);                                   // a middle rail
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
    p(3, 38, 24, 5, C.plankDark); p(3, 38, 24, 1, C.plankHi);
    for (let i = 0; i < 8; i++) { const x = 4 + i * 3; p(x, 35, 2, 3, [C.heart, C.ribbonHi, C.sun2][i % 3]); p(x + 1, 34, 1, 1, i % 3 === 0 ? C.heartHi : C.white); }
    for (let i = 0; i < 7; i++) { const x = 3 + i * 4; p(x, 43, 1, 4 + (i % 2) * 2, C.leaf); p(x + 1, 44, 1, 3, C.grass); }
  }
  if (variant === 3) {
    // ivy: tendrils winding along the railing and up the doorway, with small flowers
    line(2, 59, 7, 48, C.leafDark); line(7, 48, 12, 55, C.leafDark); line(12, 55, 18, 44, C.leafDark); line(18, 44, 23, 52, C.leafDark); line(23, 52, 27, 45, C.leafDark);
    line(27, 60, 26, 20, C.leafDark); line(26, 20, 31, 8, C.leafDark); line(31, 8, 36, 5, C.leafDark);
    for (const [x, y] of [[4, 54], [9, 51], [14, 52], [19, 46], [22, 50], [26, 47], [26, 36], [26, 26], [29, 12], [34, 6]]) { p(x - 1, y, 3, 2, C.leaf); p(x, y - 1, 1, 1, C.grassLight); }
    for (const [x, y] of [[7, 57], [16, 46], [24, 55], [26, 31], [32, 9]]) p(x, y, 1, 1, C.white);
  }
  if (dil) {
    // a plank hanging off the broken slab, moss in the joints
    p(30, 64, 3, 1, C.dry); line(31, 64, 29, 71, C.dryDark); line(32, 64, 30, 71, C.dry);
    p(2, 61, 2, 1, C.mossDark); p(23, 62, 3, 1, C.mossDark); p(36, 65, 2, 1, C.mossDark); p(14, 69, 2, 1, C.mossDark);
  }
}

export function buildBalconies() {
  const L = [0, 1, 2, 3, 4].map((v) => makeSprite(44, 72, (t) => drawBalcony(t, v), undefined, { axPx: 22 * 4, ayPx: 60 * 4 }));
  return { L, R: L.map(flipH) };
}
