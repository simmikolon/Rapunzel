import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG, mixHex } from '../util.js';
import { PX } from '../config.js';
import { BRANCH_LEN } from '../platforms.js';

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
// A limb growing out of the RIGHT trunk toward the left, on a canvas of
// (L + BRANCH.root) x BRANCH.h art px (L = 20 stub, 32 short, 50 normal,
// 76 long): the tip is at x = 3, the end of what one can stand on at
// x = L - 1 (which lies a little inside the trunk), and BRANCH.root more
// art px of collar lie over the trunk, where the limb swells into it: a
// branch grows out of a tree, it is not nailed to it. The surface (the
// collision top, the sprite's anchor) is row BRANCH.surf, and the limb's top
// is flat on that row for nearly all of its length, so that he stands on
// what one sees. Its underside does the tapering: thick at the trunk, thin
// at the tip. Lit from above: a line of light along the top, the bark's
// tones down to the underside in shade, furrows running along it.
// The left tree's branches are these, mirrored as they are drawn (world.js):
// there is one drawing for both sides. Features sit relative to the tip and
// the root, never stretched.
const BRANCH = { root: 5, h: 26, surf: 10 };

// The limb itself in the tones `T` (dark to light, six of them). Returns
// { at, under }: x at a fraction of the length (0 the tip), and the
// underside's row at x.
function limb(t, T, L, rng, opts = {}) {
  const { p } = t;
  const S = BRANCH.surf, R = L - 1, X1 = R + BRANCH.root, stub = L <= 24;
  const at = (f) => Math.round(3 + (R - 3) * f);
  const frac = (x) => Math.max(0, Math.min(1.25, (x - 3) / (R - 3)));
  const ease = (u) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };
  // the top: flat on the surface, rising a little into the collar; the underside: the taper, a slight belly, the collar's swell
  const top = (x) => S - Math.round(ease((frac(x) - 0.92) / 0.08)) - (x > R + 2 ? 1 : 0);
  const thick = (x) => { const f = frac(x); return 5 + (stub ? 2 : 3.2) * Math.min(1, f) + 2.6 * ease((f - 0.78) / 0.22) + (x > R ? (x - R) * 0.45 : 0) + (opts.hump && !stub ? 1.6 * Math.exp(-(((f - 0.45) / 0.12) ** 2)) : 0); };
  const under = (x) => S + Math.round(thick(x));
  for (let x = 3; x <= X1; x++) {
    let y0 = top(x), y1 = under(x);
    if (x < 5 && !opts.snapped) { y0 += 5 - x > 1 ? 1 : 0; y1 -= 5 - x; }           // a rounded tip
    const h = y1 - y0;
    for (let y = y0; y < y1; y++) {
      const k = (y - y0) / Math.max(1, h - 1);
      p(x, y, 1, 1, y === y0 ? T[5] : k < 0.26 ? T[4] : k < 0.6 ? T[3] : k < 0.86 ? T[2] : T[1]);
    }
  }
  // furrows along the limb, in dashes, following its underside; and the gaps between the bark's plates on its lit top
  for (const depth of [0.45, 0.72]) {
    for (let x = 6 + rng.int(0, 3); x < R; ) {
      const len = rng.int(4, 9);
      for (let i = 0; i < len && x + i < X1 - 1; i++) { const xx = x + i, y = top(xx) + Math.round((under(xx) - top(xx)) * depth); if (under(xx) - top(xx) >= 5) p(xx, y, 1, 1, depth > 0.6 ? T[0] : T[1]); }
      x += len + rng.int(2, 5);
    }
  }
  for (let x = 8 + rng.int(0, 4); x < R - 2; x += rng.int(7, 12)) { p(x, top(x) + 1, 1, 2, T[2]); p(x + 1, top(x), 1, 1, T[4]); }
  // where it joins the trunk: the collar's edge, and the shade it casts on the bark below
  for (let y = top(X1); y < under(X1); y++) p(X1, y, 1, 1, T[y - top(X1) < 3 ? 3 : 1]);
  for (let x = R - 1; x <= X1; x++) p(x, under(x), 1, 2, 'rgba(0,0,0,0.22)');
  return { at, under, top };
}
// Leaves in a round mass, lit on the upper left, in shade underneath (the style's four greens).
function leaves(t, cx, cy, r, G) {
  const { p } = t;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r + r * 0.5) continue;
    const lit = x + y * 1.4 < -r * 0.7, under = y > r * 0.5 || x + y > r * 1.15;
    p(cx + x, cy + y, 1, 1, under ? G.dark : lit ? G.b : G.a);
  }
  p(cx - Math.round(r * 0.4), cy - Math.round(r * 0.5), 1, 1, G.c); if (r >= 3) p(cx - r + 1, cy - 1, 1, 1, G.c);
}

