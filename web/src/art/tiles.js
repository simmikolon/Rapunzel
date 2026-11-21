import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';
import { PX } from '../config.js';
import { RNG } from '../util.js';

// Environment tiles. The world is 768 logical px wide (192 art px).
// Vertical tiles are 192 logical px tall (48 art px), the original tile height.

export const TILE_H = 192;
export const TOWER_W = 440;   // tower spans x = -220 .. 220
export const TRUNK_W = 100;   // trunks span |x| = 284 .. 384

const rng = new RNG(1337);

// --- the tower's wall -------------------------------------------------------------
// The tower is round. Its wall is TOWER_A x 48 art px, and what makes it a
// drum and not a plank is two things a round wall does: its bricks get
// narrower toward the edges (one sees them more and more from the side),
// and the light, which comes from the upper left as everywhere, lies on it
// in upright bands, brightest left of the middle, in shade on the right.
// Both come from one picture of it: a point of the wall at angle `a` round
// the tower (0 faces us, ROUND.edge is as far round as one sees) stands at
// xOf(a), and is lit by how squarely it faces the light (planeAt).
// The bands are flat planes, as the style asks: each is a mix of two or
// three steps of the brick ramp, a brick takes one of them, and where two
// planes meet the bricks' own offset from course to course toothes the
// border. Nothing is graded and nothing is dithered.
const TOWER_A = TOWER_W / PX;
const ROUND = { edge: 72 * Math.PI / 180, light: -36 * Math.PI / 180, brick: 14 };
const xOf = (a) => TOWER_A / 2 * (1 + Math.sin(a) / Math.sin(ROUND.edge));
const BRICK_ANGLE = ROUND.brick * Math.sin(ROUND.edge) / (TOWER_A / 2);        // a brick's angle, so that one facing us is ROUND.brick wide
// The planes, from the lit one to the one in shade: how squarely a brick
// must face the light to belong to it, what its bricks are made of (steps
// of the brick ramp and their shares), and the line of light along a
// brick's top edge.
const PLANES = [
  { from: 0.93, mix: [['brickLight', 0.72], ['brickMid', 0.28]], top: 'brickHi' },
  { from: 0.74, mix: [['brickLight', 0.34], ['brickMid', 0.6], ['brickDark', 0.06]], top: 'brickLight' },
  { from: 0.44, mix: [['brickLight', 0.08], ['brickMid', 0.6], ['brickDark', 0.32]], top: 'brickLight' },
  { from: 0.14, mix: [['brickMid', 0.24], ['brickDark', 0.6], ['brickShade', 0.16]], top: 'brickMid' },
  { from: -2, mix: [['brickDark', 0.36], ['brickShade', 0.64]], top: 'brickDark' },
];
// The same planes for dressed stone (the string course).
const STONE_PLANES = ['stoneHi', 'stoneLight', 'stone', 'stoneDark', 'stoneShade'];
const planeAt = (a) => { const l = Math.cos(a - ROUND.light); return PLANES.findIndex((q) => l >= q.from); };
// The upright joints of a course: where they stand and which plane the brick to the right of each is in.
function joints(odd) {
  const out = [], n = Math.ceil(ROUND.edge / BRICK_ANGLE) + 1;
  for (let j = -n; j <= n; j++) {
    const a0 = (j + (odd ? 0.5 : 0)) * BRICK_ANGLE, a1 = a0 + BRICK_ANGLE;
    if (a1 <= -ROUND.edge || a0 >= ROUND.edge) continue;
    const x0 = Math.round(xOf(Math.max(a0, -ROUND.edge))), x1 = Math.round(xOf(Math.min(a1, ROUND.edge)));
    if (x1 - x0 >= 1) out.push({ x0, x1, plane: planeAt((Math.max(a0, -ROUND.edge) + Math.min(a1, ROUND.edge)) / 2) });
  }
  return out;
}
const pickStep = (mix, r) => { let k = r; for (const [name, share] of mix) { if (k < share) return name; k -= share; } return mix[mix.length - 1][0]; };

