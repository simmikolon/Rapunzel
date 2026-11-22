import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { PX } from '../config.js';
import { RNG } from '../util.js';

// The tower's wall, outside: its plain tiles, the string course, and the
// areas that take turns with the plain wall on the way up (overgrown with
// ivy or with briar roses, crumbling, built of old big stones, mossy, under
// repair), with the things that hang on the wall there (boards, signs, a
// bucket on its rope, the roses).
// art/tiles.js hands the plain tiles and the course on under their old
// names; which area is where is src/towerwall.js; background.js draws them.

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
export const TOWER_W = 440;   // the tower spans x = -220 .. 220
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

// Lay the wall's bricks over the whole tile (TOWER_A x 48 art px) with the
// random stream `r`, and return them: { x, y, w, plane, col } for every
// brick (its face without the joint at its left; `col` is its colour's
// name), for what a variant or an area does to some of them.
const ROW = 6;
function layWall(t, r) {
  const { p } = t;
  const W = TOWER_A, H = 48, rowH = ROW;
  p(0, 0, W, H, C.brickMid);
  const cells = [];
  for (let y = 0; y < H; y += rowH) {
    for (const { x0, x1, plane } of joints((y / rowH) % 2 === 1)) {
      const q = PLANES[plane], w = x1 - x0, name = pickStep(q.mix, r.next()), col = C[name];
      // a brick, the line of light along its top, the joint at its left (softer where the bricks are too narrow for a dark one)
      p(x0, y, w, rowH - 1, col);
      if (w > 1) p(x0 + 1, y, w - 1, 1, C[q.top]);
      p(x0, y, 1, rowH - 1, w >= 6 ? C.mortar : plane >= 3 ? C.brickShade : C.brickDark);
      cells.push({ x: x0 + 1, y, w: w - 1, plane, col: name });
    }
    p(0, y + rowH - 1, W, 1, C.mortar);
  }
  // the wall's edges: the lit one a line of the wall's own shade, the far one dark, with a breath of light thrown back just inside it
  p(0, 0, 1, H, C.brickDark); p(W - 1, 0, 1, H, C.mortar);
  for (let y = 0; y < H; y += rowH) p(W - 3, y, 2, rowH - 1, C.brickDark);
  return cells;
}

