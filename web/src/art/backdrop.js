import { makeSprite } from './sprite.js';
import { RNG } from '../util.js';

// The forest behind the tower (background.js drawForest). One sees it in
// two places: in the narrow strips between the tower and the trees in
// front, all the way up, and at the top, where the trees in front end and
// the whole forest lies below. So there are two kinds of tile, for the
// LEFT side (the right one is the same, mirrored when drawn):
//   a strip, 24 x 96 art px, from 20 art px inside the tree in front to
//   just behind the tower's edge: tall trunks going by, a branch, leaves;
//   a canopy, 44 x 96 art px, from the picture's edge to behind the tower:
//   the forest's roof seen from a little above (`top`, with its outline)
//   and the mass of leaves under it (`body`, which repeats).
// There are two layers of these, a far one and a nearer one, at two speeds
// (the painter's FOREST); depth comes from that and from their tones: the
// far one is nearer the colour of the air behind it.
//
// The trunks of a layer stand in the same columns in every tile of it, so
// a tree goes on from tile to tile however the tiles are picked. The dark
// forest's tiles are drawn in four greys and tinted by the painter (the
// forest floor's and the deep forest's air are different greens); the
// birches of the dawn zone and the canopies have their own colours, named
// here.
// (the leaves' greys lean to green, so that under one tint the leaves are greener than the trunks)
const GREY = { hi: '#ffffff', base: '#cdcdcd', dark: '#989898', deep: '#6c6c6c', leafHi: '#f0ffd6', leaf: '#c2dcae', leafDark: '#8fa884' };
const BIRCH = { hi: '#b9cdd2', base: '#a2b9c1', dark: '#839ca7', deep: '#4f6570', leafHi: '#86b5a0', leaf: '#629389', leafDark: '#4a7679', leafDeep: '#3b6068' };
const BIRCH_FAR = { hi: '#9fc0cf', base: '#8eb2c4', dark: '#7da2b6', deep: '#6d93a9', leafHi: '#9fc0cf', leaf: '#8eb2c4', leafDark: '#7da2b6', leafDeep: '#6d93a9' };
const CANOPY = { hi: '#86c08e', base: '#57997b', dark: '#3d7a6f', deep: '#2f6065' };
const CANOPY_FAR = { hi: '#b0d6c4', base: '#8dbdb6', dark: '#72a5ab', deep: '#5f92a0' };
export const BACKDROP = { stripW: 24, canopyW: 44, tileH: 96, stripX: 80 };       // (stripX: where a strip's left edge is, in logical px from the picture's)

// A clump of leaves: a round mass, lit on its upper left, in shade underneath.
function clump(t, cx, cy, r, k) {
  const { p } = t;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r + r * 0.5) continue;
    const lit = x + y * 1.4 < -r * 0.75, under = y > r * 0.45 || x + y > r * 1.1;
    p(cx + x, cy + y, 1, 1, lit ? (k.leafHi || k.hi) : under ? (k.leafDark || k.dark) : (k.leaf || k.base));
  }
}
// A trunk from the tile's top to its bottom: lit on its left edge, in shade on its right, a little uneven.
function trunk(t, x, w, k, rng, H = BACKDROP.tileH) {
  const { p } = t;
  p(x, 0, w, H, k.base);
  p(x, 0, 1, H, k.hi);
  if (w > 2) p(x + w - 1, 0, 1, H, k.dark);
  for (let i = 0; i < 3; i++) { const y = rng.int(4, H - 14), h = rng.int(5, 12); p(x - 1, y, 1, h, k.base); if (rng.chance(0.5)) p(x + w, y + 2, 1, h - 3, k.dark); }   // where it is a little thicker
}
// A branch from (x, y) rising to one side, ending in leaves.
function branch(t, x, y, dir, len, k, rng) {
  const { p } = t;
  for (let i = 0; i < len; i++) { const yy = y - Math.round(i * 0.55); p(x + dir * i, yy, 1, i < len * 0.55 ? 2 : 1, i % 3 === 0 ? k.dark : k.base); }
  clump(t, x + dir * len, y - Math.round(len * 0.55) - 1, rng.int(3, 4), k);
}