function drawTower(t, variant) {
  const { p, line } = t;
  const W = TOWER_A, H = 48, rowH = 6;
  p(0, 0, W, H, C.brickMid);
  const cells = [];                                     // every brick: { x, y, w, plane }, for what the variants do to some of them
  for (let y = 0; y < H; y += rowH) {
    for (const { x0, x1, plane } of joints((y / rowH) % 2 === 1)) {
      const q = PLANES[plane], w = x1 - x0, col = C[pickStep(q.mix, rng.next())];
      // a brick, the line of light along its top, the joint at its left (softer where the bricks are too narrow for a dark one)
      p(x0, y, w, rowH - 1, col);
      if (w > 1) p(x0 + 1, y, w - 1, 1, C[q.top]);
      p(x0, y, 1, rowH - 1, w >= 6 ? C.mortar : plane >= 3 ? C.brickShade : C.brickDark);
      cells.push({ x: x0 + 1, y, w: w - 1, plane });
    }
    p(0, y + rowH - 1, W, 1, C.mortar);
  }
  // the wall's edges: the lit one a line of the wall's own shade, the far one dark, with a breath of light thrown back just inside it
  p(0, 0, 1, H, C.brickDark); p(W - 1, 0, 1, H, C.mortar);
  for (let y = 0; y < H; y += rowH) p(W - 3, y, 2, rowH - 1, C.brickDark);
  const wide = cells.filter((c) => c.w >= 8);
  // every wall has a few bricks that are not like the rest: a chipped corner, one that was replaced in stone
  for (let i = 0; i < 4; i++) { const c = rng.pick(wide); p(c.x + (rng.chance(0.5) ? 0 : c.w - 1), c.y + rowH - 2, 1, 1, C.mortar); }
  { const c = rng.pick(wide); p(c.x, c.y, c.w, rowH - 1, C[STONE_PLANES[Math.min(4, c.plane + 1)]]); p(c.x, c.y, c.w, 1, C[STONE_PLANES[c.plane]]); }
  if (variant === 1) {
    // moss in the joints, more of it on the side the sun does not reach, and a crack
    for (let i = 0; i < 34; i++) { const x = Math.round(xOf((rng.next() * rng.next() * 1.9 - 0.55) * ROUND.edge)), y = rng.int(0, H / rowH - 1) * rowH + rowH - 2; if (x > 2 && x < W - 3) p(x, y, rng.int(1, 3), rng.chance(0.3) ? 2 : 1, rng.chance(0.5) ? C.mossDark : C.leafDark); }
    const cx = Math.round(W * 0.58);
    line(cx, 2, cx + 4, 14, C.mortar); line(cx + 4, 14, cx + 1, 22, C.mortar); line(cx + 1, 22, cx + 6, 30, C.mortar); line(cx + 6, 30, cx + 4, 37, C.mortar);
  } else if (variant === 2) {
    // weather: damp runs down from the joints, and pale lichen where the sun gets at it
    for (let i = 0; i < 12; i++) { const c = rng.pick(cells.filter((q) => q.plane >= 2 && q.w >= 3)); const len = rng.int(3, 10); p(c.x + rng.int(0, c.w - 1), c.y + rowH - 1, 1, len, C.brickShade); }
    for (let i = 0; i < 9; i++) { const c = rng.pick(cells.filter((q) => q.plane <= 1 && q.w >= 6)); const x = c.x + rng.int(0, c.w - 3), y = c.y + rng.int(1, 3); p(x, y, 2, 1, C.stoneLight); if (rng.chance(0.5)) p(x + 1, y + 1, 2, 1, C.stoneLight); }
  } else if (variant === 3) {
    // vines hanging across, closer together toward the edges as everything is
    for (let a = -0.86; a < 0.9; a += 0.17) { const x = Math.round(xOf(a * ROUND.edge)), len = rng.int(6, 22); line(x, 0, x + rng.int(-2, 2), len, C.leafDark); p(x + 1, len - 2, 2, 2, planeAt(a * ROUND.edge) >= 3 ? C.leafDark : C.leaf); p(x - 1, Math.floor(len / 2), 2, 2, planeAt(a * ROUND.edge) >= 3 ? C.leaf : C.grass); }
  } else if (variant === 4) {
    // an old repair: a patch of the wall made up in stone
    const c0 = rng.pick(cells.filter((q) => q.plane >= 1 && q.plane <= 3 && q.w >= 9));
    for (const c of cells) {
      if (Math.abs(c.y - c0.y) > rowH * 1.5 || Math.abs(c.x + c.w / 2 - (c0.x + c0.w / 2)) > 17 || (Math.abs(c.y - c0.y) > rowH && rng.chance(0.4))) continue;
      p(c.x, c.y, c.w, rowH - 1, C[STONE_PLANES[Math.min(4, c.plane + 1)]]); p(c.x, c.y, c.w, 1, C[STONE_PLANES[c.plane]]);
    }
  }
}

