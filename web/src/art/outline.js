import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';
import { TOWER_W, ROUND, planeAt } from './tower.js';
import { SLATE } from './story.js';

// What changes the tower's outline (towerwall.js says where, background.js
// draws it): a roofed gallery that runs round it on brackets, and an oriel,
// a little turret of its own that hangs on its edge. Above the trees the
// tower stands before the sky, and its edge is what one sees of it: these
// two break the straight line. Both for the eye only: neither can be stood
// on, which is why each ends in a roof and not in a floor.
// Both stand out past the wall's edge, where its veil is not, so they are
// drawn after the veil and have it in their tones already (as the gargoyles
// do). Round as the tower is: the same light, the same planes.

const VEIL = '#14242b';
// Two colours mixed, as a hex colour (util.js mixHex gives an rgb() string, which cannot be mixed a second time).
const mix = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const V = (c) => mix(c, VEIL, 0.3);
const TOWER_A = TOWER_W / 4, E = ROUND.edge;
// By plane of light, lit to shade: the slates, the gallery's boards, dressed stone, the oriel's bricks.
const ROOF = [SLATE.hi, SLATE.hi, SLATE.base, SLATE.base, SLATE.shade].map(V);
const ROOF_LINE = [SLATE.shade, SLATE.shade, SLATE.dark, SLATE.dark, SLATE.dark].map(V);
const BOARD = [C.plankHi, mix(C.plankHi, C.plank, 0.5), C.plank, mix(C.plank, C.plankDark, 0.55), C.plankDark].map(V);
const BOARD_DARK = [C.plank, mix(C.plank, C.plankDark, 0.5), C.plankDark, mix(C.plankDark, C.barkShadow, 0.4), mix(C.plankDark, C.barkShadow, 0.7)].map(V);
const STONE = [C.stoneHi, C.stoneLight, C.stone, C.stoneDark, C.stoneShade].map(V);
const BRICK = [C.brickLight, mix(C.brickLight, C.brickMid, 0.5), C.brickMid, C.brickDark, C.brickShade].map(V);
const DEEP = V(C.wallDeep), EAVE = V(SLATE.eave), MORTAR = V(C.mortar), GOLD = [C.braidHi, C.braid, C.braidShade].map(V);
const PANE_SKY = V('#2a2650');      // a hint of the sky in a dark window's panes (as art/windows.js has it)
const step = (ramp, k) => ramp[Math.max(0, Math.min(ramp.length - 1, k))];

// --- the gallery ----------------------------------------------------------------------
// A wooden gallery round the tower, RING.w x RING.h art px: a skirt of
// slates that leans against the wall (the tower's own roof is of these),
// under its eaves a wall of upright boards with a row of small hatches,
// the beam its floor lies on, and the brackets that carry it, which step
// back to the wall. It stands RING.out art px proud of the wall at either
// side. The anchor is the middle of the roof's upper edge.
export const RING = { out: 8, roof: 12, wall: 9, corbel: 6 };
RING.w = TOWER_A + 2 * (RING.out + 1); RING.h = RING.roof + 1 + RING.wall + 2 + RING.corbel;
function drawRing(t) {
  const { p } = t, R = RING, mid = R.w / 2, r = new RNG(6100);
  const angle = (x, hw) => Math.asin(Math.max(-1, Math.min(1, ((x + 0.5 - mid) / hw) * Math.sin(E))));
  const X = (a, hw) => Math.round(mid + hw * Math.sin(a) / Math.sin(E));
  // the slates: courses four rows high, each course's joints off the one above it
  for (let y = 0; y < R.roof; y++) {
    const hw = Math.round(TOWER_A / 2 + 1 + (R.out * y) / (R.roof - 1)), line = y % 4 === 3;
    for (let x = mid - hw; x < mid + hw; x++) { const k = planeAt(angle(x, hw)); p(x, y, 1, 1, line ? ROOF_LINE[k] : ROOF[k]); }
    if (y % 4 === 0) for (let a = -E + r.range(0.02, 0.1); a < E; a += r.range(0.09, 0.15)) { const x = X(a, hw), k = planeAt(a); if (x > mid - hw && x < mid + hw - 1) p(x, y, 1, 3, ROOF_LINE[Math.max(0, k - 1)]); }
  }
  const hw = TOWER_A / 2 + R.out, y0 = R.roof;
  p(mid - hw - 1, y0, 2 * hw + 2, 1, EAVE);                                     // the eaves, dark underneath
  // the boards, in the eaves' shade at their top; a hatch in every fourth, its lower edge catching the light
  for (let x = mid - hw; x < mid + hw; x++) { const k = planeAt(angle(x, hw)); p(x, y0 + 1, 1, R.wall, BOARD[k]); p(x, y0 + 1, 1, 2, step(BOARD, k + 1)); }
  for (let a = -E, n = 0; a < E; a += 0.105, n++) {
    const x = X(a, hw), x1 = X(a + 0.105, hw), k = planeAt(a + 0.05);
    if (x > mid - hw) p(x, y0 + 1, 1, R.wall, BOARD_DARK[k]);
    if (n % 4 === 2 && x1 - x >= 6) { const xh = Math.round((x + x1) / 2) - 1; p(xh, y0 + 3, 3, 4, DEEP); p(xh, y0 + 7, 3, 1, step(BOARD, k - 1)); p(xh + 3, y0 + 3, 1, 4, BOARD_DARK[k]); }
  }
  p(mid - hw, y0 + 1, 1, R.wall, BOARD_DARK[1]); p(mid + hw - 1, y0 + 1, 1, R.wall, BOARD_DARK[4]);      // its corner posts
  // the beam under the floor: lit along its top, dark below
  const yb = y0 + 1 + R.wall;
  for (let x = mid - hw; x < mid + hw; x++) { const k = planeAt(angle(x, hw)); p(x, yb, 1, 1, step(BOARD, k - 1)); p(x, yb + 1, 1, 1, BOARD_DARK[k]); }
  // the brackets: each a block that steps back to the wall, and the dark under the floor between them
  const yc = yb + 2;
  p(mid - hw + 1, yc, 2 * hw - 2, 1, DEEP);
  for (let a = -E + 0.06; a < E; a += 0.2) {
    const k = planeAt(a);
    for (let j = 0; j < R.corbel; j++) {
      const w = [4, 4, 3, 3, 2, 1][j], x = X(a, TOWER_A / 2 + R.out * (1 - (j + 1) / R.corbel) - 1) - Math.floor(w / 2);
      p(x, yc + j, w, 1, j === 0 ? BOARD[k] : BOARD_DARK[k]); if (j > 0 && w > 1) p(x, yc + j, 1, 1, BOARD[Math.min(4, k + 1)]);
    }
  }
}

