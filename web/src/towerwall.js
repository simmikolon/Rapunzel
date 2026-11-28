import { hash } from './altitude.js';
import { TILE_H } from './art/tiles.js';
import { TOWER_AREAS } from './art/tower.js';
import { PARALLAX_TOWER } from './config.js';
import { RNG } from './util.js';
import { WINDOW_FIRST, WINDOW_STOREY } from './windows.js';

// What the tower's wall is like at a height (art/tower.js draws the looks,
// background.js lays them). A stretch of it is a section, and a section is
// a recipe with two parts that know nothing of each other: what the wall is
// built of there (its `skin`: old big stones, crumbling, under repair; none:
// the plain bricks) and what grows on it (its `growth`: ivy, moss, briar
// roses; none). Each part is an area as art/tower.js has them (its `enter`
// tile, its loop once or more, its `leave` tile), and what grows is laid
// over what is built, whatever that is. So the six looks are fifteen walls:
// ivy on old stone, moss in a crumbling wall, roses over the masons' site.
// The two parts of a section do not begin and end together: ivy does not
// know where the masonry changes.
//
// Two more parts go by storeys and not by tiles (a storey is a window,
// windows.js: one every 440 px of the tower's layer, left and right in
// turn): what hangs on the wall's face on the side that has no window
// (`hung`: lanterns, banners) and what stands out at its edges (`edge`:
// gargoyles at the ends of the string courses). Each comes in runs of a few
// storeys with none for a while between them, and knows nothing of the
// other parts either (art/hung.js draws them).
//
// A wall is anything with `skinAt(k)` and `growthAt(k)` for a tile k (a tile
// is about 2.1 m of climb): null where that part is none, else { kind, tile,
// i, n } with `tile` 'enter', 'leave' or the loop's index, `i` the tile's
// number in its area (0 is `enter`) and `n` which of the areas of its look
// it is, counted from the foot (the first briar has red roses, the next
// white ones); and with `hungAt(i)` and `edgeAt(i)` for a storey i: null or
// { kind, j, n } with `j` the storey's number in its run and `n` which run
// of its kind it is (a run of banners is the witch's, the next the
// guards'). There are three kinds of wall:
//   TowerPlan    the endless tower's: rolled from the round's seed, so every
//                round climbs another tower. Between two sections the wall
//                is plain for a while (GAP); what a height can have is in
//                RECIPES (ivy and moss down in the forest, crumbling walls,
//                repairs and old stone higher up); no section has the skin
//                or the growth of the one before.
//   stageWall    a stage's (stages.js): one recipe for its whole length
//   forcedWall   dev (?wall=stone+ivy): one recipe all the way up
// The tower's foot is not rolled: old stone from the lawn up, and above it
// plain wall for as far as one sees from the lawn (FIRST), so the title and
// a round's first picture show the same wall whatever comes above.
const GAP = [5, 11];                // tiles of plain wall between two sections
const FIRST = 10;                   // the lowest tile a section may begin at: above the lawn's picture on the tallest screen
const LOOPS = { ivy: [1, 2], worn: [2, 3], stone: [2, 4], moss: [2, 4], mended: [1, 2], briar: [1, 2] };   // how often an area's loop is laid, at the least and at the most
const OFFSET = [-2, 3];             // where a section has both parts: its growth begins this many tiles above its skin's first one (from .. to)
const FOOT_TILES = [0, 1, 2, 'leave'];      // the tower's foot: old stone from the lawn up
export const SKINS = Object.keys(TOWER_AREAS).filter((k) => !TOWER_AREAS[k].overlay);
export const GROWTHS = Object.keys(TOWER_AREAS).filter((k) => TOWER_AREAS[k].overlay);
export const HUNGS = ['lanterns', 'banners'], EDGES = ['gargoyles'];
// The parts that go by storeys: how many storeys a run is long, and by the height the prince passes it at (px) how
// many storeys are bare before it and the weights of its kinds. There is more of both the higher one gets: above the
// trees the wall stands free before the sky, and is seen.
const STOREYS = {
  hung: { run: [3, 7], by: [
    { below: 12000, gap: [5, 10], w: { lanterns: 2, banners: 1 } },
    { below: 25000, gap: [4, 8], w: { lanterns: 3, banners: 1 } },
    { below: 40000, gap: [3, 6], w: { lanterns: 2, banners: 2 } },
    { below: Infinity, gap: [2, 5], w: { lanterns: 3, banners: 3 } },
  ] },
  edge: { run: [3, 7], by: [
    { below: 25000, gap: [6, 12], w: { gargoyles: 1 } },
    { below: 40000, gap: [4, 9], w: { gargoyles: 1 } },
    { below: Infinity, gap: [3, 6], w: { gargoyles: 1 } },
  ] },
};
const FIRST_STOREY = Math.ceil((FIRST * TILE_H - WINDOW_FIRST) / WINDOW_STOREY);      // the lowest storey a run may begin at: above the lawn's picture
const storeyY = (i) => (WINDOW_FIRST + i * WINDOW_STOREY) / PARALLAX_TOWER;           // about the height the prince is at when he passes storey i