function drawTower(t, variant) {
  const { p, line } = t;
  const W = TOWER_A, H = 48, rowH = ROW;
  const cells = layWall(t, rng);
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

// --- the wall's areas ---------------------------------------------------------------
// The wall is not the same all the way up. For a stretch it is overgrown,
// or falling apart, or built of older, bigger stones, or green with moss.
// An area is a column of tiles: `enter` at its lower end, then its `loop`
// (so many tiles, bottom to top, which follow each other without a seam and
// the last of which is followed by the first again), then `leave` at its
// upper end; both ends are the area thinning out into the plain wall.
// `overlay` areas (what grows on the wall) are drawn over the plain tiles
// and have nothing but their leaves in them; the others are the wall itself.
// `band` is the string course an area has where it is not the plain one.
// A tile can have things hanging on it that are sprites of their own (its
// fixtures, see "what hangs on the wall" below).
export const TOWER_AREAS = {
  ivy: { loop: 6, overlay: true },
  worn: { loop: 4, overlay: false, band: 'worn' },
  stone: { loop: 3, overlay: false },
  moss: { loop: 3, overlay: true },
  mended: { loop: 4, overlay: false, band: 'worn' },
  briar: { loop: 5, overlay: true },
};
const DEEP = 'wallDeep';                // an opening into the wall, a crack: darker than any joint
const OLD = ['oldHi', 'oldLight', 'oldMid', 'oldDark', 'oldShade'];        // the old stones' ramp, by plane as STONE_PLANES
const seedOf = (j) => (typeof j === 'number' ? j : j === 'enter' ? 40 : 41);

// --- crumbling -----------------------------------------------------------------------
// The wall falling apart: chipped corners, bricks that have sunk in their
// bed, bricks gone (a dark hollow with a lighter lip where the light gets
// in), a wound where the facing has come away and the rubble of the core
// shows, damp under the holes, and cracks. A crack that reaches a tile's
// edge does so in a fixed column, so that it runs on in the next tile
// (CRACK_A, CRACK_B); the ends of an area have only the beginning of it all.
const crackX = (f) => Math.round(xOf(f * ROUND.edge));
const CRACK_A = crackX(0.24), CRACK_B = crackX(-0.36);
function crack(t, r, x0, y0, x1, y1) {
  // from (x0, y0) up to (x1, y1): a ragged line that finds its way there
  const { p } = t;
  let x = x0;
  for (let y = y0; y >= y1; y--) {
    const left = y - y1;
    if (left > 0 && r.chance(0.55)) x += Math.sign(x1 - x + (r.next() - 0.5) * 6);
    if (left < Math.abs(x1 - x)) x += Math.sign(x1 - x);
    p(x, y, 1, 1, C[DEEP]);
    if (r.chance(0.18)) p(x + r.sign(), y, 1, 1, C.mortar);
  }
}
function drawWorn(t, j) {
  const { p } = t;
  const r = new RNG(3100 + seedOf(j) * 17), cells = layWall(t, r), light = typeof j !== 'number', rowH = ROW;
  const big = cells.filter((c) => c.w >= 7), inner = (c) => c.y >= rowH && c.y <= 36;
  const hollow = (c) => { p(c.x, c.y, c.w, rowH - 1, C[DEEP]); p(c.x, c.y + rowH - 2, c.w, 1, C.brickShade); if (c.w > 5 && r.chance(0.5)) p(c.x + r.int(1, c.w - 3), c.y + 2, 2, 2, C[OLD[Math.min(4, c.plane + 1)]]); };
  // the facing come away over several bricks: the core's rubble in the hole
  if (!light) {
    const c0 = r.pick(big.filter((c) => inner(c) && c.plane >= 1 && c.plane <= 3));
    const mid = c0.x + c0.w / 2, reach = j % 2 ? 9 : 15;
    const gone = cells.filter((c) => Math.abs(c.y - c0.y) <= rowH && Math.abs(c.x + c.w / 2 - mid) < reach - (c.y === c0.y ? 0 : 4) && (c.y === c0.y || r.chance(0.75)));
    for (const c of gone) { p(c.x - 1, c.y, c.w + 1, rowH, C[DEEP]); }
    for (const c of gone) for (let i = 0; i < Math.max(1, Math.round(c.w / 4)); i++) {
      const x = c.x + r.int(0, Math.max(0, c.w - 3)), y = c.y + r.int(0, 3), w = r.int(2, 3);
      p(x, y, w, 2, C[OLD[Math.min(4, c.plane + 2)]]); p(x, y, w, 1, C[OLD[Math.min(4, c.plane + 1)]]);
    }
    for (const c of gone) for (let i = 0; i < 2; i++) p(c.x + r.int(0, c.w - 1), c.y + rowH + r.int(0, 8), 1, r.int(2, 5), C.brickShade);     // damp under it
  }
  // single bricks gone, bricks sunk in their bed, corners broken off
  for (let i = 0; i < (light ? 2 : 5); i++) hollow(r.pick(big.filter(inner)));
  for (let i = 0; i < (light ? 2 : 6); i++) { const c = r.pick(big); p(c.x, c.y, c.w, 1, C.mortar); p(c.x, c.y + rowH - 1, c.w, 1, C[c.col]); }
  for (let i = 0; i < (light ? 7 : 18); i++) { const c = r.pick(cells.filter((q) => q.w >= 4)), right = r.chance(0.5), low = r.chance(0.5); p(c.x + (right ? c.w - 1 : 0), c.y + (low ? rowH - 2 : 0), 1, 1, C.mortar); if (r.chance(0.4)) p(c.x + (right ? c.w - 2 : 1), c.y + (low ? rowH - 2 : 0), 1, 1, C.mortar); }
  // cracks
  if (j === 0) crack(t, r, CRACK_A + 5, 30, CRACK_A, 0);
  if (j === 1) { crack(t, r, CRACK_A, 47, CRACK_A - 6, 13); crack(t, r, CRACK_A - 2, 30, CRACK_A + 8, 21); }
  if (j === 2) crack(t, r, CRACK_B - 4, 27, CRACK_B, 0);
  if (j === 3) { crack(t, r, CRACK_B, 47, CRACK_B + 7, 9); crack(t, r, CRACK_B + 3, 26, CRACK_B - 6, 18); }
  if (light) { const x = crackX(j === 'enter' ? 0.05 : -0.1); crack(t, r, x, 30, x + 3, 19); }
}
// The string course where the wall is crumbling: pieces of it gone, the rest cracked.
function drawTowerBandWorn(t) {
  const { p, ctx } = t;
  drawTowerBand(t);
  const r = new RNG(3177), S = ctx.canvas.width / TOWER_A;
  for (const f of [-0.62, -0.18, 0.3, 0.7]) { const x = crackX(f), w = r.int(3, 7); ctx.clearRect(x * S, 0, w * S, 6 * S); p(x - 1, 1, 1, 3, C.stoneShade); p(x + w, 0, 1, 2, C.stoneHi); }
  for (const f of [-0.4, 0.05, 0.5]) { const x = crackX(f); p(x, 1, 1, 2, C.mortar); p(x + 1, 3, 1, 2, C.mortar); }
}

// --- old big stones --------------------------------------------------------------------
// A stretch built of older stone: rough blocks two courses high and a brick
// and a half to two and a half wide, round the tower like the bricks, each
// lit along its top and in shade along its right and its foot, its corners
// worn, its face pitted. Where the area ends, the stones and the bricks
// tooth into each other.
function stoneCourse(t, r, y, h, sparse = 0) {
  const { p } = t;
  let a = -ROUND.edge - r.next() * BRICK_ANGLE * 1.3;
  while (a < ROUND.edge) {
    const wide = BRICK_ANGLE * r.range(1.5, 2.5), a0 = Math.max(a, -ROUND.edge), a1 = Math.min(a + wide, ROUND.edge);
    const x0 = Math.round(xOf(a0)), x1 = Math.round(xOf(a1)), w = x1 - x0, plane = planeAt((a0 + a1) / 2);
    a += wide;
    if (w < 2 || (sparse && r.chance(sparse))) continue;
    const k = Math.max(0, Math.min(4, plane + (r.chance(0.25) ? 1 : r.chance(0.12) ? -1 : 0)));
    p(x0, y, w, h, C.mortar);                                                   // its bed and the joint at its left
    p(x0 + 1, y, w - 1, h - 1, C[OLD[k]]);
    if (w > 3) {
      p(x0 + 1, y, w - 1, 1, C[OLD[Math.max(0, k - 1)]]);                       // lit along the top
      p(x1 - 1, y + 1, 1, h - 2, C[OLD[Math.min(4, k + 1)]]); p(x0 + 2, y + h - 2, w - 2, 1, C[OLD[Math.min(4, k + 1)]]);   // in shade along the right and the foot
      if (r.chance(0.6)) p(x0 + 1, y, 1, 1, C.mortar); if (r.chance(0.6)) p(x1 - 1, y, 1, 1, C.mortar);                 // worn corners
      for (let i = 0; i < Math.round(w / 5); i++) p(x0 + r.int(2, w - 2), y + r.int(2, h - 3), 1, 1, C[OLD[Math.min(4, k + 1)]]);   // pitted
      if (w > 9 && h > 8 && r.chance(0.2)) p(x0 + 1, y + Math.round(h / 2) - 1, w - 1, 1, C.mortar);                    // one that is two thinner stones
    }
  }
  p(TOWER_A - 1, y, 1, h, C.mortar);
}
function drawStone(t, j) {
  const r = new RNG(3300 + seedOf(j) * 13);
  if (typeof j === 'number') { for (let y = 0; y < 48; y += 12) stoneCourse(t, r, y, 12); return; }
  layWall(t, r);
  // the area's end: stone above the bricks (`enter`, its lower end) or below them (`leave`), a course of stubs between
  if (j === 'enter') { stoneCourse(t, r, 0, 12); stoneCourse(t, r, 12, 12); stoneCourse(t, r, 24, 6, 0.5); }
  else { stoneCourse(t, r, 36, 12); stoneCourse(t, r, 24, 12); stoneCourse(t, r, 18, 6, 0.5); }
}

// --- ivy -----------------------------------------------------------------------------
// Ivy climbing the wall: a handful of stems that wander up it, leaves along
// them, and here and there the leaves thickening into a mass that covers
// the bricks. It is planned once for the whole loop as one tall strip, so a
// mass goes across the tiles' edges; every leaf is drawn at its place on
// the round wall, smaller toward the edges, and in the greens of the plane
// of light it is in, dark leaves first and lit ones over them. At an area's
// ends the stems run on a little and stop.
const IVY = {
  // (duller and bluer than the leaves on the branches in front, so that the two are never taken for each other)
  tones: [{ hi: '#57a25a', base: '#337544', dark: '#20543a' }, { hi: '#40864c', base: '#295e3d', dark: '#1a4331' }, { hi: '#2f6944', base: '#1e4a35', dark: '#133229' }],   // lit, between, in shade
  stem: '#5a4632', stemDark: '#3b2e23', bloom: '#e9dfe8', glint: '#7cc072',
};
const IVY_H = TOWER_AREAS.ivy.loop * 48;
let ivyPlanned = null;
function ivyPlan() {
  if (ivyPlanned) return ivyPlanned;
  const r = new RNG(4100), E = ROUND.edge, TAU = Math.PI * 2;
  const gauss = () => (r.next() + r.next() + r.next() - 1.5) / 1.5;                      // about -1 .. 1, mostly near 0
  const stems = [-0.78, -0.45, -0.08, 0.3, 0.66].map((f, i) => ({ a0: f * E, amp: r.range(0.05, 0.11) * E, n: 1 + (i % 2), ph: r.range(0, TAU), down: r.int(10, 40), up: r.int(12, 42) }));
  const angle = (s, y) => s.a0 + s.amp * Math.sin((y / IVY_H) * TAU * s.n + s.ph);        // (the same at the strip's top and bottom, so the loop closes)
  const leaves = [], blooms = [];
  const leaf = (a, y, layer) => { if (Math.abs(a) < E * 0.985) leaves.push({ a, y: ((y % IVY_H) + IVY_H) % IVY_H, layer }); };
  for (const s of stems) {
    for (let y = 0; y < IVY_H; y += r.int(2, 4)) leaf(angle(s, y) + gauss() * 0.03, y + r.int(-1, 1), r.int(0, 2));     // leaves all the way up it
    for (let b = 0; b < 3; b++) {
      // a mass of leaves somewhere on it: a bed of dark ones that hides the bricks, the lit ones on top
      const cy = r.range(0, IVY_H), ry = r.range(20, 46), spread = r.range(0.11, 0.26) * E, n = Math.round(ry * spread * 150);
      for (let i = 0; i < n; i++) {
        // the mass is a rounded thing: lit where it faces up and to the left, dark below and to the right
        const dy = gauss(), da = gauss(), y = cy + dy * ry, lift = -dy * 0.9 - da * 0.6 + (r.next() - 0.5) * 0.9;
        leaf(angle(s, y) + da * spread, y, lift > 0.75 ? 2 : lift > -0.1 ? 1 : 0);
      }
      if (r.chance(0.6)) blooms.push({ a: angle(s, cy) + gauss() * spread * 0.6, y: ((cy + gauss() * ry * 0.5) % IVY_H + IVY_H) % IVY_H });
    }
  }
  // the area's ends: each stem runs on a little below the loop and above it, with a few leaves, the last of them young and light
  const ends = { enter: [], leave: [] };
  for (const s of stems) {
    for (let d = 0; d < s.down; d += r.int(2, 4)) ends.enter.push({ a: angle(s, IVY_H + d) + gauss() * 0.03, y: IVY_H + d, layer: d > s.down - 8 ? 2 : r.int(0, 2) });
    for (let d = 0; d < s.up; d += r.int(2, 4)) ends.leave.push({ a: angle(s, -d) + gauss() * 0.03, y: -d, layer: d > s.up - 10 ? 2 : r.int(0, 2) });
  }
  leaves.sort((p, q) => p.layer - q.layer);
  return (ivyPlanned = { stems, angle, leaves, blooms, ends });
}
function drawIvy(t, j) {
  const { p } = t;
  const plan = ivyPlan();
  // the tile's place in the strip: rows y0 .. y0 + 47 of it (the loop's tiles count upward, the strip's rows downward)
  const y0 = j === 'enter' ? IVY_H : j === 'leave' ? -48 : IVY_H - (j + 1) * 48;
  const one = (a, y, layer) => {
    const x = Math.round(xOf(a)), yy = Math.round(y) - y0;
    if (yy < -3 || yy > 50) return;
    const face = Math.cos(a), g = IVY.tones[Math.min(2, Math.max(0, planeAt(a) - 1))], col = layer === 0 ? g.dark : layer === 1 ? g.base : g.hi;
    if (face > 0.62) { p(x, yy, 4, 2, col); p(x + 1, yy + 2, 2, 1, col); p(x + 1, yy - 1, 2, 1, col); if (layer > 0) p(x, yy, 2, 1, layer === 2 ? IVY.glint : g.hi); if (layer === 0) p(x + 2, yy + 1, 1, 1, g.base); }
    else if (face > 0.4) { p(x, yy, 2, 2, col); p(x, yy + 2, 1, 1, col); if (layer === 2) p(x, yy, 1, 1, g.hi); }
    else p(x, yy, 1, 2, col);
  };
  // stems first: through the whole tile in the loop, as far as they go at an end
  for (const s of plan.stems) {
    const from = j === 'enter' ? IVY_H : j === 'leave' ? -s.up : y0, to = j === 'enter' ? IVY_H + s.down : j === 'leave' ? 0 : y0 + 48;
    for (let y = from; y < to; y++) { const a = plan.angle(s, y), x = Math.round(xOf(a)); p(x, y - y0, 1, 1, planeAt(a) >= 3 ? IVY.stemDark : IVY.stem); }
  }
  for (const l of plan.leaves) for (const wrap of [-IVY_H, 0, IVY_H]) one(l.a, l.y + wrap, l.layer);
  if (typeof j !== 'number') for (const l of plan.ends[j].slice().sort((p1, p2) => p1.layer - p2.layer)) one(l.a, l.y, l.layer);
  if (typeof j === 'number') for (const b of plan.blooms) { const x = Math.round(xOf(b.a)), yy = Math.round(b.y) - y0; if (yy > 1 && yy < 45 && Math.cos(b.a) > 0.5) { p(x, yy, 2, 2, IVY.bloom); p(x, yy, 1, 1, C.white); } }
}

// --- briar roses -------------------------------------------------------------------------
// A briar has climbed the wall: three old canes as thick as a thumb that
// swing wide across it and cross each other, thorns all along them, young
// green shoots that leave a cane, arch over and hang, small dark leaves in
// twos and threes, and roses: one at the end of most shoots, a few sitting
// on the canes, buds beside them. Like the ivy it is planned once as one
// tall strip, so the loop closes and a shoot goes across the tiles' edges,
// and everything stands at its place on the round wall in the tones of the
// plane of light it is in.
// The roses are not in the tiles: they hang on the wall as the signs do
// (each whole or not at all beside a window), and background.js gives every
// stretch of briar roses of one colour (ROSES), another in the next.
const BRIAR = {
  cane: [{ hi: '#94835a', base: '#5f5339', dark: '#3a3227' }, { hi: '#716546', base: '#4a412f', dark: '#2e2820' }, { hi: '#564c39', base: '#383228', dark: '#24201b' }],      // lit, between, in shade
  shoot: [{ hi: '#9cba5e', base: '#628a42', dark: '#3b5c31' }, { hi: '#76984c', base: '#4a6e38', dark: '#2d4829' }, { hi: '#567839', base: '#36552e', dark: '#223824' }],
  leaf: [{ hi: '#8fb650', base: '#538338', dark: '#2e5729' }, { hi: '#6a9942', base: '#3e6b30', dark: '#244525' }, { hi: '#4d7836', base: '#2d522a', dark: '#1a3520' }],
  thorn: ['#f3cdac', '#cc9f86', '#987462'],
  tip: '#c56f4c',
};
export const ROSES = [
  { hi: '#ff8494', base: '#dc3550', shade: '#a2233e', deep: '#66172c' },      // red (deeper than the hearts one collects)
  { hi: '#fffdf6', base: '#f4eadc', shade: '#d6c4c0', deep: '#e6bd5c' },      // white, its heart golden
  { hi: '#ffe0d8', base: '#f0a4a6', shade: '#c9727e', deep: '#8f475a' },      // old rose (paler and more to salmon than the bows on the braid)
];
const ROSE_FORMS = [
  // open
  ['..hhb..', '.hhbbb.', 'hhbdsbb', 'hbdsdbs', 'bbsdbss', '.bbsss.', '..sss..'],
  // open, and losing its petals
  ['..hhb..', '.hhbbb.', 'hhbdsbb', 'hbdsdbs', 'bbsdbss', '.bbsss.', '..sss..', '.......', '.....b.', '.......', '..h....'],
  // half open
  ['.hhb.', 'hhdbb', 'hbdss', 'bbsss', '.gsG.'],
  // a bud in its sepals
  ['.h.', 'hbs', 'bbs', 'gbG', '.g.'],
  // full blown
  ['...hhb...', '.hhhbbbs.', '.hhbddbbs', 'hhbdsbdbs', 'hbbdbsdss', 'bbsbddsss', '.bbssssb.', '.sbbbsss.', '...sss...'],
];
const BRIAR_H = TOWER_AREAS.briar.loop * 48;
let briarPlanned = null;
function briarPlan() {
  if (briarPlanned) return briarPlanned;
  const r = new RNG(4700), E = ROUND.edge, TAU = Math.PI * 2, H = BRIAR_H;
  const wrap = (y) => ((y % H) + H) % H;
  // the old canes: a wide swing across the wall and a smaller one on top of it (both whole numbers of turns, so the loop closes)
  // (placed by hand: none the mirror of another, and no two crossings at one height)
  const canes = [
    { a0: -0.5 * E, amp: 0.25 * E, n: 1, ph: 0.4, amp2: 0.07 * E, n2: 3, ph2: 1.3, down: 38, up: 24 },
    { a0: 0.06 * E, amp: 0.15 * E, n: 2, ph: 2.3, amp2: 0.05 * E, n2: 3, ph2: 4.0, down: 20, up: 42 },
    { a0: 0.56 * E, amp: 0.19 * E, n: 1, ph: 1.9, amp2: 0.08 * E, n2: 2, ph2: 5.2, down: 30, up: 32 },
  ];
  const angle = (c, y) => c.a0 + c.amp * Math.sin((y / H) * TAU * c.n + c.ph) + c.amp2 * Math.sin((y / H) * TAU * c.n2 + c.ph2);
  const shoots = [], leaves = [], roses = [];
  const leaf = (a, y, layer) => { if (Math.abs(a) < E * 0.97) leaves.push({ a, y: wrap(y), layer }); };
  const rose = (a, y, form) => { if (Math.abs(a) < E * 0.8) roses.push({ a, y: wrap(y), form }); };
  for (const c of canes) {
    // young shoots: out from the cane and up, over, and down again to where the rose hangs
    for (let y = r.int(3, 12); y < H - 6; y += r.int(13, 22)) {
      const dir = r.chance(0.5) ? 1 : -1, len = r.range(0.13, 0.25) * E, rise = r.range(5, 12), droop = r.range(3, 11), pts = [];
      for (let k = 0; k <= 24; k++) { const f = k / 24; pts.push({ a: angle(c, y) + dir * len * f, y: y - rise * 4 * f * (1 - f) + droop * f * f }); }
      shoots.push(pts);
      for (const k of [4, 7, 10, 13, 16, 19, 22]) if (r.chance(0.85)) leaf(pts[k].a + (r.next() - 0.5) * 0.02, pts[k].y + (k % 2 ? -2 : 2), r.int(0, 2));
      const end = pts[24], form = r.chance(0.55) ? (r.chance(0.3) ? 1 : 0) : r.chance(0.6) ? 2 : 3;
      rose(end.a, end.y, form);
      leaf(end.a - 0.05, end.y - 3, 1); leaf(end.a + 0.06, end.y - 1, 0); leaf(end.a + 0.03, end.y + 3, 0); if (r.chance(0.7)) leaf(end.a - 0.04, end.y + 3, 2);       // the leaves a rose sits in
      if (r.chance(0.45)) rose(pts[17].a, pts[17].y + 3, 3);                                                                       // a bud further back on it
    }
    // on the cane itself: leaves in twos, and here and there a rose with a bud beside it
    for (let y = r.int(0, 4); y < H; y += r.int(4, 8)) { const side = r.chance(0.5) ? 1 : -1; leaf(angle(c, y) + side * 0.035, y, r.int(0, 2)); if (r.chance(0.6)) leaf(angle(c, y) - side * 0.04, y + 2, r.int(0, 1)); if (r.chance(0.25)) leaf(angle(c, y) + side * 0.08, y - 2, r.int(1, 2)); }
    for (let y = r.int(10, 30); y < H; y += r.int(44, 70)) { rose(angle(c, y) + 0.02, y, r.chance(0.7) ? 4 : 0); rose(angle(c, y) - 0.08, y + 6, 3); leaf(angle(c, y) + 0.08, y + 3, 1); leaf(angle(c, y) - 0.07, y - 4, 2); leaf(angle(c, y) + 0.05, y - 5, 0); }
  }
  leaves.sort((p, q) => p.layer - q.layer);
  return (briarPlanned = { canes, angle, shoots, leaves, roses });
}
function drawBriar(t, j, fix) {
  const { p } = t;
  const plan = briarPlan(), H = BRIAR_H, loop = typeof j === 'number';
  const y0 = j === 'enter' ? H : j === 'leave' ? -48 : H - (j + 1) * 48;        // the tile's rows of the strip, as the ivy's
  const tone = (set, a) => set[Math.min(2, Math.max(0, planeAt(a) - 1))];
  const wraps = loop ? [-H, 0, H] : [];
  // the canes: two wide where they face us, lit along their left, a thorn every few rows on one side and then the other
  for (const c of plan.canes) {
    const from = j === 'enter' ? H : j === 'leave' ? -c.up : y0, to = j === 'enter' ? H + c.down : j === 'leave' ? 0 : y0 + 48;
    let n = 0;
    for (let y = from; y < to; y += 0.25) {
      const a = plan.angle(c, y), x = Math.round(xOf(a)), yy = Math.floor(y) - y0, g = tone(BRIAR.cane, a), wide = Math.cos(a) > 0.5;
      const young = j === 'leave' && y < -c.up + 11;                                     // its upper end: this year's growth, green, the very tip red
      if (j === 'enter' && y > H + c.down - 2) { p(x - 1, yy, 3, 1, C[DEEP]); continue; }       // its lower end: the joint it comes out of
      const k = young ? tone(BRIAR.shoot, a) : g;
      if (wide && !young) { p(x, yy, 1, 1, k.hi); p(x + 1, yy, 1, 1, k.base); } else p(x, yy, 1, 1, young ? k.base : k.base);
      if (young && y < -c.up + 2) p(x, yy, 1, 1, BRIAR.tip);
      if (y === Math.floor(y) && (Math.floor(y) + 300) % 3 === 0 && !young) { n++; const th = BRIAR.thorn[Math.min(2, Math.max(0, planeAt(a) - 1))]; if (n % 2) p(x - 1, yy - 1, 1, 1, th); else p(x + (wide ? 2 : 1), yy - 1, 1, 1, th); }
      if (y === Math.floor(y) && (Math.floor(y) + 300) % 7 === 3 && wide && !young) p(x + 1, yy, 1, 1, g.dark);
    }
  }
  // the shoots, one pixel wide, with their own smaller thorns
  for (const pts of plan.shoots) for (const w of wraps) {
    for (let i = 0; i < pts.length - 1; i++) for (let f = 0; f < 1; f += 0.2) {
      const a = pts[i].a + (pts[i + 1].a - pts[i].a) * f, y = pts[i].y + (pts[i + 1].y - pts[i].y) * f + w, yy = Math.round(y) - y0;
      if (yy < -1 || yy > 48 || Math.abs(a) > ROUND.edge * 0.98) continue;
      const g = tone(BRIAR.shoot, a), x = Math.round(xOf(a));
      p(x, yy, 1, 1, i < 5 ? g.dark : g.base); if (i > 4 && i % 4 === 0 && f === 0) p(x, yy - 1, 1, 1, g.hi);
      if (i % 5 === 2 && f === 0) p(x + (i % 2 ? 1 : -1), yy + (i % 2 ? -1 : 1), 1, 1, BRIAR.thorn[Math.min(2, Math.max(0, planeAt(a)))]);
    }
  }
  // the leaves: small, dark and glossy, a point of light on the lit ones
  const one = (a, y, layer) => {
    const x = Math.round(xOf(a)), yy = Math.round(y) - y0;
    if (yy < -2 || yy > 49) return;
    const g = tone(BRIAR.leaf, a), col = layer === 0 ? g.dark : layer === 1 ? g.base : g.hi, face = Math.cos(a);
    if (face > 0.6) { p(x, yy, 3, 2, col); p(x + 1, yy - 1, 2, 1, col); p(x + 3, yy + 1, 1, 1, col); if (layer > 0) p(x, yy, 1, 1, g.hi); if (layer === 2) p(x + 1, yy - 1, 1, 1, '#b9d67a'); p(x + 1, yy + 1, 2, 1, layer === 0 ? g.dark : BRIAR.leaf[2].base); }
    else if (face > 0.4) { p(x, yy, 2, 2, col); if (layer === 2) p(x, yy, 1, 1, g.hi); }
    else p(x, yy, 1, 2, col);
  };
  for (const l of plan.leaves) for (const w of wraps) one(l.a, l.y + w, l.layer);
  if (!loop) for (const c of plan.canes) {
    // an end has a few leaves on what there is of the canes, and a bud beside a tip that got far enough
    const from = j === 'enter' ? H : -c.up, to = j === 'enter' ? H + c.down : 0, r = new RNG(4750 + Math.round(c.a0 * 100) + (j === 'enter' ? 0 : 7));
    for (let y = from + 3; y < to - 4; y += r.int(6, 10)) { const side = r.chance(0.5) ? 1 : -1; one(plan.angle(c, y) + side * 0.035, y, r.int(0, 2)); }
    const a = plan.angle(c, from + 4);
    if (j === 'leave' && c.up > 28 && Math.abs(a) < ROUND.edge * 0.8) fix.push({ what: 'rose', form: 3, x: Math.round(xOf(a)) + 1, y: Math.max(0, Math.min(43, from + 3 - y0)), plane: planeAt(a) });      // a bud beside the tip
  }
  // the roses of this tile (those of the strip whose middle is in it), each kept inside it
  if (loop) for (const q of plan.roses) {
    const yy = Math.round(q.y) - y0;
    if (yy < 0 || yy >= 48 || Math.cos(q.a) < 0.45) continue;
    const rows = ROSE_FORMS[q.form], w = rows[0].length, h = rows.length, top = q.form === 4 ? 4 : q.form < 2 ? 3 : 2;
    fix.push({ what: 'rose', form: q.form, x: Math.round(xOf(q.a)) - Math.floor(w / 2), y: Math.max(0, Math.min(48 - h, yy - top)), plane: planeAt(q.a) });
  }
}

// --- moss -----------------------------------------------------------------------------
// The wall where it never dries: moss in the joints, in runs along the
// courses and in cushions, a green film on the lower halves of some bricks,
// water marks running down from the thickest of it. More of it on the side
// away from the light, and brighter where the light reaches it.
const MOSS = [{ hi: '#86b53e', base: '#55892a', dark: '#2c6a30' }, { hi: '#62993a', base: '#3a7630', dark: '#1f552e' }, { hi: '#427a34', base: '#255a30', dark: '#143c28' }];   // lit, between, in shade
function drawMoss(t, j) {
  const { p } = t;
  const r = new RNG(4300 + seedOf(j) * 11), light = typeof j !== 'number', E = ROUND.edge;
  // it grows in patches: two or three places in a tile, likelier away from the light, and thinly between them
  const patches = Array.from({ length: light ? 1 : 3 }, () => ({ a: (r.next() * 1.5 - 0.5) * E, y: r.range(4, 44) }));
  const gauss = () => (r.next() + r.next() + r.next() - 1.5) / 1.5;
  let at = null;
  const angle = () => { if (r.chance(0.2)) { at = null; return (r.next() * 1.9 - 0.95) * E; } at = r.pick(patches); return at.a + gauss() * 0.3 * E; };
  const row = (n) => (at ? Math.max(0, Math.min(n, Math.round((at.y + gauss() * 14) / ROW))) : r.int(0, n));
  const tone = (a) => MOSS[Math.min(2, Math.max(0, planeAt(a) - 1))];
  const ok = (a) => Math.abs(a) < E * 0.97;
  // runs along the courses' joints
  for (let i = 0; i < (light ? 14 : 46); i++) {
    const a = angle(); if (!ok(a)) continue;
    const y = row(7) * ROW + ROW - 1, x = Math.round(xOf(a)), w = Math.max(1, Math.round(r.int(3, 10) * Math.cos(a))), g = tone(a);
    p(x, y, w, 1, g.dark); p(x, y - 1, w, 1, g.base); if (w > 2) p(x + 1, y - 2, w - 2, 1, r.chance(0.5) ? g.base : g.hi);
  }
  // cushions, and the water running from them
  for (let i = 0; i < (light ? 3 : 9); i++) {
    const a = angle(); if (!ok(a)) continue;
    const y = Math.max(1, row(7)) * ROW - 1, x = Math.round(xOf(a)), w = Math.max(2, Math.round(r.int(4, 7) * Math.cos(a))), g = tone(a);
    p(x, y - 2, w, 3, g.base); p(x + 1, y - 3, Math.max(1, w - 2), 1, g.base); p(x, y - 2, Math.max(1, w - 2), 1, g.hi); p(x, y, w, 1, g.dark);
    if (r.chance(0.6)) p(x + r.int(0, w - 1), y + 1, 1, r.int(3, 9), g.dark);
  }
  // a film on the bricks, in the upright joints
  for (let i = 0; i < (light ? 6 : 20); i++) {
    const a = angle(); if (!ok(a)) continue;
    const y = row(7) * ROW + r.int(2, 3), x = Math.round(xOf(a)), w = Math.max(1, Math.round(r.int(2, 6) * Math.cos(a)));
    p(x, y, w, 1, tone(a).dark); if (r.chance(0.5)) p(x + 1, y + 1, Math.max(1, w - 1), 1, tone(a).dark);
  }
  for (let i = 0; i < (light ? 4 : 12); i++) { const a = angle(); if (ok(a)) p(Math.round(xOf(a)), r.int(0, 46), 1, 2, tone(a).base); }
}

// --- what hangs on the wall -----------------------------------------------------------------
// Things on the wall that are not the wall: the boards over a hole (with
// their hole), a sign, a ladder, a bucket on its rope. They are sprites of
// their own, which background.js lays on the tiles, for two reasons. A tile
// cannot know where the windows are, and a sign with a window cut into it is
// worse than no sign: so a thing that would meet a window slides up or down
// the wall until it is clear of it (`slide`). And a tile that comes round
// again need not be the same: which sign hangs in a place is chosen by where
// on the tower it is.
// A tile's draw function says what hangs on it: { what, x, y, plane } with
// (x, y) the thing's upper left corner in the tile (art px) and `plane` the
// plane of light it hangs in, which lies over all of it as one flat tone.
const WOOD = {
  fresh: { hi: '#e6cc98', base: '#c2a06c', shade: '#93744c', dark: '#5e4932' },   // newly sawn
  grey: { hi: '#b9ad9a', base: '#8f8472', shade: '#665d50', dark: '#463f38' },    // been out in the weather
};
const PAINT = { red: '#c8372f', redHi: '#e8604e', redDark: '#8e2424', cream: '#f1e6cc', creamShade: '#cdbfa4', yellow: '#f0c23c', yellowShade: '#c08f24', ink: '#2a2230', hat: '#46306b', nail: '#dfe6e2', iron: '#59606a', rope: '#d8c38a', ropeDark: '#a68b55' };
const CAST = 'rgba(16, 26, 31, 0.5)';        // the shadow a thing throws on the wall under it
const THING_TINT = [null, null, '#dde3e4', '#b9c3c8', '#97a3ab'];   // by the plane of light a thing hangs in

// A little picture from rows of letters, each letter a colour of `key` ('.' is nothing).
function stamp(t, x, y, rows, key) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (key[row[i]]) t.p(x + i, y + j, 1, 1, key[row[i]]); });
}
// A board nailed to the wall, its upper edge from (x0, y0) to (x1, y1), `th`
// thick: lit along the top, in shade along the bottom, some grain, its shadow
// on the wall under it, a nail near each end (`loose`: only at its first
// end, it hangs from that one). `paint(i, k)` gives a painted board its
// colour at i along and k across. A steep board is laid in rows, a flat one
// in columns, so neither breaks into single pixels.
function board(t, r, x0, y0, x1, y1, th, wood, opts = {}) {
  const { p } = t, steep = Math.abs(y1 - y0) > Math.abs(x1 - x0), n = Math.max(1, steep ? Math.abs(y1 - y0) : Math.abs(x1 - x0));
  for (let i = 0; i <= n; i++) {
    const f = i / n, a = Math.round(steep ? x0 + (x1 - x0) * f : y0 + (y1 - y0) * f), b = steep ? y0 + Math.sign(y1 - y0) * i : x0 + Math.sign(x1 - x0) * i;
    for (let k = 0; k < th; k++) {
      const col = opts.paint ? opts.paint(i, k) : k === 0 ? wood.hi : k === th - 1 ? wood.shade : wood.base;
      if (steep) p(a + k, b, 1, 1, col); else p(b, a + k, 1, 1, col);
    }
    if (steep) p(a + th, b, 1, 1, CAST); else p(b, a + th, 1, 1, CAST);
    if (!opts.paint && th > 2 && i > 1 && i < n - 3 && r.chance(0.16)) { const k = r.int(1, th - 2); for (let d = 0; d < 3; d++) { const f2 = (i + d) / n, a2 = Math.round(steep ? x0 + (x1 - x0) * f2 : y0 + (y1 - y0) * f2); if (steep) p(a2 + k, b + Math.sign(y1 - y0) * d, 1, 1, wood.shade); else p(b + Math.sign(x1 - x0) * d, a2 + k, 1, 1, wood.shade); } }
  }
  // its sawn ends (the far one in shade), and the nails
  const end = (f, col) => { const a = Math.round(steep ? x0 + (x1 - x0) * f : y0 + (y1 - y0) * f), b = Math.round(steep ? y0 + (y1 - y0) * f : x0 + (x1 - x0) * f); if (steep) p(a, b, th, 1, col); else p(b, a + 1, 1, th - 1, col); };
  end(1, wood.dark);
  const nail = (i) => { const f = i / n, a = Math.round(steep ? x0 + (x1 - x0) * f : y0 + (y1 - y0) * f), b = steep ? y0 + Math.sign(y1 - y0) * i : x0 + Math.sign(x1 - x0) * i, k = Math.floor((th - 1) / 2); if (steep) { p(a + k, b, 1, 1, PAINT.nail); p(a + k + 1, b, 1, 1, wood.dark); } else { p(b, a + k, 1, 1, PAINT.nail); p(b, a + k + 1, 1, 1, wood.dark); } };
  nail(Math.min(2, n)); if (!opts.loose) nail(Math.max(0, n - 2));
}
// The red and white of a barrier: slanting stripes three wide.
const stripes = (i, k) => (Math.floor((i + k) / 3) % 2 ? (k === 0 ? PAINT.redHi : k >= 4 ? PAINT.redDark : PAINT.red) : (k >= 4 ? PAINT.creamShade : PAINT.cream));