function drawBranch(t, style, variant, rng, L = 50) {
  const { p, line, disc } = t;
  const B = style.branchBark || style.bark, G = style.leaf, T = barkTones(B);
  const S = BRANCH.surf, R = L - 1, stub = L <= 24;
  const { at, under, top } = limb(t, T, L, rng, { hump: variant === 1, snapped: stub && variant === 1 });
  if (stub) {
    if (variant === 1) {
      // a snapped stump: the break is pale wood, splintered
      for (const [dx, dy, h] of [[0, 1, 3], [1, 0, 6], [2, 2, 3]]) p(3 + dx, S + dy, 1, h, B.light);
      p(2, S + 2, 1, 2, B.light); p(4, S - 1, 1, 2, T[4]); p(5, S + 3, 2, 1, B.deep); p(6, S + 1, 1, 1, B.deep);
      if (G) leaves(t, 9, S - 2, 2, G);
    } else if (G) { leaves(t, 6, S - 1, 5, G); leaves(t, 3, S - 4, 3, G); leaves(t, 10, S - 4, 3, G); }
    else { line(6, S, 2, S - 5, B.dark); line(4, S - 2, 1, S - 2, B.dark); line(5, S + 1, 2, S + 4, B.dark); }
    return;
  }
  if (variant === 1) { const x = at(0.68); disc(x, under(x) - 1, 2, T[1]); p(x - 1, under(x) - 3, 2, 1, T[4]); }                        // gnarled: a knob below (and a hump, see limb)
  if (variant === 2) { const x = at(0.3); line(x, S, x - 5, S - 5, T[3], 2); line(x - 4, S - 5, x - 6, S - 7, T[4]); }                     // forked: a twig up
  if (variant === 3) {                                                                                                                   // knobby, ringed
    for (const f of [0.24, 0.58]) { const x = at(f); disc(x, under(x) - 1, 2, T[1]); p(x - 1, under(x) - 3, 2, 1, T[4]); }
    for (const f of [0.38, 0.76]) { const x = at(f); for (let y = top(x) + 1; y < under(x) - 1; y++) p(x, y, 1, 1, T[1]); p(x + 1, top(x), 1, 2, T[4]); }
  }
  if (variant === 4) {                                                                                                                   // mossy, with a mushroom shelf
    for (const [f, w] of [[0.1, 0.26], [0.46, 0.22], [0.76, 0.16]]) { const x = at(f), n = Math.round(L * w); p(x, S, n, 1, C.moss); p(x + 1, S + 1, n - 2, 1, C.mossDark); }
    const sx = at(0.36), sy = under(sx + 3) - 3; p(sx, sy, 7, 2, '#c9b35a'); p(sx, sy, 7, 1, '#e8d890'); p(sx + 1, sy + 2, 5, 1, C.acorn);
  }
  if (variant === 5) {                                                                                                                   // a nest with eggs
    const nx = at(0.45);
    p(nx + 1, S - 3, 10, 3, C.acorn); p(nx, S - 4, 12, 1, '#c9b35a'); p(nx + 2, S - 1, 8, 1, C.acornCap); line(nx + 1, S - 2, nx + 10, S - 2, '#b48a52');
    p(nx + 3, S - 5, 2, 1, '#eef2e0'); p(nx + 6, S - 5, 2, 1, '#eef2e0'); p(nx + 3, S - 6, 1, 1, '#ffffff');
  }
  const clear = (x) => !(variant === 5 && Math.abs(x - at(0.45) - 6) < 10);            // no leaves on the nest
  if (style.leaves === 'round') {
    leaves(t, 5, S - 1, 5, G); leaves(t, 2, S - 5, 3, G); leaves(t, 9, S - 5, 3, G);
    for (const f of [0.42, 0.78]) { const x = at(f); if (clear(x)) { leaves(t, x, S - 3, 4, G); leaves(t, x + 4, S - 2, 2, G); leaves(t, x - 3, S - 1, 2, G); } }
    if (variant === 2) leaves(t, at(0.3) - 6, S - 7, 3, G);
  } else if (style.leaves === 'droop') {
    leaves(t, 5, S - 1, 5, G); leaves(t, 3, S - 5, 3, G);
    for (const f of [0.42, 0.78]) { const x = at(f); if (clear(x)) { leaves(t, x, S - 2, 4, G); leaves(t, x + 4, S - 1, 2, G); } }
    if (variant === 2) leaves(t, at(0.3) - 6, S - 8, 2, G);
    // moss hanging from the underside, a pale tip on the longest strands
    for (const [f, n] of [[0.02, 5], [0.1, 8], [0.2, 4], [0.42, 6], [0.6, 3], [0.78, 7]]) { const x = at(f) - 1, y = under(x); line(x, y, x, y + n, n > 5 ? G.a : G.dark); if (n > 5) p(x, y + n, 1, 1, G.c); }
    for (let i = 0; i < L / 8; i++) p(10 + rng.int(0, R - 14), S - rng.int(0, 1), 1, 1, C.moss);
  } else if (style.leaves === 'sparse') {
    // a birch: thin twigs with leaves in pairs, a catkin or two
    for (const [f, len, dir] of [[0.0, 5, -1], [0.16, 6, 1], [0.44, 5, -1], [0.72, 4, 1]]) {
      const x = at(f) + 2; if (!clear(x)) continue;
      for (let i = 1; i <= len; i++) p(x + dir * Math.round(i * 0.5), S - i, 1, 1, T[2]);
      const tx = x + dir * Math.round(len * 0.5), ty = S - len;
      p(tx - 2, ty, 2, 1, G.b); p(tx + 1, ty - 1, 2, 1, G.c); p(tx - 1, ty + 2, 2, 1, G.a); p(tx + 2, ty + 1, 1, 1, G.b);
    }
    p(1, S - 1, 2, 1, G.b); p(0, S + 1, 2, 1, G.a); p(2, S - 3, 1, 1, G.c);
    for (const f of [0.3, 0.62]) { const x = at(f); p(x, under(x), 1, 3, G.b); p(x, under(x) + 3, 1, 1, G.a); }                       // catkins
  } else {
    // bare: twigs only
    line(5, S, 1, S - 5, B.dark); line(3, S - 2, 0, S - 2, B.dark); line(5, S + 3, 2, S + 6, B.dark);
    for (const f of [0.3, 0.6, 0.86]) { const x = at(f); line(x, S, x - 3, S - 6, B.dark); line(x - 2, S - 4, x - 5, S - 5, B.dark); }
  }
}

