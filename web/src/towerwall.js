import { hash } from './altitude.js';
import { TILE_H } from './art/tiles.js';
import { TOWER_AREAS } from './art/tower.js';
import { PARALLAX_TOWER } from './config.js';

// Which look the tower's wall has at a height (art/tower.js draws the looks,
// background.js lays them). Like the windows (windows.js) this is a fixed
// plan, the same in every round, so the tower is a place one gets to know:
// its foot is of old big stones; from there up, stretches of plain wall
// (GAP tiles) take turns with areas, each one of the looks, chosen by what
// suits the height (WEIGHTS: ivy and moss down in the forest, crumbling
// walls and old stone higher up, nothing that grows above the trees) and
// never the look of the area before. An area is its `enter` tile, its loop
// once or more, and its `leave` tile (art/tower.js TOWER_AREAS).
const GAP = [6, 14];                // tiles of plain wall between two areas (a tile is about 2.1 m of climb)
const WEIGHTS = [
  { below: 12000, w: { ivy: 6, moss: 3, worn: 1, stone: 1 } },      // the forest floor
  { below: 25000, w: { ivy: 6, moss: 3, worn: 2, stone: 1 } },      // the deep forest
  { below: 40000, w: { ivy: 3, moss: 1, worn: 3, stone: 3 } },      // the windows
  { below: Infinity, w: { ivy: 0, moss: 0, worn: 4, stone: 3 } },   // above the trees
];
const LOOPS = { ivy: [1, 2], worn: [2, 3], stone: [2, 4], moss: [2, 4] };   // how often an area's loop is laid, at the least and at the most
const FOOT = { kind: 'stone', from: 0, tiles: [0, 1, 2, 'leave'] };         // the tower's foot: old stone from the lawn up
// Which of all the plans these rules allow this tower has. Chosen by looking: ivy is the first thing one meets
// (from 21 m, so the youngest see it), and all four looks come before the trees end.
const PLAN = 15;

// The areas found so far, bottom to top: { kind, from, tiles } with `tiles` the tile of the look for from, from + 1, ...
const areas = [FOOT];
let planned = FOOT.tiles.length;    // every tile below this one is planned
function planUpTo(k) {
  while (planned <= k) {
    const i = areas.length, h = hash(i * 31 + PLAN);
    const from = planned + GAP[0] + (h % (GAP[1] - GAP[0] + 1));
    const y = (from * TILE_H) / PARALLAX_TOWER;                       // about the height the prince is at when he passes it
    const w = WEIGHTS.find((z) => y < z.below).w, last = areas[i - 1].kind;
    const table = Object.entries(w).filter(([kind, n]) => n > 0 && kind !== last);
    let pick = (h >>> 8) % table.reduce((s, e) => s + e[1], 0), kind = table[0][0];
    for (const [name, n] of table) { if (pick < n) { kind = name; break; } pick -= n; }
    const M = TOWER_AREAS[kind].loop, [lo, hi] = LOOPS[kind], loops = lo + ((h >>> 16) % (hi - lo + 1));
    const tiles = ['enter'];
    for (let n = 0; n < loops * M; n++) tiles.push(n % M);
    tiles.push('leave');
    areas.push({ kind, from, tiles });
    planned = from + tiles.length;
  }
}

// The wall at tile k: null where it is plain, else { kind, tile } with `tile` 'enter', 'leave' or the loop's index.
export function towerAreaAt(k) {
  if (k < 0) return null;
  planUpTo(k);
  for (let i = areas.length - 1; i >= 0; i--) {
    const a = areas[i];
    if (k >= a.from) return k < a.from + a.tiles.length ? { kind: a.kind, tile: a.tiles[k - a.from] } : null;
  }
  return null;
}
// A look all the way up (dev: ?wall=ivy): the loop's tiles in turn.
export const towerAreaForced = (kind, k) => ({ kind, tile: ((k % TOWER_AREAS[kind].loop) + TOWER_AREAS[kind].loop) % TOWER_AREAS[kind].loop });
