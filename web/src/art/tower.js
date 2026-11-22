import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { PX } from '../config.js';
import { RNG } from '../util.js';

// The tower's wall, outside: its plain tiles, the string course, and the
// areas that take turns with the plain wall on the way up (overgrown with
// ivy, crumbling, built of old big stones, mossy). art/tiles.js hands the
// plain tiles and the course on under their old names; which area is where
// is src/towerwall.js; background.js draws them.

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
export const TOWER_AREAS = {
  ivy: { loop: 6, overlay: true },
  worn: { loop: 4, overlay: false },
  stone: { loop: 3, overlay: false },
  moss: { loop: 3, overlay: true },
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

const AREA_DRAW = { ivy: drawIvy, worn: drawWorn, stone: drawStone, moss: drawMoss };

export function buildTower() {
  const tile = (draw) => makeSprite(TOWER_A, 48, draw, { ax: 0.5, ay: 1 });
  const plain = [0, 1, 2, 3, 4].map((v) => tile((t) => drawTower(t, v)));
  const band = makeSprite(TOWER_A, 6, (t) => drawTowerBand(t), { ax: 0.5, ay: 0 });
  const bandWorn = makeSprite(TOWER_A, 6, (t) => drawTowerBandWorn(t), { ax: 0.5, ay: 0 });
  const areas = {};
  for (const [kind, A] of Object.entries(TOWER_AREAS)) {
    const draw = AREA_DRAW[kind];
    areas[kind] = { enter: tile((t) => draw(t, 'enter')), leave: tile((t) => draw(t, 'leave')), loop: Array.from({ length: A.loop }, (_, j) => tile((t) => draw(t, j))) };
  }
  return { plain, band, bandWorn, areas };
}