// The hole a set of boards is nailed over: the facing gone over some courses
// (`spans`: for each course from the top, the dark from x0 to x1; the first
// course's top is row `oy` of the sprite), the core's rubble in the dark, a
// little damp under it. It is in the boards' sprite, so the two go about the
// wall together; the sprite is hung so that the hole's courses are the
// wall's (drawMended), and its ragged ends make broken bricks of the whole
// ones they cut.
function hole(t, r, oy, spans) {
  const { p } = t;
  spans.forEach(([x0, x1], i) => p(x0, oy + i * ROW - 1, x1 - x0, ROW + 1, C[DEEP]));
  spans.forEach(([x0, x1], i) => {
    for (let n = 0; n < Math.max(1, Math.round((x1 - x0) / 7)); n++) { const x = r.int(x0 + 1, x1 - 4), y = oy + i * ROW + r.int(1, 3), w = r.int(2, 3); p(x, y, w, 2, C[OLD[4]]); p(x, y, w, 1, C[OLD[3]]); }
  });
  const [x0, x1] = spans[spans.length - 1], foot = oy + spans.length * ROW;
  for (let n = 0; n < 2; n++) p(r.int(x0 + 1, x1 - 2), foot, 1, r.int(2, 3), 'rgba(40, 56, 62, 0.6)');
}