// Dry (crumbling) branch: the same limb in dead-wood greys, cracked through
// in two places, its bark gone, a few splinters: it reads as about to go.
function drawDryBranch(t, L = 50) {
  const { p, line } = t;
  const T = [C.barkShadow, C.dryDark, mixHex(C.dryDark, C.dry, 0.5), C.dry, mixHex(C.dry, C.dryLight, 0.5), C.dryLight];
  const S = BRANCH.surf;
  const { at, under, top } = limb(t, T, L, new RNG(5 + L));
  for (const f of [0.34, 0.66]) {                                                    // cracks right through it
    const x = at(f);
    for (let y = top(x); y < under(x); y++) p(x + ((y - top(x)) % 4 === 3 ? 1 : 0), y, 1, 1, C.barkShadow);
    p(x + 1, top(x), 1, 2, C.dryLight); p(x - 2, under(x), 1, 2, C.dryDark);
  }
  for (const f of [0.18, 0.5, 0.82]) { const x = at(f); line(x, top(x) + 2, x + 3, top(x) + 3, C.barkShadow); }
  line(6, S, 3, S - 4, C.dryDark); line(4, S - 3, 1, S - 3, C.dryDark);            // dead twigs
  for (const f of [0.5, 0.9]) { const x = at(f); line(x, S, x + 2, S - 4, C.dryDark); line(x + 2, S - 3, x + 5, S - 5, C.dryDark); }
}