// What a section can be, by the height the prince passes it at (px): the
// weights of its skin and of its growth. A recipe's weight is the two
// multiplied, times how well the pair goes together (PAIRS, and a band's
// own `pairs` before those; 1 where nothing is said).
const RECIPES = [
  { below: 12000, skin: { plain: 6, stone: 2, worn: 1, mended: 2 }, growth: { none: 2, ivy: 5, moss: 3, briar: 5 } },      // the forest floor
  { below: 25000, skin: { plain: 5, stone: 2, worn: 2, mended: 2 }, growth: { none: 2, ivy: 5, moss: 4, briar: 4 } },      // the deep forest
  { below: 40000, skin: { plain: 3, stone: 3, worn: 3, mended: 3 }, growth: { none: 4, ivy: 3, moss: 2, briar: 3 } },      // the windows
  // above the trees: the sun is on the wall, so moss is only where old stone or a crumbling wall holds the damp
  { below: Infinity, skin: { plain: 2, stone: 3, worn: 4, mended: 3 }, growth: { none: 5, ivy: 2, moss: 2, briar: 3 }, pairs: { 'plain+moss': 0 } },
];
// Old walls are what things like to grow on; a site somebody works on is kept clear of them, mostly.
const PAIRS = { 'stone+ivy': 1.3, 'stone+moss': 1.4, 'stone+briar': 1.2, 'worn+ivy': 1.3, 'worn+moss': 1.4, 'mended+ivy': 0.7, 'mended+moss': 0.5, 'mended+briar': 0.4 };

// A recipe for a section at height y: { skin, growth } (null where that part is none), never both none, by the
// stream `r`. `last`: the recipe before it, whose skin and whose growth it does not have again. `keep`: parts that are
// given ({ skin } or { growth }, null for none), so that only the other is rolled. `full`: a recipe with both parts.
function roll(r, y, last, keep = {}, full = false) {
  const Z = RECIPES.find((z) => y < z.below), table = [];
  let sum = 0;
  for (const [s, ws] of Object.entries(Z.skin)) {
    for (const [g, wg] of Object.entries(Z.growth)) {
      const skin = s === 'plain' ? null : s, growth = g === 'none' ? null : g, key = s + '+' + g;
      if (keep.skin !== undefined ? skin !== keep.skin : last && skin && skin === last.skin) continue;
      if (keep.growth !== undefined ? growth !== keep.growth : last && growth && growth === last.growth) continue;
      if (full ? !skin || !growth : !skin && !growth && keep.skin === undefined && keep.growth === undefined) continue;
      const pair = Z.pairs && Z.pairs[key] != null ? Z.pairs[key] : PAIRS[key] != null ? PAIRS[key] : 1;
      const w = (keep.skin !== undefined ? 1 : ws) * (keep.growth !== undefined ? 1 : wg) * pair;
      if (w > 0) { table.push([skin, growth, w]); sum += w; }
    }
  }
  if (!table.length) return { skin: keep.skin || null, growth: keep.growth || null };
  let pick = r.next() * sum;
  for (const [skin, growth, w] of table) { if (pick < w) return { skin, growth }; pick -= w; }
  return { skin: table[0][0], growth: table[0][1] };
}

// An area's tiles in the order they are laid: `enter`, its loop `loops` times, `leave`.
function tilesOf(kind, loops) {
  const M = TOWER_AREAS[kind].loop, tiles = ['enter'];
  for (let j = 0; j < loops * M; j++) tiles.push(j % M);
  tiles.push('leave');
  return tiles;
}
// Lay `tiles` of the look `kind` into `track` (the cells of one part by tile) from tile `from` up; returns the first tile above them.
function lay(track, kind, from, tiles, n) {
  tiles.forEach((tile, i) => { track[from + i] = { kind, tile, i, n }; });
  return from + tiles.length;
}

