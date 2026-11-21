import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';
import { STONEWORK as K, recede } from './interior.js';

// The treasury (vault.js): the golden door that leads into it and out of
// it, the chest one bounces on, the hoard heaped on its floor and the
// shelves on its wall.
//
// Gold is the braid's ramp, so the witch's gold and Rapunzel's hair are one
// colour (it is what she hoards). What one can take is the brightest gold
// in the room and glows (the suns, drawn by the renderer); what only
// furnishes is the same gold stepped back toward the wall (STEP_BACK), the
// way the tower's furniture is. Nothing in here is red: red is what bites.
const GOLD = { hi: C.braidHi, base: C.braid, shade: C.braidShade, dark: C.braidDark, deep: '#6e4c1c' };
// a door that has been gone through: its gold gone dull
const DULL = { hi: '#b7aa8c', base: '#978a6c', shade: '#786c56', dark: '#564c40', deep: '#3d3630' };
const SILVER = { hi: '#f1eff8', base: '#c9c6d6', shade: '#8f8ca1' };
const GEMS = [C.tunicHi, C.grassLight, '#c79aff', '#7fe3e0'];        // sapphire, emerald, amethyst, aquamarine
const BLAZE = ['#fffbe0', C.sun1, C.sun2, C.braidShade];              // the light of the hoard, from its brightest down
const TOWER = ['#3a2f52', '#5a4470', '#7a5a6a'];                      // the tower's dusk, seen from the treasury

// What the painter and the world colour with at runtime: the tint that warms
// the tower's stone in here, the room's light, the ceiling, the glints.
export const VAULT_LOOK = {
  stone: '#f6dcb4', dark: '#19141c', ceiling: '#2b2430', cornice: '#6f6270', corniceHi: '#978a92',
  goldLight: '#ffd98a', doorLight: '#ffe9a0', ambient: '#c9a479', dim: 0.3,
  chestSuns: [C.sun1, C.sun2, C.braidHi],
};
const STEP_BACK = { hoard: 0.16, shelf: 0.34 };

