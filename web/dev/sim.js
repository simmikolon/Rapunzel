// Headless gameplay simulator: runs World.update() in a tight loop with a
// scripted player and collects attrition statistics. No rendering.
import { buildAllArt } from '../src/art/index.js';
import { World } from '../src/world.js';
import { GRAVITY, JUMP_VY, W, H, PX_PER_METER } from '../src/config.js';
import { RNG } from '../src/util.js';

const STEP = 1 / 120;

// Skill presets: how fast the scripted player reacts and how often it
// hesitates. "kid" is a cautious five-year-old, "good" an adult who knows
// the game.
const SKILLS = {
  kid: { reaction: 0.22, hesitate: 0.25, dodgeRange: 110 },
  good: { reaction: 0.10, hesitate: 0.05, dodgeRange: 150 },
};

class BotInput {
  constructor() { this.axis = 0; this.usingTilt = false; this.boostQueued = 0; }
  consumeBoost() { const v = this.boostQueued > 0; this.boostQueued = 0; return v; }
}

// The scripted player: steers toward the next platform, dodges enemies in
// its path and uses boosts to save a fall or (policy 'bold') to punch
// through an enemy above.
class Bot {
  constructor(world, input, skill, policy, rng) {
    this.world = world; this.input = input; this.s = SKILLS[skill]; this.policy = policy; this.rng = rng;
    this.timer = 0;
  }
  step(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = this.s.reaction;
    if (this.rng.next() < this.s.hesitate) return;   // hesitation: keep doing what we did
    const w = this.world, p = w.player, cam = w.cam;
    if (!p.alive) { this.input.axis = 0; return; }
    const plats = w.platforms.filter((q) => q.landable && q.kind !== 'ground' && q.y > cam.y - 50 && q.y < cam.top + 800);
    let above = null, below = null;
    for (const q of plats) {
      if (q.y > p.y + 10 && (!above || q.y < above.y)) above = q;
      if (q.y <= p.y + 10 && q.y > cam.y && (!below || q.y > below.y)) below = q;
    }
    // In a row with two platforms a player aims for the bigger one (a stub
    // next to a ribbon is the optional target, not the route).
    const widest = (ref) => { let best = ref; for (const q of plats) if (Math.abs(q.y - ref.y) <= 40 && q.w > best.w) best = q; return best; };
    if (above) above = widest(above);
    if (below) below = widest(below);
    const apexLeft = p.vy > 0 ? (p.vy * p.vy) / (2 * GRAVITY) : 0;
    let target = p.vy > 0 ? (above && above.y - p.y < apexLeft + 60 ? above : (below || above)) : (below || above);
    if (target && target.kind === 'swing' && target.y > p.y) target = { x: p.x < 0 ? -195 : 195, y: target.y, kind: 'side' };
    let axis = 0;
    if (target) {
      let dx = target.x - p.x; if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
      if (Math.abs(dx) > 16) axis = dx > 0 ? 1 : -1;
    }
    // Enemies in the way: within dodgeRange horizontally and in the body's vertical path.
    let threat = null;
    for (const e of w.enemies) {
      if (!e.alive || e.dead || !e.hurtful || e.phase === 'warn') continue;
      let dx = e.x - p.x; if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
      const dy = e.y - (p.y + 110);
      const ahead = p.vy > 0 ? (dy > -80 && dy < 360) : (dy < 80 && dy > -360);
      if (Math.abs(dx) < this.s.dodgeRange && ahead) { if (!threat || Math.abs(dy) < Math.abs(threat.dy)) threat = { e, dx, dy }; }
    }
    if (threat) {
      const e = threat.e;
      const canPunch = this.policy === 'bold' && p.boost >= 1 && p.vy > -200 && threat.dy > 0 && threat.dy < 300;
      if (e.kind === 'squirrel' && target && e.platform === target) {
        // A squirrel on the branch we are landing on: a bold player stomps it
        // (aim at it while falling from above), a cautious one lands on the
        // far end of the branch instead of fleeing the platform altogether.
        if (this.policy === 'bold' && p.vy < 0 && p.y > e.y + 10) axis = e.x > p.x + 8 ? 1 : e.x < p.x - 8 ? -1 : 0;
        else {
          const away = e.x > target.x ? target.left + 30 : target.right - 30;
          let dx = away - p.x; if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
          axis = Math.abs(dx) > 12 ? (dx > 0 ? 1 : -1) : 0;
        }
      } else if (canPunch) this.input.boostQueued++;
      else axis = threat.dx > 0 ? -1 : 1;               // steer away
    }
    // Save a fall: nothing landable below in view.
    if (p.vy < -300 && p.boost >= 1 && !below && p.boostCooldown <= 0) this.input.boostQueued++;
    // Reach a platform that is just out of bounce range.
    if (p.vy > 0 && p.vy < 500 && above && !below && above.y - p.y > apexLeft + 40 && p.boost >= 1) this.input.boostQueued++;
    this.input.axis = axis;
  }
}

function makeWorld(input) {
  const art = makeWorld.art || (makeWorld.art = buildAllArt());
  return new World({ art, input, best: 0 });
}