function buildThings() {
  const at = { ax: 0, ay: 0 }, r = new RNG(3600);
  // (`oy`: the row of the sprite that its hole's first course begins at)
  const holed = (w, h, oy, draw) => Object.assign(makeSprite(w, h, draw, at), { oy });
  const boards = {
    // two boards crossed over a small hole
    cross: holed(22, 15, 4, (t) => { hole(t, r, 4, [[5, 18]]); board(t, r, 1, 1, 20, 8, 3, WOOD.grey); board(t, r, 1, 10, 20, 2, 3, WOOD.fresh); }),
    // three boards over a bigger one, none of them level and none the same length
    three: holed(32, 20, 4, (t) => { hole(t, r, 4, [[6, 25], [3, 29]]); board(t, r, 2, 1, 29, 3, 4, WOOD.fresh); board(t, r, 0, 9, 26, 7, 3, WOOD.grey); board(t, r, 4, 13, 30, 15, 4, WOOD.fresh); }),
    // two boards, and a third that has come off at one end and hangs from its other nail
    hang: holed(30, 26, 3, (t) => { hole(t, r, 3, [[4, 24], [2, 27], [9, 22]]); board(t, r, 1, 2, 28, 4, 4, WOOD.grey); board(t, r, 3, 11, 27, 9, 3, WOOD.fresh); board(t, r, 22, 14, 18, 24, 3, WOOD.grey, { loose: true }); }),
    // the barrier: a red and white board across the worst of them, a plain one under it, an upright behind them
    barrier: holed(36, 22, 2, (t) => { hole(t, r, 2, [[8, 27], [3, 33], [5, 30]]); board(t, r, 17, 0, 16, 20, 3, WOOD.grey); board(t, r, 0, 4, 35, 2, 6, WOOD.fresh, { paint: stripes }); board(t, r, 2, 15, 33, 16, 3, WOOD.fresh); t.p(2, 6, 1, 1, PAINT.nail); t.p(33, 4, 1, 1, PAINT.nail); }),
  };
  const K = { R: PAINT.red, r: PAINT.redDark, h: PAINT.redHi, y: PAINT.yellow, Y: PAINT.yellowShade, k: PAINT.ink, c: PAINT.cream, s: PAINT.creamShade, n: PAINT.nail, d: CAST, W: WOOD.fresh.base, w: WOOD.fresh.hi, x: WOOD.fresh.shade, D: WOOD.fresh.dark, g: WOOD.grey.base, G: WOOD.grey.shade, v: PAINT.hat };
  const signs = [
    // stones may fall: the yellow triangle with its red rim
    makeSprite(17, 16, (t) => stamp(t, 0, 0, [
      '........n........',
      '.......hhh.......',
      '......hRyRR......',
      '......RyyyR......',
      '.....hRyyyRR.....',
      '.....RyyyyyR.....',
      '....hRyykyyRR....',
      '....RyyyyyyyR....',
      '...hRyykyyyyRR...',
      '...RyyyyyykyyR...',
      '..hRyyyyyyyyyRR..',
      '..RyykkyykkykyR..',
      '.hRYYYYYYYYYYYRR.',
      '.RRRRRRRRRRRRRRr.',
      '..ddddddddddddd..',
    ], K), at),
    // no witches: her hat in the red ring, struck through
    makeSprite(17, 18, (t) => {
      const { p, disc, ring, line } = t;
      disc(8, 9, 8, CAST); disc(8, 8, 8, PAINT.red); disc(8, 8, 6, PAINT.cream);
      p(3, 2, 3, 1, PAINT.redHi); p(2, 3, 2, 2, PAINT.redHi); p(1, 5, 1, 2, PAINT.redHi);     // the ring lit at its upper left
      p(11, 14, 3, 1, PAINT.redDark); p(13, 12, 2, 2, PAINT.redDark);
      p(3, 11, 11, 1, PAINT.ink); p(4, 12, 9, 1, PAINT.ink);                                  // the brim
      p(6, 10, 6, 1, PAINT.hat); p(6, 9, 5, 1, PAINT.ink); p(7, 8, 4, 1, PAINT.ink); p(7, 7, 4, 1, PAINT.ink); p(8, 6, 3, 1, PAINT.ink); p(8, 5, 3, 1, PAINT.ink); p(9, 4, 2, 1, PAINT.ink); p(10, 3, 2, 1, PAINT.ink);
      p(8, 10, 2, 1, PAINT.yellow);                                                           // its buckle
      line(4, 4, 12, 12, PAINT.red, 1); line(3, 4, 4, 5, PAINT.red, 1); line(12, 11, 13, 12, PAINT.red, 1);
      p(8, 0, 1, 1, PAINT.nail);
    }, at),
    // the master mason's notice: lines nobody can read from here, his seal, a corner curling
    makeSprite(13, 16, (t) => stamp(t, 0, 0, [
      '......n......',
      '.ccccccccccc.',
      '.ccccccccccc.',
      '.ckkkkkckkcc.',
      '.ccccccccccc.',
      '.ckkckkkkkcc.',
      '.ccccccccccc.',
      '.ckkkkkkckkc.',
      '.ccccccccccc.',
      '.ckkkckkcccc.',
      '.ccccccccccc.',
      '.ccccccRRRcc.',
      '.ccccccRhRcs.',
      '.ccccccRRrss.',
      '.sssssssss...',
      '..ddddddd....',
    ], { ...K, k: '#8b7c80' }), at),
    // this way up: a board sawn into an arrow, its edge painted
    makeSprite(13, 18, (t) => stamp(t, 0, 0, [
      '......c......',
      '.....cwc.....',
      '....cwWWc....',
      '...cwWWWWc...',
      '..cwWWnWWWc..',
      '.cwWWWWWWWxc.',
      'cwwWWWWWWWxxc',
      'cccccwWWxcccc',
      '.dddcwWWxcdd.',
      '....cwWWxc...',
      '....cwWWxc...',
      '....cwWWxc...',
      '....cwWWxc...',
      '....cwnWxc...',
      '....cwWWxc...',
      '....cxxxxc...',
      '....cccccc...',
      '.....dddd....',
    ], K), at),
  ];
  // a ladder left standing against the wall, tied at the top, one rung gone
  const ladder = makeSprite(11, 46, (t) => {
    const { p } = t, G = WOOD.grey, F = WOOD.fresh;
    const lean = (y) => (y < 23 ? 1 : 0);
    for (let y = 1; y < 46; y++) { const x = lean(y); p(x, y, 2, 1, F.base); p(x, y, 1, 1, F.hi); p(x + 7, y, 2, 1, F.base); p(x + 8, y, 1, 1, F.shade); p(x + 9, y, 1, 1, CAST); }
    for (let y = 5, i = 0; y < 44; y += 6, i++) {
      const x = lean(y) + 2;
      if (i === 3) { p(x, y, 2, 1, G.base); p(x, y + 1, 1, 1, G.shade); continue; }       // the rung that broke: a stump
      p(x, y, 5, 1, i % 2 ? G.hi : F.hi); p(x, y + 1, 5, 1, i % 2 ? G.shade : F.shade); p(x, y + 2, 5, 1, CAST);
    }
    p(0, 2, 4, 2, PAINT.rope); p(0, 3, 4, 1, PAINT.ropeDark); p(7, 2, 4, 2, PAINT.rope); p(7, 3, 4, 1, PAINT.ropeDark);     // lashed to a hook at the top
  }, at);
  // the hoist: a beam let into the wall with a wheel on it (it stays), and the bucket of mortar on the rope (it swings a little: anchored where the rope leaves the wheel)
  const hoist = makeSprite(9, 8, (t) => {
    const { p } = t, G = WOOD.grey;
    p(1, 0, 7, 3, G.base); p(1, 0, 7, 1, G.hi); p(1, 2, 7, 1, G.shade); p(7, 0, 1, 3, G.dark); p(1, 3, 7, 1, CAST);
    p(3, 3, 3, 4, PAINT.iron); p(4, 4, 1, 2, PAINT.nail); p(3, 7, 3, 1, CAST);
  }, at);
  const bucket = makeSprite(9, 26, (t) => {
    const { p } = t, F = WOOD.fresh;
    p(4, 0, 1, 15, PAINT.rope); for (let y = 2; y < 15; y += 3) p(4, y, 1, 1, PAINT.ropeDark);
    p(2, 13, 1, 3, PAINT.iron); p(6, 13, 1, 3, PAINT.iron); p(3, 12, 3, 1, PAINT.iron);                              // the handle
    p(1, 16, 7, 7, F.base); p(2, 23, 5, 1, F.shade); p(1, 16, 1, 7, F.hi); p(7, 16, 1, 6, F.shade); p(3, 17, 1, 6, F.shade); p(5, 17, 1, 6, F.shade);   // staves
    p(1, 18, 7, 1, PAINT.iron); p(2, 22, 5, 1, PAINT.iron);                                                          // hoops
    p(2, 15, 5, 1, C.stoneLight); p(3, 14, 3, 1, C.stoneHi); p(6, 14, 1, 1, C.stoneLight);                           // heaped with mortar
    p(6, 11, 1, 3, WOOD.grey.dark); p(7, 10, 1, 2, WOOD.grey.base);                                                  // the trowel's handle sticking out of it
    p(2, 24, 6, 1, CAST);
  }, { ax: 0.5, ay: 0 }, { axPx: 4.5 * PX, ayPx: 0 });
  // the briar's roses: every form in every colour, [colour][form]
  const roses = ROSES.map((R) => ROSE_FORMS.map((rows) => makeSprite(rows[0].length, rows.length, (t) => stamp(t, 0, 0, rows, { h: R.hi, b: R.base, s: R.shade, d: R.deep, g: BRIAR.leaf[0].base, G: BRIAR.leaf[1].dark }), at)));
  return { boards, signs, ladder, hoist, bucket, roses };
}

