import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// Sky lanterns: a big paper lantern the prince can bounce on (34 x 40 art
// px, anchored at the top rim, which is the landing surface) in two
// colourways, and a tiny one for the field of lanterns rising behind the
// tower at night.
const WAYS = [
  { paper: C.lanternPaper, hi: C.lanternHi, band: '#f0b860', deep: '#c98a3c' },
  { paper: '#ffb0c8', hi: '#ffe0ea', band: '#e07aa0', deep: '#b04f78' },
];

function drawBig(t, way) {
  const { p, ellipse, line } = t;
  const c = WAYS[way];
  // 34 x 40: top rim and the loop
  p(11, 0, 12, 2, C.lanternFrame); p(15, 0, 4, 1, '#d9a062');
  // paper body: a tall rounded shape, lit band in the middle, deeper toward the bottom
  ellipse(17, 18, 15, 16, c.deep);
  ellipse(17, 17, 14, 15, c.paper);
  ellipse(17, 13, 11, 8, c.hi);
  p(4, 23, 26, 3, c.band); p(5, 27, 24, 2, c.band);
  // bamboo ribs
  for (const x of [7, 17, 27]) line(x, 3, x, 33, C.lanternFrame);
  line(3, 10, 31, 10, C.lanternFrame); line(3, 25, 31, 25, C.lanternFrame);
  // the flame glow seen through the paper
  ellipse(17, 19, 5, 6, C.lanternGlow); ellipse(17, 18, 2, 3, C.sun1);
  // bottom rim and tassel
  p(10, 33, 14, 2, C.lanternFrame); p(15, 35, 4, 1, C.lanternFrame);
  p(16, 36, 2, 3, C.capeHi); p(15, 38, 4, 2, C.cape);
}

function drawFar(t) {
  const { p } = t;
  p(1, 0, 4, 1, C.lanternFrame);
  p(0, 1, 6, 6, C.lanternPaper); p(1, 2, 4, 3, C.lanternHi);
  p(2, 3, 2, 2, C.lanternGlow);
  p(1, 7, 4, 1, C.lanternFrame);
}

export function buildLanterns() {
  return {
    big: [0, 1].map((w) => makeSprite(34, 40, (t) => drawBig(t, w), { ax: 0.5, ay: 0 })),
    far: makeSprite(6, 8, (t) => drawFar(t), { ax: 0.5, ay: 0.5 }),
  };
}