// --- the oriel --------------------------------------------------------------------------
// A turret of its own on the tower's edge, ORIEL.w x ORIEL.h art px: a cone
// of slates with a golden ball on its tip, a round body of the tower's own
// brick between two bands of dressed stone, a small arched window in it,
// and under it rings of stone that step in to a point. ORIEL.in art px of
// its body lie over the wall, the rest hangs out past the edge. Drawn for
// either side with the light where it is (upper left), not mirrored; the
// one at the right edge is round the tower from the light, a step darker.
// The anchor is where the wall's edge crosses the top of its lower band,
// which lies on a string course. `pane`: the middle of its window, from the
// sprite's upper left corner, for the light in it at night.
export const ORIEL = { w: 30, h: 67, half: 12, in: 10, band: 52, pane: [15, 37] };
function drawOriel(t, right) {
  const { p } = t, O = ORIEL, cx = O.w / 2, r = new RNG(right ? 6300 : 6200), dim = right ? 1 : 0;
  const angle = (x, hw) => Math.asin(Math.max(-1, Math.min(1, ((x + 0.5 - cx) / hw) * Math.sin(E))));
  const plane = (x, hw) => Math.min(4, planeAt(angle(x, hw)) + dim);
  const X = (a, hw) => Math.round(cx + hw * Math.sin(a) / Math.sin(E));
  // the roof: a cone of slates, rows 5 to 24
  for (let y = 5; y < 25; y++) {
    const hw = Math.round(1 + ((y - 5) / 19) * 13), line = (y - 5) % 5 === 4;
    for (let x = cx - hw; x < cx + hw; x++) { const k = plane(x, hw); p(x, y, 1, 1, line ? ROOF_LINE[k] : ROOF[k]); }
    if ((y - 5) % 5 === 0 && hw > 4) for (let a = -E + r.range(0.1, 0.3); a < E; a += r.range(0.32, 0.5)) { const x = X(a, hw); if (x > cx - hw && x < cx + hw - 1) p(x, y, 1, 4, ROOF_LINE[Math.max(0, plane(x, hw) - 1)]); }
  }
  p(cx - 14, 25, 28, 1, EAVE);
  // its golden ball on a spike
  p(cx - 1, 3, 2, 3, GOLD[2]); p(cx - 2, 0, 4, 3, GOLD[1]); p(cx - 2, 0, 2, 2, GOLD[0]); p(cx - 1, 3, 1, 1, GOLD[1]);
  // the body: a band of stone, four courses of brick (in the eaves' shade at the top), a band of stone
  const hw = O.half, top = 26, courses = 4, rowH = 6;
  const band = (y, n) => { for (let x = cx - hw - 1; x < cx + hw + 1; x++) { const k = plane(x, hw + 1); p(x, y, 1, n, STONE[k]); p(x, y, 1, 1, step(STONE, k - 1)); p(x, y + n - 1, 1, 1, step(STONE, k + 1)); } };
  band(top, 2);
  for (let c = 0; c < courses; c++) {
    const y = top + 2 + c * rowH;
    for (let x = cx - hw; x < cx + hw; x++) p(x, y, 1, rowH, MORTAR);
    for (let a = -E - (c % 2 ? 0.2 : 0), n = 0; a < E; a += 0.4, n++) {
      const x0 = Math.max(cx - hw, X(Math.max(a, -E), hw)), x1 = Math.min(cx + hw, X(Math.min(a + 0.4, E), hw)), k = Math.min(4, planeAt((Math.max(a, -E) + Math.min(a + 0.4, E)) / 2) + dim + (r.chance(0.3) ? 1 : 0) + (c === 0 ? 1 : 0));
      if (x1 - x0 < 2) continue;
      p(x0 + 1, y, x1 - x0 - 1, rowH - 1, step(BRICK, k)); p(x0 + 1, y, x1 - x0 - 1, 1, step(BRICK, k - 1));
    }
  }
  band(O.band, 2);
  // its window: an arch of dressed stone, the dark of the room, a sill
  const wx = cx - 4, wy = 31;
  p(wx, wy + 2, 8, 11, STONE[1 + dim]); p(wx + 1, wy + 1, 6, 1, STONE[1 + dim]); p(wx + 2, wy, 4, 1, STONE[dim]); p(wx + 7, wy + 2, 1, 11, STONE[3]);
  p(wx + 1, wy + 3, 6, 9, V(C.nightDeep)); p(wx + 2, wy + 2, 4, 1, V(C.nightDeep)); p(wx + 3, wy + 1, 2, 1, V(C.nightDeep));
  p(wx + 2, wy + 4, 2, 2, PANE_SKY); p(wx + 4, wy + 3, 1, 9, STONE[3]);                               // a hint of the sky in its panes, and the mullion
  p(wx - 1, wy + 13, 10, 1, STONE[dim]); p(wx - 1, wy + 14, 10, 1, STONE[3]);
  // under it: rings of stone that step in, each lit along its top, and a drop at the point
  for (let s = 0; s < 4; s++) {
    const w = [10, 7, 4, 2][s], y = O.band + 2 + s * 3;
    for (let x = cx - w; x < cx + w; x++) { const k = plane(x, w); p(x, y, 1, 3, step(STONE, k + 1)); p(x, y, 1, 1, STONE[k]); p(x, y + 2, 1, 1, step(STONE, k + 2)); }
  }
  p(cx - 1, O.band + 14, 2, 1, STONE[3]);
}