// --- under repair ------------------------------------------------------------------------
// Somebody is mending the wall, or was: holes where the facing has come away,
// boards nailed over them (and the red and white of a barrier over the
// worst), patches already made up in new brick that is paler and warmer than
// the old and still has its fresh mortar round it, the mason's chalk on the
// bricks that come out next, the ends of the beams a scaffold stood on, a
// ladder, a bucket of mortar on a hoist, and signs.
// SITE says what each tile has: boarded holes [where round the wall (a share
// of ROUND.edge), the course its hole begins at, which boards], patches of
// new brick [where, course, reach], things [what, x, y] and signs [x, y,
// which or any]. Only the patches, the chalk and the beam ends are in the
// tile; the rest hangs on it.
const NEW = ['#f0dcc2', '#dcc3a6', '#c0a58c', '#9d8674', '#78685e'];       // new brick, by plane as STONE_PLANES
const FRESH = ['#f8f1e2', '#e9e0cc', '#cdc2ae', '#a69c8c', '#837a70'];     // fresh mortar
const CHALK = '#eef3ee';
const SITE = {
  enter: { holes: [], patches: [[0.5, 1, 6]], signs: [[21, 14, 0]], things: [], putlogs: [] },
  0: { holes: [[-0.4, 2, 'barrier']], patches: [], signs: [[75, 6, null]], things: [], putlogs: [[0.2, 42], [0.5, 42]] },
  1: { holes: [[-0.1, 2, 'cross']], patches: [[0.34, 5, 13]], signs: [], things: [['hoist', 4, 3], ['bucket', 4, 10]], putlogs: [] },
  2: { holes: [[0.36, 3, 'hang']], patches: [[-0.08, 1, 7]], signs: [[20, 18, null]], things: [['ladder', 98, 1]], putlogs: [] },
  3: { holes: [[0.52, 2, 'cross'], [-0.18, 4, 'three']], patches: [[-0.4, 1, 12]], signs: [[66, 26, null]], things: [], putlogs: [[-0.66, 20], [0.16, 6], [0.44, 20]] },
  leave: { holes: [], patches: [[-0.3, 6, 8]], signs: [], things: [], putlogs: [] },
};
const SIZE = { cross: [22, 4], three: [32, 4], hang: [30, 3], barrier: [36, 2] };      // the boards' sprites: how wide, and the row their hole's first course begins at (buildThings)
function drawMended(t, j, fix) {
  const { p } = t;
  const r = new RNG(3500 + seedOf(j) * 19), cells = layWall(t, r), light = typeof j !== 'number', rowH = ROW, E = ROUND.edge, S = SITE[j];
  const near = (c, x, y, reach, rows) => Math.abs(c.y - y) <= rows * rowH && Math.abs(c.x + c.w / 2 - x) < reach - (c.y === y ? 0 : 3);
  // the wear of a wall that needed it: corners off, a few bricks sunk in their bed
  for (let i = 0; i < (light ? 2 : 4); i++) { const c = r.pick(cells.filter((q) => q.w >= 7)); p(c.x, c.y, c.w, 1, C.mortar); p(c.x, c.y + rowH - 1, c.w, 1, C[c.col]); }
  for (let i = 0; i < (light ? 6 : 12); i++) { const c = r.pick(cells.filter((q) => q.w >= 4)), right = r.chance(0.5), low = r.chance(0.5); p(c.x + (right ? c.w - 1 : 0), c.y + (low ? rowH - 2 : 0), 1, 1, C.mortar); }
  // made up in new brick: the bricks of the patch, each lit along its top, fresh mortar in its joints and smeared a little over the old bricks round it
  for (const [f, row, reach] of S.patches) {
    const x = xOf(f * E), y = row * rowH, rows = reach > 9 ? 1 : 0;
    const made = cells.filter((c) => near(c, x, y, reach, rows) && (c.y === y || r.chance(0.8)));
    for (const c of made) {
      const k = Math.min(4, c.plane + (r.chance(0.3) ? 1 : 0));
      p(c.x - 1, c.y - 1, c.w + 2, rowH + 1, FRESH[Math.min(4, c.plane + 1)]);                 // bedded in fresh mortar, which shows all round it
      p(c.x, c.y, c.w, rowH - 1, NEW[k]); p(c.x, c.y, c.w, 1, NEW[Math.max(0, k - 1)]); p(c.x, c.y + rowH - 2, c.w, 1, NEW[Math.min(4, k + 1)]);
    }
    for (const c of made) if (r.chance(0.6)) { const low = r.chance(0.5); p(c.x + r.int(0, c.w - 1), c.y + (low ? rowH : -2), r.int(1, 3), low ? r.int(1, 3) : 1, FRESH[Math.min(4, c.plane + 1)]); }   // and has run down the wall under it
  }
  // the mason's chalk on a few bricks: these come out next
  for (let i = 0; i < (light ? 1 : 4); i++) { const c = r.pick(cells.filter((q) => q.w >= 8 && q.plane <= 3)), cx = c.x + r.int(1, c.w - 4); p(cx, c.y + 1, 1, 1, CHALK); p(cx + 2, c.y + 1, 1, 1, CHALK); p(cx + 1, c.y + 2, 1, 1, CHALK); p(cx, c.y + 3, 1, 1, CHALK); p(cx + 2, c.y + 3, 1, 1, CHALK); }
  // the boarded holes: each hung with its hole's courses on the wall's
  for (const [f, row, boards] of S.holes) fix.push({ what: boards, x: Math.round(xOf(f * E)) - Math.floor(SIZE[boards][0] / 2), y: row * rowH - SIZE[boards][1], plane: planeAt(f * E) });
  // where the scaffold stood: the ends of its beams, sawn off at the wall
  for (const [f, y] of S.putlogs) {
    const x = Math.round(xOf(f * E)), k = planeAt(f * E) >= 3 ? WOOD.grey : WOOD.fresh;
    p(x - 1, y - 1, 5, 5, C[DEEP]); p(x, y, 3, 3, k.base); p(x, y, 3, 1, k.hi); p(x + 2, y + 1, 1, 2, k.shade); p(x + 1, y + 1, 1, 1, k.dark);
  }
  const planeOf = (x) => planeAt(Math.asin(Math.max(-1, Math.min(1, (x / (TOWER_A / 2) - 1) * Math.sin(E)))));
  for (const [what, x, y] of S.things) fix.push({ what, x, y, plane: planeOf(x + 4) });
  for (const [x, y, which] of S.signs) fix.push({ what: 'sign', sign: which, x, y, plane: planeOf(x + 7) });      // (null: whichever sign this place on the tower gets)
}