// --- the golden door ---------------------------------------------------------------
// The gate's stone doorway (art/interior.js drawGate) with golden leaves:
// 46 x 58 art px, the anchor the landing's top middle. `leaves`: 'shut' or
// 'open' (stood back against the jambs). `beyond` is what the fanlight and
// the open doorway show: 'gold' (the hoard's blaze: this way to the
// treasure), 'tower' (the way out of it) or 'none' (a door that has been
// gone through: dark behind the glass, and its gold dull).
function drawDoor(t, leaves, beyond) {
  const { p, disc } = t;
  const cx = 23, SURF = 46, hw = 13, spring = 20;
  const G = beyond === 'none' ? DULL : GOLD;
  // the surround: dressed stone, lit on its left, with a golden moulding inside it
  p(cx - hw - 3, spring, hw * 2 + 6, SURF - spring, K.frame); disc(cx, spring, hw + 3, K.frame);
  p(cx - hw - 3, spring, 1, SURF - spring, K.frameHi); p(cx + hw + 2, spring, 1, SURF - spring, K.frameDark);
  p(cx - hw - 1, spring, hw * 2 + 2, SURF - spring, G.shade); disc(cx, spring, hw + 1, G.shade);
  p(cx - hw - 1, spring, 1, SURF - spring, G.hi);
  // what lies beyond, in the doorway's shape
  for (let yy = spring - hw; yy < SURF; yy++) for (let xx = cx - hw; xx < cx + hw; xx++) {
    if (yy < spring && (xx - cx + 0.5) ** 2 + (yy - spring) ** 2 > hw * hw) continue;
    let c;
    if (beyond === 'gold') c = yy < 13 ? BLAZE[0] : yy < 26 ? BLAZE[1] : yy < 38 ? BLAZE[2] : BLAZE[3];
    else if (beyond === 'tower') c = yy < 20 ? TOWER[0] : yy < 34 ? TOWER[1] : TOWER[2];
    else c = K.hole;
    p(xx, yy, 1, 1, c);
  }
  if (beyond === 'gold') {
    // a heap of it on the floor in there, and glints in the light
    for (const [x, y, w] of [[cx - 11, 42, 22], [cx - 9, 40, 16], [cx - 6, 38, 10], [cx - 3, 36, 5]]) p(x, y, w, 2, GOLD.shade);
    for (const [x, y] of [[cx - 7, 40], [cx - 2, 37], [cx + 3, 41], [cx - 9, 43], [cx + 7, 43], [cx + 1, 39]]) p(x, y, 2, 1, GOLD.hi);
    for (const [x, y] of [[cx - 6, 12], [cx + 5, 17], [cx - 9, 24], [cx + 8, 28], [cx - 2, 31], [cx + 3, 9]]) p(x, y, 1, 1, C.white);
  } else if (beyond === 'tower') {
    p(cx - 1, 24, 2, 5, C.flame2); p(cx - 1, 26, 1, 2, C.flame1); p(cx - 2, 29, 4, 2, K.iron);                   // a torch out there
    p(cx - 7, 40, 14, 1, '#9a7a80'); p(cx - 5, 37, 10, 1, '#8a6a78');
  }
  p(cx - 2, spring - hw - 5, 4, 3, G.hi); p(cx - 1, spring - hw - 4, 2, 1, beyond === 'none' ? K.frameDark : GEMS[0]);   // the keystone, a stone set in it
  if (leaves === 'shut') {
    const top = spring + 2, h = SURF - top;
    p(cx - hw, top, hw * 2, h, G.base);
    p(cx - hw, top, hw * 2, 1, G.hi); p(cx - hw, top, 1, h, G.hi); p(cx, top, 1, h, G.hi);          // lit along the top and each leaf's left edge
    p(cx - 1, top, 1, h, G.dark); p(cx + hw - 1, top, 1, h, G.shade);                               // where the leaves meet; the right edge in shade
    p(cx - hw, SURF - 3, hw * 2, 3, G.shade); p(cx - hw, SURF - 1, hw * 2, 1, G.dark);              // the kick plates
    // a panel in each leaf
    for (const x0 of [cx - hw + 2, cx + 2]) { p(x0, top + 3, 9, 1, G.shade); p(x0, top + 3, 1, 16, G.shade); p(x0 + 8, top + 3, 1, 16, G.hi); p(x0, top + 18, 9, 1, G.hi); }
    // the sun across both leaves: the hoard is counted in suns
    disc(cx, 33, 5, G.shade); disc(cx, 33, 4, G.hi); disc(cx, 33, 2, beyond === 'none' ? G.base : C.white);
    for (const [dx, dy] of [[0, -8], [0, 7], [-8, 0], [7, 0], [-6, -6], [5, -6], [-6, 5], [5, 5]]) p(cx + dx, 33 + dy, 1, 2, G.hi);
    p(cx - 1, 27, 1, 13, G.dark);
    // studs down the edges, the transom under the fanlight, two ring handles
    for (let y = top + 2; y < SURF - 4; y += 5) { p(cx - hw + 1, y, 1, 1, G.dark); p(cx + hw - 2, y, 1, 1, G.dark); }
    p(cx - hw, spring, hw * 2, 2, G.dark); p(cx - hw, spring, hw * 2, 1, G.shade);
    for (const x of [cx - 4, cx + 2]) { p(x, 41, 2, 2, G.dark); p(x, 41, 1, 1, G.hi); }
  } else {
    p(cx - hw, spring - 4, 3, SURF - spring + 4, G.base); p(cx - hw, spring - 4, 1, SURF - spring + 4, G.hi); p(cx - hw + 2, spring - 4, 1, SURF - spring + 4, G.dark);
    p(cx + hw - 3, spring - 4, 3, SURF - spring + 4, G.shade); p(cx + hw - 3, spring - 4, 1, SURF - spring + 4, G.base); p(cx + hw - 1, spring - 4, 1, SURF - spring + 4, G.dark);
  }
  // the landing: the gate's pale slab, edged in gold, a blue runner over its front
  p(0, SURF, 46, 6, K.ledge); p(0, SURF, 46, 1, K.ledgeHi); p(0, SURF + 4, 46, 2, K.ledgeShade); p(0, SURF + 1, 1, 3, K.ledgeHi);
  p(0, SURF + 3, 46, 1, G.base); p(0, SURF + 3, 1, 1, G.hi);
  for (const x of [5, 35]) { p(x, SURF + 6, 6, 3, K.ledgeShade); p(x + 1, SURF + 9, 4, 3, K.ledgeDark); }
  const run = beyond === 'none' ? [C.tightsDark, C.tights, C.tightsDark] : [C.tunic, C.tunicHi, C.tunicDark];
  p(cx - 8, SURF, 16, 7, run[0]); p(cx - 8, SURF, 16, 1, run[1]); p(cx + 7, SURF, 1, 7, run[2]); p(cx - 8, SURF, 1, 7, run[1]);
  for (let x = cx - 8; x < cx + 8; x += 2) p(x, SURF + 7, 1, 1, G.base);                                 // its fringe
  p(cx - 6, SURF + 5, 12, 1, G.base);
}