// The string course that runs round the tower under every row of windows
// (background.js lays it at the storeys' rhythm): TOWER_A x 6 art px of
// dressed stone, the anchor its top middle. Lit and jointed like the wall,
// a line of shadow under it.
function drawTowerBand(t) {
  const { p } = t;
  for (const { x0, x1, plane } of joints(false)) {
    const w = x1 - x0;
    p(x0, 0, w, 1, C[STONE_PLANES[Math.max(0, plane - 1)]]);
    p(x0, 1, w, 3, C[STONE_PLANES[plane]]);
    p(x0, 4, w, 1, C[STONE_PLANES[Math.min(4, plane + 1)]]);
    if (w >= 6) p(x0, 1, 1, 3, C[STONE_PLANES[Math.min(4, plane + 1)]]);
    p(x0, 5, w, 1, plane >= 3 ? C.mortar : C.brickShade);
  }
  p(TOWER_A - 1, 0, 1, 5, C.mortar);
}

// The prototype's distant forest, 192 x 48 art px: tall thin trunks and leaf
// streaks in the teal palette of bg.png. The game's forest behind the tower
// is art/backdrop.js now; this tile is still the texture of the landing
// page's lower end (site/landing.js).
function drawForest(t, variant) {
  const { p, line } = t;
  const W = 192, H = 48;
  p(0, 0, W, H, C.tealGrey);
  const cols = [C.tealDark, C.mortar, C.dusk, C.tealMid, C.leafDark, C.grassDark, '#2f4d3a', '#35464c'];
  // vertical bands: distant trunks of different widths
  const r = new RNG(99 + variant);
  let x = 0;
  while (x < W) {
    const w = r.int(2, 9);
    p(x, 0, w, H, r.pick(cols));
    if (r.chance(0.3)) p(x, 0, 1, H, C.barkShadow);
    x += w + r.int(0, 3);
  }
  // diagonal light shafts (like the prototype background)
  for (let i = 0; i < 6; i++) {
    const sx = r.int(0, W);
    for (let y = 0; y < H; y += 1) { const xx = sx + Math.floor(y * 0.6); if (xx < W && (y + i) % 2 === 0) p(xx, y, 2, 1, '#345b60'); }
  }
  // leaf streaks
  for (let i = 0; i < 40; i++) { const lx = r.int(0, W - 4), ly = r.int(0, H - 1); p(lx, ly, r.int(2, 5), 1, r.chance(0.5) ? C.mossDark : C.leafDark); }
  // a few dark birds
  if (variant === 1) { line(60, 10, 63, 8, C.nightDeep); line(63, 8, 66, 10, C.nightDeep); line(140, 30, 143, 28, C.nightDeep); line(143, 28, 146, 30, C.nightDeep); }
}

// Ground at the foot of the tower: 192 x 36 art px with grass, flowers and
// the end of Rapunzel's braid curled up on the lawn.
function drawGround(t) {
  const { p, disc, line } = t;
  const W = 192, H = 36;
  p(0, 6, W, H - 6, C.grassDark);
  p(0, 6, W, 6, C.grass);
  p(0, 4, W, 3, C.grassLight);
  const r = new RNG(7);
  for (let i = 0; i < 70; i++) { const x = r.int(0, W - 1); p(x, 2 + r.int(0, 2), 1, 2 + r.int(0, 2), r.chance(0.5) ? C.grassLight : C.grass); }
  for (let i = 0; i < 40; i++) { const x = r.int(0, W - 2), y = r.int(12, H - 2); p(x, y, r.int(1, 3), 1, C.grass); }
  for (let i = 0; i < 14; i++) { const x = r.int(3, W - 3); const col = r.pick([C.ribbonHi, C.gold, C.white, C.ribbon]); p(x, 3, 1, 1, col); p(x - 1, 4, 3, 1, col); p(x, 5, 1, 2, C.grass); }
  // dirt patches
  for (let i = 0; i < 10; i++) { const x = r.int(0, W - 6), y = r.int(14, H - 4); p(x, y, r.int(3, 8), 2, C.barkDeep); }
}

