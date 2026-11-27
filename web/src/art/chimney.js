import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';
import { STONEWORK as K } from './interior.js';

// The chimney (chimney.js): Lord Springalot's room. A fireplace in the
// tower leads into it and a soot door out of it again; between them a
// brick shaft, narrow and black with soot, with ledges of brick, kettles
// on the pot chain and iron dampers one bumps one's head on.
//
// Brick is a ramp of its own, warm and dull: the walls are what stands
// closest, the back of the shaft is the same brick under soot. Nothing in
// here is as bright as the suns and the lord's red shirt.
const BRICK = { hi: '#86594c', base: '#6c4540', shade: '#553536', dark: '#3e262b', mortar: '#2b1a20' };
const SOOT = { hi: '#514552', base: '#3e343f', shade: '#2f2731', dark: '#231c25', mortar: '#18131a' };
const IRON = { hi: '#c9c6d6', base: '#8f8ca1', shade: '#5f5c75', dark: '#3a374c' };
const TOWER = ['#3a2f52', '#5a4470', '#7a5a6a'];                      // the tower's dusk, seen through the soot door
// the same brick where the smoke has gone over it for years (the walls, toward the shaft)
const SMOKED = { hi: '#5f4244', base: '#4c3438', shade: '#3c292e', dark: '#2c1e24', mortar: '#1e151a' };
// dressed stone under soot: the corners of the shaft, the niches, the hearth
const STONE = { hi: '#958c85', base: '#787069', shade: '#5a5351', dark: '#3f3a3e' };
const OWL = { hi: '#c9a37a', base: '#a07a55', dark: '#6e5038', belly: '#e6d2b0', eye: '#ffe27a' };
const MOUSE = { hi: '#cfc9d6', base: '#a9a3b0', dark: '#7a7486' };
const NEST = { hi: '#b9a26a', base: '#8d7445', dark: '#5a4a2e', chick: '#f2e6a0', chickShade: '#d9c26a' };
const MEAT = { hi: '#c9755a', base: '#9a4a3a', dark: '#6a2f2a', fat: '#f2dcb8' };
const BRISTLE = { hi: C.broomStraw, base: '#b8923f', dark: C.broom };
const CHALK = '#d9d2e0', WEB = '#bdb8c9', STEAM = '#d9d6e6', HOLE = '#0a080c';
const SKY = ['#8fd0ff', '#bfe6ff'];

// What the painter and the world colour with at runtime.
export const CHIMNEY_LOOK = {
  dark: '#120e14', throat: '#1c161e', lip: '#4a3038', lipHi: '#74403c',
  ambient: '#b3a6b0', dim: 0.2, emberLight: '#ff9a4a', dayLight: '#cfe0ff', candleLight: '#ffd596', eyes: '#ffe98a', mouseEyes: '#ffd0d8',
  soot: '#0c0a0e', smoke: '#6a6070', spark: ['#fff3a0', '#ffd04a', '#ff8a3d'], rope: '#a68b55', back: '#8f8798',
};

// Courses of brick over x0 .. x1 of a tile h art px high: a brick is 8 x 4
// with its joint, every other course set off by half a brick, and the
// courses line up from one call to the next. `R` colours them; a seeded
// RNG makes some lighter, some darker. `edge(row)` may move x1 for a
// course, so that two kinds of brick do not meet along a ruled line.
function bricks(t, x0, x1, h, R, seed, lit, edge) {
  const { p } = t, rng = new RNG(seed);
  for (let row = 0; row * 4 < h; row++) {
    const y = row * 4, off = row % 2 ? -4 : 0, to = edge ? edge(row) : x1;
    p(x0, y, to - x0, 4, R.mortar);
    for (let x = off; x < to; x += 8) {
      const k = rng.next(), a = Math.max(x0, x), b = Math.min(to, x + 7);
      if (b <= a) continue;
      const body = k < 0.16 ? R.shade : k > 0.86 ? R.hi : R.base;
      p(a, y, b - a, 3, body);
      if (lit && k > 0.3) p(a, y, b - a, 1, k > 0.6 ? R.hi : body);                 // the top edge catches the light
      if (k > 0.55 && k < 0.63 && b - a > 4) p(a + 2, y + 1, 2, 1, R.dark);         // a chip
    }
  }
}
// soot that has run down a wall
function streaks(t, x0, x1, h, color, seed, n) {
  const { p } = t, rng = new RNG(seed);
  for (let i = 0; i < n; i++) {
    const x = rng.int(x0 + 1, x1 - 2), y0 = rng.int(0, h - 8), len = rng.int(5, 12);
    for (let y = y0; y < Math.min(h, y0 + len); y++) if ((y + x) % 4 !== 3) p(x, y, 1, 1, color);
  }
}

