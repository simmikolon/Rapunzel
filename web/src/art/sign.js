import { PX } from '../config.js';
import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// Trimmings for the wooden menu sign. src/sign.js draws the boards, the
// frame and the ropes with rectangles so a sign can be any size; these are
// the pieces with a shape: a vine curling over the top-left corner, its
// mirror image hanging off the bottom-right, and the bow tied into the
// right rope. Art pixels; each anchor is the point that sits on the sign.

// Stems as pixel runs, leaves as small ellipses with a lit tip, one flower.
const STEM_TOP = [[10, 9], [11, 9], [12, 9], [13, 8], [14, 8], [15, 8], [16, 8], [17, 9], [18, 9], [19, 9], [20, 9], [21, 8], [22, 8], [23, 8]];
const STEM_LEFT = [[9, 10], [9, 11], [8, 12], [8, 13], [8, 14], [8, 15], [9, 16], [9, 17], [9, 18], [8, 19], [8, 20], [8, 21]];
const LEAVES = [[14, 6, 1], [19, 11, -1], [22, 6, 1], [5, 13, -1], [11, 15, 1], [5, 18, -1], [11, 20, 1]];
const VINE_W = 24, VINE_H = 22;

// `m` mirrors the drawing through both axes for the bottom-right corner.
function drawVine(t, m) {
  const { p } = t;
  const X = (x) => (m ? VINE_W - 1 - x : x), Y = (y) => (m ? VINE_H - 1 - y : y);
  const q = (x, y, c) => p(X(x), Y(y), 1, 1, c);
  for (const [x, y] of STEM_TOP) q(x, y, C.leafDark);
  for (const [x, y] of STEM_LEFT) q(x, y, C.leafDark);
  for (const [x, y, side] of LEAVES) {
    // a leaf: 5 x 3 with pointed ends, darker edge, a bright tip
    for (let dx = -2; dx <= 2; dx++) q(x + dx, y, Math.abs(dx) === 2 ? C.leafDark : C.leaf);
    q(x, y - 1, C.leaf); q(x, y + 1, C.leafDark);
    q(x + 2 * side, y, C.grassLight);
  }
  // the bunch at the corner: a round leaf cluster, a pink flower on top
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) q(9 + dx, 8 + dy, dx + dy < -1 ? C.grassLight : dx + dy > 2 ? C.leafDark : C.leaf);
  q(5, 6, C.ribbonHi); q(7, 6, C.ribbonHi); q(6, 5, C.ribbonHi); q(6, 7, C.ribbonHi); q(6, 6, C.gold);
  q(16, 11, C.gold); q(17, 11, C.gold); q(16, 12, C.gold); q(17, 12, C.gold); q(17, 11, C.sun1);
}

const BOW = [
  '..aaa....aaa..',
  '.acbba..abbca.',
  '.abbbaaaabbba.',
  '.abbbaccabbba.',
  '..abbbccbbba..',
  '...aabccbaa...',
  '....ab..ba....',
  '...abb..bba...',
  '...ab....ba...',
  '....a....a....',
];
const BOW_COL = { a: C.bowDark, b: C.bow, c: C.bowHi };

export function buildSign() {
  return {
    vineTL: makeSprite(VINE_W, VINE_H, (t) => drawVine(t, false), undefined, { axPx: 9 * PX, ayPx: 9 * PX }),
    vineBR: makeSprite(VINE_W, VINE_H, (t) => drawVine(t, true), undefined, { axPx: (VINE_W - 10) * PX, ayPx: (VINE_H - 10) * PX }),
    bow: makeSprite(14, 10, ({ p }) => BOW.forEach((row, y) => row.split('').forEach((ch, x) => p(x, y, 1, 1, BOW_COL[ch]))), undefined, { axPx: 7 * PX, ayPx: 4 * PX }),
  };
}