// Braid segment: 14 x 12 art px, tiled downward along the sway curve.
function drawBraidSegment(t) {
  const { p, disc, ellipse } = t;
  // two interlocking strands
  ellipse(5, 4, 4, 3, C.braid); ellipse(9, 9, 4, 3, C.braid);
  ellipse(9, 2, 3, 2, C.braidShade); ellipse(5, 10, 3, 2, C.braidShade);
  p(4, 2, 3, 1, C.braidHi); p(8, 8, 3, 1, C.braidHi);
  p(1, 5, 2, 1, C.braidDark); p(11, 11, 2, 1, C.braidDark); p(2, 11, 1, 1, C.braidDark); p(12, 3, 1, 1, C.braidDark);
}

// The frayed end of a cut braid: 14 x 10 art px hanging from the last
// whole bit (anchor top centre; drawn upside down for a falling piece's top).
function drawBraidCut(t) {
  const { p, line } = t;
  p(3, 0, 8, 2, C.braid); p(4, 0, 6, 1, C.braidHi);
  line(4, 2, 1, 8, C.braidShade); line(6, 2, 5, 9, C.braid); line(8, 2, 9, 9, C.braid); line(10, 2, 13, 8, C.braidShade);
  p(1, 8, 1, 1, C.braidDark); p(13, 8, 1, 1, C.braidDark); p(5, 9, 1, 1, C.braidDark); p(9, 9, 1, 1, C.braidDark);
}

function drawBraidEnd(t) {
  const { p, disc, ellipse } = t;
  // the loose end of the braid pooling on the grass
  ellipse(16, 8, 14, 5, C.braidShade);
  ellipse(14, 6, 12, 4, C.braid);
  ellipse(20, 5, 6, 2, C.braidHi);
  p(6, 7, 1, 1, C.braidDark); p(22, 10, 2, 1, C.braidDark);
  // a bow at the end
  disc(29, 4, 2, C.ribbon); disc(33, 4, 2, C.ribbon); p(30, 3, 3, 3, C.ribbonHi);
}

// Falling leaves: 5 x 4 art px, three colorways. Anchor center.
function drawLeaf(t, variant) {
  const { p } = t;
  const cols = [[C.leaf, C.grassLight], [C.moss, '#c8d848'], ['#c87a2a', '#e8a65e']][variant];
  p(1, 0, 3, 1, cols[0]); p(0, 1, 5, 2, cols[0]); p(1, 3, 3, 1, cols[0]);
  p(1, 1, 2, 1, cols[1]); p(2, 2, 1, 1, cols[0]); p(4, 0, 1, 1, cols[0]);
}

// Leafy bough growing from a trunk into the picture: 26 x 14 art px, grows
// to the right from its left edge (anchor left-middle). Mirrored for the
// right trunk.
function drawBough(t) {
  const { p, disc, line } = t;
  line(0, 7, 14, 6, C.barkDark); line(0, 8, 14, 7, C.barkDeep); line(8, 6, 16, 3, C.barkDark);
  disc(13, 6, 4, C.leafDark); disc(18, 5, 4, C.leaf); disc(22, 8, 3, C.leafDark);
  disc(15, 4, 3, C.leaf); disc(20, 3, 3, C.grass); disc(10, 9, 3, C.leafDark); disc(24, 5, 2, C.leaf);
  p(16, 2, 2, 1, C.grassLight); p(21, 1, 1, 1, C.grassLight); p(12, 3, 1, 1, C.grass); p(23, 9, 2, 1, C.leaf);
  p(18, 11, 1, 2, C.leafDark); p(13, 12, 1, 1, C.leafDark); p(17, 7, 2, 1, C.grass); p(11, 5, 1, 1, C.grassLight);
}

// Small bird perched / flying, 8 x 6 art px, facing right. Anchor bottom-center.
function drawBird(t, frame) {
  const { p } = t;
  const body = '#3b4a7a', wing = '#2a3560', belly = '#c9d2e8';
  p(2, 2, 4, 3, body); p(3, 4, 2, 1, belly);
  p(5, 1, 2, 2, body); p(7, 2, 1, 1, C.beak);            // head, beak
  p(6, 1, 1, 1, C.black);
  p(0, 3, 2, 1, body);                                     // tail
  if (frame) { p(2, 0, 3, 2, wing); } else { p(3, 3, 2, 1, wing); }
  p(3, 5, 1, 1, C.beak); p(5, 5, 1, 1, C.beak);            // feet
}

