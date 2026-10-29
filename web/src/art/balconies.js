import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Balconies on the tower: 36 x 40 art px for the LEFT edge of the wall.
// The door sits on the wall side (right), the slab reaches outward; the
// landing surface is the slab top (y = 30). The prince stands in front of
// the railing. Variants: stone, wooden, flowered, ivy, dilapidated.
const STONE = { slabHi: C.stoneLight, slab: C.stone, slabLo: C.stoneDark, slabShade: C.stoneShade, post: C.stoneLight, bal: C.stone, frame: C.stoneLight };
const WOOD = { slabHi: C.plankHi, slab: C.plank, slabLo: C.plankDark, slabShade: '#5a3a24', post: C.plankDark, bal: C.plank, frame: C.plankDark };
const DRY = { slabHi: C.dryLight, slab: C.dry, slabLo: C.dryDark, slabShade: '#3e3228', post: C.dryDark, bal: C.dry, frame: C.dryDark };

function drawBalcony(t, variant) {
  const { p, line, disc, poly } = t;
  const k = variant === 4 ? DRY : (variant === 1 || variant === 3) ? WOOD : STONE;
  // the doorway on the wall side: arched, dark inside, a lit pane
  p(23, 2, 12, 29, k.frame); disc(29, 4, 5, k.frame);
  p(25, 4, 8, 27, C.nightDeep); disc(29, 5, 3, C.nightDeep);
  if (variant === 4) { for (const y of [10, 17, 24]) { line(24, y, 34, y + 2, C.dryDark); line(24, y + 1, 34, y + 3, C.dry); } }  // boarded up
  else { p(27, 9, 4, 5, C.lanternPaper); p(28, 10, 2, 2, C.lanternHi); p(25, 20, 8, 1, k.frame); }                              // a lit pane, a sill
  // slab: top light, body, dark underside, brackets
  p(0, 30, 36, 1, k.slabHi); p(0, 31, 36, 2, k.slab); p(0, 33, 36, 1, k.slabLo);
  poly([[4, 34], [12, 34], [12, 39]], k.slabShade); poly([[16, 34], [24, 34], [24, 39]], k.slabShade);
  line(12, 34, 12, 39, k.slabLo); line(24, 34, 24, 39, k.slabLo);
  if (variant === 4) {
    // dilapidated: cracks, a missing bit of slab, a hanging plank, a broken railing
    line(6, 31, 9, 33, C.dryDark); line(20, 30, 22, 33, C.dryDark); p(14, 30, 3, 1, C.dryDark);
    poly([[26, 34], [29, 34], [27, 41], [25, 40]], C.dry); line(26, 34, 25, 40, C.dryDark);
    p(2, 18, 22, 1, k.post); p(2, 29, 22, 1, k.post);
    p(3, 18, 2, 12, k.post); line(21, 19, 23, 29, k.post);           // one post stands, one leans
    for (const x of [8, 17]) p(x, 20, 1, 9, k.bal);
    p(12, 23, 1, 3, k.bal);                                             // a broken baluster
    p(12, 18, 6, 1, 'rgba(0,0,0,0)');
  } else {
    // railing: top rail, posts, balusters, bottom rail
    p(2, 18, 22, 2, k.post); p(2, 28, 22, 2, k.post);
    for (const x of [3, 12, 21]) p(x, 18, 2, 12, k.post);
    for (const x of [6, 9, 15, 18]) p(x, 20, 1, 8, k.bal);
  }
  if (variant === 2) {
    // flowered: a window box on the rail with geraniums, greens spilling over
    p(3, 15, 20, 4, C.plankDark); p(3, 15, 20, 1, C.plankHi);
    for (let i = 0; i < 7; i++) { const x = 4 + i * 3; p(x, 13, 2, 2, [C.heart, C.ribbonHi, C.sun2][i % 3]); p(x + 1, 12, 1, 1, i % 3 === 0 ? C.heartHi : C.white); }
    for (let i = 0; i < 6; i++) { const x = 3 + i * 4; p(x, 19, 1, 3 + (i % 2), C.leaf); p(x + 1, 20, 1, 2, C.grass); }
  }
  if (variant === 3) {
    // ivy: tendrils winding along the railing and up the door frame, with small flowers
    line(2, 29, 6, 22, C.leafDark); line(6, 22, 10, 26, C.leafDark); line(10, 26, 15, 19, C.leafDark); line(15, 19, 20, 24, C.leafDark); line(20, 24, 24, 20, C.leafDark);
    line(23, 30, 23, 8, C.leafDark); line(23, 8, 27, 1, C.leafDark);
    for (const [x, y] of [[4, 25], [8, 23], [12, 24], [16, 21], [19, 23], [22, 21], [23, 14], [23, 24], [25, 4]]) { p(x - 1, y, 3, 2, C.leaf); p(x, y - 1, 1, 1, C.grassLight); }
    for (const [x, y] of [[6, 27], [14, 20], [21, 26], [23, 10]]) p(x, y, 1, 1, C.white);
  }
}

export function buildBalconies() {
  const L = [0, 1, 2, 3, 4].map((v) => makeSprite(36, 40, (t) => drawBalcony(t, v), undefined, { axPx: 18 * 4, ayPx: 30 * 4 }));
  return { L, R: L.map(flipH) };
}