const AREA_DRAW = { ivy: drawIvy, worn: drawWorn, stone: drawStone, moss: drawMoss, mended: drawMended, briar: drawBriar };

// The wall's sprites: its plain tiles, the string courses (`bands`: the
// plain one and the others by name), and every area's tiles with what hangs
// on each (`fix`, shaped like the tiles: enter, leave, loop[]): { s } or
// { signs, sign } (one of the signs: that one, or any where `sign` is null,
// and then `slot` of `slots` says which of the loop's places for any sign it is)
// or { roses, form } (a rose of that form, roses[colour][form]),
// `dx`, `dy` from the tile's anchor (its foot, in the middle) right and up to
// the thing's own anchor in layer px, `tint`, `swing` where it does, and
// `slide` where it gets out of a window's way (COURSE at a time).
export const COURSE = ROW * PX;
export function buildTower() {
  const tile = (draw) => makeSprite(TOWER_A, 48, draw, { ax: 0.5, ay: 1 });
  const plain = [0, 1, 2, 3, 4].map((v) => tile((t) => drawTower(t, v)));
  const band = makeSprite(TOWER_A, 6, (t) => drawTowerBand(t), { ax: 0.5, ay: 0 });
  const bandWorn = makeSprite(TOWER_A, 6, (t) => drawTowerBandWorn(t), { ax: 0.5, ay: 0 });
  const things = buildThings();
  const hung = (f) => {
    const s = f.what === 'sign' || f.what === 'rose' ? null : things.boards[f.what] || things[f.what];
    const out = { dx: (f.x - TOWER_A / 2) * PX + (s ? s.ax : 0), dy: (48 - f.y) * PX, tint: THING_TINT[f.plane] };
    if (s) out.s = s; else if (f.what === 'rose') { out.roses = things.roses; out.form = f.form; } else { out.signs = things.signs; out.sign = f.sign; }
    if (f.what !== 'rose') out.slide = true;      // (a rose belongs where its shoot ends: beside a window it is left out)
    if (f.what === 'bucket') out.swing = true;
    return out;
  };
  const areas = {};
  for (const [kind, A] of Object.entries(TOWER_AREAS)) {
    const draw = AREA_DRAW[kind], fix = {};
    const one = (j) => { const f = []; const s = tile((t) => draw(t, j, f)); (typeof j === 'number' ? (fix.loop = fix.loop || []) : fix)[j] = f.map(hung); return s; };
    areas[kind] = { enter: one('enter'), leave: one('leave'), loop: Array.from({ length: A.loop }, (_, j) => one(j)), fix };
    // the places for any sign, numbered up the loop (`slot` of `slots`), so that background.js can hang a different one in each
    const free = fix.loop.flat().filter((f) => f.signs && f.sign == null);
    free.forEach((f, n) => { f.slot = n; f.slots = free.length; });
  }
  return { plain, band, bandWorn, bands: { worn: bandWorn }, areas };
}