// --- trunks -----------------------------------------------------------------
// 25 x 48 art px, the LEFT trunk (screen edge at x = 0, inner edge at 24).
// What one sees is the inner flank of a tree far thicker than the strip
// of it in the picture: its middle is TRUNK.axis art px off screen. So it
// is round the way the tower is (art/tiles.js): the bark's ridges get
// narrower toward the inner edge, where one sees them from the side, and
// the light, which for a trunk comes from the inner edge, lies on it in
// upright planes: lit at the edge, darker toward the picture's border.
// The furrows between the ridges stand in the same columns at a tile's
// top and bottom, so the bark goes on from tile to tile.
// Variant 2 always carries the knot hole at (12, 22): the owls live there.
const TRUNK = { axis: -16, r: 40, light: 80 * Math.PI / 180 };
const trunkAngle = (x) => Math.asin(Math.min(1, (x - TRUNK.axis) / TRUNK.r));
const trunkX = (a) => TRUNK.axis + TRUNK.r * Math.sin(a);
// The furrows' columns for ridges `deg` wide round the trunk, from the picture's border to the inner edge.
function furrows(deg) {
  const out = [], a0 = trunkAngle(0), step = deg * Math.PI / 180;
  for (let a = a0 + step * 0.9; a < Math.PI / 2 - 0.05; a += step) { const x = Math.round(trunkX(a)); if (!out.length || x > out[out.length - 1]) out.push(x); }
  return out.filter((x) => x > 1 && x < 23);
}
// The bark's tones, dark to light: the style's ramp with a half step either side of its middle.
const barkTones = (B) => [B.deep, B.dark, mixHex(B.dark, B.mid, 0.5), B.mid, mixHex(B.mid, B.light, 0.5), B.light];
// How light the bark is at column x: an index into the tones (1 at the border, 5 at the lit edge).
function trunkPlane(x) {
  const l = Math.cos(trunkAngle(x) - TRUNK.light);
  return l > 0.95 ? 5 : l > 0.87 ? 4 : l > 0.76 ? 3 : l > 0.64 ? 2 : 1;
}

function drawTrunk(t, style, variant, rng) {
  const { p, line, disc } = t;
  const B = style.bark, T = barkTones(B);
  const W = 25, H = 48, name = style.name;
  const smooth = name === 'birch';
  // the planes of light, column by column
  for (let x = 0; x < W; x++) p(x, 0, 1, H, T[trunkPlane(x)]);
  if (smooth) {
    // a birch: smooth pale bark, dark marks across it (shorter toward the edge, as everything is), flakes of it peeling
    for (let i = 0; i < 18; i++) {
      const x = rng.int(1, 21), y = rng.int(0, H - 1), w = Math.max(1, Math.round((rng.int(3, 6)) * Math.cos(trunkAngle(x)) * 1.3));
      p(x, y, Math.min(w, 23 - x), 1, B.shadow); if (rng.chance(0.45)) p(x + 1, y + 1, Math.max(1, w - 2), 1, B.deep);
    }
    for (let i = 0; i < 7; i++) { const x = rng.int(3, 17), y = rng.int(0, H - 3), w = rng.int(2, 5); p(x, y, w, 2, T[Math.min(5, trunkPlane(x) + 1)]); p(x, y + 2, w, 1, T[Math.max(1, trunkPlane(x) - 1)]); }
    for (const [x, y] of [[6, rng.int(4, 18)], [15, rng.int(28, 44)]]) { p(x, y, 3, 1, B.shadow); p(x - 1, y + 1, 5, 1, B.shadow); p(x, y + 2, 3, 1, B.deep); p(x + 1, y + 1, 1, 1, B.deep); }   // the eyes where branches were
  } else {
    // ridges of bark between furrows, each broken into plates
    const cols = furrows(name === 'giant' ? 12 : name === 'bare' ? 7.5 : 9);
    const edges = [0, ...cols, 24];
    const wander = cols.map(() => 0);
    const plateEnd = edges.map(() => rng.int(3, 14));
    for (let y = 0; y < H; y++) {
      // a furrow strays a pixel to either side on its way and is back in its column where the tile ends
      cols.forEach((c, i) => { if (y > 3 && y < H - 4 && rng.chance(0.16)) wander[i] = Math.max(-1, Math.min(1, wander[i] + rng.sign())); if (y >= H - 4) wander[i] = 0; });
      for (let i = 0; i + 1 < edges.length; i++) {
        const x0 = edges[i] + (i > 0 ? wander[i - 1] : 0), x1 = edges[i + 1] + (i < cols.length ? wander[i] : 0), w = x1 - x0;
        if (w < 1) continue;
        const plane = trunkPlane((x0 + x1) / 2);
        if (y === plateEnd[i] && name !== 'bare' && w >= 2) {
          // where one plate ends and the next begins: a dark gap, the next plate's top edge catching the light
          p(x0 + 1, y, w - 1, 1, T[Math.max(0, plane - 2)]);
          plateEnd[i] = y + rng.int(name === 'giant' ? 9 : 6, name === 'giant' ? 20 : 15);
        } else if (y === plateEnd[i] - 0 + 1 && false) { /* (kept flat: a lit top edge on every plate was too much) */ }
        if (i > 0) p(x0, y, 1, 1, plane >= 3 ? B.deep : B.shadow);                       // the furrow at its left
        if (w >= 3) p(x1 - 1, y, 1, 1, T[Math.min(5, plane + 1)]);                       // the ridge's lit side, toward the inner edge
      }
    }
    if (name === 'bare') {
      // dead wood: the bark is gone in places, long cracks run down it
      for (let i = 0; i < 4; i++) { const x = rng.int(4, 19), y = rng.int(0, H - 14); line(x, y, x + rng.int(-1, 1), y + rng.int(7, 13), B.shadow); }
      for (let i = 0; i < 3; i++) { const x = rng.int(3, 15), y = rng.int(2, H - 10), w = rng.int(3, 5), h = rng.int(5, 9); p(x, y, w, h, T[Math.min(5, trunkPlane(x) + 1)]); p(x, y + h, w, 1, B.deep); }
    }
  }
  p(24, 0, 1, H, B.deep);                                                                // the edge toward the sky
  if (variant === 1) {
    if (name === 'oak' || name === 'giant') for (let i = 0; i < (name === 'giant' ? 9 : 5); i++) { const x = rng.int(6, W - 8), y = rng.int(2, H - 6), r = rng.int(1, 3); disc(x, y, r, C.mossDark); p(x - 1, y - r, 2 + r, 1, C.moss); }
    else if (name === 'birch') for (let i = 0; i < 5; i++) { const x = rng.int(5, 18), y = rng.int(2, H - 4); p(x, y, rng.int(2, 4), 2, '#b7c9a8'); p(x + 1, y, 1, 1, '#dfe7d0'); }
    else { line(10, 4, 13, 44, B.shadow); line(11, 4, 11, 20, B.deep); }
  } else if (variant === 2) {
    disc(12, 22, 5, B.deep); disc(12, 22, 3, B.shadow); p(8, 18, 3, 1, T[5]); p(7, 19, 1, 3, T[4]); p(9, 27, 6, 1, B.shadow);     // the knot hole, a lip of bark round it
    if (name === 'giant') for (let i = 0; i < 4; i++) { const x = rng.int(6, W - 8), y = rng.int(2, H - 6); disc(x, y, 2, C.mossDark); p(x - 1, y - 2, 3, 1, C.moss); }
    else if (name !== 'bare') for (let i = 0; i < 2; i++) { const x = rng.int(6, W - 8), y = rng.int(2, H - 6); disc(x, y, 2, name === 'birch' ? '#b7c9a8' : C.mossDark); }
  } else if (variant === 3) {
    if (name === 'oak') { let y = 0, x = 16; while (y < H) { p(x, y, 1, 2, C.leafDark); if (rng.chance(0.5)) p(x + rng.int(-2, 2), y, 2, 2, C.leaf); x += rng.int(-1, 1); x = Math.max(6, Math.min(W - 5, x)); y += 2; } }
    else if (name === 'giant') for (let i = 0; i < 2; i++) { const y = 8 + i * 22 + rng.int(0, 8), x = 17 + rng.int(0, 3), w = 24 - x; p(x, y, w, 2, '#c9b35a'); p(x, y, w, 1, '#e8d890'); p(x + 1, y + 2, w - 1, 1, C.acorn); }
    else if (name === 'birch') for (let i = 0; i < 7; i++) { const x = rng.int(4, 18), y = rng.int(1, H - 3); p(x, y, 3, 2, '#b7c9a8'); p(x + 1, y, 1, 1, '#dfe7d0'); }
    else { line(6, 10, 9, 30, B.shadow); line(14, 2, 15, 16, B.shadow); line(17, 30, 19, 46, B.shadow); }
  }
}