// A side wall of the shaft, 48 x 32 art px, as it stands on the left: its
// right edge is the corner he bounces along. Brick, smoked black toward the
// shaft; the corner is built of dressed stone, long and short blocks in
// turn, lit along the arris. Four of them: one with a stone fallen out
// and a crack, one with an iron tie, one mended with newer brick, and a
// plain one, which is most of the wall.
function drawWall(t, v) {
  const { p, line } = t, seed = [3, 11, 29, 47][v], rng = new RNG(seed + 100);
  const meet = [0, 1, 2, 3, 4, 5, 6, 7].map(() => 30 + rng.int(0, 2) * 4);      // where the smoke ends, course by course
  bricks(t, 0, 48, 32, SMOKED, seed + 7, false);
  bricks(t, 0, 40, 32, BRICK, seed, true, (row) => meet[row]);
  streaks(t, 4, 30, 32, BRICK.dark, seed + 1, 3);
  for (let y = 0; y < 32; y++) if ((y * 7 + seed) % 5 < 2) p(0, y, 3 + ((y * 3 + seed) % 3), 1, BRICK.shade);      // toward the picture's edge it falls into shade
  // the corner stones: two courses high, long and short
  for (let i = 0; i < 4; i++) {
    const y = i * 8, w = i % 2 ? 6 : 10, x = 48 - w, gone = v === 0 && i === 2;
    if (gone) { p(x, y, w, 7, SMOKED.dark); p(x + 1, y + 1, w - 2, 5, HOLE); continue; }         // one has fallen out: a hole, black
    p(x, y, w, 7, STONE.base); p(x, y, w, 1, STONE.hi); p(x, y + 6, w, 1, STONE.shade); p(x, y, 1, 7, STONE.shade);
    p(47, y, 1, 7, STONE.hi); p(x, y + 7, w, 1, SMOKED.mortar);
    if ((i + v) % 3 === 0) { p(x + 2, y + 2, 3, 1, SOOT.hi); p(x + 3, y + 3, 2, 2, SOOT.base); }   // soot in its pores
    if ((i + v) % 2 === 0) p(x + w - 3, y + 4, 2, 1, STONE.dark);
  }
  if (v === 0) { line(14, 2, 17, 9, BRICK.mortar); line(17, 9, 15, 15, BRICK.mortar); line(15, 15, 19, 22, BRICK.mortar); p(8, 20, 6, 3, SMOKED.dark); p(9, 21, 4, 1, HOLE); }
  if (v === 1) { line(16, 10, 22, 16, IRON.shade); line(22, 10, 16, 16, IRON.shade); p(18, 12, 3, 3, IRON.base); p(18, 12, 1, 1, IRON.hi); p(19, 13, 1, 1, IRON.dark); p(19, 17, 1, 6, BRICK.dark); }
  if (v === 2) { for (const [x, y, w] of [[8, 8, 7], [16, 8, 7], [4, 12, 7], [12, 12, 7], [20, 12, 7], [8, 16, 7], [16, 16, 7]]) { p(x, y, w, 3, BRICK.hi); p(x, y, w, 1, '#a06d5a'); } }
}

// The back of the shaft, 96 x 32 art px: the same courses under soot. Three
// of them: plain, one with bricks gone and one the sweep's brush has gone
// over (a lighter stripe).
function drawBack(t, v) {
  const { p, line } = t, seed = [5, 23, 41][v];
  bricks(t, 0, 96, 32, SOOT, seed, false);
  streaks(t, 0, 96, 32, SOOT.dark, seed + 1, 6);
  if (v === 1) { for (const [x, y] of [[20, 8], [60, 20], [68, 20], [40, 28]]) { p(x, y, 7, 3, HOLE); p(x, y, 7, 1, SOOT.dark); } line(30, 0, 33, 7, SOOT.mortar); line(33, 7, 31, 13, SOOT.mortar); }
  if (v === 2) { const rng = new RNG(9); for (let y = 0; y < 32; y += 4) for (let x = 52 + (y % 8 ? -4 : 0); x < 76; x += 8) if (rng.chance(0.7)) { p(x, y, 7, 3, SOOT.hi); p(x, y, 7, 1, '#5d515e'); } }
}

// A ledge out of the left wall, 26 x 8 art px, the anchor its top middle: a
// slab of the pale stone everything he stands on in the tower is made of,
// on two courses of brick corbelled out under it, soot lying on it.
function drawLedge(t) {
  const { p } = t;
  p(0, 0, 26, 3, K.ledge); p(0, 0, 26, 1, K.ledgeHi); p(0, 2, 26, 1, K.ledgeShade); p(25, 0, 1, 3, K.ledgeShade);
  for (const x of [9, 18]) p(x, 1, 1, 1, K.ledgeShade);
  p(0, 3, 20, 2, BRICK.base); p(0, 3, 20, 1, BRICK.shade); p(9, 3, 1, 2, BRICK.mortar);
  p(0, 5, 12, 3, BRICK.shade); p(0, 7, 12, 1, BRICK.dark);
  p(3, 0, 4, 1, SOOT.hi); p(13, 0, 3, 1, SOOT.hi);                                 // soot on it
}

