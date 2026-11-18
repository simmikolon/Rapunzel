import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// The power-ups as pickups, about 14 art px each (a sun is 11, the prince's
// head 10 wide), two frames each, the soap bubble they float in, and the
// pair of wings the feather gives the prince. Lit from the upper left like everything in the prince's plane.
// Each has an idea of its own: the shooting star smiles and winks and drags
// a rainbow, the cloak is a hood with nobody in it but two eyes and fades
// out, the spring is a toy launcher that squashes, the magnet pulls sparks,
// the feather is the stork's.
const K = {
  // the cloak of invisibility: moonlit lilac blue
  cloakHi: '#e6ecff', cloak: '#a9b8f2', cloakShade: '#7482d4', cloakDark: '#3c4585',
  // the star's rainbow tail
  tailPink: C.ribbonHi, tailGold: C.sun2, tailBlue: '#7fd0e8',
  // the magnet: red lacquer, steel tips
  magHi: C.heartHi, mag: C.heart, magDark: C.heartDark, steelHi: C.springHi, steel: C.spring, steelShade: C.pole,
  // the spring: the braid's gold, a red cushion on top
  goldHi: C.braidHi, gold: C.braid, goldShade: C.braidShade, goldDark: C.braidDark, pad: C.cape, padHi: C.capeHi,
  // the soap bubble's shell
  bubbleHi: '#ffffff', bubble: '#d6ecf5', bubbleShade: '#9cc3d6',
};

// Row spans [y, x0, x1] in one colour.
const rows = (p, spans, color, ox = 0, oy = 0) => { for (const [y, x0, x1] of spans) p(ox + x0, oy + y, x1 - x0 + 1, 1, color); };
// A shape from row spans in three flat planes: lit where nothing of it lies
// above, shaded where nothing lies below, the base in between.
function planes(p, spans, hi, base, shade, ox = 0, oy = 0) {
  const has = new Set();
  for (const [y, x0, x1] of spans) for (let x = x0; x <= x1; x++) has.add(x + ',' + y);
  for (const [y, x0, x1] of spans) for (let x = x0; x <= x1; x++) {
    p(ox + x, oy + y, 1, 1, !has.has(x + ',' + (y - 1)) ? hi : !has.has(x + ',' + (y + 1)) ? shade : base);
  }
}

// Shooting star, 17 x 16 art px: a plump star at the upper right, its
// rainbow tail running down to the left behind it. Frame 0 smiles with its
// eyes shut, frame 1 winks and a glint sits on its top point.
const STAR = [[0, 6, 6], [1, 5, 7], [2, 5, 7], [3, 4, 8], [4, 0, 12], [5, 0, 12], [6, 1, 11], [7, 2, 10], [8, 2, 10], [9, 1, 11], [10, 1, 5], [10, 7, 11], [11, 0, 3], [11, 9, 12], [12, 0, 1], [12, 11, 12]];
function drawStar(t, frame) {
  const { p } = t;
  const ox = 4;
  // the tail: three stripes side by side, a pixel further left each row, the outer ones shorter
  for (let k = 0; k <= 5; k++) {
    p(5 - k, 8 + k, 2, 1, K.tailPink);
    if (k <= 5) p(6 - k, 9 + k, k === 5 ? 1 : 2, 1, K.tailGold);
    if (k <= 4) p(7 - k, 10 + k, k === 4 ? 1 : 2, 1, K.tailBlue);
  }
  rows(p, STAR, C.sun2, ox);
  // lit planes: the top point's left side, the left arm's top, a block on the body
  p(ox + 6, 0, 1, 1, C.sun1); p(ox + 5, 1, 1, 3, C.sun1); p(ox + 4, 3, 1, 1, C.sun1);
  p(ox + 0, 4, 5, 1, C.sun1); p(ox + 2, 6, 3, 1, C.sun1);
  p(ox + 5, 2, 1, 1, C.white);
  // shaded planes: the right arm's underside, the legs' undersides, the top point's right side
  p(ox + 7, 2, 1, 2, C.sun3); p(ox + 8, 3, 1, 1, C.sun3);
  p(ox + 11, 5, 2, 1, C.sun3); p(ox + 10, 6, 2, 1, C.sun3);
  p(ox + 9, 10, 3, 1, C.sun3); p(ox + 9, 11, 4, 1, C.sun3); p(ox + 11, 12, 2, 1, C.sun3);
  p(ox + 2, 11, 2, 1, C.sun3); p(ox + 0, 12, 2, 1, C.sun3);
  // the face: eyes shut, content (frame 1 opens one: a wink), cheeks, a small smile
  p(ox + 3, 7, 2, 1, C.black);
  if (frame) { p(ox + 8, 6, 2, 2, C.eyeWhite); p(ox + 9, 7, 1, 1, C.black); p(ox + 6, 0, 1, 1, C.white); p(ox + 6, 1, 1, 1, C.sun1); }
  else p(ox + 8, 7, 2, 1, C.black);
  p(ox + 2, 9, 1, 1, C.cheek); p(ox + 10, 9, 1, 1, C.cheek);
  p(ox + 5, 8, 1, 1, C.furDark); p(ox + 6, 9, 1, 1, C.furDark); p(ox + 7, 8, 1, 1, C.furDark);
}

