import { W, SAFE_GAP, BEAT } from './config.js';
import { Platform } from './platforms.js';
import { Crow, Spider } from './enemies.js';
import { Sun, Lantern, Heart } from './pickups.js';
import { lerp, invLerp, clamp } from './util.js';

// Procedural level built from "rows" (the original's beats). Each row holds
// one or two platforms picked from fixed slots: a branch on the left tree,
// a branch on the right tree, a ribbon on the braid, or a plank swing hung
// between the trees. Difficulty is a smooth function of altitude.

const TIERS = [
  { y: 0,     gap: [0.75, 1.0],  dry: 0.00, crow: 0.00, spider: 0.00, swing: 0.00, bow: 0.04, sway: 0,   crowSpeed: [130, 190], lantern: 0.10, sun: 0.40, double: 0.35 },
  { y: 2500,  gap: [0.85, 1.2],  dry: 0.10, crow: 0.10, spider: 0.00, swing: 0.08, bow: 0.05, sway: 18,  crowSpeed: [160, 230], lantern: 0.10, sun: 0.40, double: 0.30 },
  { y: 7000,  gap: [1.0, 1.45],  dry: 0.18, crow: 0.17, spider: 0.10, swing: 0.12, bow: 0.06, sway: 42,  crowSpeed: [190, 270], lantern: 0.11, sun: 0.40, double: 0.26 },
  { y: 13000, gap: [1.1, 1.65],  dry: 0.26, crow: 0.23, spider: 0.18, swing: 0.14, bow: 0.06, sway: 70,  crowSpeed: [230, 330], lantern: 0.12, sun: 0.40, double: 0.22 },
  { y: 21000, gap: [1.25, 1.8],  dry: 0.33, crow: 0.28, spider: 0.24, swing: 0.15, bow: 0.07, sway: 100, crowSpeed: [270, 390], lantern: 0.12, sun: 0.40, double: 0.20 },
];

function tierAt(y) {
  // Linear interpolation between tier rows so difficulty ramps smoothly.
  let i = 0;
  while (i < TIERS.length - 1 && y >= TIERS[i + 1].y) i++;
  const a = TIERS[i], b = TIERS[Math.min(i + 1, TIERS.length - 1)];
  const t = a === b ? 0 : invLerp(a.y, b.y, y);
  const out = {};
  for (const k of Object.keys(a)) {
    if (Array.isArray(a[k])) out[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)];
    else out[k] = lerp(a[k], b[k], t);
  }
  out.index = i + t;
  return out;
}

export class Level {
  constructor(world, rng) {
    this.world = world;
    this.rng = rng;
  }

  reset() {
    this.nextY = 300;
    this.lastSafeY = 0;        // the ground
    this.pendingGapCap = null; // cap the next gap after an all-dry row
    this.rowIndex = 0;
    this.lastLayout = null;
    this.rowsSinceHeart = 0;
    this.lastHadCenter = true;   // the ground counts: no swing right above the start
    this.lastBowY = -1e9;
  }

  get difficulty() { return tierAt(this.world.player.maxY); }

  generateUpTo(yTop) {
    while (this.nextY < yTop) this.makeRow();
  }

  pickLayout(T, y) {
    const r = this.rng;
    const items = [
      ['branchL', 1.0], ['branchR', 1.0], ['ribbon', 1.1],
      ['branchL+ribbon', T.double * 0.7], ['branchR+ribbon', T.double * 0.7], ['branchL+branchR', T.double * 0.6],
      ['swing', T.swing], ['bow', T.bow],
    ];
    let layout = r.weighted(items);
    // avoid the same single slot three times in a row (keeps the climb zig-zagging)
    if (layout === this.lastLayout && this.rowIndex > 1 && r.chance(0.7)) layout = r.weighted(items.filter((it) => it[0] !== layout));
    // A swing is solid from below: never put one straight above a platform in
    // the center lane (you would bounce into its underside), nor within a
    // bow's spring height.
    if (layout === 'swing' && (this.lastHadCenter || y - this.lastBowY < 1900)) layout = r.pick(['branchL', 'branchR']);
    this.lastLayout = layout;
    return layout;
  }

  makeRow() {
    const r = this.rng;
    const T = tierAt(this.nextY);
    const y = this.nextY;
    const layout = this.pickLayout(T, y);
    const kinds = layout.split('+');
    this.lastHadCenter = kinds.some((k) => k === 'ribbon' || k === 'bow' || k === 'swing');
    if (kinds.includes('bow')) this.lastBowY = y;
    const platforms = [];
    const canBeDry = kinds.length > 1 || (y - this.lastSafeY) + T.gap[1] * BEAT <= SAFE_GAP;
    let safe = false;
    for (const kind of kinds) {
      const opts = {};
      if ((kind === 'branchL' || kind === 'branchR') && canBeDry && r.chance(T.dry)) opts.dry = true;
      const p = new Platform(kind, y + (kinds.length > 1 ? r.int(-24, 24) : 0), opts);
      platforms.push(p);
      if (!opts.dry) safe = true;
    }
    if (!safe && kinds.length === 1 && (y - this.lastSafeY) + T.gap[1] * BEAT > SAFE_GAP) {
      // Reachability: a lone dry branch needs a reachable follow-up row.
      platforms[0].dry = false; safe = true;
    }
    for (const p of platforms) this.world.platforms.push(p);
    if (safe) this.lastSafeY = y;

    // --- enemies -----------------------------------------------------------
    let gapMin = T.gap[0] * BEAT, gapMax = T.gap[1] * BEAT;
    if (!safe) gapMax = Math.min(gapMax, SAFE_GAP - (y - this.lastSafeY));
    gapMax = Math.max(gapMax, gapMin);
    const gap = r.range(gapMin, gapMax);

    if (y > 2200 && r.chance(T.crow)) {
      const dir = r.sign();
      const cy = y + gap * r.range(0.4, 0.7);
      const cx = r.range(-W / 2, W / 2);
      const track = clamp((T.index - 1.5) / 2.5, 0, 1);
      this.world.enemies.push(new Crow(cx, cy, dir, r.range(T.crowSpeed[0], T.crowSpeed[1]), track));
    }
    if (y > 6500 && r.chance(T.spider)) {
      const branch = platforms.find((p) => p.kind === 'branchL' || p.kind === 'branchR');
      if (branch) {
        const sx = branch.x + r.range(-50, 50);
        const lunge = clamp((T.index - 2) / 2, 0, 1);
        this.world.enemies.push(new Spider(sx, y - 28, 50, r.range(180, 300), r.range(1.4, 2.4), lunge));
      }
    }

    // --- pickups -----------------------------------------------------------
    if (r.chance(T.sun)) {
      const n = r.int(3, 5);
      const cx = r.range(-W / 2 + 120, W / 2 - 120);
      const baseY = y + gap * 0.5;
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1;
        this.world.pickups.push(new Sun(cx + t * 110, baseY + (1 - t * t) * 70));
      }
    }
    if (r.chance(T.lantern)) this.world.pickups.push(new Lantern(r.range(-W / 2 + 100, W / 2 - 100), y + 80));
    this.rowsSinceHeart++;
    if (this.rowsSinceHeart > 14 && this.world.player.hearts < 3 && r.chance(0.22)) {
      this.world.pickups.push(new Heart(r.range(-200, 200), y + gap * 0.5));
      this.rowsSinceHeart = 0;
    }

    this.nextY = y + gap;
    this.rowIndex++;
  }
}