// --- the chest ----------------------------------------------------------------------
// 26 x 30 art px, the anchor the middle of its shut lid's top (row 12): that
// is where he lands, and where the gold lies when it is open. Oak with
// golden bands and a lock. Frame 0 shut; frame 1 open: the lid thrown back
// (one sees its inside), gold heaped over the rim, glints on it.
function drawChest(t, open) {
  const { p } = t;
  const W0 = 1, W1 = 25, TOP = 12;
  // the box
  p(W0, 19, 24, 9, C.plank); p(W0, 19, 24, 1, C.plankHi); p(W0, 26, 24, 2, C.plankDark); p(W0, 19, 1, 9, C.plankHi); p(W1 - 1, 19, 1, 9, C.plankDark);
  for (const x of [8, 17]) p(x, 20, 1, 6, C.plankDark);                                             // its boards
  for (const x of [3, 20]) { p(x, 19, 3, 9, GOLD.base); p(x, 19, 1, 9, GOLD.hi); p(x + 2, 19, 1, 9, GOLD.shade); p(x, 26, 3, 2, GOLD.dark); }   // the bands
  p(2, 28, 3, 1, C.plankDark); p(21, 28, 3, 1, C.plankDark);                                        // feet
  if (!open) {
    // the lid: rounded on top, lit along it
    p(W0 + 1, TOP, 22, 1, C.plankHi); p(W0, TOP + 1, 24, 6, C.plank); p(W0, TOP + 1, 24, 1, C.plankHi); p(W0, TOP + 5, 24, 2, C.plankDark); p(W0, TOP + 1, 1, 5, C.plankHi);
    for (const x of [8, 17]) p(x, TOP + 2, 1, 4, C.plankDark);
    for (const x of [3, 20]) { p(x, TOP, 3, 7, GOLD.base); p(x, TOP, 1, 7, GOLD.hi); p(x + 2, TOP, 1, 7, GOLD.shade); }
    p(W0, TOP + 7, 24, 1, C.barkShadow);                                                            // where it shuts
    p(11, TOP + 5, 4, 6, GOLD.base); p(11, TOP + 5, 1, 6, GOLD.hi); p(14, TOP + 5, 1, 6, GOLD.shade); p(12, TOP + 8, 2, 2, GOLD.deep);   // the lock
    return;
  }
  // open: the lid stands up behind, its inside toward us
  p(W0 + 1, 1, 22, 1, C.plank); p(W0, 2, 24, 9, C.plankDark); p(W0 + 1, 3, 22, 7, C.barkDeep); p(W0, 2, 24, 1, C.plank);
  for (const x of [3, 20]) { p(x, 1, 3, 10, GOLD.shade); p(x, 1, 1, 10, GOLD.base); }
  p(W0, 18, 24, 1, C.barkShadow);
  // the gold in it, heaped over the rim
  for (const [x, y, w] of [[2, 16, 22], [3, 14, 20], [5, 12, 16], [8, 11, 10]]) { p(x, y, w, 2, GOLD.shade); p(x, y, w, 1, GOLD.base); }
  for (const [x, y] of [[4, 15], [9, 13], [15, 14], [19, 16], [11, 11], [7, 16], [13, 16], [17, 12]]) { p(x, y, 3, 1, GOLD.hi); p(x, y + 1, 3, 1, GOLD.base); }
  for (const [x, y] of [[6, 13], [16, 11], [20, 14], [12, 14]]) p(x, y, 1, 1, C.white);
  p(10, 12, 2, 2, GEMS[0]); p(10, 12, 1, 1, C.white); p(18, 15, 2, 2, GEMS[1]);
  p(11, 20, 4, 5, GOLD.base); p(11, 20, 1, 5, GOLD.hi); p(14, 20, 1, 5, GOLD.shade); p(12, 22, 2, 2, GOLD.deep);     // the lock plate, the hasp open
}

