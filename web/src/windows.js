import { PARALLAX_TOWER } from './config.js';
import { hash } from './altitude.js';
import { WINDOW_VARIANTS, WINDOW_LIT } from './art/windows.js';

// Where the tower's windows are. They live on the tower layer (0.9x) left
// and right of the braid, never under it: one window per storey, left and
// right in turn, at a fixed spacing, so the tower reads as built by people
// rather than scattered. Only the look of a window comes from a hash. The
// background draws them; the level reads them to put a grabber in one. A
// window is 88 x 120 px with its sill at `ly` (layer height).

export const WINDOW_X = 114;        // |x| of a window's centre; the wall's edge is at 190
export const WINDOW_W = 88;
export const WINDOW_H = 120;
export const WINDOW_STOREY = 440;   // layer px from one window's sill to the next (same side: twice that)
const WINDOW_FIRST = 260;           // the first sill above the lawn

// The look of window i, never the same as the one below it.
function variantOf(i) {
  const pick = hash(i * 17 + 5) % 100;
  return pick < 30 ? 0 : pick < 50 ? 1 : pick < 70 ? 2 : pick < 85 ? 3 : 4;
}

// Window number i (0 at the bottom): side, look, sill height.
export function windowAt(i) {
  if (i < 0) return null;
  const side = i % 2 ? 'R' : 'L';
  let variant = variantOf(i);
  if (i > 0 && variant === variantOf(i - 1)) variant = (variant + 1) % WINDOW_VARIANTS;
  return { i, side, variant, lit: WINDOW_LIT[variant], ly: WINDOW_FIRST + i * WINDOW_STOREY, x: side === 'L' ? -WINDOW_X : WINDOW_X };
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
  for (let i = Math.max(0, Math.ceil((lyLo - WINDOW_FIRST) / WINDOW_STOREY)); WINDOW_FIRST + i * WINDOW_STOREY <= lyHi; i++) {
    const w = windowAt(i);
    if (!blockedBy(w, blockers)) out.push(w);
  }
  return out;
}

// The altitude (prince's plane) a layer height is seen at, for anyone who
// needs to key a window's look to a zone.
export const altitudeOf = (ly) => ly / PARALLAX_TOWER;

export { WINDOW_VARIANTS };