// One part that goes by storeys (`spec`: STOREYS.hung or .edge), rolled by the stream `r`: its cell at a storey, or null.
class Runs {
  constructor(r, spec) { this.r = r; this.spec = spec; this.cells = []; this.planned = 0; this.count = {}; this.last = null; }
  at(i) {
    if (i < 0) return null;
    while (this.planned <= i) {
      const r = this.r, from = Math.max(FIRST_STOREY, this.planned + r.int(...this.spec.by.find((z) => storeyY(this.planned) < z.below).gap));
      const table = Object.entries(this.spec.by.find((z) => storeyY(from) < z.below).w).filter(([kind]) => kind !== this.last || Object.keys(this.spec.by[0].w).length < 2);
      const kind = r.weighted(table), n = this.count[kind] || 0, len = r.int(this.spec.run[0], this.spec.run[1]);
      this.count[kind] = n + 1; this.last = kind;
      for (let j = 0; j < len; j++) this.cells[from + j] = { kind, j, n };
      this.planned = from + len;
    }
    return this.cells[i] || null;
  }
}

export class TowerPlan {
  constructor(seed = (Math.random() * 0x7fffffff) | 0) {
    this.r = new RNG(seed);
    this.hung = new Runs(new RNG(hash(seed + 1)), STOREYS.hung);      // (streams of their own: a seed's sections are the same whatever hangs on them)
    this.edge = new Runs(new RNG(hash(seed + 2)), STOREYS.edge);
    this.skins = []; this.growths = [];      // the cells of either part, by tile (a hole where it is none)
    this.sections = [];                      // { from, to, skin, growth }: the tiles it begins at and ends under, bottom to top
    this.count = { stone: 1 };               // how many areas of a look there are so far (the foot is the first of old stone)
    this.planned = lay(this.skins, 'stone', 0, FOOT_TILES, 0);      // every tile below this one is planned
    this.last = { skin: 'stone', growth: null };                    // (so no old stone right above the foot)
  }
  area(track, kind, from) {
    const [lo, hi] = LOOPS[kind], n = this.count[kind] || 0;
    this.count[kind] = n + 1;
    return lay(track, kind, from, tilesOf(kind, this.r.int(lo, hi)), n);
  }
  planUpTo(k) {
    while (this.planned <= k) {
      const r = this.r, from = Math.max(FIRST, this.planned + r.int(GAP[0], GAP[1]));
      const R = roll(r, (from * TILE_H) / PARALLAX_TOWER, this.last);      // (by about the height the prince is at when he passes it)
      let first = from, to = from;
      if (R.skin) to = this.area(this.skins, R.skin, from);
      if (R.growth) { first = R.skin ? Math.max(FIRST, from + r.int(OFFSET[0], OFFSET[1])) : from; to = Math.max(to, this.area(this.growths, R.growth, first)); }
      this.sections.push({ from: Math.min(from, first), to, skin: R.skin, growth: R.growth });
      this.last = R; this.planned = to;
    }
  }
  skinAt(k) { if (k < 0) return null; this.planUpTo(k); return this.skins[k] || null; }
  growthAt(k) { if (k < 0) return null; this.planUpTo(k); return this.growths[k] || null; }
  hungAt(i) { return this.hung.at(i); }
  edgeAt(i) { return this.edge.at(i); }
  // The section tile k is in, or null where the wall is plain.
  sectionAt(k) { this.planUpTo(k); for (let i = this.sections.length - 1; i >= 0; i--) { const s = this.sections[i]; if (k >= s.from) return k < s.to ? s : null; } return null; }
}