// --- the hoard --------------------------------------------------------------------
// A heap of gold in a corner of the floor, 64 x 36 art px, for the LEFT
// corner (highest against the pillar, running out toward the room), the
// anchor its bottom middle. Coins by the hundred, and in them what a witch
// has taken over the years: a crown, a silver goblet, a sword, a vase, a
// string of pearls, cut stones.
function drawHoard(t) {
  const { p, disc } = t;
  const r = new RNG(77), WA = 64, HA = 36;
  const top = (x) => HA - Math.round(5 + 25 * Math.exp(-((x / 27) ** 2)) + 3 * Math.exp(-(((x - 40) / 7) ** 2)) + (x > 58 ? (58 - x) * 0.8 : 0));
  for (let x = 0; x < WA; x++) { const y0 = top(x); p(x, y0, 1, HA - y0, GOLD.shade); }
  // coins: a lit edge over a base, a dark gap under some
  for (let i = 0; i < 230; i++) {
    const x = r.int(0, WA - 3), y = r.int(top(x + 1) + 1, HA - 2);
    if (y < top(x) || y < top(x + 2)) continue;
    p(x, y, 3, 1, GOLD.hi); p(x, y + 1, 3, 1, GOLD.base);
    if (r.chance(0.45)) p(x + r.int(0, 2), y + 2, 1, 1, GOLD.dark);
  }
  for (let x = 0; x < WA; x++) { const y0 = top(x); p(x, y0, 1, 1, GOLD.hi); if (x % 5 === 2) p(x, y0 + 1, 1, 1, C.white); }   // the heap's lit top
  // a sword stuck in it, hilt up
  p(27, 5, 2, 12, SILVER.base); p(27, 5, 1, 12, SILVER.hi); p(24, 16, 8, 2, GOLD.base); p(24, 16, 8, 1, GOLD.hi); p(27, 18, 2, 3, C.tunicDark); p(26, 2, 4, 3, GOLD.base); p(27, 3, 2, 1, GEMS[0]);
  // the crown on top
  const kx = 6, ky = top(9) - 6;
  p(kx, ky + 3, 10, 4, GOLD.base); p(kx, ky + 3, 10, 1, GOLD.hi); p(kx, ky + 6, 10, 1, GOLD.dark);
  for (const dx of [0, 3, 6, 9]) { p(kx + dx, ky, 1, 3, GOLD.hi); }
  p(kx + 2, ky + 4, 2, 2, GEMS[1]); p(kx + 6, ky + 4, 2, 2, GEMS[0]); p(kx + 4, ky + 1, 2, 2, GOLD.base);
  // a silver goblet, a vase
  const gx = 34, gy = top(36) - 8;
  p(gx, gy, 6, 4, SILVER.base); p(gx, gy, 6, 1, SILVER.hi); p(gx + 5, gy + 1, 1, 3, SILVER.shade); p(gx + 2, gy + 4, 2, 3, SILVER.base); p(gx + 1, gy + 7, 4, 1, SILVER.shade);
  const vx = 44, vy = top(46) - 9;
  disc(vx + 3, vy + 5, 3, C.tunic); p(vx + 2, vy, 3, 3, C.tunic); p(vx + 1, vy, 5, 1, C.tunicHi); p(vx + 1, vy + 3, 1, 4, C.tunicHi); p(vx + 2, vy + 5, 3, 1, GOLD.base);
  // pearls trailing down the slope, stones here and there
  for (let i = 0; i < 9; i++) { const x = 16 + i * 2, y = top(x) + 3 + Math.round(Math.sin(i * 0.9) * 2); p(x, y, 1, 1, C.white); }
  for (const [x, i] of [[14, 2], [22, 0], [31, 3], [39, 1], [50, 2], [56, 0], [3, 3]]) { const y = top(x) + 4 + (i % 2) * 3; p(x, y, 2, 2, GEMS[i]); p(x, y, 1, 1, C.white); }
}