// The cloak of invisibility, 14 x 14 art px: a hood and shoulders with
// nobody inside but two eyes, a gold clasp, the hem dissolving. In frame 1
// it has all but gone: a dotted ghost of itself and the eyes.
const CLOAK = [[0, 5, 8], [1, 4, 9], [2, 3, 10], [3, 3, 10], [4, 3, 10], [5, 3, 10], [6, 3, 10], [7, 2, 11], [8, 1, 12], [9, 1, 12], [10, 0, 13]];
function drawCloak(t, frame) {
  const { p, hatch } = t;
  if (frame) {
    for (const [y, x0, x1] of CLOAK) hatch(x0, y, x1 - x0 + 1, 1, K.cloak, 2, 0);
    hatch(0, 11, 14, 1, K.cloakShade, 4, 1);
  } else {
    rows(p, CLOAK, K.cloak);
    // lit along the hood's left and top, shaded down the right
    p(5, 0, 3, 1, K.cloakHi); p(4, 1, 2, 1, K.cloakHi); p(3, 2, 1, 5, K.cloakHi); p(2, 7, 1, 1, K.cloakHi); p(1, 8, 1, 2, K.cloakHi); p(0, 10, 1, 1, K.cloakHi);
    p(10, 3, 1, 4, K.cloakShade); p(11, 7, 1, 1, K.cloakShade); p(11, 8, 2, 2, K.cloakShade); p(11, 10, 3, 1, K.cloakShade);
    p(4, 7, 6, 1, K.cloakShade);                       // the shadow under the hood
    p(8, 8, 1, 3, K.cloakShade);                       // a fold
    // the hem dissolves
    hatch(0, 11, 14, 1, K.cloak, 2, 1); hatch(0, 12, 14, 1, K.cloakShade, 3, 0); hatch(1, 13, 12, 1, K.cloakShade, 4, 2);
    p(6, 7, 2, 2, C.gold); p(7, 8, 1, 1, C.goldDark);  // the clasp
  }
  // the empty hood and the eyes in it
  p(5, 3, 4, 4, K.cloakDark); p(4, 4, 1, 2, K.cloakDark); p(9, 4, 1, 2, K.cloakDark);
  p(5, 4, 1, 2, C.white); p(8, 4, 1, 2, C.white);
  if (!frame) { p(5, 5, 1, 1, K.cloakHi); p(8, 5, 1, 1, K.cloakHi); }
}

// The golden spring, 12 x 16 art px: a toy launcher with a red cushion,
// standing on the canvas's bottom row. Frame 0 stretched, frame 1 squashed.
function drawSpring(t, frame) {
  const { p } = t;
  const bars = 5, link = frame ? 0 : 1;
  const h = 2 + 1 + bars + (bars - 1) * link + 2;
  let y = 16 - h;
  p(2, y, 8, 1, K.padHi); p(1, y + 1, 10, 1, K.pad); p(2, y, 2, 1, C.cheek); y += 2;      // cushion
  p(0, y, 12, 1, K.goldHi); p(9, y, 3, 1, K.gold); y += 1;                                 // top plate
  for (let i = 0; i < bars; i++) {
    p(1, y, 10, 1, i % 2 ? K.goldShade : K.gold); p(1, y, 3, 1, K.goldHi); p(10, y, 1, 1, K.goldDark);
    y += 1;
    if (link && i < bars - 1) { p(i % 2 ? 1 : 8, y, 3, 1, K.goldDark); y += 1; }           // the wire turning back
  }
  p(0, y, 12, 1, K.goldShade); p(0, y, 3, 1, K.gold); p(0, y + 1, 12, 1, K.goldDark);      // base
}

// The sun magnet, 13 x 13 art px: a red horseshoe with steel tips pointing
// down. In frame 1 sparks jump between the tips.
const MAGNET = [[0, 3, 9], [1, 1, 11], [2, 0, 12], [3, 0, 12], [4, 0, 4], [4, 8, 12], [5, 0, 3], [5, 9, 12], [6, 0, 3], [6, 9, 12], [7, 0, 3], [7, 9, 12], [8, 0, 3], [8, 9, 12]];
function drawMagnet(t, frame) {
  const { p } = t;
  rows(p, MAGNET, K.mag);
  p(3, 0, 5, 1, K.magHi); p(1, 1, 3, 1, K.magHi); p(0, 2, 1, 7, K.magHi); p(1, 2, 1, 2, K.magHi);   // lit: top left of the bow, the left arm's face
  p(12, 3, 1, 6, K.magDark); p(10, 1, 2, 1, K.magDark); p(3, 5, 1, 4, K.magDark); p(5, 3, 3, 1, K.magDark);   // shaded: right face, inside of the bow
  p(9, 5, 1, 4, K.magHi);
  for (const x of [0, 9]) { p(x, 9, 4, 1, K.steelHi); p(x, 10, 4, 2, K.steel); p(x, 11, 4, 1, K.steelShade); p(x, 10, 1, 1, K.steelHi); }
  if (frame) { p(5, 10, 1, 1, C.sun1); p(7, 11, 1, 1, C.sun1); p(6, 12, 1, 1, C.sun2); p(6, 9, 1, 1, C.white); }
  else { p(6, 11, 1, 1, C.sun2); }
}