// A kettle on the pot chain, 22 x 20 art px, the anchor the middle of its
// lid: black iron, round, a bail over it up to the chain, lit from above.
function drawKettle(t) {
  const { p } = t;
  const top = 6;
  // the bail, up to the hook
  p(10, 0, 2, 2, K.chain); p(4, 2, 14, 1, IRON.base); p(3, 3, 2, 3, IRON.base); p(17, 3, 2, 3, IRON.base); p(4, 2, 5, 1, IRON.hi);
  // the lid and its knob
  p(3, top, 16, 2, IRON.base); p(3, top, 16, 1, IRON.hi); p(10, top - 1, 2, 1, IRON.hi);
  // the belly
  const rows = [[2, 20], [1, 21], [0, 22], [0, 22], [0, 22], [0, 22], [1, 21], [2, 20], [4, 18], [6, 16]];
  rows.forEach(([a, b], i) => { p(a, top + 2 + i, b - a, 1, IRON.shade); p(b - 3, top + 2 + i, Math.min(3, b - a), 1, IRON.dark); });
  p(3, top + 3, 3, 4, IRON.base); p(3, top + 3, 2, 2, IRON.hi);                    // the light on its shoulder
  p(2, top + 2, 18, 1, IRON.base);                                                 // the rim
  p(7, top + 12, 2, 2, IRON.dark); p(13, top + 12, 2, 2, IRON.dark);               // feet
}

// An iron damper out of the left wall, 42 x 8 art px, the anchor its top
// middle: a plate across more than half the shaft, riveted, on a rod.
function drawDamper(t) {
  const { p } = t;
  p(0, 0, 42, 5, IRON.base); p(0, 0, 42, 1, IRON.hi); p(0, 4, 42, 1, IRON.dark); p(41, 0, 1, 5, IRON.shade);
  for (const x of [4, 14, 24, 34]) { p(x, 2, 2, 1, IRON.hi); p(x, 3, 2, 1, IRON.dark); }
  p(0, 5, 30, 1, IRON.shade); p(0, 6, 8, 2, IRON.dark);                            // the rod it turns on, into the wall
  p(9, 0, 6, 1, SOOT.hi); p(27, 0, 4, 1, SOOT.hi);
}

// The hearth the shaft stands on, 96 x 28 art px, the anchor the middle of
// its floor (row 16): a floor of stone slabs with ash on it and coals in
// the ash, and at each wall a firedog with a log across it, burning. Two
// frames: the flames.
function drawHearth(t, frame) {
  const { p } = t, rng = new RNG(77), F = 16;
  p(0, F, 96, 12, SOOT.dark);
  p(0, F, 96, 3, STONE.shade); p(0, F, 96, 1, STONE.base);
  for (let x = 14; x < 96; x += 17) p(x, F, 1, 3, STONE.dark);
  // ash, heaped toward the middle, and what still glows in it
  for (let i = 0; i < 22; i++) { const x = rng.int(22, 70), w = rng.int(2, 6); p(x, F - (i % 4 === 0 ? 1 : 0), w, 1, i % 3 ? SOOT.hi : '#6a5f6a'); }
  for (let i = 0; i < 6; i++) { const x = 24 + i * 8 + rng.int(0, 4); p(x, F, 2, 1, C.flame4); if (i % 2 === frame) p(x, F, 1, 1, C.flame3); }
  for (const m of [0, 1]) {
    const X = (x, w) => (m ? 96 - x - w : x);
    // the firedog and its logs
    p(X(17, 1), F - 8, 1, 8, IRON.shade); p(X(16, 3), F - 9, 3, 1, IRON.base); p(X(15, 5), F - 1, 5, 1, IRON.shade);
    p(X(0, 20), F - 4, 20, 3, C.barkMid); p(X(0, 20), F - 4, 20, 1, C.barkLight); p(X(0, 20), F - 2, 20, 1, C.barkDark); p(X(19, 1), F - 4, 1, 3, C.flame3);
    p(X(2, 14), F - 7, 14, 3, C.barkDark); p(X(2, 14), F - 7, 14, 1, C.barkMid); p(X(15, 1), F - 7, 1, 3, C.flame4);
    p(X(5, 2), F - 3, 2, 1, C.barkDeep); p(X(11, 1), F - 4, 1, 2, C.barkDeep);
    // the flames on them: [x, height, width], each with a paler heart
    const fl = frame ? [[1, 6, 3], [5, 9, 4], [10, 5, 3], [14, 7, 2]] : [[2, 8, 3], [6, 6, 4], [11, 8, 3], [15, 4, 2]];
    for (const [x, h, w] of fl) {
      p(X(x, w), F - 7 - h, w, h, C.flame3); p(X(x, w), F - 7 - h + 2, w, h - 2, C.flame2);
      if (h > 5) p(X(x + 1, w - 2 || 1), F - 7 - h + 4, w - 2 || 1, h - 4, C.flame1);
      p(X(x + (w > 2 ? 1 : 0), 1), F - 8 - h, 1, 1, C.flame3);
    }
    p(X(frame ? 13 : 3, 1), F - 14 - frame, 1, 1, C.flame2);        // a spark
  }
}

