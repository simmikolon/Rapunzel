import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';

// Trees: one look per zone (oak on the forest floor, mossy giants in the
// deep forest, birch-like trunks at the windows, bare tops above the
// trees), six branch variants per style that all share the same surface
// and collision box, trunk tiles per style, and small overlay sprites the
// background scatters over the trunks. Same 4-px grid and value structure
// as the rest of the art: lit inner edge, deep shadow at the screen edge,
// dark outline toward the sky.

export const TREE_STYLES = [
  { name: 'oak',   bark: { light: C.barkLight, mid: C.barkMid, dark: C.barkDark, deep: C.barkDeep, shadow: C.barkShadow },
    leaf: { a: C.leaf, b: C.grass, c: C.grassLight, dark: C.leafDark }, leaves: 'round',
    overlays: [['moss', 3], ['crack', 3], ['hole', 2], ['fungus', 1], ['burl', 2]], perTile: [1, 3], lianas: 0.22, vines: [['ivy', 5], ['flower', 4], ['thorn', 1]], vineChance: 0.6 },
  { name: 'giant', bark: { light: '#8c7e68', mid: '#5f5648', dark: '#4a4238', deep: '#352e2d', shadow: '#231d1c' },
    leaf: { a: C.leafDark, b: C.leaf, c: C.moss, dark: '#102a14' }, leaves: 'droop',
    overlays: [['moss', 6], ['crack', 1], ['hole', 1], ['fungus', 2], ['burl', 2], ['lichen', 1]], perTile: [2, 4], lianas: 0.55, vines: [['ivy', 4], ['thorn', 5], ['flower', 1]], vineChance: 0.8 },
  { name: 'birch', bark: { light: '#e4e0d0', mid: '#c9c4b2', dark: '#9a9484', deep: '#6a6458', shadow: '#3a3230' },
    branchBark: { light: '#c9bfa8', mid: '#9c9280', dark: '#6f6658', deep: '#4e4740', shadow: '#3a3230' },
    leaf: { a: C.moss, b: '#c8d848', c: '#e8e86a', dark: C.leaf }, leaves: 'sparse',
    overlays: [['lichen', 5], ['hole', 2], ['crack', 1], ['moss', 1], ['burl', 1]], perTile: [1, 2], lianas: 0.08, vines: [['ivy', 1]], vineChance: 0.25 },
  { name: 'bare',  bark: { light: '#8a7e72', mid: '#625a50', dark: '#4a433b', deep: '#332d28', shadow: '#1f1b18' },
    leaf: null, leaves: 'none',
    overlays: [['crack', 5], ['hole', 3], ['lichen', 2], ['burl', 2]], perTile: [1, 3], lianas: 0, vines: [], vineChance: 0 },
];