// --- the stair turret ---------------------------------------------------------------------
// A slim turret that runs up the tower's edge over several storeys, with
// the winding stair in it: the oriel's cone of slates on top (`cap`), its
// rings of stone that step in underneath (`foot`), and between them one
// `shaft` for every storey, TURRET.shaft art px high (a storey's height):
// the tower's brick with a band of stone at its foot and three slits that
// climb round it with the stair. As wide as the oriel and hung on the
// edge like it; drawn for either side, the right one a step darker. The
// anchors are on the wall's edge: the cap's and a shaft's at their foot,
// the foot's at its top.
export const TURRET = { w: 30, cap: 28, shaft: 110, foot: 15, half: 12, in: 10 };
function turretKit(t, right, seed) {
  const { p } = t, T = TURRET, cx = T.w / 2, hw = T.half, r = new RNG(seed), dim = right ? 1 : 0;
  const angle = (x, w) => Math.asin(Math.max(-1, Math.min(1, ((x + 0.5 - cx) / w) * Math.sin(E))));
  const plane = (x, w) => Math.min(4, planeAt(angle(x, w)) + dim);
  const X = (a, w) => Math.round(cx + w * Math.sin(a) / Math.sin(E));
  const band = (y, n) => { for (let x = cx - hw - 1; x < cx + hw + 1; x++) { const k = plane(x, hw + 1); p(x, y, 1, n, STONE[k]); p(x, y, 1, 1, step(STONE, k - 1)); p(x, y + n - 1, 1, 1, step(STONE, k + 1)); } };
  const bricks = (y0, courses) => {
    for (let c = 0; c < courses; c++) {
      const y = y0 + c * 6;
      for (let x = cx - hw; x < cx + hw; x++) p(x, y, 1, 6, MORTAR);
      for (let a = -E - (c % 2 ? 0.2 : 0); a < E; a += 0.4) {
        const x0 = Math.max(cx - hw, X(Math.max(a, -E), hw)), x1 = Math.min(cx + hw, X(Math.min(a + 0.4, E), hw)), k = Math.min(4, planeAt((Math.max(a, -E) + Math.min(a + 0.4, E)) / 2) + dim + (r.chance(0.3) ? 1 : 0));
        if (x1 - x0 < 2) continue;
        p(x0 + 1, y, x1 - x0 - 1, 5, step(BRICK, k)); p(x0 + 1, y, x1 - x0 - 1, 1, step(BRICK, k - 1));
      }
    }
  };
  return { p, cx, hw, r, dim, plane, X, band, bricks };
}
function drawTurretCap(t, right) {
  const { p, cx, r, plane, X, band } = turretKit(t, right, right ? 6500 : 6400);
  for (let y = 5; y < 25; y++) {
    const hw = Math.round(1 + ((y - 5) / 19) * 13), line = (y - 5) % 5 === 4;
    for (let x = cx - hw; x < cx + hw; x++) { const k = plane(x, hw); p(x, y, 1, 1, line ? ROOF_LINE[k] : ROOF[k]); }
    if ((y - 5) % 5 === 0 && hw > 4) for (let a = -E + r.range(0.1, 0.3); a < E; a += r.range(0.32, 0.5)) { const x = X(a, hw); if (x > cx - hw && x < cx + hw - 1) p(x, y, 1, 4, ROOF_LINE[Math.max(0, plane(x, hw) - 1)]); }
  }
  p(cx - 14, 25, 28, 1, EAVE);
  p(cx - 1, 3, 2, 3, GOLD[2]); p(cx - 2, 0, 4, 3, GOLD[1]); p(cx - 2, 0, 2, 2, GOLD[0]); p(cx - 1, 3, 1, 1, GOLD[1]);
  band(26, 2);
}
function drawTurretShaft(t, right) {
  const { p, cx, dim, band, bricks } = turretKit(t, right, right ? 6700 : 6600), T = TURRET;
  bricks(0, 18); band(T.shaft - 2, 2);
  // the stair's slits, each a little higher and further round than the one before
  for (const [x, y] of [[cx - 8, 80], [cx - 2, 49], [cx + 4, 18]]) {
    p(x - 1, y - 1, 4, 10, STONE[Math.min(4, 1 + dim)]); p(x + 2, y - 1, 1, 10, STONE[3]); p(x - 1, y - 1, 4, 1, STONE[dim]);
    p(x, y, 2, 8, V(C.nightDeep)); p(x - 1, y + 9, 4, 1, STONE[3]);
  }
}
function drawTurretFoot(t, right) {
  const { p, cx, plane, band } = turretKit(t, right, right ? 6900 : 6800);
  band(0, 2);
  for (let s = 0; s < 4; s++) {
    const w = [10, 7, 4, 2][s], y = 2 + s * 3;
    for (let x = cx - w; x < cx + w; x++) { const k = plane(x, w); p(x, y, 1, 3, step(STONE, k + 1)); p(x, y, 1, 1, STONE[k]); p(x, y + 2, 1, 1, step(STONE, k + 2)); }
  }
  p(cx - 1, 14, 2, 1, STONE[3]);
}

