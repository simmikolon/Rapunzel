import { W, SAFE_GAP, BEAT, LAYER_GAP_CAP, LAYER_GAP_CAP_DRY, CAMERA_PLAYER_OFFSET, CAMERA_START_Y, GRAVITY, JUMP_VY, WEAK_JUMP_VY, SPRING_VY } from './config.js';
import { Platform } from './platforms.js';
import { Crow, Spider, Squirrel } from './enemies.js';
import { Sun, Lantern, Heart } from './pickups.js';
import { lerp, invLerp, clamp } from './util.js';
import { treeStyleIndexAt } from './altitude.js';

// Procedural level built from "rows" (the original's beats). Each row holds
// one or two platforms picked from fixed slots: a branch on the left tree,
// a branch on the right tree, a ribbon on the braid, or a plank swing hung
// between the trees. Difficulty is a smooth function of altitude.

// Difficulty keyframes by altitude (px; 100 px = 1 m). The ramp used to
// peak at 210 m and stay there, which capped good runs around 300 m; it now
// stretches to 700 m with a final step beyond.
const TIERS = [
  { y: 0,     gap: [0.75, 1.0],  dry: 0.00, short: 0.00, stub: 0.00, long: 0.10, crow: 0.00, spider: 0.00, swing: 0.00, bow: 0.04, sway: 0,   crowSpeed: [130, 190], lantern: 0.10, sun: 0.40, double: 0.35, squirrel: 0.00 },
  { y: 3500,  gap: [0.85, 1.2],  dry: 0.10, short: 0.08, stub: 0.00, long: 0.12, crow: 0.10, spider: 0.00, swing: 0.08, bow: 0.05, sway: 18,  crowSpeed: [160, 230], lantern: 0.10, sun: 0.40, double: 0.30, squirrel: 0.00 },
  { y: 10000, gap: [1.0, 1.45],  dry: 0.18, short: 0.16, stub: 0.07, long: 0.12, crow: 0.17, spider: 0.10, swing: 0.12, bow: 0.06, sway: 42,  crowSpeed: [190, 270], lantern: 0.11, sun: 0.40, double: 0.26, squirrel: 0.24 },
  { y: 22000, gap: [1.1, 1.65],  dry: 0.26, short: 0.22, stub: 0.12, long: 0.12, crow: 0.23, spider: 0.18, swing: 0.14, bow: 0.06, sway: 70,  crowSpeed: [230, 330], lantern: 0.12, sun: 0.40, double: 0.22, squirrel: 0.30 },
  { y: 40000, gap: [1.25, 1.8],  dry: 0.33, short: 0.26, stub: 0.16, long: 0.12, crow: 0.28, spider: 0.24, swing: 0.15, bow: 0.07, sway: 100, crowSpeed: [270, 390], lantern: 0.12, sun: 0.40, double: 0.20, squirrel: 0.32 },
  { y: 70000, gap: [1.3, 1.9],   dry: 0.36, short: 0.28, stub: 0.20, long: 0.12, crow: 0.32, spider: 0.28, swing: 0.15, bow: 0.07, sway: 115, crowSpeed: [300, 420], lantern: 0.12, sun: 0.40, double: 0.18, squirrel: 0.34 },
];

// Zones: altitude bands that scale each element's spawn chance, so new
// elements arrive as a place changes rather than piling on top of each
// other. An element's rule is: tier chance x pacing x zone multiplier,
// starting at the band where its multiplier first becomes positive.
export const ZONES = [
  { name: 'forest floor', from: 0,     mul: { crow: 1.0, spider: 1.0, squirrel: 0.0, stub: 0.0 } },
  { name: 'deep forest',  from: 12000, mul: { crow: 0.6, spider: 1.0, squirrel: 1.0, stub: 1.0 } },
  { name: 'windows',      from: 25000, mul: { crow: 0.8, spider: 0.7, squirrel: 0.6, stub: 1.0 } },
  { name: 'above the trees', from: 40000, mul: { crow: 1.2, spider: 0.3, squirrel: 0.3, stub: 0.7 } },
];
export function zoneAt(y) {
  let z = ZONES[0];
  for (const c of ZONES) if (y >= c.from) z = c;
  return z;
}
const zoneMul = (y, element) => { const m = zoneAt(y).mul[element]; return m == null ? 1 : m; };

