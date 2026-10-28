// Altitude-keyed amounts shared by the background and the atmosphere
// (100 px = 1 m). Zone bands: forest floor 0, deep forest 120 m, windows
// 250 m, above the trees 400 m, then sunset and night.
import { invLerp, smoothstep } from './util.js';

export const forestAlpha = (y) => 1 - smoothstep(invLerp(27000, 40000, y));
export const cloudAlpha = (y) => smoothstep(invLerp(34000, 42000, y)) * (1 - 0.5 * smoothstep(invLerp(66000, 70000, y)));
export const nightAlpha = (y) => smoothstep(invLerp(66000, 70000, y));
// Deep forest atmosphere (fog, leaves, boughs, dapple): rises into the band
// and thins out toward the windows.
export const deepForestAmount = (y) => smoothstep(invLerp(7000, 13000, y)) * (1 - smoothstep(invLerp(22000, 29000, y)));
// Sunlight through the canopy: forest floor and deep forest, gone above the trees.
export const shaftAmount = (y) => 1 - smoothstep(invLerp(24000, 34000, y));
// Forest life (butterflies, birds): floor and deep forest.
export const lifeAmount = (y) => 1 - smoothstep(invLerp(22000, 29000, y));

export function hash(k) { let h = (k * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; return (h ^ (h >>> 15)) >>> 0; }

// Tree look per zone: 0 oak (forest floor), 1 mossy giant (deep forest),
// 2 birch-like (windows), 3 bare (above the trees). Trunks crossfade over
// ~30 m around each boundary; a branch takes the nearest style.
const TREE_BOUNDS = [12000, 25000, 40000];
const TREE_FADE = 1500;
export function treeStyleAt(y) {
  for (let i = 0; i < TREE_BOUNDS.length; i++) {
    const b = TREE_BOUNDS[i];
    if (y < b - TREE_FADE) return { a: i, b: i, t: 0 };
    if (y < b + TREE_FADE) return { a: i, b: i + 1, t: smoothstep(invLerp(b - TREE_FADE, b + TREE_FADE, y)) };
  }
  return { a: TREE_BOUNDS.length, b: TREE_BOUNDS.length, t: 0 };
}
export const treeStyleIndexAt = (y) => { const s = treeStyleAt(y); return s.t < 0.5 ? s.a : s.b; };