// --- what is in the walls ----------------------------------------------------------
// A niche in a side wall, 20 x 20 art px, the anchor the middle of its
// sill: an arched recess framed in stone, black inside. What stands in it
// is drawn apart (below), on the sill.
function drawNiche(t) {
  const { p, disc } = t;
  const cx = 10, hw = 7, spring = 9, SILL = 16;
  p(cx - hw - 2, spring, hw * 2 + 4, SILL - spring, STONE.shade); disc(cx, spring, hw + 2, STONE.shade);
  p(cx - hw - 2, spring, 1, SILL - spring, STONE.base); p(cx - 1, spring - hw - 2, 3, 2, STONE.base);       // lit on its left, and the keystone
  for (let yy = spring - hw; yy < SILL; yy++) for (let xx = cx - hw; xx < cx + hw; xx++) {
    if (yy < spring && (xx - cx + 0.5) ** 2 + (yy - spring) ** 2 > hw * hw) continue;
    p(xx, yy, 1, 1, yy > SILL - 4 && xx > cx - hw + 1 ? SOOT.dark : HOLE);
  }
  p(cx - hw - 3, SILL, hw * 2 + 6, 2, STONE.base); p(cx - hw - 3, SILL, hw * 2 + 6, 1, STONE.hi); p(cx - hw - 1, SILL + 2, hw * 2 + 2, 1, STONE.dark);
  p(cx + 3, SILL, 3, 1, SOOT.hi);
}
// An owl, 10 x 11 art px, on its feet: round, tufted, big yellow eyes (the
// painter adds the pupils, which follow the lord). Frame 1: eyes shut.
function drawOwl(t, shut) {
  const { p } = t;
  p(1, 0, 2, 2, OWL.dark); p(7, 0, 2, 2, OWL.dark);
  p(1, 1, 8, 9, OWL.base); p(0, 3, 10, 6, OWL.base); p(2, 1, 6, 1, OWL.hi); p(0, 3, 1, 3, OWL.hi);
  p(0, 6, 1, 3, OWL.dark); p(9, 4, 1, 5, OWL.dark); p(8, 9, 1, 1, OWL.dark);
  p(3, 6, 4, 4, OWL.belly); p(4, 7, 1, 1, OWL.dark); p(5, 8, 1, 1, OWL.dark); p(3, 9, 1, 1, OWL.dark);
  if (shut) { p(1, 2, 3, 3, OWL.hi); p(6, 2, 3, 3, OWL.hi); p(1, 4, 3, 1, OWL.dark); p(6, 4, 3, 1, OWL.dark); }
  else { p(1, 2, 3, 3, OWL.eye); p(6, 2, 3, 3, OWL.eye); }
  p(4, 4, 2, 2, C.storkBeakHi); p(4, 5, 1, 1, C.storkBeak);
  p(3, 10, 1, 1, C.storkBeak); p(6, 10, 1, 1, C.storkBeak);
}
// A mouse with a piece of cheese, 12 x 7 art px, facing right. Frame 1: it
// bends to nibble.
function drawMouse(t, frame) {
  const { p } = t, d = frame;
  p(0, 5, 2, 1, C.cheek); p(0, 4, 1, 1, C.cheek);                                  // the tail
  p(2, 2, 6, 4, MOUSE.base); p(3, 1, 4, 1, MOUSE.base); p(3, 1, 3, 1, MOUSE.hi); p(2, 6, 6, 1, MOUSE.dark); p(3, 5, 3, 1, MOUSE.hi);
  p(6, 2 + d, 4, 3, MOUSE.base); p(6, 2 + d, 3, 1, MOUSE.hi);                      // the head
  p(5, 0 + d, 2, 2, MOUSE.dark); p(6, 1 + d, 1, 1, C.cheek);                       // an ear
  p(8, 3 + d, 1, 1, C.black); p(10, 4 + d, 1, 1, C.cheek);
  p(9, 5, 3, 2, C.sun2); p(9, 5, 3, 1, C.sun1); p(10, 6, 1, 1, C.sun3);            // the cheese
}
// A nest with three chicks, 13 x 9 art px. Frame 1: beaks wide open.
function drawNest(t, frame) {
  const { p } = t;
  for (const x of [1, 5, 9]) {
    p(x, 2, 3, 3, NEST.chick); p(x, 4, 3, 1, NEST.chickShade);
    if (frame) { p(x, 0, 1, 2, C.storkBeakHi); p(x + 2, 0, 1, 2, C.storkBeakHi); p(x + 1, 1, 1, 2, C.gem); }
    else { p(x + 1, 3, 1, 1, C.storkBeakHi); p(x, 2, 1, 1, C.black); p(x + 2, 2, 1, 1, C.black); }
  }
  p(1, 5, 11, 3, NEST.base); p(2, 8, 9, 1, NEST.dark); p(0, 5, 13, 1, NEST.hi);
  p(0, 4, 1, 1, NEST.hi); p(12, 4, 1, 1, NEST.base); p(3, 6, 3, 1, NEST.dark); p(8, 7, 3, 1, NEST.dark); p(6, 6, 2, 1, NEST.hi); p(11, 6, 2, 1, NEST.dark);
}
// A candle end on a tin plate, 5 x 9 art px. Two frames: the flame.
function drawStub(t, frame) {
  const { p } = t;
  p(0, 8, 5, 1, IRON.shade); p(0, 8, 2, 1, IRON.base);
  p(1, 4, 3, 4, K.candle); p(1, 4, 1, 4, C.white); p(4, 5, 1, 2, K.candle);
  if (frame) { p(2, 0, 1, 4, C.flame2); p(1, 2, 1, 1, C.flame3); p(2, 2, 1, 2, C.flame1); }
  else { p(2, 1, 1, 3, C.flame2); p(3, 2, 1, 1, C.flame3); p(2, 2, 1, 1, C.flame1); }
}
// A teddy bear somebody has hidden here, 9 x 10 art px, sitting: a heart sewn on.
function drawTeddy(t) {
  const { p } = t;
  p(1, 0, 2, 2, C.fur); p(6, 0, 2, 2, C.fur); p(2, 1, 5, 4, C.fur); p(2, 1, 4, 1, C.furHi);
  p(3, 3, 3, 2, C.belly); p(4, 3, 1, 1, C.black); p(3, 2, 1, 1, C.black); p(5, 2, 1, 1, C.black);
  p(2, 5, 5, 4, C.fur); p(3, 6, 3, 2, C.belly); p(1, 5, 1, 3, C.furDark); p(7, 5, 1, 3, C.furDark);
  p(1, 8, 3, 2, C.fur); p(5, 8, 3, 2, C.fur); p(1, 9, 3, 1, C.furDark); p(5, 9, 3, 1, C.furDark); p(2, 8, 1, 1, C.belly); p(6, 8, 1, 1, C.belly);
  p(5, 6, 1, 1, C.heart);
}
// A Christmas stocking hung from a sill, 7 x 10 art px, the anchor its top.
function drawStocking(t) {
  const { p } = t;
  p(1, 0, 5, 2, C.white); p(1, 1, 5, 1, C.storkShade);
  p(2, 2, 3, 5, C.heart); p(2, 2, 1, 5, C.heartHi); p(2, 6, 5, 3, C.heart); p(2, 9, 4, 1, C.heartDark); p(6, 7, 1, 2, C.heartDark);
}

