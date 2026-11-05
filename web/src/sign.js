import { PAL as C } from './palette.js';
import { RNG } from './util.js';

// The wooden sign the menus hang on: a bark frame around boards, nailed at
// the ends, on two ropes from the top of the screen, a vine over two corners
// and a bow on the right rope. Drawn every frame with rectangles on the
// 4-px art grid so one routine serves signs of any size; only the vines and
// the bow are sprites (art/sign.js). Logical coordinates, x/y/w/h multiples
// of 4. A sign is `signHeight(n)` tall for n boards.

export const BOARD = 72;               // a board with the gap under it
export const FRAME = 20;               // outline, bark band and the recess
export const ROPE_IN = 166;            // the ropes this far in from the sides
export const signHeight = (boards) => 2 * FRAME - 4 + boards * BOARD;
export const BTN_FILL = 'rgba(40,30,22,0.88)';   // a recessed button on the boards

const SH = C.barkShadow;

// Grain and knots per board index, fixed so the sign never flickers.
const grain = new Map();
function boardGrain(i) {
  let b = grain.get(i);
  if (b) return b;
  const r = new RNG(1000 + i);
  const dashes = [];
  const n = r.int(4, 6);
  for (let k = 0; k < n; k++) dashes.push({ x: r.range(0.04, 0.82), len: r.range(0.07, 0.2), row: r.pick([20, 28, 36, 44, 52]), hi: r.chance(0.4) });
  b = { dashes, knot: r.chance(0.45) ? r.range(0.15, 0.8) : null };
  grain.set(i, b);
  return b;
}
const frameGrain = (() => {
  const r = new RNG(77);
  return Array.from({ length: 10 }, () => ({ x: r.range(0.03, 0.9), len: r.range(0.03, 0.09), side: r.int(0, 3) }));
})();

const snap = (v) => Math.round(v / 4) * 4;

// o: alpha, ropes (default true), plain (no vines and bow)
export function drawSign(g, art, x, y, w, h, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  const r = (xx, yy, ww, hh, c) => g.rect(xx, yy, ww, hh, c, a);
  g.rect(x + 12, y + 12, w, h, '#000', 0.25 * a);                // its shadow on the scene
  if (o.ropes !== false) for (const rx of [x + ROPE_IN, x + w - ROPE_IN - 8]) drawRope(r, rx, y);

  // frame: outline with the corner pixel cut, bark band, bevel, recess
  r(x + 4, y, w - 8, 4, SH); r(x + 4, y + h - 4, w - 8, 4, SH); r(x, y + 4, 4, h - 8, SH); r(x + w - 4, y + 4, 4, h - 8, SH);
  r(x + 4, y + 4, w - 8, 12, C.barkDark); r(x + 4, y + h - 16, w - 8, 12, C.barkDark);
  r(x + 4, y + 4, 12, h - 8, C.barkDark); r(x + w - 16, y + 4, 12, h - 8, C.barkDark);
  r(x + 8, y + 4, w - 16, 4, C.barkLight); r(x + 4, y + 8, 4, h - 16, C.barkLight);
  r(x + 8, y + h - 8, w - 16, 4, C.barkDeep); r(x + w - 8, y + 8, 4, h - 16, C.barkDeep);
  for (const d of frameGrain) {
    // lighter streaks along each bar
    if (d.side === 0) r(x + 16 + snap(d.x * (w - 32)), y + 8, snap(d.len * w), 4, C.barkMid);
    else if (d.side === 1) r(x + 16 + snap(d.x * (w - 32)), y + h - 12, snap(d.len * w), 4, C.barkMid);
    else if (d.side === 2) r(x + 8, y + 16 + snap(d.x * (h - 32)), 4, snap(d.len * h), C.barkMid);
    else r(x + w - 12, y + 16 + snap(d.x * (h - 32)), 4, snap(d.len * h), C.barkMid);
  }
  // mitred corners
  for (const [cx, cy] of [[x + 4, y + 4], [x + w - 16, y + 4], [x + 4, y + h - 16], [x + w - 16, y + h - 16]]) r(cx + 4, cy + 4, 4, 4, C.barkDeep);
  r(x + 16, y + 16, w - 32, h - 32, SH);                          // the recess the boards sit in

  // boards
  const ix = x + FRAME, iy = y + FRAME, iw = w - 2 * FRAME;
  const n = Math.floor((h - 2 * FRAME + 4) / BOARD);
  for (let i = 0; i < n; i++) {
    const by = iy + i * BOARD, bg = boardGrain(i);
    r(ix, by, iw, BOARD - 4, C.plank);
    r(ix, by, iw, 4, C.plankHi);
    r(ix, by + BOARD - 12, iw, 8, C.plankDark);
    for (const d of bg.dashes) r(ix + 24 + snap(d.x * (iw - 48)), by + d.row, Math.max(8, snap(d.len * iw)), 4, d.hi ? C.plankHi : C.plankDark);
    if (bg.knot != null) {
      const kx = ix + 24 + snap(bg.knot * (iw - 60)), ky = by + 24;
      r(kx, ky, 12, 12, C.plankDark); r(kx + 4, ky + 4, 4, 4, C.plank); r(kx - 8, ky + 4, 8, 4, C.plankDark); r(kx + 12, ky + 4, 8, 4, C.plankDark);
    }
    for (const nx of [ix + 8, ix + iw - 16]) { r(nx, by + 30, 8, 8, C.pole); r(nx, by + 30, 4, 4, C.poleHi); }
  }

  if (o.plain || !art.sign) return;
  g.blit(art.sign.vineTL, x + 8, y + 8, { alpha: a });
  g.blit(art.sign.vineBR, x + w - 8, y + h - 8, { alpha: a });
  g.blit(art.sign.bow, x + w - ROPE_IN - 4, y - 2, { alpha: a });
}

// A twisted rope from the top of the screen down to the sign, knotted there.
function drawRope(r, rx, y) {
  if (y < 8) return;                 // the sign is still above the screen
  r(rx, 0, 8, y + 4, C.rope);
  r(rx + 4, 0, 4, y + 4, C.ropeDark);
  for (let yy = 4; yy < y - 8; yy += 16) r(rx + ((yy / 16) % 2 ? 4 : 0), yy, 4, 4, (yy / 16) % 2 ? C.rope : C.ropeDark);
  r(rx - 4, y - 8, 16, 12, C.ropeDark);
  r(rx, y - 4, 8, 4, C.rope);
}