// --- branches -------------------------------------------------------------
// 50 x 18 art px (200 x 72 logical), growing out of the RIGHT trunk toward
// the left; the surface (collision top) is y = 7. Mirrored for the left.
function drawBranch(t, style, variant, rng) {
  const { p, poly, line, disc } = t;
  const B = style.branchBark || style.bark, L = style.leaf;
  // log shape: thick at the trunk (right), tapering to the tip; gnarled adds a hump
  const top = variant === 1 ? [[3, 8], [14, 8], [22, 6], [30, 7], [49, 5]] : [[3, 8], [49, 5]];
  poly([...top, [49, 16], [3, 12]], B.mid);
  poly([...top, [49, 7], ...[...top].reverse().map(([x, y]) => [x, y + 1])], B.light);
  poly([[3, 11], [49, 13], [49, 16], [3, 12]], B.dark);
  line(10, 10, 30, 9, B.dark); line(26, 11, 46, 11, B.dark); line(14, 9, 20, 9, B.light); line(34, 8, 44, 7, B.light);
  if (variant === 1) { disc(35, 12, 2, B.dark); p(34, 11, 2, 1, B.light); }                         // gnarled: a knob below
  if (variant === 2) { line(16, 7, 9, 1, B.mid, 2); line(10, 2, 8, 1, B.light); }                     // forked: a twig up
  if (variant === 3) { disc(14, 13, 2, B.dark); disc(30, 14, 2, B.dark); p(13, 12, 2, 1, B.light); p(29, 13, 2, 1, B.light); line(20, 6, 20, 12, B.dark); line(38, 5, 38, 13, B.dark); } // knobby, rings
  if (variant === 4) {                                                                                  // mossy with a mushroom shelf
    p(6, 8, 14, 1, C.moss); p(24, 7, 12, 1, C.moss); p(38, 6, 9, 1, C.moss); p(12, 9, 3, 1, C.mossDark); p(30, 8, 3, 1, C.mossDark);
    p(20, 13, 7, 2, '#c9b35a'); p(20, 13, 7, 1, '#e8d890'); p(21, 15, 5, 1, C.acorn);
  }
  if (variant === 5) {                                                                                  // nest with eggs
    poly([[24, 7], [36, 7], [34, 3], [26, 3]], C.acorn); p(26, 3, 8, 1, '#c9b35a'); line(25, 5, 35, 5, '#b48a52'); line(27, 6, 33, 6, C.acornCap);
    p(28, 2, 2, 1, '#eef2e0'); p(31, 2, 2, 1, '#eef2e0');
  }
  // leaves by style
  if (style.leaves === 'round') {
    disc(5, 7, 4, L.a); disc(3, 5, 3, L.b); disc(7, 4, 2, L.c); p(1, 9, 3, 2, L.dark); p(0, 7, 2, 2, L.a);
    disc(21, 4, 3, L.a); disc(23, 3, 2, L.b); p(19, 6, 2, 1, L.dark); p(24, 2, 1, 1, L.c);
    if (variant !== 5) { disc(40, 3, 2, L.a); p(41, 2, 1, 1, L.c); }
    if (variant === 2) { disc(8, 1, 2, L.a); p(8, 0, 1, 1, L.c); }
  } else if (style.leaves === 'droop') {
    disc(5, 7, 4, L.a); disc(4, 5, 3, L.b); p(6, 4, 2, 1, L.c); p(1, 9, 3, 2, L.dark);
    disc(21, 5, 3, L.a); p(22, 3, 2, 1, L.b);
    line(2, 11, 2, 16, L.dark); line(6, 11, 6, 17, L.a); line(9, 10, 9, 14, L.dark); line(21, 8, 21, 13, L.dark);   // hanging moss
    p(2, 16, 1, 1, L.c); p(6, 17, 1, 1, L.c);
    for (let i = 0; i < 6; i++) p(10 + rng.int(0, 36), 8 - rng.int(0, 2), 1, 1, C.moss);
  } else if (style.leaves === 'sparse') {
    for (let i = 0; i < 9; i++) { const x = rng.int(0, 22), y = rng.int(1, 9); p(x, y, 1, 1, rng.chance(0.5) ? L.b : L.c); }
    line(6, 7, 1, 3, B.dark); line(4, 6, 2, 9, B.dark); p(1, 2, 1, 1, L.c); p(2, 10, 1, 1, L.b);
    for (let i = 0; i < 4; i++) p(rng.int(24, 46), rng.int(3, 6), 1, 1, L.b);
  } else {
    line(6, 8, 1, 3, B.dark); line(3, 5, 0, 6, B.dark); line(5, 9, 2, 12, B.dark); line(18, 7, 15, 2, B.dark); line(16, 4, 13, 3, B.dark);
    line(32, 6, 30, 1, B.dark); line(31, 3, 34, 1, B.dark);
  }
}

// Dry (crumbling) branch: the same silhouette in dead-wood greys, cracked.
function drawDryBranch(t) {
  const { p, poly, line } = t;
  poly([[3, 8], [49, 5], [49, 16], [3, 12]], C.dry);
  poly([[3, 8], [49, 5], [49, 7], [3, 9]], C.dryLight);
  poly([[3, 11], [49, 13], [49, 16], [3, 12]], C.dryDark);
  line(10, 10, 30, 9, C.dryDark); line(26, 11, 46, 11, C.dryDark); line(14, 9, 20, 9, C.dryLight); line(34, 8, 44, 7, C.dryLight);
  line(18, 8, 20, 12, C.barkShadow); line(33, 6, 31, 11, C.barkShadow); line(24, 9, 26, 9, C.barkShadow);
  line(6, 7, 3, 3, C.dryDark); line(4, 4, 1, 4, C.dryDark); line(28, 6, 30, 2, C.dryDark); line(30, 3, 33, 1, C.dryDark);
  p(12, 12, 1, 2, C.dryDark); p(40, 15, 1, 2, C.dryDark);
}

