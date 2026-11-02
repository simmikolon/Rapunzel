import { TILE_H } from './art/tiles.js';
import { PARALLAX_TOWER } from './config.js';
import { hash } from './altitude.js';
import { WINDOW_VARIANTS, WINDOW_LIT } from './art/windows.js';

// Where the tower's windows are. They live on the tower layer (0.9x) left
// and right of the braid, never under it, placed per tile by hash like the
// trunk overlays, so a height always shows the same windows whatever the
// seed. The background draws them; the level reads them to put a grabber
// in one. A window is 88 x 120 px with its sill at `ly` (layer height).

export const WINDOW_X = 114;        // |x| of a window's centre; the wall's edge is at 190
export const WINDOW_W = 88;
export const WINDOW_H = 120;

// Windows per side and tile, keyed to the zone bands in level.js (the
// altitude a layer height is seen at is ly / PARALLAX_TOWER).
const DENSITY = [[0, 0.10], [12000, 0.12], [25000, 0.42], [40000, 0.30]];
const BOTH_SIDES_FROM = 25000;      // one window per tile below the windows zone
function densityAt(alt) {
  let d = DENSITY[0][1];
  for (const [from, v] of DENSITY) if (alt >= from) d = v;
  return d;
}

// The raw roll for a tile and side: does this tile want a window here?
function wants(k, s) {
  if (k < 1) return false;          // tile 0 is the lawn's wall
  const alt = (k * TILE_H) / PARALLAX_TOWER;
  return (hash(k * 17 + s) % 1000) < densityAt(alt) * 1000;
}

// Sill offset of a tile's window inside its tile (0 .. TILE_H - 1).
const sillAt = (k, s) => hash(hash(k * 17 + s) + 2) % TILE_H;

// A window on `side` ('L' | 'R') in tile k, or null. One side's windows keep
// at least MIN_GAP between sills (the tile below is checked on its raw roll
// so this stays pure), and both sides in one tile only from the windows
// zone on.
const MIN_GAP = 160;
export function windowAt(k, side) {
  const s = side === 'L' ? 1 : 2;
  if (!wants(k, s)) return null;
  if (wants(k - 1, s) && TILE_H + sillAt(k, s) - sillAt(k - 1, s) < MIN_GAP) return null;
  const alt = (k * TILE_H) / PARALLAX_TOWER;
  if (s === 2 && alt < BOTH_SIDES_FROM && wants(k, 1)) return null;
  const seed = hash(k * 17 + s);
  const pick = hash(seed + 1) % 100;
  const variant = pick < 30 ? 0 : pick < 50 ? 1 : pick < 70 ? 2 : pick < 85 ? 3 : 4;
  const ly = k * TILE_H + sillAt(k, s);
  return { k, side, variant, lit: WINDOW_LIT[variant], ly, x: side === 'L' ? -WINDOW_X : WINDOW_X };
}

// A balcony on the same side covers the wall around its slab (the sprite
// reaches 240 px above the slab and 48 below): no window there.
export function blockedBy(w, blockers) {
  for (const b of blockers) if (b.side === w.side && w.ly > b.ly - 200 && w.ly < b.ly + 280) return true;
  return false;
}

// Every window with its sill in [lyLo, lyHi], minus those a blocker covers.
export function windowsBetween(lyLo, lyHi, blockers = []) {
  const out = [];
  for (let k = Math.max(1, Math.floor(lyLo / TILE_H)); k <= Math.floor(lyHi / TILE_H); k++) {
    for (const side of ['L', 'R']) {
      const w = windowAt(k, side);
      if (w && w.ly >= lyLo && w.ly <= lyHi && !blockedBy(w, blockers)) out.push(w);
    }
  }
  return out;
}

export { WINDOW_VARIANTS };