// Butterfly, 7 x 5 art px, two frames (wings open / closed), three colours.
function drawButterfly(t, color, frame) {
  const { p } = t;
  const cols = [['#f4c542', '#e08a2a'], ['#6fb7ff', '#2c6fd1'], ['#ff8ab8', '#d14a7a']][color];
  p(3, 1, 1, 3, '#2a1a10');                                 // body
  if (frame === 0) {
    p(0, 0, 3, 2, cols[0]); p(4, 0, 3, 2, cols[0]); p(1, 2, 2, 2, cols[1]); p(4, 2, 2, 2, cols[1]);
    p(1, 0, 1, 1, cols[1]); p(5, 0, 1, 1, cols[1]);
  } else {
    p(2, 0, 1, 2, cols[0]); p(4, 0, 1, 2, cols[0]); p(2, 2, 1, 2, cols[1]); p(4, 2, 1, 2, cols[1]);
  }
}

// Acorn, 4 x 5 art px. Anchor center.
function drawAcorn(t) {
  const { p } = t;
  p(0, 0, 4, 2, C.acornCap); p(1, 2, 2, 3, C.acorn); p(0, 2, 1, 2, C.acorn); p(3, 2, 1, 2, C.acorn); p(1, 2, 1, 1, '#b48a52');
}

function drawCloud(t, w, h) {
  const { ellipse, p } = t;
  const r = new RNG(w * 31 + h);
  ellipse(w / 2, h * 0.65, w / 2 - 1, h * 0.3, C.white);
  for (let i = 0; i < 4; i++) { const cx = r.int(h * 0.5, w - h * 0.5), cy = r.int(h * 0.35, h * 0.6), rr = r.int(h * 0.25, h * 0.45); ellipse(cx, cy, rr, rr, C.white); }
  ellipse(w / 2, h * 0.8, w / 2 - 2, h * 0.18, '#dfe9ee');
}

function drawMoon(t) {
  const { disc, p, ctx } = t;
  disc(12, 12, 10, '#f6f1c8');
  ctx.globalCompositeOperation = 'destination-out';
  disc(16, 10, 9, '#000'); // crescent cut (transparent)
  ctx.globalCompositeOperation = 'source-over';
  p(5, 10, 1, 1, '#e4dca8'); p(7, 15, 2, 1, '#e4dca8'); p(4, 13, 1, 1, '#e4dca8');
}

export function buildTiles() {
  const tower = [0, 1, 2, 3, 4].map((v) => makeSprite(TOWER_A, 48, (t) => drawTower(t, v), { ax: 0.5, ay: 1 }));
  const towerBand = makeSprite(TOWER_A, 6, (t) => drawTowerBand(t), { ax: 0.5, ay: 0 });
  const forest = [0, 1].map((v) => makeSprite(192, 48, (t) => drawForest(t, v), { ax: 0.5, ay: 1 }));
  const ground = makeSprite(192, 36, (t) => drawGround(t), { ax: 0.5, ay: 0 }, { ayPx: 4 * PX });
  const braid = makeSprite(14, 12, (t) => drawBraidSegment(t), { ax: 0.5, ay: 0 });
  const braidEnd = makeSprite(36, 14, (t) => drawBraidEnd(t), { ax: 0.4, ay: 1 });
  const braidCut = makeSprite(14, 10, (t) => drawBraidCut(t), { ax: 0.5, ay: 0 });
  const clouds = [[28, 10], [40, 13], [54, 16]].map(([w, h]) => makeSprite(w, h, (t) => drawCloud(t, w, h), { ax: 0.5, ay: 0.5 }));
  const moon = makeSprite(24, 24, (t) => drawMoon(t), { ax: 0.5, ay: 0.5 });
  const leaves = [0, 1, 2].map((v) => makeSprite(5, 4, (t) => drawLeaf(t, v), { ax: 0.5, ay: 0.5 }));
  const boughL = makeSprite(26, 14, (t) => drawBough(t), { ax: 0, ay: 0.5 });
  const boughR = flipH(boughL);
  const birdR = [0, 1].map((f) => makeSprite(8, 6, (t) => drawBird(t, f), { ax: 0.5, ay: 1 }));
  const birdL = birdR.map(flipH);
  const butterflies = [0, 1, 2].map((c) => [0, 1].map((f) => makeSprite(7, 5, (t) => drawButterfly(t, c, f), { ax: 0.5, ay: 0.5 })));
  const acorn = makeSprite(4, 5, (t) => drawAcorn(t), { ax: 0.5, ay: 0.5 });
  return { tower, towerBand, forest, ground, braid, braidEnd, braidCut, clouds, moon, leaves, boughL, boughR, birdR, birdL, butterflies, acorn };
}
