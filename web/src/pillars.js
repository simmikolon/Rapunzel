import { hash } from './altitude.js';
import { TILE_H } from './art/tiles.js';

// What the two pillars inside the tower carry, tile by tile (tile k stands
// on k * TILE_H). Like the windows outside (windows.js) this is a fixed map,
// so the room reads as built: a torch every third tile, left and right in
// turn (both in the hall); a guard's hatch in some of the tiles between,
// left ones and right ones never at one height. The painter (interior.js)
// draws the tiles, the level reads the hatches to put a pike guard in one.
// A gallery's door covers the pillar where it stands: a plain tile there.

export const PILLAR_X = 334;          // |x| of a pillar's middle; its face toward the room is at 284
export const TORCH_Y = 108;           // from a tile's foot up to its torch's cup
export const HATCH_SILL = 40;         // from a tile's foot up to its hatch's sill height (the opening starts 16 px above, as a window's does)
const TORCH_EVERY = 3;
const HATCH_FROM = 6;                 // none in the hall
const HATCH_CHANCE = 50;              // percent of the tiles that may have one

// PLAIN (two drawings), HATCH and TORCH are the pillar sprites' variants (art/interior.js).
export const PLAIN = 0, HATCH = 2, TORCH = 3;

// What puts a door into a pillar: a gallery, or the top tread of a flight of stairs.
export const hasDoor = (p) => p.kind === 'gallery' || p.door === true;

// Does a door's drawing (150 px up from where one stands, a strut 60 px down) cover tile k on this side?
function covered(k, side, galleries) {
  for (const p of galleries) if (p.side === side && p.y - 60 < (k + 1) * TILE_H && p.y + 160 > k * TILE_H) return true;
  return false;
}

export function pillarTile(k, side, galleries = []) {
  const h = hash(k * 7 + (side === 'L' ? 3 : 5)) % 100;
  const plain = h % 10 < 7 ? PLAIN : PLAIN + 1;
  if (k < 1 || covered(k, side, galleries)) return plain;
  if (k % TORCH_EVERY === 1) return k === 1 || (((k - 1) / TORCH_EVERY) % 2 ? 'R' : 'L') === side ? TORCH : plain;
  if (k >= HATCH_FROM && k % TORCH_EVERY === (side === 'L' ? 0 : 2) && h < HATCH_CHANCE) return HATCH;
  return plain;
}

// Every hatch with its sill in [yLo, yHi], in the shape the window guard
// expects of a window: { i, side, x, ly, f } with f = 1 (the pillars stand
// in the prince's plane, so `ly` is a plain height).
export function hatchesBetween(yLo, yHi, galleries = []) {
  const out = [];
  for (let k = Math.max(HATCH_FROM, Math.ceil((yLo - HATCH_SILL) / TILE_H)); k * TILE_H + HATCH_SILL <= yHi; k++) {
    for (const side of ['L', 'R']) {
      if (pillarTile(k, side, galleries) === HATCH) out.push({ i: k, side, x: side === 'L' ? -PILLAR_X : PILLAR_X, ly: k * TILE_H + HATCH_SILL, f: 1 });
    }
  }
  return out;
}