// --- what is on the back of the shaft ------------------------------------------------
// A rod across with what is hung in the smoke: sausages and a ham, 34 x 18
// art px, the anchor its top middle.
function drawSausages(t) {
  const { p } = t;
  p(0, 0, 34, 2, IRON.shade); p(0, 0, 34, 1, IRON.base); p(0, 0, 2, 4, IRON.dark); p(32, 0, 2, 4, IRON.dark);
  for (const [x, len] of [[4, 8], [9, 9], [14, 7]]) {
    p(x + 1, 2, 1, 2, CHIMNEY_LOOK.rope);
    p(x, 4, 3, len, MEAT.base); p(x, 5, 1, len - 2, MEAT.hi); p(x + 2, 5, 1, len - 1, MEAT.dark); p(x + 1, 4 + len, 1, 1, CHIMNEY_LOOK.rope);
  }
  p(24, 2, 1, 2, CHIMNEY_LOOK.rope); p(23, 3, 3, 2, MEAT.fat);
  [[22, 5], [21, 7], [20, 9], [20, 9], [20, 9], [21, 8], [22, 6], [23, 4]].forEach(([x, w], i) => { p(x, 5 + i, w, 1, MEAT.base); p(x, 5 + i, 2, 1, MEAT.hi); p(x + w - 2, 5 + i, 2, 1, MEAT.dark); });
  for (const [x, y] of [[23, 7], [25, 9], [27, 11], [26, 7], [23, 10]]) p(x, y, 1, 1, MEAT.dark);      // the net it hangs in
}
// The sweep's brush, forgotten on its rope: 11 x 16 art px, the anchor the
// rope's upper end (the painter draws the rope up from there). A round
// head of straw bristles, soft to look at (nothing in here has spikes),
// and under it the iron ball that takes it down.
function drawBrush(t) {
  const { p, disc, hatch } = t;
  p(5, 0, 1, 2, CHIMNEY_LOOK.rope);
  disc(5, 6, 4, BRISTLE.base); hatch(2, 3, 7, 7, BRISTLE.dark, 3); p(3, 2, 5, 1, BRISTLE.hi); p(2, 3, 2, 2, BRISTLE.hi);
  p(4, 5, 3, 3, C.plank); p(4, 5, 3, 1, C.plankHi); p(5, 6, 1, 1, IRON.base);                                               // the wooden core the bristles are set in
  p(5, 11, 1, 2, CHIMNEY_LOOK.rope); p(4, 13, 3, 3, IRON.shade); p(4, 13, 1, 1, IRON.hi); p(6, 15, 1, 1, IRON.dark);
}
// What a child has drawn on the soot with chalk, 16 x 12 art px: a tally,
// a crown under the sun, a hobby horse and a heart.
function drawChalk(t, v) {
  const { p, line, ring } = t;
  if (v === 0) { for (const x of [2, 5, 8, 11]) p(x, 3, 1, 7, CHALK); line(1, 9, 13, 3, CHALK); }
  else if (v === 1) {
    for (const [a, b, c, d] of [[2, 9, 2, 5], [2, 5, 4, 7], [4, 7, 5, 4], [5, 4, 7, 7], [7, 7, 9, 5], [9, 5, 9, 9], [9, 9, 2, 9]]) line(a, b, c, d, CHALK);
    ring(12, 3, 2, CHALK); p(12, 0, 1, 1, CHALK); p(15, 3, 1, 1, CHALK); p(12, 6, 1, 1, CHALK); p(9, 3, 1, 1, CHALK);
  } else {
    line(4, 11, 4, 6, CHALK); for (const [a, b, c, d] of [[4, 6, 5, 3], [5, 3, 8, 3], [8, 3, 9, 5], [9, 5, 7, 6], [7, 6, 5, 6]]) line(a, b, c, d, CHALK);
    p(5, 2, 1, 1, CHALK); p(3, 4, 1, 1, CHALK); p(3, 6, 1, 1, CHALK);
    p(11, 7, 1, 1, CHALK); p(13, 7, 1, 1, CHALK); p(10, 8, 5, 1, CHALK); p(11, 9, 3, 1, CHALK); p(12, 10, 1, 1, CHALK);
  }
}
// An iron rung let into the back of the shaft, 10 x 4 art px.
function drawRung(t) { const { p } = t; p(0, 0, 10, 2, IRON.shade); p(1, 0, 8, 1, IRON.base); p(0, 2, 1, 2, IRON.dark); p(9, 2, 1, 2, IRON.dark); }
// Where a brick is gone, 10 x 6 art px: black, somebody's eyes in it (the painter's).
function drawHole(t) { const { p } = t; p(1, 1, 8, 4, HOLE); p(0, 2, 10, 2, HOLE); p(1, 0, 3, 1, SOOT.dark); p(6, 5, 3, 1, SOOT.dark); p(8, 0, 1, 1, SOOT.hi); }
// A cobweb in a corner, 13 x 13 art px, as it hangs in an upper left one.
function drawCobweb(t) {
  const { p, line } = t;
  for (const [x, y] of [[12, 2], [10, 7], [6, 10], [2, 12]]) line(0, 0, x, y, WEB);
  for (const [a, b, c, d] of [[5, 1, 4, 3], [4, 3, 3, 5], [3, 5, 1, 5], [9, 2, 8, 5], [8, 5, 5, 8], [5, 8, 2, 9]]) line(a, b, c, d, WEB);
  p(7, 6, 1, 1, C.white);
}
// A wisp of steam over a kettle, 7 x 9 art px. Two frames.
function drawSteam(t, frame) {
  const { p } = t;
  for (const [x, y] of [[3, 7], [2, 5], [3, 3], [4, 1]]) p(frame ? 6 - x : x, y, 1, 2, STEAM);
  p(3, 0, 1, 1, STEAM);
}