// Pacing waves: every PACE_CYCLE px the climb builds up to a peak and then
// gets a breather (no enemies, no crumbling branches, closer platforms,
// more suns) so the pressure never becomes a flat plateau.
const PACE_CYCLE = 9000;        // 90 m
const PACE_BREATHER = 1500;     // the last 15 m of each cycle
export function pacingAt(y) {
  const phase = ((y % PACE_CYCLE) + PACE_CYCLE) % PACE_CYCLE;
  if (phase >= PACE_CYCLE - PACE_BREATHER) return { breather: true, enemy: 0, dry: 0, short: 0, long: 1.6, gap: 0.85, sun: 1.6, lantern: 1.5 };
  const t = phase / (PACE_CYCLE - PACE_BREATHER);          // 0 at the start of a cycle, 1 at the peak
  return { breather: false, enemy: 0.75 + 0.45 * t, dry: 0.8 + 0.4 * t, short: 0.8 + 0.4 * t, long: 1, gap: 1, sun: 1, lantern: 1 };
}

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
    this.forceLen = null;        // dev: every branch gets this length class
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
    this.prevRowY = 0;           // the ground
    this.prevRowApex = JUMP_VY * JUMP_VY / (2 * GRAVITY);
    this.modelCam = CAMERA_START_Y; // highest view bottom the climb so far implies (never descends)
    this.nextLayout = null;      // layout already chosen for the next row
    this.lastStubRow = -9;       // row index of the last stub branch
  }

  get difficulty() { return tierAt(this.world.player.maxY); }
  pacingAt(y) { return pacingAt(y); }

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

  // Length class of a branch in a row of `kinds`. Stubs and short branches
  // are the challenge: never in a breather, never two stubs within two rows,
  // and a stub stands alone in a row only from tier 2.5 with the last safe
  // row right below it (a miss is a bounce back, not a fall). Long branches
  // are relief and only appear in single-branch rows (never at a ribbon's
  // height, never two at one height).
  pickLen(T, P, y, kinds) {
    const r = this.rng;
    if (this.forceLen) return this.forceLen;
    const single = kinds.length === 1;
    const stubOk = this.rowIndex - this.lastStubRow > 1 && (!single || (T.index >= 2.5 && y - this.lastSafeY <= 1.2 * BEAT));
    if (stubOk && r.chance(T.stub * P.short * zoneMul(y, 'stub'))) { this.lastStubRow = this.rowIndex; return 'stub'; }
    if (r.chance(T.short * P.short * zoneMul(y, 'short'))) return 'short';
    if (single && r.chance(T.long * P.long * zoneMul(y, 'long'))) return 'long';
    return 'normal';
  }

  // A squirrel on a healthy branch of this row, somewhere along it. Only
  // normal and long branches have room for a patrol; long ones first.
  spawnSquirrel(platforms) {
    const r = this.rng;
    const branch = platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && p.len === 'long')
      || platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && p.len === 'normal');
    if (!branch) return null;
    const T = tierAt(branch.y);
    const sq = new Squirrel(branch, r.range(-60, 60), r.range(95, 150), clamp((T.index - 1.5) / 2.5, 0.3, 1));
    this.world.enemies.push(sq);
    return sq;
  }

  makeRow() {
    const r = this.rng;
    const T = tierAt(this.nextY);
    const P = pacingAt(this.nextY);
    const y = this.nextY;
    const layout = this.nextLayout || this.pickLayout(T, y);
    this.nextLayout = null;
    const kinds = layout.split('+');
    this.lastHadCenter = kinds.some((k) => k === 'ribbon' || k === 'bow' || k === 'swing');
    if (kinds.includes('bow')) this.lastBowY = y;
    const front = kinds.some((k) => k !== 'ribbon' && k !== 'bow');
    // Ribbons live on the slower tower layer. Their layer height is chosen so
    // that they are exactly at `y` in the prince's plane at the moment he
    // arrives, i.e. with the camera where it will be after bouncing off the
    // previous row (view bottom = previous apex - player offset). The camera
    // only ever climbs, so the model keeps the highest value so far (a bow
    // spring lifts it well above the rows that follow).
    this.modelCam = Math.max(this.modelCam, this.prevRowY + this.prevRowApex - CAMERA_PLAYER_OFFSET);
    const arrivalCam = this.modelCam;
    const platforms = [];
    const canBeDry = kinds.length > 1 || (y - this.lastSafeY) + T.gap[1] * BEAT <= SAFE_GAP;
    let safe = false;
    for (const kind of kinds) {
      const opts = {};
      if (kind === 'branchL' || kind === 'branchR') {
        const len = this.pickLen(T, P, y, kinds);
        opts.len = len;
        if (len === 'normal' || len === 'long') {          // stubs and short branches are never dry
          if (canBeDry && r.chance(T.dry * P.dry)) opts.dry = true;
          opts.lenScale = r.range(0.88, 1.12);
        }
        opts.variant = len === 'stub' ? r.int(0, 1) : r.int(0, 5);
        opts.style = treeStyleIndexAt(y);
        opts.tint = r.pick([null, null, '#f2ece4', '#e4ddd2', '#d8d4cc', '#e8e0d0']);
      }
      const py = y + (kinds.length > 1 ? r.int(-16, 16) : 0);
      if (kind === 'ribbon' || kind === 'bow') opts.ly = Platform.worldToLayer(py, Platform.layerFactor(kind), arrivalCam);
      const p = new Platform(kind, py, opts);
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
    let gapMin = T.gap[0] * BEAT * P.gap, gapMax = T.gap[1] * BEAT * P.gap;
    if (!safe) gapMax = Math.min(gapMax, SAFE_GAP - (y - this.lastSafeY));
    // Decide the next row's layout now: from a front-plane row up to a row
    // that only has tower-layer platforms the effective gap grows while the
    // camera climbs, so that gap is kept short.
    const nextLayout = this.pickLayout(tierAt(y + gapMin), y + gapMin);
    const nextTowerOnly = nextLayout.split('+').every((k) => k === 'ribbon' || k === 'bow');
    if (front && nextTowerOnly) gapMax = Math.min(gapMax, platforms.some((p) => p.dry) ? LAYER_GAP_CAP_DRY : LAYER_GAP_CAP);
    gapMax = Math.max(gapMax, gapMin);
    const gap = r.range(gapMin, gapMax);
    this.nextLayout = nextLayout;
    const bounceVy = kinds.includes('bow') ? SPRING_VY : platforms.every((p) => p.dry) ? WEAK_JUMP_VY : JUMP_VY;
    this.prevRowY = y; this.prevRowApex = bounceVy * bounceVy / (2 * GRAVITY);

    if (y > 2200 && r.chance(T.crow * P.enemy * zoneMul(y, 'crow'))) {
      const dir = r.sign();
      const cy = y + gap * r.range(0.4, 0.7);
      const cx = r.range(-W / 2, W / 2);
      const track = clamp((T.index - 1.5) / 2.5, 0, 1);
      this.world.enemies.push(new Crow(cx, cy, dir, r.range(T.crowSpeed[0], T.crowSpeed[1]), track));
    }
    if (y > 6500 && r.chance(T.spider * P.enemy * zoneMul(y, 'spider'))) {
      const branch = platforms.find((p) => p.kind === 'branchL' || p.kind === 'branchR');
      if (branch) {
        const sx = branch.x + r.range(-50, 50);
        const lunge = clamp((T.index - 2) / 2, 0, 1);
        this.world.enemies.push(new Spider(sx, y - 28, 50, r.range(180, 300), r.range(1.4, 2.4), lunge));
      }
    }

    if (r.chance(T.squirrel * P.enemy * zoneMul(y, 'squirrel'))) this.spawnSquirrel(platforms);

    // --- pickups -----------------------------------------------------------
    // A stub is worth aiming for: most carry a small arc of suns.
    const stub = platforms.find((p) => p.len === 'stub');
    if (stub && r.chance(kinds.length > 1 ? 0.7 : 0.4)) {
      for (let i = 0; i < 3; i++) { const t = i - 1; this.world.pickups.push(new Sun(stub.x + t * 44, stub.y + 70 + (1 - t * t) * 30)); }
    }
    if (r.chance(Math.min(0.9, T.sun * P.sun))) {
      const n = r.int(3, 5);
      const cx = r.range(-W / 2 + 120, W / 2 - 120);
      const baseY = y + gap * 0.5;
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1;
        this.world.pickups.push(new Sun(cx + t * 110, baseY + (1 - t * t) * 70));
      }
    }
    // A lantern likes a long branch: a little likelier there, and it sits on it.
    const longBranch = platforms.find((p) => p.len === 'long' && !p.dry);
    if (r.chance(T.lantern * P.lantern * (longBranch ? 1.6 : 1))) {
      this.world.pickups.push(new Lantern(longBranch ? longBranch.x + longBranch.def.dir * 60 : r.range(-W / 2 + 100, W / 2 - 100), y + 80));
    }
    // Hearts: a chance once one is missing, and a pity timer that guarantees
    // one before long when the prince is down to his last heart.
    this.rowsSinceHeart++;
    const hearts = this.world.player.hearts;
    const pity = hearts <= 1 && this.rowsSinceHeart > 8;
    if (pity || (this.rowsSinceHeart > 12 && hearts < 3 && r.chance(0.25))) {
      this.world.pickups.push(new Heart(r.range(-200, 200), y + gap * 0.5));
      this.rowsSinceHeart = 0;
    }

    this.nextY = y + gap;
    this.rowIndex++;
  }
}