// One look in stretches from tile k0 up (its `enter` tile, its loop once or
// more, its `leave` tile) with two to four tiles of plain wall between them,
// so that it is a wall something has happened to and not a pattern: the
// cell at a tile, or null. `n` is passed on (the roses' colour).
function stretches(kind, k0, seed, n) {
  if (!TOWER_AREAS[kind]) return () => null;
  const track = [], [lo, hi] = LOOPS[kind];
  let next = k0 + 1 + (hash(seed * 13 + 3) % 2), count = 0;
  return (k) => {
    if (k < k0) return null;
    while (next <= k) {
      const h = hash(seed * 7 + count++ * 31 + 5);
      next = lay(track, kind, next, tilesOf(kind, lo + (h % (hi - lo + 1))), n) + 2 + ((h >>> 8) % 3);
    }
    return track[k] || null;
  };
}
const footAt = (k) => (k >= 0 && k < FOOT_TILES.length ? FOOT_CELLS[k] : null);
const FOOT_CELLS = FOOT_TILES.map((tile, i) => ({ kind: 'stone', tile, i, n: 0 }));
// A part that goes by storeys, the same kind at every storey from i0 up (a stage's): its cell at a storey, or null.
function everyStorey(kind, i0, n) {
  if (!kind) return () => null;
  const cells = [];
  return (i) => (i < i0 ? null : cells[i - i0] || (cells[i - i0] = { kind, j: i - i0, n }));
}
// The wall of one stage (stages.js): its recipe from tile k0 up, the two
// parts of the wall itself in stretches of their own, so that what grows
// comes and goes over what is built, and what hangs on it and stands out
// from it at every storey. `skin` 'foot' is the plain wall over the tower's
// foot of old stone; any other name that is no look is plain wall. `n`: the
// roses' colour; the banners are the witch's and the guards' in turn, stage
// by stage.
export function stageWall({ skin, growth, hung, edge }, k0, seed, n = 0) {
  const both = TOWER_AREAS[skin] && TOWER_AREAS[growth], i0 = Math.ceil((k0 * TILE_H - WINDOW_FIRST) / WINDOW_STOREY) + 1;
  return {
    skinAt: skin === 'foot' ? footAt : stretches(skin, k0, seed, n), growthAt: stretches(growth, k0, both ? seed + 101 : seed, n),
    hungAt: everyStorey(HUNGS.includes(hung) && hung, i0, seed), edgeAt: everyStorey(EDGES.includes(edge) && edge, i0, seed),
  };
}
// A stage's recipe (stages.js THEMES: `wall`, `growth`, `roses`, `hung`,
// `edge`): as it is written down the first time a theme is climbed. When a
// theme comes round again (`lap` 1 and up: the stages go round and round
// after the last one), what it leaves open is rolled from what its height
// can have, by the round's seed: of the wall's two parts the open one is
// never left open then (the ivy wall is on old stone, or on a crumbling
// wall, or the masons have been at it), and something hangs on it or
// stands out from it in two stages of three.
export function stageRecipe(st, seed) {
  const R = { skin: st.wall || null, growth: st.growth || null, roses: st.roses || 0, hung: st.hung || null, edge: st.edge || null };
  if (!st.lap || R.skin === 'foot') return R;
  const r = new RNG(hash(seed + st.n * 577 + 9));
  if (!(R.skin && R.growth)) {
    const got = roll(r, st.from, null, R.skin ? { skin: R.skin } : R.growth ? { growth: R.growth } : {}, true);
    if (got.growth === 'briar' && R.growth !== 'briar') R.roses = r.int(0, 2);
    R.skin = got.skin; R.growth = got.growth;
  }
  const open = (part, kind) => kind || (r.chance(0.65) ? r.weighted(Object.entries(STOREYS[part].by.find((z) => st.from < z.below).w)) : null);
  R.hung = open('hung', R.hung); R.edge = open('edge', R.edge);
  return R;
}
// One recipe all the way up (dev: ?wall=ivy, ?wall=stone+ivy+lanterns+gargoyles; any other name: plain wall): the
// loops' tiles in turn, and what goes by storeys at every storey (the banners the witch's and the guards' by fives).
const forced = (kind) => (k) => ({ kind, tile: ((k % TOWER_AREAS[kind].loop) + TOWER_AREAS[kind].loop) % TOWER_AREAS[kind].loop, i: k + 1, n: Math.max(0, Math.floor(k / TOWER_AREAS[kind].loop)) });
const forcedStorey = (kind) => (i) => ({ kind, j: i, n: Math.floor(i / 5) });
export function forcedWall(name) {
  const kinds = String(name).split(/[+ ]/), one = (list) => kinds.find((k) => list.includes(k));
  const skin = one(SKINS), growth = one(GROWTHS), hung = one(HUNGS), edge = one(EDGES);
  return { skinAt: skin ? forced(skin) : () => null, growthAt: growth ? forced(growth) : () => null, hungAt: hung ? forcedStorey(hung) : () => null, edgeAt: edge ? forcedStorey(edge) : () => null };
}