// A small heap for the corner by the door he came in at (the big one would
// stand in front of it): 30 x 14 art px, for the LEFT corner, the anchor its
// bottom middle. Coins, a golden cup on them.
function drawPile(t) {
  const { p } = t;
  const r = new RNG(91), WA = 30, HA = 14;
  const top = (x) => HA - Math.round(2 + 9 * Math.exp(-((x / 13) ** 2)));
  for (let x = 0; x < WA; x++) { const y0 = top(x); p(x, y0, 1, HA - y0, GOLD.shade); }
  for (let i = 0; i < 46; i++) {
    const x = r.int(0, WA - 3), y = r.int(top(x + 1) + 1, HA - 2);
    if (y < top(x) || y < top(x + 2)) continue;
    p(x, y, 3, 1, GOLD.hi); p(x, y + 1, 3, 1, GOLD.base);
    if (r.chance(0.45)) p(x + r.int(0, 2), y + 2, 1, 1, GOLD.dark);
  }
  for (let x = 0; x < WA; x++) p(x, top(x), 1, 1, GOLD.hi);
  const gx = 9, gy = top(11) - 7;
  p(gx, gy, 5, 4, GOLD.base); p(gx, gy, 5, 1, GOLD.hi); p(gx + 4, gy + 1, 1, 3, GOLD.shade); p(gx + 2, gy + 4, 1, 2, GOLD.base); p(gx + 1, gy + 6, 3, 1, GOLD.shade);
  p(18, top(18) + 2, 2, 2, GEMS[2]); p(18, top(18) + 2, 1, 1, C.white); p(3, top(3) + 3, 2, 2, GEMS[3]);
}

// --- shelves on the wall ----------------------------------------------------------
// 30 x 22 art px, the anchor the top middle: a stone shelf on two brackets
// with a few of her things on it. Looks: 0 goblets and a crown, 1 stacks of
// coins and a vase, 2 two sacks, one of them come open.
function drawShelf(t, look) {
  const { p, disc } = t;
  const SH = 16;
  p(0, SH, 30, 3, K.frame); p(0, SH, 30, 1, K.frameHi); p(0, SH + 2, 30, 1, K.frameDark);
  for (const x of [4, 23]) { p(x, SH + 3, 3, 2, K.frameDark); p(x + 1, SH + 5, 2, 1, K.frameDark); }
  const goblet = (x, c) => { p(x, SH - 8, 5, 4, c.base); p(x, SH - 8, 5, 1, c.hi); p(x + 4, SH - 7, 1, 3, c.shade); p(x + 2, SH - 4, 1, 3, c.base); p(x + 1, SH - 1, 3, 1, c.shade); };
  const stack = (x, n) => { for (let i = 0; i < n; i++) { p(x, SH - 2 - i * 2, 4, 1, GOLD.hi); p(x, SH - 1 - i * 2, 4, 1, GOLD.shade); } };
  if (look === 0) {
    goblet(3, SILVER); goblet(22, GOLD);
    p(11, SH - 5, 8, 5, GOLD.base); p(11, SH - 5, 8, 1, GOLD.hi); p(11, SH - 1, 8, 1, GOLD.dark);
    for (const dx of [0, 3, 7]) p(11 + dx, SH - 8, 1, 3, GOLD.hi);
    p(14, SH - 3, 2, 2, GEMS[0]);
  } else if (look === 1) {
    stack(2, 5); stack(7, 3); stack(12, 6);
    disc(23, SH - 5, 4, C.tights); p(21, SH - 12, 4, 4, C.tights); p(20, SH - 12, 6, 1, C.ribbonHi); p(20, SH - 7, 1, 4, C.ribbonHi); p(21, SH - 5, 5, 1, GOLD.base);
  } else {
    // sacks: one tied, one fallen open with its coins out
    disc(7, SH - 5, 5, C.dry); p(5, SH - 11, 4, 2, C.dry); p(4, SH - 9, 6, 1, C.ropeDark); p(3, SH - 8, 2, 6, C.dryLight); p(10, SH - 4, 2, 4, C.dryDark);
    disc(20, SH - 4, 4, C.dry); p(17, SH - 6, 2, 5, C.dryLight); p(23, SH - 4, 2, 4, C.dryDark);
    for (const [x, y] of [[23, SH - 2], [26, SH - 1], [24, SH - 1], [27, SH - 2]]) { p(x, y, 2, 1, GOLD.hi); }
    p(21, SH - 8, 3, 2, GOLD.base); p(21, SH - 8, 3, 1, GOLD.hi);
  }
}