// --- trunks -----------------------------------------------------------------
// 25 x 48 art px, the LEFT trunk (screen edge at x = 0, inner edge at 24).
// Variant 2 always carries the knot hole at (12, 22): the owls live there.
function drawTrunk(t, style, variant, rng) {
  const { p, line, disc } = t;
  const B = style.bark;
  const W = 25, H = 48;
  p(0, 0, W, H, B.mid);
  p(0, 0, 4, H, B.dark);
  p(18, 0, 6, H, B.light);
  p(22, 0, 2, H, B.mid);
  p(24, 0, 1, H, B.deep);
  if (style.name === 'birch') {
    // peeling pale bark with dark horizontal marks
    for (let i = 0; i < 16; i++) { const y = rng.int(0, H - 1), x = rng.int(2, 18); p(x, y, rng.int(2, 6), 1, B.shadow); if (rng.chance(0.5)) p(x, y + 1, rng.int(1, 3), 1, B.deep); }
    for (let i = 0; i < 8; i++) { const y = rng.int(0, H - 2), x = rng.int(4, 16); p(x, y, rng.int(3, 7), 2, B.light); }
  } else {
    for (let i = 0; i < 18; i++) {
      const x = rng.int(3, W - 4), y = rng.int(0, H - 1), len = rng.int(4, 18);
      line(x, y, x + rng.int(-1, 1), Math.min(H - 1, y + len), rng.chance(0.5) ? B.dark : B.deep);
      if (rng.chance(0.4)) line(x + 1, y, x + 1, Math.min(H - 1, y + len - 2), B.light);
    }
  }
  if (style.name === 'bare') for (let i = 0; i < 5; i++) { const x = rng.int(5, 20), y = rng.int(0, H - 10); line(x, y, x + rng.int(-2, 2), y + rng.int(5, 12), B.shadow); }
  if (variant === 1) {
    if (style.name === 'oak' || style.name === 'giant') for (let i = 0; i < (style.name === 'giant' ? 9 : 5); i++) { const x = rng.int(6, W - 8), y = rng.int(2, H - 6); disc(x, y, rng.int(1, 3), C.mossDark); p(x - 1, y - 1, 2, 1, C.moss); }
    else if (style.name === 'birch') for (let i = 0; i < 5; i++) { const x = rng.int(5, 18), y = rng.int(2, H - 4); p(x, y, rng.int(2, 4), 2, '#b7c9a8'); p(x + 1, y, 1, 1, '#dfe7d0'); }
    else { line(10, 4, 13, 44, B.shadow); line(11, 4, 11, 20, B.deep); }
  } else if (variant === 2) {
    disc(12, 22, 5, B.deep); disc(12, 22, 3, B.shadow); p(9, 18, 2, 1, B.light);
    if (style.name === 'giant') for (let i = 0; i < 4; i++) { const x = rng.int(6, W - 8), y = rng.int(2, H - 6); disc(x, y, 2, C.mossDark); }
    else if (style.name !== 'bare') for (let i = 0; i < 2; i++) { const x = rng.int(6, W - 8), y = rng.int(2, H - 6); disc(x, y, 2, style.name === 'birch' ? '#b7c9a8' : C.mossDark); }
  } else if (variant === 3) {
    if (style.name === 'oak') { let y = 0, x = 16; while (y < H) { p(x, y, 1, 2, C.leafDark); if (rng.chance(0.5)) p(x + rng.int(-2, 2), y, 2, 2, C.leaf); x += rng.int(-1, 1); x = Math.max(6, Math.min(W - 5, x)); y += 2; } }
    else if (style.name === 'giant') for (let i = 0; i < 2; i++) { const y = 8 + i * 22 + rng.int(0, 8), x = 17 + rng.int(0, 3), w = 24 - x; p(x, y, w, 2, '#c9b35a'); p(x, y, w, 1, '#e8d890'); p(x + 1, y + 2, w - 2, 1, C.acorn); }
    else if (style.name === 'birch') for (let i = 0; i < 7; i++) { const x = rng.int(4, 18), y = rng.int(1, H - 3); p(x, y, 3, 2, '#b7c9a8'); p(x + 1, y, 1, 1, '#dfe7d0'); }
    else { line(6, 10, 9, 30, B.shadow); line(14, 2, 15, 16, B.shadow); line(17, 30, 19, 46, B.shadow); }
  }
}