// Crown: the top of the LEFT trunk at the treeline, 25 x 48 art px. The
// trunk's own bark, tapering from the full width at the bottom into a
// broken tip with a few bare twigs.
function drawCrown(t, style) {
  const { poly, line, p, ctx } = t;
  const B = style.bark;
  drawTrunk(t, style, 0, new RNG(77));
  // keep the bark inside the taper only
  ctx.globalCompositeOperation = 'destination-in';
  poly([[0, 48], [25, 48], [23, 38], [19, 28], [15, 20], [11, 13], [9, 10], [6, 14], [3, 24], [1, 36]], '#000000');
  ctx.globalCompositeOperation = 'source-over';
  // its inner edge down the taper, and the splintered top
  for (const [[x0, y0], [x1, y1]] of [[[24, 47], [23, 38]], [[23, 38], [19, 28]], [[19, 28], [15, 20]], [[15, 20], [11, 13]], [[11, 13], [9, 10]]]) line(x0 - 1, y0, x1 - 1, y1, B.deep);
  line(10, 10, 14, 1, B.dark); line(12, 5, 17, 3, B.dark); line(9, 11, 4, 3, B.dark); line(6, 6, 2, 5, B.dark); line(14, 4, 15, 0, B.dark);
  p(11, 12, 2, 1, B.light);
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
// --- the foot of a tree -----------------------------------------------------------
// Where a trunk stands on the lawn, TREE_FOOT.w x TREE_FOOT.h art px: the
// LEFT tree's, the anchor at the picture's border on the lawn's line. It
// lies over the trunk's lowest tile (and is drawn after what climbs and
// hangs on the trunk, so a vine comes out from behind a root).
// The trunk's own bark, widening: its planes of light and its furrows are
// the trunk's where the sprite begins and swing out with the flank on the
// way down, so the ridges between them become the roots. At the lawn they
// part into toes with dark hollows between, the innermost runs on along
// the ground, dives into the grass and comes up once more as a knee. A
// slope that faces up is lit and has no dark edge; grass stands in front
// of all of it (drawTreeFootGrass), and moss sits on its shoulders.
// Two looks, so the two trees are not one tree mirrored: 0 has a small
// door between two roots with a light in the window beside it (somebody
// lives there) and mushrooms on the lawn before it, 1 a fern in the fork.
export const TREE_FOOT = { w: 70, h: 50, sink: 1, from: 42, reach: [23, 21], window: [20, 5] };      // (`from`: the height the flank begins to widen at; `reach`: how far it swings out, by look; `window`: the lit window's lower left corner in the first look, art px right of the border and up from the lawn)
const FUNGUS = { hi: C.furHi, base: C.fur, dark: C.furDark, stem: C.belly, spot: C.white };      // the mushrooms at the left tree's foot: the squirrel's orange, which shows before grey stone and green
function drawTreeFoot(t, look) {
  const { p, ctx } = t;
  const F = TREE_FOOT, B = TREE_STYLES[0].bark, T = barkTones(B), r = new RNG(900 + look * 7);
  const S = ctx.canvas.width / F.w, top = F.h - F.sink;
  // by height above the lawn: (x, h) is the art pixel in column x whose lower edge is h above the lawn's line
  const q = (x, h, col, w = 1, n = 1) => p(x, top - h - n, w, n, col);
  const clear = (x, h, w = 1, n = 1) => ctx.clearRect(x * S, (top - h - n) * S, w * S, n * S);
  const edge = (h) => 24 + Math.round(F.reach[look] * Math.pow(Math.max(0, 1 - h / F.from), 2.3));      // the flank's last column at height h
  const stretch = (h) => (edge(h) - TRUNK.axis) / (24 - TRUNK.axis);
  const cols = furrows(9), hTop = F.h - F.sink - 1;
  const plate = cols.map(() => r.int(6, 14));
  for (let h = hTop; h >= -F.sink; h--) {
    const e = edge(h), s = stretch(h), above = h < hTop ? edge(h + 1) : e;
    // the bark's planes, swung out with the flank
    for (let x = 0; x <= e; x++) q(x, h, T[trunkPlane(Math.min(24, TRUNK.axis + (x - TRUNK.axis) / s))]);
    // its furrows, the lit side of each ridge, and the gaps between the bark's plates
    cols.forEach((c, i) => {
      const x = Math.round(TRUNK.axis + (c - TRUNK.axis) * s), plane = trunkPlane(c);
      q(x, h, plane >= 3 ? B.deep : B.shadow);
      if (x - 1 > 0 && s < 1.5) q(x - 1, h, T[Math.min(5, plane + 1)]);
      if (h === hTop - plate[i]) { const x2 = i + 1 < cols.length ? Math.round(TRUNK.axis + (cols[i + 1] - TRUNK.axis) * s) : e; if (x2 - x > 2) q(x + 1, h, T[Math.max(0, plane - 2)], x2 - x - 1); plate[i] += r.int(7, 14); }
    });
    // its edge: dark toward the sky where it is steep, as the trunk's is; lit where it faces up
    if (e - above >= 2) { q(above + 1, h, T[5], e - above); q(above + 1, h - 1, T[4], e - above); }
    else q(e, h, B.deep);
  }
  // the toes: hollows between the roots at the lawn, each a wedge of dark with the grass showing at its foot
  const base = edge(0), toes = look === 0 ? [[8, 4, 6], [15, 4, 7], [39, 4, 6]] : [[8, 5, 7], [19, 4, 9], [30, 6, 10], [39, 3, 5]];
  for (const [x0, w0, n] of toes) {
    for (let h = -F.sink; h < n; h++) {
      const w = Math.max(1, Math.round(w0 * (1 - Math.max(0, h) / n))), x = x0 + Math.floor((w0 - w) / 2);
      if (x + w > base) continue;
      if (h < 1) clear(x, h, w); else q(x, h, h < 3 ? B.deep : B.shadow, w);
      q(x - 1, h, T[4]); q(x + w, h, T[1]);                                      // the root left of it faces the light, the one right of it is in its own shade
    }
    q(x0 + Math.floor(w0 / 2) - 1, n, T[1], 2);
  }
  // the root that runs on: along the ground from the flank's foot, into the grass, and a knee of it further on
  const run = look === 0 ? 7 : 14;
  for (let i = 1; i <= run; i++) {
    const x = base + i, n = Math.max(1, Math.round(5 * (1 - i / (run + 1)) + 0.4));
    q(x, -F.sink, T[2], 1, n + F.sink); q(x, n - 1, T[5]); if (n > 2) q(x, n - 2, T[4]); if (n > 3) q(x, 0, T[1]);
  }
  if (look === 1) { const x = base + run + 4;
    q(x, 0, T[2], 2, 1); q(x + 5, 0, T[1], 2, 1); q(x, 1, T[3], 7, 1); q(x + 1, 2, T[5], 5, 1); q(x + 2, 1, T[4], 3, 1); q(x + 2, 0, B.shadow, 3, 1); clear(x - 1, -F.sink, 9, F.sink); q(x, -F.sink, T[2], 2, F.sink); q(x + 5, -F.sink, T[1], 2, F.sink); }
  // moss on its shoulders
  const moss = (x, h, w) => { q(x, h, C.mossDark, w, 2); q(x + 1, h + 2, C.mossDark, w - 2); q(x, h + 1, C.moss, w - 1); q(x + 1, h + 2, C.moss, Math.max(1, w - 3)); };
  for (const [f, h, w] of look === 0 ? [[0.72, 17, 5], [0.45, 30, 4], [0.9, 7, 4]] : [[0.8, 13, 6], [0.3, 24, 4], [0.6, 36, 3]]) moss(Math.round(edge(h) * f), h, w);
  moss(base + (look === 0 ? 5 : 8), look === 0 ? 3 : 2, 4);
  if (look === 0) {
    // somebody's house: a round-topped door of planks between two roots, its doorstep, and beside it a window with a light on
    const x = 25, [wx, wy] = F.window;
    q(x, 0, B.shadow, 9, 10); q(x + 1, 10, B.shadow, 7); q(x + 2, 11, B.shadow, 5); q(x - 1, 0, T[4], 1, 9); q(x + 9, 0, T[1], 1, 9);
    q(x + 1, 1, C.plank, 7, 7); q(x + 2, 8, C.plank, 5); q(x + 3, 9, C.plank, 3);
    q(x + 1, 1, C.plankHi, 1, 7); q(x + 2, 8, C.plankHi); q(x + 3, 9, C.plankHi, 2); q(x + 3, 1, C.plankDark, 1, 8); q(x + 5, 1, C.plankDark, 1, 8); q(x + 7, 1, C.plankDark, 1, 7);
    q(x + 1, 6, B.deep, 7); q(x + 1, 2, B.deep, 7);                              // its two bands
    q(x + 6, 4, C.gold);                                                         // its knob
    q(x - 1, 0, C.stoneLight, 11); q(x - 1, 0, C.stoneHi, 5);                    // the doorstep
    q(wx - 1, wy - 1, B.shadow, 4, 5); q(wx, wy, C.lanternGlow, 2, 3); q(wx, wy + 2, C.lanternHi); q(wx - 1, wy - 2, T[5], 4);      // the window, its sill catching the light
    // and a few mushrooms on the lawn in front of the house, the biggest in the middle: a cap lit on its upper left, pale spots, a pale stem
    const cap = (x, h, w) => { q(x, h, FUNGUS.dark, w); q(x, h + 1, FUNGUS.base, w, w > 5 ? 2 : 1); const up = h + (w > 5 ? 3 : 2); q(x + 1, up, FUNGUS.base, w - 2); q(x + 1, up, FUNGUS.hi, Math.ceil((w - 2) / 2)); q(x, up - 1, FUNGUS.hi, 2); q(x + w - 3, up - 1, FUNGUS.spot); if (w > 5) q(x + 2, up - 2, FUNGUS.spot); };
    for (const [x, n, w] of [[56, 3, 5], [60, 5, 7], [65, 1, 4]]) { q(x + Math.floor(w / 2) - (w > 5 ? 1 : 0), 0, FUNGUS.stem, w > 5 ? 2 : 1, n); cap(x, n, w); }
  } else {
    // a fern in the fork: three fronds arching out of one place, each a stem with leaflets either side that get shorter toward its tip
    const fx = base + 1, fronds = [[-1, 12, -0.75], [0.3, 13, 0.2], [1, 11, 1.05]];
    for (const [lean, len, bend] of fronds) for (let i = 0; i < len; i++) {
      const f = i / (len - 1), x = Math.round(fx + lean * 1.5 + bend * 9 * f * f), h = 3 + Math.round(i * (1 - 0.35 * f * Math.abs(bend)));
      q(x, h, i > len - 3 ? C.grassLight : C.leaf);
      if (i > 1 && i % 2 === 0 && i < len - 1) { const n = f < 0.6 ? 2 : 1; q(x - n, h, C.grass, n); q(x + 1, h, bend > 0.5 ? C.grassLight : C.grass, n); q(x - n, h - 1, C.leafDark); }
    }
    q(fx - 1, 1, C.leafDark, 4, 2);
  }
}
// The grass that stands in front of a tree's foot, TREE_FOOT.w x 4 art px with the same anchor: blades over where it
// meets the lawn, more of them than on the open lawn. A sprite of its own, because under snow there is none (background.js).
function drawTreeFootGrass(t, look) {
  const F = TREE_FOOT, r = new RNG(950 + look * 7);
  for (let x = 0; x < F.w; x++) {
    if (look === 0 && ((x >= 24 && x <= 34) || x >= 56)) continue;               // (the doorstep is kept clear, and the mushrooms)
    if (r.chance(0.55)) { const n = F.sink + r.int(1, 3); t.p(x, 4 - n, 1, n, r.chance(0.5) ? C.grassLight : C.grass); }
  }
}

export function buildTrees() {
  const rng = new RNG(2024);
  const branch = (L, v, draw) => makeSprite(L + BRANCH.root, BRANCH.h, draw, undefined, { axPx: L * 2, ayPx: BRANCH.surf * 4 });
  const styles = TREE_STYLES.map((style, si) => {
    const branchR = {};
    for (const [len, { art }] of Object.entries(BRANCH_LEN)) {
      const variants = len === 'stub' ? [0, 1] : [0, 1, 2, 3, 4, 5];
      branchR[len] = variants.map((v) => branch(art, v, (t) => drawBranch(t, style, v, rng, art)));
    }
    const trunkL = [0, 1, 2, 3].map((v) => makeSprite(25, 48, (t) => drawTrunk(t, style, v, new RNG(100 + si * 10 + v)), { ax: 0, ay: 1 }));
    return { ...style, branchR, trunkL };       // (the right trunk and the left tree's branches are these, mirrored when drawn)
  });
  const branchRDry = { normal: branch(50, 0, (t) => drawDryBranch(t, 50)), long: branch(76, 0, (t) => drawDryBranch(t, 76)) };
  const burlL = makeSprite(6, 9, (t) => drawBurl(t), { ax: 0, ay: 0.5 });
  const feet = [0, 1].map((look) => makeSprite(TREE_FOOT.w, TREE_FOOT.h, (t) => drawTreeFoot(t, look), { ax: 0, ay: 1 }, { ayPx: (TREE_FOOT.h - TREE_FOOT.sink) * PX }));      // (the right tree's is the second, mirrored when drawn)
  const feetGrass = [0, 1].map((look) => makeSprite(TREE_FOOT.w, 4, (t) => drawTreeFootGrass(t, look), { ax: 0, ay: 1 }, { ayPx: (4 - TREE_FOOT.sink) * PX }));
  const overlays = {
    moss: [0, 1, 2].map((s) => makeSprite(5 + s * 3, 4 + s * 2, (t) => drawMoss(t, s), { ax: 0.5, ay: 0.5 })),
    crack: makeSprite(3, 10, (t) => drawCrack(t), { ax: 0.5, ay: 0.5 }),
    hole: makeSprite(4, 5, (t) => drawHole(t), { ax: 0.5, ay: 0.5 }),
    fungus: [0, 1].map((b) => makeSprite(b ? 10 : 6, 5, (t) => drawFungus(t, b), { ax: 0.5, ay: 0.5 })),
    lichen: makeSprite(7, 5, (t) => drawLichen(t), { ax: 0.5, ay: 0.5 }),
    burlL, burlR: flipH(burlL),
  };
  const crownL = makeSprite(25, 48, (t) => drawCrown(t, TREE_STYLES[3]), { ax: 0, ay: 1 });
  return { styles, branchRDry, overlays, crownL, feet, feetGrass };
}