// --- the top ---------------------------------------------------------------------------
// The throat, 96 x 44 art px, the anchor its bottom middle: the shaft draws
// in, course by course, each on a band of stone, to a slit with the day in
// it; a stork has built on the chimney, and twigs of its nest hang in.
function drawThroat(t) {
  const { p } = t;
  const steps = [[32, 12], [20, 24], [8, 34], [0, 38]];                 // from row .. up to the next: the opening begins this far in
  steps.forEach(([y0, inset], i) => {
    const y1 = i ? steps[i - 1][0] : 44;
    for (const m of [0, 1]) {
      const x = m ? 96 - inset : 0;
      bricks({ p: (a, b, w, h, c) => p(a + x, b + y0, w, h, c) }, 0, inset, y1 - y0, BRICK, 50 + i * 7 + m, true);
      p(x, y1 - 1, inset, 1, STONE.shade); p(x, y1 - 2, inset, 1, STONE.base);      // each course of the corbel stands on a band of stone
      p(m ? x : inset - 1, y0, 1, y1 - y0 - 2, m ? BRICK.hi : BRICK.dark);
      p(m ? x : inset - 4, y1 - 2, 4, 1, STONE.hi);                    // the corbel's lip, lit by the day
    }
  });
  // the day in the slit, and a cloud in it
  p(38, 0, 20, 8, SKY[0]); p(34, 8, 28, 12, SKY[1]); p(34, 8, 28, 3, SKY[0]);
  p(37, 13, 9, 3, C.white); p(39, 12, 5, 1, C.white); p(38, 16, 6, 1, C.storkShade);
  // the nest's twigs over the edge
  for (const [x, y, w] of [[55, 0, 9], [57, 1, 6], [58, 2, 4], [53, 0, 3], [54, 8, 9], [56, 9, 6]]) p(x, y, w, 1, NEST.base);
  p(56, 0, 5, 1, NEST.hi); p(60, 2, 1, 4, NEST.dark); p(58, 3, 1, 3, NEST.base); p(55, 8, 5, 1, NEST.hi); p(61, 10, 1, 3, NEST.dark);
}
// The stork looking down the chimney, 16 x 12 art px, the anchor the top
// right corner (where its neck comes over the edge). Frame 1: it blinks.
function drawStorkPeek(t, blink) {
  const { p } = t;
  p(11, 0, 4, 4, C.stork); p(14, 0, 1, 4, C.storkShade); p(11, 0, 3, 1, C.storkHi);                  // the neck
  p(6, 2, 7, 5, C.stork); p(7, 2, 5, 1, C.storkHi); p(6, 6, 7, 1, C.storkShade);                      // the head
  if (blink) p(8, 4, 2, 1, C.storkDeep); else { p(8, 3, 2, 2, C.white); p(8, 4, 1, 1, C.black); }
  for (const [x, y, w] of [[4, 6, 3], [3, 7, 3], [2, 8, 3], [1, 9, 2], [0, 10, 2]]) { p(x, y, w, 1, C.storkBeak); p(x, y, 1, 1, C.storkBeakHi); }
  p(0, 11, 1, 1, C.storkBeakDark);
}