export function runOne({ seed = 1, skill = 'good', policy = 'bold', cap = 1500, maxTime = 900 } = {}) {
  const input = new BotInput();
  const world = makeWorld(input);
  world.reset(seed);
  world.start();
  const bot = new Bot(world, input, skill, policy, new RNG(seed * 7919 + 13));
  const stats = { seed, height: 0, cause: null, time: 0, hits: {}, hitsByBand: {}, hearts: 0, lanterns: 0, boosts: 0, stomps: 0, punches: 0, witches: 0 };
  const band = () => Math.floor(world.player.maxY / PX_PER_METER / 100) * 100;
  const origHurt = world.onPlayerHurt.bind(world);
  world.onPlayerHurt = (pl, src) => { const k = src.kind || 'unknown'; stats.hits[k] = (stats.hits[k] || 0) + 1; const b = band(); stats.hitsByBand[b] = (stats.hitsByBand[b] || 0) + 1; origHurt(pl, src); };
  const origCollect = world.collect.bind(world);
  world.collect = (k) => { if (k.kind === 'heart') stats.hearts++; if (k.kind === 'lantern') stats.lanterns++; origCollect(k); };
  const origBoost = world.onPlayerBoost.bind(world);
  world.onPlayerBoost = (pl) => { stats.boosts++; origBoost(pl); };
  const origStomp = world.onPlayerStomp.bind(world);
  world.onPlayerStomp = (pl, e) => { stats.stomps++; origStomp(pl, e); };
  if (world.onBoostPunch) { const o = world.onBoostPunch.bind(world); world.onBoostPunch = (pl, e) => { stats.punches++; o(pl, e); }; }
  let t = 0, witchSeen = 0;
  while (!world.over && t < maxTime && world.heightM < cap) {
    bot.step(STEP);
    world.update(STEP);
    t += STEP;
    const wc = world.enemies.filter((e) => e.kind === 'witch').length;
    if (wc > witchSeen) stats.witches++;
    witchSeen = wc;
  }
  stats.height = world.heightM;
  stats.time = t;
  stats.cause = world.over ? world.player.deathCause : (world.heightM >= cap ? 'cap' : 'timeout');
  if (stats.cause === 'fell') stats.fellBand = band();
  return stats;
}

export function runSims({ runs = 30, skill = 'good', policy = 'bold', cap = 1500, seedBase = 1 } = {}) {
  const all = [];
  for (let i = 0; i < runs; i++) all.push(runOne({ seed: seedBase + i, skill, policy, cap }));
  return summarize(all, { runs, skill, policy, cap });
}

function summarize(all, cfg) {
  const heights = all.map((s) => s.height).sort((a, b) => a - b);
  const q = (p) => heights[Math.min(heights.length - 1, Math.floor(p * heights.length))];
  const total = (k) => all.reduce((a, s) => a + (s[k] || 0), 0);
  const hits = {};
  for (const s of all) for (const k of Object.keys(s.hits)) hits[k] = (hits[k] || 0) + s.hits[k];
  const bands = {};
  for (const s of all) for (const b of Object.keys(s.hitsByBand)) bands[b] = (bands[b] || 0) + s.hitsByBand[b];
  // metres climbed inside each 100 m band, summed over runs, for a rate
  const bandMetres = {};
  for (const s of all) { for (let b = 0; b < s.height; b += 100) bandMetres[b] = (bandMetres[b] || 0) + Math.min(100, s.height - b); }
  const causes = {};
  for (const s of all) causes[s.cause] = (causes[s.cause] || 0) + 1;
  const fallsByBand = {};
  for (const s of all) if (s.fellBand != null) fallsByBand[s.fellBand] = (fallsByBand[s.fellBand] || 0) + 1;
  const deaths = all.filter((s) => s.cause === 'fell' || s.cause === 'caught').length;
  const totalM = heights.reduce((a, b) => a + b, 0);
  return {
    cfg,
    runs: all.length,
    heightMedian: q(0.5), heightMean: Math.round(totalM / all.length), heightMax: heights[heights.length - 1],
    reach: { 100: all.filter((s) => s.height >= 100).length, 200: all.filter((s) => s.height >= 200).length, 300: all.filter((s) => s.height >= 300).length, 500: all.filter((s) => s.height >= 500).length, 800: all.filter((s) => s.height >= 800).length },
    causes, fallsByBand, fallShare: deaths ? +((causes.fell || 0) / deaths).toFixed(2) : 0,
    hits, hitsPer100m: totalM ? +(Object.values(hits).reduce((a, b) => a + b, 0) / totalM * 100).toFixed(2) : 0,
    hitsPer100mByBand: Object.fromEntries(Object.keys(bandMetres).sort((a, b) => a - b).map((b) => [b, +((bands[b] || 0) / bandMetres[b] * 100).toFixed(2)])),
    hearts: total('hearts'), lanterns: total('lanterns'), boosts: total('boosts'), stomps: total('stomps'), punches: total('punches'), witches: total('witches'),
    runsDetail: all.map((s) => ({ seed: s.seed, h: s.height, cause: s.cause, t: Math.round(s.time) })),
  };
}

export function formatReport(r) {
  const n = r.runs;
  const pct = (v) => `${Math.round((v / n) * 100)}%`;
  const lines = [];
  lines.push(`config: ${JSON.stringify(r.cfg)}`);
  lines.push(`height: median ${r.heightMedian} m, mean ${r.heightMean} m, max ${r.heightMax} m`);
  lines.push(`reached: 100 m ${pct(r.reach[100])}, 200 m ${pct(r.reach[200])}, 300 m ${pct(r.reach[300])}, 500 m ${pct(r.reach[500])}, 800 m ${pct(r.reach[800])}`);
  lines.push(`deaths: ${JSON.stringify(r.causes)}  falls: ${Math.round(r.fallShare * 100)}% of deaths, by band ${JSON.stringify(r.fallsByBand)}`);
  lines.push(`hits per 100 m: ${r.hitsPer100m}  by enemy: ${JSON.stringify(r.hits)}`);
  lines.push(`hits per 100 m by band: ${JSON.stringify(r.hitsPer100mByBand)}`);
  lines.push(`hearts ${r.hearts}, lanterns ${r.lanterns}, boosts ${r.boosts}, stomps ${r.stomps}, boost-punches ${r.punches}, witch events ${r.witches}`);
  return lines.join('\n');
}
