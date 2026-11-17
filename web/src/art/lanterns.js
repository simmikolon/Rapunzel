import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// Sky lanterns: a big paper lantern the prince can bounce on (34 x 40 art
// px, anchored at the top, which is the landing surface) in two
// colourways, and a tiny one for the field of lanterns rising behind the
// tower at night.
//
// A sky lantern is a paper bag lit by a flame at its open bottom, so the
// paper is brightest in a dome above the flame and darkest under the closed
// top; the sky lights the top edge, the right side turns away. Each
// colourway carries a motif painted on the paper, seen against the light as
// a dark shape: a crown on the gold one, a tulip on the pink one.
const WAYS = [
  { hi: C.lanternHi, paper: C.lanternPaper, shade: C.lanternShade, deep: C.lanternDeep, motif: 'crown' },
  { hi: C.lanternPinkHi, paper: C.lanternPink, shade: C.lanternPinkShade, deep: C.lanternPinkDeep, motif: 'tulip' },
];
const W = 34;
// The bag's outline, row by row: [first row, inset from both sides].
const BAG = [[0, 6], [1, 3], [2, 2], [3, 1], [15, 2], [23, 3], [28, 4], [32, 5]];
const BAG_BOTTOM = 33;
const inset = (y) => { let s = 0; for (const [y0, i] of BAG) if (y >= y0) s = i; return s; };
// The bright dome above the flame, a little left of centre (the sky's side).
const DOME = { cx: 16, rx: 10, ry: 15 };
const inDome = (x, y) => { const d = (BAG_BOTTOM - y) / DOME.ry; if (d > 1) return false; const hw = DOME.rx * Math.sqrt(1 - d * d); return x >= Math.round(DOME.cx - hw) && x <= Math.round(DOME.cx + hw) - 1; };

function drawBig(t, way) {
  const { p } = t;
  const c = WAYS[way];
  const span = (y, x0, x1, color) => { const i = inset(y); x0 = Math.max(x0, i); x1 = Math.min(x1, W - 1 - i); if (x1 >= x0) p(x0, y, x1 - x0 + 1, 1, color); };
  const at = (x, y, color) => { if (x >= inset(y) && x <= W - 1 - inset(y)) p(x, y, 1, 1, color); };
  // the paper, then the light: darker under the top, bright above the flame
  for (let y = 0; y <= BAG_BOTTOM; y++) span(y, 0, W, c.paper);
  for (let y = 1; y <= 7; y++) span(y, 0, W, c.shade);
  for (const [y, x0, x1] of [[8, 0, 9], [8, 22, 33], [9, 0, 5], [9, 27, 33], [10, 29, 33]]) span(y, x0, x1, c.shade);
  for (let y = 0; y <= BAG_BOTTOM; y++) for (let x = 0; x < W; x++) if (inDome(x, y)) at(x, y, c.hi);
  span(0, 9, 21, c.hi);                                                      // the sky on the top edge
  // the right side turns away from the light; a softer edge on the left
  for (let y = 2; y <= BAG_BOTTOM; y++) { const r = W - 1 - inset(y); p(r, y, 1, 1, c.deep); if (y > 4 && !inDome(r - 1, y)) p(r - 1, y, 1, 1, c.shade); }
  for (let y = 4; y <= 26; y++) p(inset(y), y, 1, 1, c.shade);
  // paper seams, bowing with the bag; faint where the light is strong
  for (const [xt, xb] of [[8, 10], [17, 17], [25, 23]]) {
    for (let y = 2; y <= BAG_BOTTOM; y++) { const x = Math.round(xt + (xb - xt) * (y - 2) / (BAG_BOTTOM - 2)); p(x, y, 1, 1, inDome(x, y) ? c.paper : c.shade); }
  }
  // the painted motif, dark against the light
  if (c.motif === 'crown') {
    for (const [x, y] of [[12, 12], [16, 11], [17, 11], [21, 12]]) p(x, y, 1, 1, c.deep);
    p(12, 13, 2, 1, c.deep); p(15, 12, 4, 2, c.deep); p(20, 13, 2, 1, c.deep);
    p(12, 14, 10, 3, c.deep); p(16, 15, 2, 1, c.hi);
  } else {
    // a tulip: three petal points, the cup, a stem between two leaves
    for (const x of [14, 16, 18]) p(x, 10, 1, 1, c.deep);
    p(14, 11, 5, 2, c.deep); p(15, 13, 3, 1, c.deep);
    p(16, 14, 1, 5, c.deep);
    p(13, 15, 1, 1, c.deep); p(14, 16, 2, 1, c.deep); p(19, 15, 1, 1, c.deep); p(17, 16, 2, 1, c.deep);
    p(15, 11, 1, 1, c.shade);
  }
  // bamboo ring at the opening, wires down to the fuel cake, its flame
  p(7, 34, 20, 2, C.lanternFrame); p(8, 34, 16, 1, C.lanternFrameHi);
  p(9, 36, 1, 1, C.lanternFrame); p(10, 37, 3, 1, C.lanternFrame);
  p(24, 36, 1, 1, C.lanternFrame); p(21, 37, 3, 1, C.lanternFrame);
  p(13, 38, 8, 2, C.lanternFrame); p(13, 38, 4, 1, C.lanternFrameHi);
  p(15, 35, 4, 3, C.flame3); p(16, 34, 2, 4, C.flame2); p(16, 35, 1, 2, C.flame1);
}

// The far lantern, 6 x 8: the same bag, lit from below.
function drawFar(t) {
  const { p } = t;
  p(1, 0, 4, 1, C.lanternShade);
  p(0, 1, 6, 4, C.lanternShade); p(0, 3, 6, 2, C.lanternPaper);
  p(1, 5, 4, 1, C.lanternPaper); p(1, 4, 3, 2, C.lanternHi);
  p(5, 1, 1, 4, C.lanternDeep);
  p(1, 6, 4, 1, C.lanternFrame);
  p(2, 7, 2, 1, C.flame2);
}

export function buildLanterns() {
  return {
    big: [0, 1].map((w) => makeSprite(34, 40, (t) => drawBig(t, w), { ax: 0.5, ay: 0 })),
    far: makeSprite(6, 8, (t) => drawFar(t), { ax: 0.5, ay: 0.5 }),
  };
}