// The doors, 46 x 58 art px like the tower's gates, the anchor the
// landing's top middle (art/interior.js drawGate).
//
// The fireplace is the way in: a low, wide mouth under a mantel, black
// inside, coals glowing at the bottom. Shut, a fire guard of iron bars
// stands in it; open, the guard is swung aside.
function drawFireplace(t, open) {
  const { p, disc } = t;
  const cx = 23, SURF = 46, hw = 14, spring = 32;
  // the breast: brick, with a stone mantel over it
  p(cx - hw - 4, spring - 10, hw * 2 + 8, SURF - spring + 10, BRICK.base);
  for (let y = spring - 10; y < SURF; y += 4) { p(cx - hw - 4, y + 3, hw * 2 + 8, 1, BRICK.mortar); for (let x = cx - hw - 4 + (y % 8 ? 4 : 0); x < cx + hw + 4; x += 8) p(x, y, 1, 3, BRICK.mortar); }
  p(cx - hw - 4, spring - 10, 1, SURF - spring + 10, BRICK.hi); p(cx + hw + 3, spring - 10, 1, SURF - spring + 10, BRICK.dark);
  p(cx - hw - 6, spring - 14, hw * 2 + 12, 4, K.frame); p(cx - hw - 6, spring - 14, hw * 2 + 12, 1, K.frameHi); p(cx - hw - 6, spring - 11, hw * 2 + 12, 1, K.frameDark);
  // the flue above it, narrowing into the wall
  p(cx - 8, spring - 26, 16, 12, BRICK.shade); p(cx - 8, spring - 26, 1, 12, BRICK.base); p(cx - 6, spring - 30, 12, 4, BRICK.dark);
  for (let y = spring - 26; y < spring - 14; y += 4) p(cx - 8, y + 3, 16, 1, BRICK.mortar);
  // the mouth: a low arch, black, the coals at the bottom
  for (let yy = spring - 8; yy < SURF; yy++) for (let xx = cx - hw; xx < cx + hw; xx++) {
    if (yy < spring && ((xx - cx + 0.5) / hw) ** 2 + ((yy - spring) / 8) ** 2 > 1) continue;
    p(xx, yy, 1, 1, yy > SURF - 5 ? SOOT.shade : SOOT.mortar);
  }
  for (const [x, w] of [[cx - 10, 4], [cx - 4, 5], [cx + 3, 4], [cx + 8, 3]]) { p(x, SURF - 3, w, 2, C.flame4); p(x + 1, SURF - 3, w - 2, 1, C.flame3); }
  p(cx - 3, SURF - 4, 2, 1, C.flame2); p(cx + 4, SURF - 4, 1, 1, C.flame2);
  disc(cx, spring - 2, 2, SOOT.shade);                                             // the way up, a shade lighter
  if (!open) {
    for (let x = cx - hw + 1; x < cx + hw; x += 4) p(x, spring - 2, 1, SURF - spring + 2, IRON.base);
    p(cx - hw, spring + 2, hw * 2, 1, IRON.hi); p(cx - hw, SURF - 2, hw * 2, 1, IRON.base);
  } else {
    p(cx + hw - 2, spring - 4, 3, SURF - spring + 4, IRON.base); p(cx + hw - 2, spring - 4, 1, SURF - spring + 4, IRON.hi);
  }
  landing(t, SURF);
}

