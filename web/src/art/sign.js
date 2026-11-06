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

// A four-point sparkle (the effects button), a tilted phone (the tilt
// button, its screen lit when tilt is on) and a star (stomps on game over).
function drawSparkle(t) {
  const { p } = t;
  for (let i = 0; i < 9; i++) { p(4, i, 1, 1, C.braidDark); p(i, 4, 1, 1, C.braidDark); }
  for (let i = 1; i < 8; i++) { p(4, i, 1, 1, C.braid); p(i, 4, 1, 1, C.braid); }
  p(3, 3, 3, 3, C.braidHi); p(4, 4, 1, 1, C.white);
  for (const [x, y] of [[2, 2], [6, 2], [2, 6], [6, 6]]) p(x, y, 1, 1, C.braidShade);
}
function drawPhone(t, on) {
  const { p } = t;
  // leaning right: every two rows the body shifts one pixel
  for (let y = 0; y < 12; y++) {
    const x0 = 5 - Math.floor(y / 2);
    p(x0, y, 6, 1, C.uiDark);
    if (y > 0 && y < 10) p(x0 + 1, y, 4, 1, on ? C.gold : C.stoneLight);
  }
  p(1, 10, 2, 1, C.stone); p(2, 1, 2, 1, C.white);
}
function drawStar(t) {
  const { p } = t;
  for (let i = 0; i < 7; i++) { p(3, i, 1, 1, C.braidDark); p(i, 3, 1, 1, C.braidDark); }
  for (let i = 1; i < 6; i++) { p(3, i, 1, 1, C.sun2); p(i, 3, 1, 1, C.sun2); }
  p(2, 2, 3, 3, C.sun1); p(2, 2, 1, 1, C.sun2); p(4, 4, 1, 1, C.sun3);
}

// Rapunzel peeking over the sign's top edge: her head and shoulders (drawn
// behind the sign, so the frame hides the rest) and her hands on the edge
// (drawn over it). 18 x 20 art px, anchored at the bottom centre.
function drawRapunzel(t, blink) {
  const { p, disc, ellipse } = t;
  // hair: a golden mass with a shaded rim and a lock down each side
  disc(9, 8, 8, C.braidShade);
  disc(9, 7, 7, C.braid);
  p(1, 8, 3, 12, C.braidShade); p(2, 8, 2, 11, C.braid);
  p(14, 8, 3, 12, C.braidShade); p(14, 8, 2, 11, C.braid);
  // face
  ellipse(9, 10, 5, 5, C.skin);
  ellipse(9, 14, 3, 1, C.skinShade);
  // fringe with lit strands
  p(4, 5, 11, 2, C.braid); p(5, 5, 3, 1, C.braidHi); p(11, 5, 3, 1, C.braidHi); p(9, 6, 1, 1, C.braidShade);
  // eyes, cheeks, a smile
  if (blink) { p(7, 10, 1, 1, C.hair); p(11, 10, 1, 1, C.hair); }
  else { p(7, 9, 1, 2, C.hair); p(11, 9, 1, 2, C.hair); }
  p(5, 11, 1, 1, C.cheek); p(13, 11, 1, 1, C.cheek);
  p(8, 12, 1, 1, C.skinShade); p(10, 12, 1, 1, C.skinShade); p(9, 13, 1, 1, C.skinShade);
  // a flower over her ear
  p(3, 4, 1, 1, C.ribbonHi); p(2, 5, 1, 1, C.ribbonHi); p(4, 5, 1, 1, C.ribbonHi); p(3, 6, 1, 1, C.ribbonHi); p(3, 5, 1, 1, C.gold);
  // neck and the dress, mostly behind the sign
  p(8, 15, 3, 2, C.skinShade);
  p(4, 17, 11, 3, C.ribbon); p(4, 17, 11, 1, C.ribbonHi);
}
function drawHands(t) {
  const { p } = t;
  p(1, 0, 4, 2, C.skin); p(13, 0, 4, 2, C.skin);
  p(2, 1, 1, 1, C.skinShade); p(4, 1, 1, 1, C.skinShade); p(14, 1, 1, 1, C.skinShade); p(16, 1, 1, 1, C.skinShade);
  p(1, 2, 4, 1, C.skinShade); p(13, 2, 4, 1, C.skinShade);
}

export function buildSign() {
  return {
    rapunzel: makeSprite(18, 20, (t) => drawRapunzel(t, false), { ax: 0.5, ay: 1 }),
    rapunzelBlink: makeSprite(18, 20, (t) => drawRapunzel(t, true), { ax: 0.5, ay: 1 }),
    hands: makeSprite(18, 3, drawHands, { ax: 0.5, ay: 1 }),
    sparkle: makeSprite(9, 9, drawSparkle, { ax: 0.5, ay: 0.5 }),
    phone: makeSprite(11, 12, (t) => drawPhone(t, false), { ax: 0.5, ay: 0.5 }),
    phoneOn: makeSprite(11, 12, (t) => drawPhone(t, true), { ax: 0.5, ay: 0.5 }),
    star: makeSprite(7, 7, drawStar, { ax: 0.5, ay: 0.5 }),
    vineTL: makeSprite(VINE_W, VINE_H, (t) => drawVine(t, false), undefined, { axPx: 9 * PX, ayPx: 9 * PX }),
    vineBR: makeSprite(VINE_W, VINE_H, (t) => drawVine(t, true), undefined, { axPx: (VINE_W - 10) * PX, ayPx: (VINE_H - 10) * PX }),
    bow: makeSprite(14, 10, ({ p }) => BOW.forEach((row, y) => row.split('').forEach((ch, x) => p(x, y, 1, 1, BOW_COL[ch]))), undefined, { axPx: 7 * PX, ayPx: 4 * PX }),
  };
}