// --- overlays scattered on the trunks (style independent) ---------------------
function drawMoss(t, size) {
  const { disc, p } = t;
  const r = [1, 2, 3][size];
  disc(r + 1, r, r, C.mossDark); disc(r + 1 + (size ? 2 : 1), r, r, C.mossDark);
  p(r, r - 1, 2 + size, 1, C.moss); if (size === 2) p(r + 2, r - 2, 2, 1, C.grass);
}
function drawCrack(t) { const { line } = t; line(1, 0, 0, 3, C.barkShadow); line(0, 3, 1, 6, C.barkShadow); line(1, 6, 0, 9, C.barkShadow); line(2, 1, 2, 2, C.barkDeep); }
function drawHole(t) { const { p } = t; p(1, 0, 2, 5, C.barkShadow); p(0, 1, 4, 3, C.barkShadow); p(1, 1, 1, 1, C.barkDeep); p(0, 0, 1, 1, C.barkLight); }
function drawFungus(t, big) {
  const { p } = t;
  const w = big ? 10 : 6;
  p(0, 1, w, 2, '#c9b35a'); p(0, 1, w, 1, '#e8d890'); p(1, 3, w - 2, 1, C.acorn); if (big) { p(2, 0, w - 4, 1, '#e8d890'); p(3, 4, 4, 1, C.acornCap); }
}
function drawLichen(t) { const { p } = t; p(1, 1, 3, 2, '#b7c9a8'); p(4, 2, 2, 2, '#b7c9a8'); p(0, 3, 2, 1, '#b7c9a8'); p(2, 1, 1, 1, '#dfe7d0'); p(5, 2, 1, 1, '#dfe7d0'); }
function drawBurl(t) { const { disc, p } = t; disc(2, 4, 3, C.barkMid); disc(3, 4, 2, C.barkLight); p(5, 3, 1, 3, C.barkDeep); p(1, 1, 2, 1, C.barkDark); p(1, 7, 2, 1, C.barkDark); }
function drawRoots(t) {
  const { poly, line, p } = t;
  poly([[0, 2], [10, 5], [22, 8], [36, 11], [36, 12], [20, 12], [8, 10], [0, 9]], C.barkMid);
  poly([[0, 3], [10, 6], [24, 9], [36, 12], [22, 11], [8, 9], [0, 7]], C.barkLight);
  line(6, 10, 14, 12, C.barkDark); line(18, 11, 30, 12, C.barkDark); p(4, 6, 1, 1, C.mossDark); p(16, 9, 2, 1, C.moss); p(28, 11, 1, 1, C.mossDark);
}

export function buildTrees() {
  const rng = new RNG(2024);
  const styles = TREE_STYLES.map((style, si) => {
    const branchR = [0, 1, 2, 3, 4, 5].map((v) => makeSprite(50, 18, (t) => drawBranch(t, style, v, rng), undefined, { axPx: 25 * 4, ayPx: 7 * 4 }));
    const branchL = branchR.map(flipH);
    const trunkL = [0, 1, 2, 3].map((v) => makeSprite(25, 48, (t) => drawTrunk(t, style, v, new RNG(100 + si * 10 + v)), { ax: 0, ay: 1 }));
    const trunkR = trunkL.map(flipH);
    return { ...style, branchR, branchL, trunkL, trunkR };
  });
  const branchRDry = makeSprite(50, 18, (t) => drawDryBranch(t), undefined, { axPx: 25 * 4, ayPx: 7 * 4 });
  const burlL = makeSprite(6, 9, (t) => drawBurl(t), { ax: 0, ay: 0.5 });
  const rootsL = makeSprite(36, 13, (t) => drawRoots(t), { ax: 0, ay: 1 });
  const overlays = {
    moss: [0, 1, 2].map((s) => makeSprite(5 + s * 3, 4 + s * 2, (t) => drawMoss(t, s), { ax: 0.5, ay: 0.5 })),
    crack: makeSprite(3, 10, (t) => drawCrack(t), { ax: 0.5, ay: 0.5 }),
    hole: makeSprite(4, 5, (t) => drawHole(t), { ax: 0.5, ay: 0.5 }),
    fungus: [0, 1].map((b) => makeSprite(b ? 10 : 6, 5, (t) => drawFungus(t, b), { ax: 0.5, ay: 0.5 })),
    lichen: makeSprite(7, 5, (t) => drawLichen(t), { ax: 0.5, ay: 0.5 }),
    burlL, burlR: flipH(burlL),
    rootsL, rootsR: flipH(rootsL),
  };
  return { styles, branchRDry, branchLDry: flipH(branchRDry), overlays };
}