// --- pieces of the hoard to take ----------------------------------------------------
// The pickups of the treasury (pickups.js Treasure), the anchor their
// middle: a cut stone (9 x 9 art px, in four kinds), a golden goblet (9 x 12)
// and the crown (15 x 12). Unlike what stands on the shelves they are not
// stepped back: bright, lit from the upper left, a white glint on each.
const STONES = [
  { hi: '#cfe6ff', base: C.tunicHi, shade: C.tunic },            // sapphire
  { hi: '#d6ffd9', base: C.grassLight, shade: C.grass },         // emerald
  { hi: '#f0e0ff', base: '#c79aff', shade: C.tights },           // amethyst
  { hi: '#e6fffd', base: '#7fe3e0', shade: '#3fa9a8' },          // aquamarine
];
function drawGem(t, k) {
  const { p } = t, s = STONES[k];
  // a brilliant seen from the side: the crown's facets, the girdle, the pavilion down to its point
  const rows = [[3, 3], [2, 5], [1, 7], [0, 9], [1, 7], [2, 5], [3, 3], [4, 1]];
  rows.forEach(([x, w], y) => p(x, y, w, 1, y < 3 ? s.base : s.shade));
  p(0, 3, 9, 1, s.base);                                              // the girdle
  p(3, 0, 2, 1, s.hi); p(2, 1, 2, 1, s.hi); p(1, 2, 2, 1, s.hi); p(1, 3, 3, 1, s.hi);   // the lit facets
  p(4, 4, 1, 3, s.base); p(5, 1, 1, 2, s.shade);                      // a facet's edge down the middle, one in shade above
  p(3, 1, 1, 1, C.white);
}
function drawGoblet(t) {
  const { p } = t;
  p(0, 0, 9, 1, GOLD.hi);                                             // the rim
  p(0, 1, 9, 3, GOLD.base); p(1, 4, 7, 1, GOLD.base); p(2, 5, 5, 1, GOLD.shade);
  p(0, 1, 2, 3, GOLD.hi); p(7, 1, 2, 3, GOLD.shade); p(6, 4, 2, 1, GOLD.shade);
  p(4, 2, 2, 2, STONES[0].base); p(4, 2, 1, 1, C.white);              // a stone set in the cup
  p(4, 6, 2, 3, GOLD.base); p(4, 6, 1, 3, GOLD.hi); p(3, 7, 4, 1, GOLD.shade);   // the stem and its knop
  p(1, 9, 7, 1, GOLD.base); p(1, 9, 3, 1, GOLD.hi); p(0, 10, 9, 1, GOLD.shade); p(0, 11, 9, 1, GOLD.dark);
}
function drawCrown(t) {
  const { p } = t;
  // the band, lit on top, a stone in each field
  p(0, 6, 15, 5, GOLD.base); p(0, 6, 15, 1, GOLD.hi); p(0, 10, 15, 1, GOLD.shade); p(0, 11, 15, 1, GOLD.dark); p(0, 6, 1, 5, GOLD.hi); p(14, 6, 1, 5, GOLD.shade);
  p(2, 8, 2, 2, STONES[1].base); p(2, 8, 1, 1, C.white); p(6, 7, 3, 3, STONES[0].base); p(6, 7, 1, 1, C.white); p(11, 8, 2, 2, STONES[2].base); p(11, 8, 1, 1, C.white);
  // five points, the middle one highest, a pearl on each
  for (const [x, h] of [[0, 3], [3, 4], [7, 6], [11, 4], [14, 3]]) { p(x, 6 - h, 1, h, GOLD.base); if (x > 0 && x < 14) { p(x - 1, 6 - h + 2, 1, h - 2, GOLD.hi); p(x + 1, 6 - h + 2, 1, h - 2, GOLD.shade); } p(x, 6 - h - 1, 1, 1, C.white); }
}