// The stork's feather, 12 x 12 art px: a white vane leaning to the upper
// right, its tip black like the stork's flight feathers, the quill at the
// lower left.
const VANE = [[0, 8, 10], [1, 6, 11], [2, 5, 11], [3, 4, 11], [4, 3, 10], [5, 3, 9], [6, 2, 8], [7, 2, 7], [8, 2, 6], [9, 1, 4]];
const SHAFT = [9, 8, 7, 6, 5, 5, 4, 3, 2];     // the shaft's column in rows 1 to 9
function drawFeather(t) {
  const { p } = t;
  for (const [y, x0, x1] of VANE) {
    const sx = y >= 1 ? SHAFT[y - 1] : 9;
    for (let x = x0; x <= x1; x++) p(x, y, 1, 1, x < sx ? C.storkHi : x === x1 && y >= 3 ? C.storkShade : C.stork);
    if (y >= 1) p(sx, y, 1, 1, C.storkShade);
  }
  p(8, 0, 3, 1, C.crow); p(9, 1, 3, 1, C.crow); p(11, 2, 1, 2, C.crow); p(9, 0, 1, 1, C.crowHi);   // the black tip
  p(9, 4, 1, 1, C.storkDeep); p(6, 7, 1, 1, C.storkDeep);       // gaps between the barbs
  p(1, 10, 2, 1, C.storkShade); p(0, 11, 1, 1, C.storkDeep);    // the quill
}

// A wing for the prince's back while the feather lasts, 15 x 10 art px,
// reaching right from its root (the anchor): frame 0 raised, frame 1
// lowered. The leading edge is round, the trailing edge ends in feather tips.
const WING_UP = [[0, 8, 11], [1, 6, 12], [2, 4, 13], [3, 3, 14], [4, 2, 14], [5, 1, 9], [5, 11, 14], [6, 0, 7], [6, 9, 11], [7, 0, 5], [7, 7, 9], [8, 0, 3], [8, 5, 6], [9, 0, 1]];
const WING_DOWN = [[0, 0, 2], [1, 0, 6], [2, 0, 9], [3, 1, 12], [4, 1, 13], [5, 2, 14], [6, 2, 3], [6, 5, 14], [7, 5, 6], [7, 8, 14], [8, 8, 9], [8, 11, 14], [9, 11, 13]];
function drawWing(t, frame) {
  planes(t.p, frame ? WING_DOWN : WING_UP, C.storkHi, C.stork, C.storkShade);
}

// The soap bubble every power-up floats in, 26 x 26 art px: a thin shell,
// white where the light catches it at the upper left, darker at the lower
// right, with a window glint; `bubbleFill` is its inside as a flat disc
// (drawn faint in the power-up's colour, the shell over it).
const BUBBLE_R = 12;
function drawBubble(t) {
  const { p } = t;
  const c = 13, r = BUBBLE_R;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y;
    if (d > r * r + r * 0.5 || d <= (r - 1) * (r - 1) + (r - 1) * 0.5) continue;
    p(c + x, c + y, 1, 1, x + y < -7 ? K.bubbleHi : x + y > 8 ? K.bubbleShade : K.bubble);
  }
  p(6, 6, 3, 1, K.bubbleHi); p(5, 7, 1, 3, K.bubbleHi); p(7, 7, 1, 1, K.bubbleHi);    // the window's reflection
  p(19, 20, 2, 1, K.bubble); p(20, 19, 1, 1, K.bubble);                                // and its echo below
}
function drawBubbleFill(t) { t.disc(13, 13, BUBBLE_R - 1, C.white); }

export function buildPowerups() {
  const two = (w, h, draw, anchor, opts) => [0, 1].map((f) => makeSprite(w, h, (t) => draw(t, f), anchor, opts));
  const mid = { ax: 0.5, ay: 0.5 };
  const feather = makeSprite(12, 12, drawFeather, mid);
  return {
    star: two(17, 16, drawStar, undefined, { axPx: 10.5 * 4, ayPx: 6.5 * 4 }),
    cloak: two(14, 14, drawCloak, mid),
    spring: two(12, 16, drawSpring, mid),
    magnet: two(13, 13, drawMagnet, mid),
    feather: [feather, feather],
    wings: [makeSprite(15, 10, (t) => drawWing(t, 0), undefined, { axPx: 0, ayPx: 7.5 * 4 }), makeSprite(15, 10, (t) => drawWing(t, 1), undefined, { axPx: 0, ayPx: 1.5 * 4 })],
    bubble: makeSprite(26, 26, drawBubble, mid),
    bubbleFill: makeSprite(26, 26, drawBubbleFill, mid),
  };
}