// A strip of the nearer layer in the dark forest: two trunks, and what the variant adds.
function drawNear(t, variant, k, birch) {
  const { p } = t, rng = new RNG(700 + variant * 13 + (birch ? 5 : 0)), H = BACKDROP.tileH;
  trunk(t, 7, birch ? 4 : 5, k, rng); trunk(t, 17, birch ? 2 : 3, k, rng);
  if (birch) {
    // the marks of a birch, and where a branch has gone
    for (let i = 0; i < 12; i++) { const y = rng.int(2, H - 3); p(7 + rng.int(0, 2), y, rng.int(1, 2), 1, k.deep); if (i % 3 === 0) p(17, y + 5, 2, 1, k.deep); }
    p(8, rng.int(20, 70), 2, 3, k.deep);
  } else {
    for (let i = 0; i < 4; i++) p(8 + rng.int(0, 2), rng.int(4, H - 8), 1, rng.int(3, 7), k.dark);          // furrows in the bark
  }
  if (variant === 0) { clump(t, 13, 30, 3, k); clump(t, 20, 70, 3, k); }
  if (variant === 1) { branch(t, 11, 60, 1, 8, k, rng); clump(t, 4, 22, 4, k); clump(t, 8, 18, 3, k); }
  if (variant === 2) {
    branch(t, 17, 40, -1, 6, k, rng); clump(t, 21, 34, 3, k);
    for (const [x, y, n] of [[10, 36, 9], [12, 37, 6], [21, 37, 11]]) p(x, y, 1, n, k.dark);                     // moss hanging from it
    clump(t, 14, 84, 4, k); clump(t, 18, 86, 3, k);
  }
  if (variant === 3) { p(8, 46, 3, 4, k.deep); p(9, 45, 1, 1, k.deep); branch(t, 19, 78, 1, 4, k, rng); clump(t, 3, 60, 4, k); clump(t, 13, 12, 3, k); }   // a hole in the trunk
}
// A strip of the far layer: thin trunks, small leaves.
function drawFar(t, variant, k) {
  const rng = new RNG(900 + variant * 7), H = BACKDROP.tileH;
  for (const [x, w] of [[5, 2], [12, 1], [15, 2], [21, 1]]) { t.p(x, 0, w, H, k.base); t.p(x, 0, 1, H, k.hi); }
  const spots = [[[9, 20, 3], [19, 52, 2], [13, 80, 3]], [[18, 14, 3], [8, 46, 2], [22, 74, 2], [10, 66, 3]], [[14, 34, 3], [6, 86, 3], [20, 30, 2]]][variant];
  for (const [x, y, r] of spots) clump(t, x, y, r, k);
  for (let i = 0; i < 3; i++) { const x = [5, 15, 21][i], y = rng.int(10, H - 10), d = rng.sign(); for (let j = 1; j < 5; j++) t.p(x + d * j, y - Math.round(j * 0.6), 1, 1, k.base); }   // twigs
}

// The forest's roof. `top`: its outline (rounded crowns side by side, each
// lit on its upper left) and the leaves under it; `body`: leaves all over,
// made to repeat from tile to tile.
function drawCanopy(t, top, k, seed, small) {
  const { p } = t, rng = new RNG(seed), W = BACKDROP.canopyW, H = BACKDROP.tileH;
  const line = small ? 30 : 34;                          // where the crowns' middles are, from the tile's top
  if (top) {
    const crowns = small ? [[3, 5, 0], [11, 6, -3], [20, 5, 1], [28, 7, -2], [37, 6, 2], [43, 5, -1]] : [[4, 8, 1], [15, 10, -4], [27, 8, 2], [38, 10, -3]];
    p(0, line + 4, W, H - line - 4, k.base);
    for (const [cx, r, dy] of crowns) clump(t, cx, line + dy, r, k);
    for (const [cx, r, dy] of crowns) p(cx + r - 1, line + dy + 2, 2, r, k.dark);                                // the shade between two crowns
  } else p(0, 0, W, H, k.base);
  // the mass: smaller rounds of leaves all over it, gaps of deep shade between
  const from = top ? line + 8 : 0;
  for (let i = 0; i < (small ? 34 : 22); i++) {
    const cx = rng.int(0, W - 1), cy = rng.int(from, H - 1), r = small ? rng.int(2, 3) : rng.int(3, 5);
    for (const oy of top ? [0] : [-H, 0, H]) clump(t, cx, cy + oy, r, k);
    if (rng.chance(0.4)) for (const oy of top ? [0] : [-H, 0, H]) p(cx + r, cy + r + oy, 2, 2, k.deep);
  }
}

export function buildBackdrop() {
  const B = BACKDROP, left = { ax: 0, ay: 1 };
  const strip = (draw) => makeSprite(B.stripW, B.tileH, draw, left);
  const canopy = (top, k, seed, small) => makeSprite(B.canopyW, B.tileH, (t) => drawCanopy(t, top, k, seed, small), left);
  return {
    // strips: [variant], to be tinted (the dark forest) or in their own colours (the birches)
    far: [0, 1, 2].map((v) => strip((t) => drawFar(t, v, GREY))),
    near: [0, 1, 2, 3].map((v) => strip((t) => drawNear(t, v, GREY, false))),
    farBirch: [0, 1, 2].map((v) => strip((t) => drawFar(t, v, BIRCH_FAR))),
    nearBirch: [0, 1, 2].map((v) => strip((t) => drawNear(t, v, BIRCH, true))),
    // canopies
    farTop: canopy(true, CANOPY_FAR, 41, true), farBody: canopy(false, CANOPY_FAR, 43, true),
    nearTop: canopy(true, CANOPY, 47, false), nearBody: canopy(false, CANOPY, 53, false),
  };
}