// --- the bubble -----------------------------------------------------------------
// What carries a prince who dropped out of the treasury's picture back up
// (world.js rescue): the power-ups' soap bubble at his size and in gold,
// 68 x 68 art px, the anchor its middle. A thin shell, white where the
// light catches it at the upper left and deeper gold at the lower right, a
// second line inside the lit quarter so that it is a ball and not a ring,
// the window's glint and its echo. `bubbleFill` is its inside as a flat
// disc (drawn faint, the shell over it).
const BUBBLE_R = 33;
function drawBubble(t) {
  const { p } = t;
  const c = 34, r = BUBBLE_R;
  const shell = (rr, pick) => {
    for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) {
      const d = x * x + y * y;
      if (d > rr * rr + rr * 0.5 || d <= (rr - 1) * (rr - 1) + (rr - 1) * 0.5) continue;
      const col = pick(x, y);
      if (col) p(c + x, c + y, 1, 1, col);
    }
  };
  shell(r, (x, y) => (x + y < -20 ? C.white : x + y > 24 ? GOLD.shade : GOLD.hi));
  shell(r - 2, (x, y) => (x + y < -30 ? GOLD.hi : null));
  p(13, 15, 7, 2, C.white); p(11, 17, 2, 7, C.white); p(14, 18, 3, 2, C.white);        // the window's reflection
  p(49, 54, 5, 1, GOLD.hi); p(54, 50, 1, 4, GOLD.hi);                                   // and its echo below
}
function drawBubbleFill(t) { t.disc(34, 34, BUBBLE_R - 1, C.white); }

export function buildVault() {
  const door = (leaves, beyond) => makeSprite(46, 58, (t) => drawDoor(t, leaves, beyond), undefined, { axPx: 23 * 4, ayPx: 46 * 4 });
  const hoardL = makeSprite(64, 36, drawHoard, { ax: 0.5, ay: 1 });
  const pileL = makeSprite(30, 14, drawPile, { ax: 0.5, ay: 1 });
  recede(hoardL, STEP_BACK.hoard); recede(pileL, STEP_BACK.hoard);
  const shelf = [0, 1, 2].map((k) => makeSprite(30, 22, (t) => drawShelf(t, k), { ax: 0.5, ay: 0 }));
  for (const s of shelf) recede(s, STEP_BACK.shelf);
  return {
    // in: the way into the treasury (in the tower); out: the way out of it (in the room); spent: gone through
    door: { in: [door('shut', 'gold'), door('open', 'gold')], out: [door('shut', 'tower'), door('open', 'tower')], spent: door('shut', 'none') },
    chest: [false, true].map((o) => makeSprite(26, 30, (t) => drawChest(t, o), undefined, { axPx: 13 * 4, ayPx: 12 * 4 })),
    hoard: { L: hoardL, R: flipH(hoardL) },
    pile: { L: pileL, R: flipH(pileL) },
    treasure: {
      gem: STONES.map((_, k) => makeSprite(9, 9, (t) => drawGem(t, k), { ax: 0.5, ay: 0.5 })),
      goblet: makeSprite(9, 12, drawGoblet, { ax: 0.5, ay: 0.5 }),
      crown: makeSprite(15, 13, drawCrown, { ax: 0.5, ay: 0.5 }, { shift: [0, 1] }),
    },
    bubble: makeSprite(68, 68, drawBubble, { ax: 0.5, ay: 0.5 }),
    bubbleFill: makeSprite(68, 68, drawBubbleFill, { ax: 0.5, ay: 0.5 }),
    shelf,
  };
}