export function buildOutline() {
  const O = ORIEL, cx = O.w / 2;
  return {
    ring: makeSprite(RING.w, RING.h, (t) => drawRing(t), { ax: 0.5, ay: 0 }),
    // (the left one's wall edge is `in` art px in from its body's right side, the right one's from its left)
    turret: Object.fromEntries([['L', false], ['R', true]].map(([side, right]) => {
      const T = TURRET, ax = (right ? T.w / 2 - T.half + T.in : T.w / 2 + T.half - T.in) * 4;
      return [side, {
        cap: makeSprite(T.w, T.cap, (t) => drawTurretCap(t, right), undefined, { axPx: ax, ayPx: T.cap * 4 }),
        shaft: makeSprite(T.w, T.shaft, (t) => drawTurretShaft(t, right), undefined, { axPx: ax, ayPx: T.shaft * 4 }),
        foot: makeSprite(T.w, T.foot, (t) => drawTurretFoot(t, right), undefined, { axPx: ax, ayPx: 0 }),
      }];
    })),
    oriel: { L: makeSprite(O.w, O.h, (t) => drawOriel(t, false), undefined, { axPx: (cx + O.half - O.in) * 4, ayPx: O.band * 4 }), R: makeSprite(O.w, O.h, (t) => drawOriel(t, true), undefined, { axPx: (cx - O.half + O.in) * 4, ayPx: O.band * 4 }) },
  };
}