// The soot door is the way out, high in the shaft: a small iron door in
// the brick. Open, it shows the tower. From the tower's side, gone
// through, it is the same door shut, with a sooty hand on the wall by it.
function drawHatch(t, open, spent) {
  const { p, disc } = t;
  const cx = 23, SURF = 46, hw = 9, spring = 24;
  // its frame of dressed stone in the wall
  p(cx - hw - 3, spring, hw * 2 + 6, SURF - spring, K.frame); disc(cx, spring, hw + 3, K.frame);
  p(cx - hw - 3, spring, 1, SURF - spring, K.frameHi); p(cx + hw + 2, spring, 1, SURF - spring, K.frameDark);
  for (let yy = spring - hw; yy < SURF; yy++) for (let xx = cx - hw; xx < cx + hw; xx++) {
    if (yy < spring && (xx - cx + 0.5) ** 2 + (yy - spring) ** 2 > hw * hw) continue;
    p(xx, yy, 1, 1, !open ? IRON.base : yy < 24 ? TOWER[0] : yy < 36 ? TOWER[1] : TOWER[2]);
  }
  if (!open) {
    p(cx - hw, spring - 2, 1, SURF - spring + 2, IRON.hi); p(cx + hw - 1, spring - 2, 1, SURF - spring + 2, IRON.dark);
    for (const y of [spring + 2, SURF - 6]) { p(cx - hw, y, hw * 2, 2, IRON.shade); p(cx - hw, y, hw * 2, 1, IRON.hi); }
    for (const [x, y] of [[cx - 6, spring + 3], [cx + 5, spring + 3], [cx - 6, SURF - 5], [cx + 5, SURF - 5]]) p(x, y, 1, 1, IRON.dark);
    p(cx + 4, 34, 2, 3, K.bell); p(cx + 4, 34, 1, 1, K.bellHi);                    // the latch
    p(cx - 3, spring - 4, 6, 1, IRON.shade);
  } else {
    p(cx - 1, 27, 2, 4, C.flame2); p(cx - 1, 28, 1, 2, C.flame1); p(cx - 2, 31, 4, 1, K.iron);      // a torch out there
    p(cx - hw, spring - 4, 3, SURF - spring + 4, IRON.base); p(cx - hw, spring - 4, 1, SURF - spring + 4, IRON.hi);   // the door, stood back
  }
  if (spent) {
    // soot around it, and the print of a small hand
    for (const [x, y, w] of [[cx - hw - 6, 30, 3], [cx + hw + 3, 26, 3], [cx - 4, spring - hw - 5, 8], [cx + hw + 4, 38, 2]]) p(x, y, w, 2, SOOT.shade);
    p(cx + hw + 5, 31, 3, 3, SOOT.dark); for (const dx of [0, 1, 2, 3]) p(cx + hw + 4 + dx, 29 + (dx % 2), 1, 2, SOOT.dark);
  }
  landing(t, SURF);
}

// The gates' landing: a pale slab on two brackets (art/interior.js drawGate).
function landing(t, SURF) {
  const { p } = t;
  p(0, SURF, 46, 6, K.ledge); p(0, SURF, 46, 1, K.ledgeHi); p(0, SURF + 4, 46, 2, K.ledgeShade); p(0, SURF + 1, 1, 3, K.ledgeHi);
  for (const x of [11, 23, 34]) p(x, SURF + 1, 1, 3, K.ledgeShade);
  for (const x of [5, 35]) { p(x, SURF + 6, 6, 3, K.ledgeShade); p(x + 1, SURF + 9, 4, 3, K.ledgeDark); }
}

export function buildChimney() {
  const door = (draw) => makeSprite(46, 58, draw, undefined, { axPx: 23 * 4, ayPx: 46 * 4 });
  const top = { ax: 0.5, ay: 0 }, two = (w, h, draw, anchor, opts) => [0, 1].map((f) => makeSprite(w, h, (t) => draw(t, f), anchor, opts));
  return {
    wall: [0, 1, 2, 3].map((v) => makeSprite(48, 32, (t) => drawWall(t, v), { ax: 1, ay: 1 })),      // the left wall, anchored at the corner's foot; the right one is drawn with `flip`
    back: [0, 1, 2].map((v) => makeSprite(96, 32, (t) => drawBack(t, v))),
    ledge: makeSprite(26, 8, drawLedge, top),            // out of the left wall
    kettle: makeSprite(22, 20, drawKettle, undefined, { axPx: 11 * 4, ayPx: 6 * 4 }),
    damper: makeSprite(42, 8, drawDamper, top),
    hearth: two(96, 28, drawHearth, undefined, { axPx: 48 * 4, ayPx: 16 * 4 }),
    fireplace: [door((t) => drawFireplace(t, false)), door((t) => drawFireplace(t, true))],
    hatch: [door((t) => drawHatch(t, false, false)), door((t) => drawHatch(t, true, false))],
    hatchSpent: door((t) => drawHatch(t, false, true)),
    // in the walls
    niche: makeSprite(20, 20, drawNiche, undefined, { axPx: 10 * 4, ayPx: 16 * 4 }),
    owl: two(10, 11, drawOwl), mouse: two(12, 7, drawMouse), nest: two(13, 9, drawNest), stub: two(5, 9, drawStub),
    teddy: makeSprite(9, 10, drawTeddy), stocking: makeSprite(7, 10, drawStocking, top),
    // on the back of the shaft
    sausages: makeSprite(34, 18, drawSausages, top), brush: makeSprite(11, 16, drawBrush, top),
    chalk: [0, 1, 2].map((v) => makeSprite(16, 12, (t) => drawChalk(t, v), { ax: 0.5, ay: 0.5 })),
    rung: makeSprite(10, 4, drawRung, { ax: 0.5, ay: 0.5 }), hole: makeSprite(10, 6, drawHole, { ax: 0.5, ay: 0.5 }),
    cobweb: makeSprite(13, 13, drawCobweb, { ax: 0, ay: 0 }), steam: two(7, 9, drawSteam),
    // the top
    throat: makeSprite(96, 44, drawThroat), stork: two(16, 12, drawStorkPeek, { ax: 1, ay: 0 }),
  };
}
