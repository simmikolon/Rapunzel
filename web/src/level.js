import { W, SAFE_GAP, BEAT, LAYER_GAP_CAP, LAYER_GAP_CAP_DRY, CAMERA_PLAYER_OFFSET, CAMERA_START_Y, GRAVITY, JUMP_VY, WEAK_JUMP_VY, SPRING_VY, PARALLAX_TOWER, POWER_FIRST, POWER_EVERY } from './config.js';
import { Platform, CLOUD_SIZE, GALLERY_X, GATE_X } from './platforms.js';
import { Crow, Spider, Squirrel, Lightning, Guard, Flowerpot, Grabber, Bat, Web, Ghost, Cat } from './enemies.js';
import { Sun, Lantern, Heart, PowerUp } from './pickups.js';
import { lerp, invLerp, clamp, RNG } from './util.js';
import { treeStyleIndexAt, cloudAmount, lanternAmount } from './altitude.js';
import { windowsBetween } from './windows.js';
import { hatchesBetween, pillarTile, hasDoor, HATCH } from './pillars.js';
import { STONE_STYLE, STAIR } from './art/interior.js';
import { placeOf } from './places.js';
import { VAULT } from './vault.js';
import { stageAt, stagePacing } from './stages.js';

// Procedural level built from "rows" (the original's beats). Each row holds
// one or two platforms picked from fixed slots: a branch on the left tree,
// a branch on the right tree, a ribbon on the braid, or a plank swing hung
// between the trees. Difficulty is a smooth function of altitude. Inside
// the tower (places.js) the slots are the same and hold the room's things.

// Difficulty keyframes by altitude (px; 100 px = 1 m). The ramp used to
// peak at 210 m and stay there, which capped good runs around 300 m; it now
// stretches to 700 m with a final step beyond.
const TIERS = [
  { y: 0,     gap: [0.75, 1.0],  dry: 0.00, short: 0.00, stub: 0.00, long: 0.10, cloudSmall: 0.00, cloudWide: 0.30, drift: 0.00, storm: 0.00, updraft: 0.10, crow: 0.00, spider: 0.00, swing: 0.00, bow: 0.04, sway: 0,   crowSpeed: [130, 190], lantern: 0.10, sun: 0.40, double: 0.35, squirrel: 0.00, balcony: 0.00, guard: 0.00, pot: 0.00, grabber: 0.00, bat: 0.00 },
  { y: 3500,  gap: [0.85, 1.2],  dry: 0.10, short: 0.08, stub: 0.00, long: 0.12, cloudSmall: 0.00, cloudWide: 0.30, drift: 0.00, storm: 0.00, updraft: 0.10, crow: 0.10, spider: 0.00, swing: 0.08, bow: 0.05, sway: 18,  crowSpeed: [160, 230], lantern: 0.10, sun: 0.40, double: 0.30, squirrel: 0.00, balcony: 0.00, guard: 0.00, pot: 0.00, grabber: 0.00, bat: 0.00 },
  { y: 10000, gap: [1.0, 1.45],  dry: 0.18, short: 0.16, stub: 0.07, long: 0.12, cloudSmall: 0.05, cloudWide: 0.30, drift: 0.10, storm: 0.00, updraft: 0.10, crow: 0.17, spider: 0.10, swing: 0.12, bow: 0.06, sway: 42,  crowSpeed: [190, 270], lantern: 0.11, sun: 0.40, double: 0.26, squirrel: 0.24, balcony: 0.60, guard: 0.25, pot: 0.25, grabber: 0.09, bat: 0.14 },
  { y: 22000, gap: [1.1, 1.65],  dry: 0.26, short: 0.22, stub: 0.12, long: 0.12, cloudSmall: 0.10, cloudWide: 0.28, drift: 0.18, storm: 0.00, updraft: 0.10, crow: 0.23, spider: 0.18, swing: 0.14, bow: 0.06, sway: 70,  crowSpeed: [230, 330], lantern: 0.12, sun: 0.40, double: 0.22, squirrel: 0.30, balcony: 1.00, guard: 0.35, pot: 0.35, grabber: 0.13, bat: 0.18 },
  { y: 40000, gap: [1.25, 1.8],  dry: 0.33, short: 0.26, stub: 0.16, long: 0.12, cloudSmall: 0.16, cloudWide: 0.24, drift: 0.26, storm: 0.00, updraft: 0.10, crow: 0.28, spider: 0.24, swing: 0.15, bow: 0.07, sway: 100, crowSpeed: [270, 390], lantern: 0.12, sun: 0.40, double: 0.20, squirrel: 0.32, balcony: 1.00, guard: 0.40, pot: 0.40, grabber: 0.17, bat: 0.20 },
  { y: 70000, gap: [1.3, 1.9],   dry: 0.36, short: 0.28, stub: 0.20, long: 0.12, cloudSmall: 0.26, cloudWide: 0.18, drift: 0.40, storm: 0.20, updraft: 0.16, crow: 0.32, spider: 0.28, swing: 0.15, bow: 0.07, sway: 115, crowSpeed: [300, 420], lantern: 0.12, sun: 0.40, double: 0.18, squirrel: 0.34, balcony: 1.00, guard: 0.45, pot: 0.45, grabber: 0.20, bat: 0.20 },
];

// Zones: altitude bands that scale each element's spawn chance, so new
// elements arrive as a place changes rather than piling on top of each
// other. An element's rule is: tier chance x pacing x zone multiplier,
// starting at the band where its multiplier first becomes positive.
export const ZONES = [
  { name: 'forest floor', from: 0,     mul: { crow: 1.0, spider: 1.0, squirrel: 0.0, stub: 0.0, balcony: 0.0, guard: 0.0, pot: 0.0, grabber: 0.0, scissors: 0.0, bat: 0.0, flock: 0.0, star: 0.5, cloak: 0.3, spring: 0.6, feather: 1.3 } },
  { name: 'deep forest',  from: 12000, mul: { crow: 0.6, spider: 0.5, squirrel: 1.0, stub: 1.0, balcony: 0.0, guard: 0.0, pot: 0.0, grabber: 0.0, scissors: 0.0, bat: 1.0 } },
  { name: 'windows',      from: 25000, mul: { crow: 0.6, spider: 0.5, squirrel: 0.5, stub: 1.0, balcony: 0.0, guard: 0.0, pot: 0.0, grabber: 1.0, scissors: 1.0, bat: 0.5, cloak: 1.4, feather: 0.8 } },
  { name: 'above the trees', from: 40000, mul: { crow: 1.0, spider: 0.3, squirrel: 0.3, stub: 0.7, storm: 1.0, balcony: 0.4, guard: 0.5, pot: 0.8, grabber: 0.6, scissors: 1.0, bat: 0.5, star: 1.2, cloak: 0.6, feather: 1.5 } },
];
// Inside the tower (places.js): its own roster, floor by floor, in the same
// bands as the outside's zones (a gate will lead from one to the other at a
// height). What is not named counts as 1, so the outside's creatures are
// switched off by name. Who lives in here: bats under the ledges, guards on
// the galleries, pike guards in the pillars' hatches, the spider's web under
// a ledge (it holds instead of biting), the witch's cat on the ledges (the
// squirrel's place), the ghost in the crow's place, and
// the flock's gate as a swarm of bats (from 160 m). Each floor leans on two
// or three of them and on its own things to stand on.
const OUTSIDERS = { crow: 0.0, spider: 0.0, squirrel: 0.0, balcony: 0.0, pot: 0.0, scissors: 0.0, storm: 0.0 };
export const ZONES_INSIDE = [
  // The hall: the gentle part, as the forest floor is outside. No stubs, no
  // pikes, no ghost, more long ledges, the power-ups lean toward the feather.
  { name: 'the hall',        from: 0,     mul: { ...OUTSIDERS, stub: 0.0, long: 2.0, gallery: 0.5, guard: 0.6, grabber: 0.0, bat: 0.8, ghost: 0.0, cat: 0.0, star: 0.5, cloak: 0.3, spring: 0.6, feather: 1.3 } },
  // The guard rooms: galleries, guards on them, pikes from the hatches, stairs.
  { name: 'the guard rooms', from: 12000, mul: { ...OUTSIDERS, gallery: 0.8, guard: 1.2, grabber: 2.4, bat: 1.2, web: 1.0, ghost: 0.6, cat: 0.5, stairs: 1.5 } },
  // The library: dusty and haunted. Webs and ghosts, few guards; the cloak
  // helps here. Its spring is the great chained book (the bell's slot).
  { name: 'the library',     from: 25000, mul: { ...OUTSIDERS, gallery: 0.3, guard: 0.7, grabber: 1.2, bat: 1.5, web: 2.4, ghost: 1.9, cat: 1.0, bell: 1.6, cloak: 1.4 } },
  // The belfry: bells to bounce on, scaffold boards, and the bats' home.
  { name: 'the belfry',      from: 40000, mul: { ...OUTSIDERS, gallery: 0.3, guard: 0.7, grabber: 1.2, bat: 1.9, web: 1.2, ghost: 1.0, cat: 0.6, bell: 3.0, board: 2.0, stairs: 0.5, feather: 1.5 } },
];
export function zoneAt(y, zones = ZONES) {
  let z = zones[0];
  for (const c of zones) if (y >= c.from) z = c;
  return z;
}

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

// Power-ups (src/powerups.js): one item every POWER_EVERY px of climb, the
// first within POWER_FIRST. Which one is a weighted pick: the weight here x
// the zone's multiplier x pacing (the star and the cloak follow the enemies'
// pacing, so none in a breather and none on the first 30 m, where there is
// nothing to fend off; the magnet follows the suns' and likes a breather),
// never the same twice in a row. The zones lean toward what helps there: the
// feather on the forest floor (where the youngest play and falls end the
// run; the spring is the one that makes landing harder, so less of it), the
// cloak at the windows (guards, the witch), the feather above the trees
// (clouds are where falls happen; lightning does not care about the cloak).
const POWER_WEIGHT = { magnet: 1.0, spring: 1.0, feather: 0.8, star: 1.0, cloak: 0.9 };
const POWER_CALM = 3000;        // below this height no star and no cloak

// The flock of starlings (enemies.js Flock): a set piece the generator
// builds. From FLOCK_FROM on, every FLOCK_EVERY of climb, never in a
// breather and never inside a braid cut's stretch, a row becomes a floor
// across the whole width (two long branches that meet in the middle, or
// three wide clouds above the trees), the next row FLOCK_GAP above it
// another, and the birds stream through the gap between them, FLOCK_BAND
// above the lower floor: high enough that a prince crouched on it is clear
// of them, low enough that the upper floor is clear too. Both floors are
// solid ground (nothing crumbles, drifts or strikes, no enemy on or between
// them), so a prince turned back by the birds comes down on the lower one
// wherever he is, and one who burst through lands on the upper one. Two
// lanterns that stay where they are stand on the lower floor: the boost the
// birds ask for is always there (a lantern precedes a barrier that needs a
// boost).
export const FLOCK_FROM = 16000, FLOCK_EVERY = [30000, 45000], FLOCK_GAP = 500, FLOCK_BAND = 345, FLOCK_LEAD = 1600;
const floorLayout = (y, place) => (place.sky && cloudAmount(y) >= 0.5 ? 'cloudL+cloudC+cloudR' : 'branchL+branchR');

// The braid cut. From CUT_FROM on, every CUT_EVERY of climb the generator
// plans a cut stretch from the row it is at (`from`) to CUT_AHEAD above it
// (`yc`) plus CUT_MARGIN, and builds those rows without braid-only layouts
// and without dry branches. The witch comes once the prince reaches `from`
// and snips above his highest point, never above `yc`, so the cut always
// falls inside the stretch and the climb stays possible once the ribbons
// below it have fallen. She only sets out while he is still CUT_ROOM below
// `yc` (a plan another witch blocked for too long is dropped), so the cut
// lands above him even if he boosts; the margin covers the layer drift (a
// ribbon planned for a row just above the cut can still hang below it when
// she snips).
// Gates between the outside and the inside (platforms.js `gate`,
// World.enterGate): from GATE_FROM (above the forest floor and the hall,
// which stay as gentle as they are) up to GATE_TO (the trees' end: above it
// the outside is sky, which the inside has no rows for), every GATE_EVERY
// of climb, a row is a gate's landing on one side and a healthy branch (a
// ledge) on the other, so going through is a choice. Nothing crumbles or
// lives in that row. Never inside a flock's or a braid cut's stretch. The
// plan rolls on a stream of its own; with `gates` off (the simulator's
// baseline) nothing of it is rolled and the tower is the one it was.
export const GATE_FROM = 12000, GATE_TO = 40000, GATE_EVERY = [10000, 16000];

// Golden doors to the treasury (vault.js; inside the tower only): the first
// VAULT_FIRST up, so that the youngest find one too (it is in the hall),
// then one every VAULT_EVERY of climb above where the last one lets him out.
// Its row is a gate's: the door's landing on one side, a healthy ledge on
// the other, nothing that crumbles and nobody in it; never in the dark and
// never at a swarm's floors. Going in is a choice, and a door one passed by
// is gone. The plan rolls on a stream of its own; with `vaults` off (the
// simulator's baseline) nothing of it is rolled.
export const VAULT_FIRST = [4000, 7000], VAULT_EVERY = [20000, 30000];

// Where the lights are out (inside the tower only): from DARK_FROM on,
// every DARK_EVERY of climb, a stretch DARK_LEN long is dark. The torches
// there are out, the windows walled up, the chandeliers unlit until he
// lands on them (world.js), and what he sees he sees by his own light and
// by whatever shines. So that the dark is tense but never unfair, its rows
// have nothing that crumbles and nothing small, fewer creatures, and more
// lanterns; no gate and no swarm is built in it. `darkAt(y)` is how dark it
// is at a height (0 to 1, fading in and out over DARK_FADE).
export const DARK_FROM = 15000, DARK_EVERY = [14000, 22000], DARK_LEN = [3200, 4200], DARK_FADE = 520;

export const CUT_FROM = 30000, CUT_EVERY = [12000, 18000], CUT_AHEAD = 1600, CUT_MARGIN = 240, CUT_ROOM = 1000;
// In stages (stages.js) a stage has at most one braid cut and one flock, where its zone has them at all: this is how likely.
const STAGE_CUT = 0.5, STAGE_FLOCK = 0.35;
const braidOnly = (layout) => layout.split('+').every((k) => k === 'ribbon' || k === 'bow');

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
    this.rng = rng;              // the geometry stream: rows, lengths, enemies, suns, lanterns
    this.rngHearts = rng;        // hearts depend on the prince's state, so they get a stream of their own
    this.rngTower = rng;         // what the tower does (window guards): rolled apart so the geometry stays comparable
    this.rngPower = rng;         // the power-ups: their own stream, so the tower is the same with and without them
    this.rngFauna = rng;         // bats and the flock's timing: apart again, so only the flock's two floors change the tower
    this.rngGates = rng;         // where the gates are
    this.rngDark = rng;          // where the lights are out
    this.darks = [];             // the dark stretches built so far: { from, to, said }
    this.gates = true;           // false: a tower without gates (the simulator's baseline)
    this.rngVault = rng;         // where the golden doors are, and which room is behind one
    this.vaults = true;          // false: a tower without treasuries (the simulator's baseline)
    this.nextChimneyY = Infinity; // dev: a fireplace, the way into the chimney (chimney.js), in the first row from this height on
    this.forcePlan = null;       // dev: every treasury begins with this section (vault.js SECTIONS)
    this.route = null;           // the tower in stages (stages.js; the world sets it before reset()); null: the endless game
    this.stage = null;           // the stage being built: { n, place, from, to, end } with `end` its floor and door once they stand
    this.endNext = null;         // the next row is the door over a stage's last floor: 'gateL' or 'gateR'
    this.place = placeOf('outside');   // where this tower is climbed (places.js); the world sets it before reset()
    this.zones = ZONES;
    this.forceLen = null;        // dev: every branch gets this length class
    this.forceLayout = null;     // dev: the next row that is picked gets this layout
  }

  // A fresh stream for an entity that keeps rolling after it was spawned (a
  // squirrel's moods), seeded from the geometry stream so it replays too.
  child(r = this.rng) { return new RNG(r.int(0, 0x7fffffff)); }

  // An element's zone multiplier at height y in this place (1 when the zone does not name it).
  zoneMul(y, element) { const m = zoneAt(y, this.zones).mul[element]; return m == null ? 1 : m; }

  reset() {
    this.zones = this.place.inside ? ZONES_INSIDE : ZONES;
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
    this.updraftLane = null;     // lane with an updraft below the next row (no storm there)
    this.lastBalconyRow = -9;    // row index of the last balcony row
    this.nextCutY = CUT_FROM;    // the next braid cut is planned at the first row from here
    this.cutPlan = null;         // { from, yc, until, fired }: the stretch kept free of braid-only rows
    this.flockPlan = null;       // { from, to, y, fired }: the two floors and the height the birds fly at
    this.flockNext = false;      // the next row is a flock's upper floor
    this.nextFlockY = FLOCK_FROM + this.rngFauna.range(0, 8000);   // the first between 160 and 240 m
    this.darks = [];
    this.nextDarkY = this.place.inside ? DARK_FROM + this.rngDark.range(0, 6000) : Infinity;   // the first dark stretch between 150 and 210 m
    this.nextGateY = this.gates ? GATE_FROM + this.rngGates.range(0, 5000) : Infinity;   // the first gate between 120 and 170 m
    this.nextVaultY = this.vaults && this.place.inside ? this.rngVault.range(VAULT_FIRST[0], VAULT_FIRST[1]) : Infinity;   // the first golden door between 40 and 70 m
    this.lastPower = null;       // the kind of the last power-up (never twice in a row)
    this.nextPowerY = this.rngPower.range(POWER_FIRST[0], POWER_FIRST[1]);   // the next power-up waits above the first row from here
    this.stage = this.route ? { ...stageAt(this.route, 0), base: 0, y0: 0 } : null;
    this.endNext = null;
    if (this.stage) this.beginStage();
  }

  // --- stages (stages.js) ----------------------------------------------------
  // How hard the tower is at height y. In the endless game that is the
  // height; in stages it is how far he has come in all (a stage is built at
  // its theme's height, `y0`, and `base` is what he had climbed before it).
  tierOf(y) { const st = this.stage; return tierAt(st ? st.base + (y - st.y0) : y); }
  // A stage begins (or begins again): what the endless game plans along the
  // height is planned from the stage's start instead, wherever in the tower
  // that is. A braid cut and a flock where the zone has them, one of each at
  // the most; the dark for the whole stage or not at all (`dark`; the lights
  // are back on before the door); a power-up soon.
  beginStage() {
    const st = this.stage, R = this.route;
    // (not in every stage: in the endless tower a cut comes every 120 to 180 m and a flock every 300 to 450)
    this.cutPlan = null; this.nextCutY = this.rngTower.chance(STAGE_CUT) ? Math.max(CUT_FROM, st.from + 2000) : Infinity;
    this.flockPlan = null; this.flockNext = false; this.nextFlockY = this.rngFauna.chance(STAGE_FLOCK) ? Math.max(FLOCK_FROM, st.from + 2500 + this.rngFauna.range(0, 2500)) : Infinity;
    const said = this.darks.some((d) => d.said && d.stage === st.n);
    this.darks = st.dark ? [{ from: st.from + 300, to: st.to - R.calmBefore, said, stage: st.n }] : [];
    this.nextDarkY = Infinity;
    this.nextPowerY = st.from + this.rngPower.range(600, 2500);
    this.planStage();
  }
  // What a stage has besides its rows: no gate but the door at its end, and
  // (`vault`) a golden door, once, where the treasury behind it still lets
  // him out below the stage's last stretch. Its end is not built yet (or no
  // longer: the rows above were cleared).
  planStage() {
    const st = this.stage, R = this.route;
    st.end = null; this.endNext = null;
    this.nextGateY = Infinity;
    this.nextDarkY = Infinity;                                           // (the dark is the stage's or nobody's: beginStage)
    const room = st.to - R.calmBefore - 600 - VAULT.rise - st.from;      // how far up the stage a golden door may stand
    this.nextVaultY = this.vaults && st.vault && !st.vaulted && room > 800 ? st.from + this.rngVault.range(600, room) : Infinity;
  }
  // He came through the door into stage `st` (stages.js stageAt, with `base`:
  // what he has climbed so far): he stands at its start, y, and its rows go up from there.
  enterStage(st, y, gap) {
    this.stage = { ...st, y0: y };
    this.restartFrom(y, gap);
    this.modelCam = this.world.cam.y;
    this.beginStage();
  }
  // He goes on from the door at height y he had come through (or from the
  // lawn): the stage's rows are built again from there, others than before.
  retryStage(y, gap) {
    this.restartFrom(y, gap);
    this.modelCam = this.world.cam.y;      // the camera is back at the door
    this.beginStage();
  }
  // He left the stage's rows for the treasury (the world cleared them): what stood of its end is gone with them.
  clearStageEnd() { if (this.stage) { this.stage.end = null; this.endNext = null; } }

  // The prince went through a gate at height y: the place is another now,
  // and the rows from here on are its rows. (The world cleared what stood
  // above; the next gate is already planned.)
  restartFrom(y, gap) {
    this.zones = this.place.inside ? ZONES_INSIDE : ZONES;
    this.nextY = y + gap; this.lastSafeY = y; this.pendingGapCap = null;
    this.lastLayout = null; this.nextLayout = null;
    this.lastHadCenter = true; this.lastBowY = -1e9; this.lastStubRow = -9; this.lastBalconyRow = this.rowIndex; this.updraftLane = null;
    this.prevRowY = y; this.prevRowApex = JUMP_VY * JUMP_VY / (2 * GRAVITY);
    this.cutPlan = null; this.nextCutY = Math.max(this.nextCutY, y + 4000);
    this.flockPlan = null; this.flockNext = false; this.nextFlockY = Math.max(this.nextFlockY, y + 4000);
    this.nextPowerY = Math.max(this.nextPowerY, y + 600);
    if (this.place.inside && this.nextDarkY === Infinity) this.nextDarkY = y + this.rngDark.range(3000, 9000);   // he came in at a gate: the dark has its turn too
    // and the treasury: a door some way up for one who came in at a gate, none right behind one
    if (this.vaults && this.place.inside) this.nextVaultY = this.nextVaultY === Infinity ? y + this.rngVault.range(2000, 8000) : Math.max(this.nextVaultY, y + 2000);
  }

  // He came out of the treasury at height y, having gone in at `entryY`:
  // the tower's rows go on from here. A dark stretch that had been planned
  // for the rows he never climbed is planned again further up (nobody
  // steps out of the gold into the dark), and no gate stands right at the door.
  leaveVault(y, gap, entryY) {
    this.restartFrom(y, gap);
    if (this.darks.some((d) => d.from > entryY)) {
      this.darks = this.darks.filter((d) => d.from <= entryY);
      this.nextDarkY = y + this.rngDark.range(3000, 9000);
    }
    this.nextDarkY = Math.max(this.nextDarkY, y + 1500);
    this.nextGateY = Math.max(this.nextGateY, y + 2500);
  }

  // Is row height y in a dark stretch? And how dark is it at a height (0 to 1)?
  inDark(y) { return this.darks.some((d) => y >= d.from && y <= d.to); }
  darkAt(y) {
    let a = 0;
    for (const d of this.darks) a = Math.max(a, clamp(Math.min((y - d.from + DARK_FADE) / DARK_FADE, (d.to + DARK_FADE - y) / DARK_FADE), 0, 1));
    return a * a * (3 - 2 * a);
  }

  // Which power-up for a row at height y with pacing P; null when none fits.
  pickPower(y, P) {
    const items = [];
    for (const kind of Object.keys(POWER_WEIGHT)) {
      let w = kind === this.lastPower ? 0 : POWER_WEIGHT[kind] * this.zoneMul(y, kind);
      if (kind === 'star' || kind === 'cloak') w *= y < POWER_CALM ? 0 : P.enemy;
      if (kind === 'magnet') w *= P.sun;
      if (w > 0) items.push([kind, w]);
    }
    return items.length ? this.rngPower.weighted(items) : null;
  }

  // Is row height y inside the planned cut's stretch?
  inCut(y) { return !!this.cutPlan && y >= this.cutPlan.from && y <= this.cutPlan.until; }

  // The cut happened, was fended off or was outclimbed: plan the next one.
  cutDone() {
    const base = this.cutPlan ? this.cutPlan.yc : this.world.player.maxY;
    this.cutPlan = null;
    this.nextCutY = base + this.rngTower.range(CUT_EVERY[0], CUT_EVERY[1]);
  }

  // The flock has gone (he passed it, or was past its height before it came): plan the next.
  flockDone() {
    const base = this.flockPlan ? this.flockPlan.to : this.world.player.maxY;
    this.flockPlan = null;
    this.nextFlockY = base + this.rngFauna.range(FLOCK_EVERY[0], FLOCK_EVERY[1]);
  }

  // A bat under a healthy branch of this row that is long enough to hang from.
  spawnBat(platforms) {
    const rf = this.rngFauna;
    const branch = platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && p.len !== 'stub');
    // one thing per branch: not where a spider hangs or a squirrel lives
    if (!branch || this.world.enemies.some((e) => (e.kind === 'spider' && Math.abs(e.anchorY - (branch.y - 28)) < 2) || ((e.kind === 'squirrel' || e.kind === 'bat' || e.kind === 'web' || e.kind === 'cat') && e.platform === branch))) return null;
    const T = this.tierOf(branch.y);
    const half = branch.w / 2 - 30;
    const bat = new Bat(branch, rf.range(-half, half), clamp((T.index - 2) / 2.5, 0, 1), this.child(rf));
    this.world.enemies.push(bat);
    return bat;
  }

  // A spider's web in the corner under a healthy ledge of this row that is
  // long enough to leave room beside it (inside the tower). One thing per
  // ledge: not where a bat hangs.
  spawnWeb(platforms) {
    const ledge = platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && (p.len === 'normal' || p.len === 'long')
      && !this.world.enemies.some((e) => (e.kind === 'bat' || e.kind === 'web' || e.kind === 'cat') && e.platform === p));
    if (!ledge) return null;
    const web = new Web(ledge, this.child(this.rngFauna));
    this.world.enemies.push(web);
    return web;
  }

  // The witch's cat on a healthy ledge of this row that is long enough to
  // land beside it (inside the tower). One thing per ledge: none where a
  // bat hangs or a web is spun.
  spawnCat(platforms) {
    const rf = this.rngFauna;
    const ledge = platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && (p.len === 'normal' || p.len === 'long')
      && !this.world.enemies.some((e) => (e.kind === 'bat' || e.kind === 'web' || e.kind === 'cat') && e.platform === p));
    if (!ledge) return null;
    const half = ledge.w / 2 - 44;
    const cat = new Cat(ledge, rf.range(-half, half), clamp((this.tierOf(ledge.y).index - 2) / 2.5, 0, 1), this.child(rf));
    this.world.enemies.push(cat);
    return cat;
  }

  get difficulty() { return this.tierOf(this.world.player.maxY); }
  pacingAt(y) { return this.stage ? stagePacing(this.route, this.stage, y) : pacingAt(y); }

  generateUpTo(yTop) {
    if (this.place.vault) return;      // the treasury is furnished at once (vault.js), it has no rows
    while (this.nextY < yTop) this.makeRow();
  }

  pickLayout(T, y, rowIndex = this.rowIndex) {
    const r = this.rng;
    if (this.forceLayout) { const l = this.forceLayout; this.forceLayout = null; this.lastLayout = l; return l; }
    // Above the treeline the branch slots become cloud lanes (left, right and
    // a centre lane that never shares a row with a ribbon); the handover is
    // gradual through cloudAmount. Swings need trees. Balconies belong to
    // the tower where it stands alone, above the treeline: in the sky
    // table only, at most one balcony row in two.
    const ca = this.place.sky ? cloudAmount(y) : 0;     // no sky rows inside
    const sky = ca > 0 && r.chance(ca);
    const b = ca >= 1 ? T.balcony * this.zoneMul(y, 'balcony') * (rowIndex - this.lastBalconyRow < 2 ? 0 : 1) : 0;
    // Inside the tower the same slots hold the room's things: a stone ledge
    // on a pillar, a chandelier on the chain where a ribbon would be, the
    // bell for the bow, a scaffold board for the swing, and from 35 m on a
    // gallery at a pillar's door (never two rows running).
    const gl = this.place.inside ? T.balcony * this.zoneMul(y, 'gallery') * (rowIndex - this.lastBalconyRow < 2 ? 0 : 1) : 0;
    const st = this.place.inside ? 0.3 * this.zoneMul(y, 'stairs') * (rowIndex - this.lastBalconyRow < 3 ? 0 : 1) : 0;
    let items = this.place.inside ? [
      ['branchL', 1.0], ['branchR', 1.0], ['chandelier', 1.1],
      ['branchL+chandelier', T.double * 0.7], ['branchR+chandelier', T.double * 0.7], ['branchL+branchR', T.double * 0.6],
      ['swing', T.swing * this.zoneMul(y, 'board')], ['bell', T.bow * this.zoneMul(y, 'bell')],
      ['galleryL', gl], ['galleryR', gl], ['galleryL+chandelier', gl * T.double * 0.6], ['galleryR+chandelier', gl * T.double * 0.6],
      ['galleryL+branchR', gl * T.double * 0.5], ['branchL+galleryR', gl * T.double * 0.5],
      // a flight of stairs built out from a pillar: wide and safe, a relief like the long ledge
      ['stairsL', st], ['stairsR', st],
    ] : sky ? [
      ['cloudL', 1.0], ['cloudR', 1.0], ['cloudC', 0.6], ['ribbon', 1.1],
      ['cloudL+ribbon', T.double * 0.7], ['cloudR+ribbon', T.double * 0.7], ['cloudL+cloudR', T.double * 0.6],
      ['bow', T.bow],
      ['balconyL', b], ['balconyR', b], ['balconyL+ribbon', b * T.double * 0.6], ['balconyR+ribbon', b * T.double * 0.6],
      ['balconyL+cloudR', b * T.double * 0.5], ['cloudL+balconyR', b * T.double * 0.5], ['balconyL+balconyR', b * T.double * 0.4],
    ] : [
      ['branchL', 1.0], ['branchR', 1.0], ['ribbon', 1.1],
      ['branchL+ribbon', T.double * 0.7], ['branchR+ribbon', T.double * 0.7], ['branchL+branchR', T.double * 0.6],
      ['swing', T.swing * (1 - ca)], ['bow', T.bow],
    ];
    // in a planned cut's stretch nothing may hang on the braid alone
    if (this.inCut(y)) items = items.filter((it) => !braidOnly(it[0]));
    let layout = r.weighted(items.filter((it) => it[1] > 0));
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
    if (stubOk && r.chance(T.stub * P.short * this.zoneMul(y, 'stub'))) { this.lastStubRow = this.rowIndex; return 'stub'; }
    if (r.chance(T.short * P.short * this.zoneMul(y, 'short'))) return 'short';
    if (single && r.chance(T.long * P.long * this.zoneMul(y, 'long'))) return 'long';
    return 'normal';
  }

  // A squirrel on a healthy branch of this row, somewhere along it. Only
  // normal and long branches have room for a patrol; long ones first.
  spawnSquirrel(platforms) {
    const r = this.rng;
    const branch = platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && p.len === 'long')
      || platforms.find((p) => (p.kind === 'branchL' || p.kind === 'branchR') && !p.dry && p.len === 'normal');
    if (!branch) return null;
    const T = this.tierOf(branch.y);
    const sq = new Squirrel(branch, r.range(-60, 60), r.range(95, 150), clamp((T.index - 1.5) / 2.5, 0.3, 1), this.child());
    this.world.enemies.push(sq);
    return sq;
  }

  // A guard in one of the windows near this row. The windows are fixed per
  // height (windows.js), so the roll is only whether one of them is manned;
  // it runs on the tower stream so the geometry is the same with or
  // without him. A window a balcony covers or that already has a guard is
  // out.
  // Inside the tower his windows are the hatches in the pillars (pillars.js):
  // he thrusts from the pillar over the ledges, so his pike is a little
  // longer there (a ledge's tip stays out of reach).
  spawnGrabber(y, arrivalCam) {
    const rt = this.rngTower;
    const inside = this.place.inside;
    const lyRow = inside ? y : Platform.worldToLayer(y, PARALLAX_TOWER, arrivalCam);
    const taken = this.world.enemies.filter((e) => e.kind === 'grabber');
    const cover = this.world.platforms.filter((p) => (inside ? hasDoor(p) : p.kind === 'balcony' || p.kind === 'gate'));
    const free = (inside ? hatchesBetween(lyRow - 60, lyRow + 420, cover) : windowsBetween(lyRow - 60, lyRow + 420, cover)).filter((w) => !taken.some((e) => e.win.i === w.i && e.win.side === w.side));
    if (!free.length) return null;
    const T = this.tierOf(y);
    const gr = new Grabber(rt.pick(free), this.child(rt), (inside ? 165 : 130) + 30 * clamp((T.index - 2.5) / 2.5, 0, 1), this.world.cam.y);
    this.world.enemies.push(gr);
    return gr;
  }

  makeRow() {
    const r = this.rng;
    const T = this.tierOf(this.nextY);
    const y = this.nextY;
    // A stage (stages.js): this row is the door over its last floor (`doorRow`), or its end is due (`due`: the floor is
    // the first row from its last height on that nothing else has a claim to), or it is so close to its end that
    // nothing long is begun any more (`late`: no braid cut, no dark, no flock).
    const st = this.stage, doorRow = this.endNext;
    this.endNext = null;
    const due = !!st && !st.end && !doorRow && y >= st.to, late = !!st && y >= st.to - 1500;
    // Plan a braid cut: never in a stretch that starts or ends in a breather.
    if (!late && !this.cutPlan && !this.flockPlan && !this.flockNext && y >= this.nextCutY && this.zoneMul(y, 'scissors') > 0 && !this.pacingAt(y).breather && !this.pacingAt(y + CUT_AHEAD + CUT_MARGIN).breather) {
      this.cutPlan = { from: y, yc: y + CUT_AHEAD, until: y + CUT_AHEAD + CUT_MARGIN, fired: false };
    }
    const P0 = this.pacingAt(y);
    // Plan a dark stretch from this row up (inside), never around a swarm's floors.
    if (!late && this.place.inside && y >= this.nextDarkY && !this.flockPlan && !this.flockNext) {
      const len = this.rngDark.range(DARK_LEN[0], DARK_LEN[1]);
      this.darks = this.darks.filter((d) => d.to > y - 6000);
      this.darks.push({ from: y, to: y + len, said: false });
      this.nextDarkY = y + len + this.rngDark.range(DARK_EVERY[0], DARK_EVERY[1]);
    }
    const dark = this.place.inside && this.inDark(y);
    // A flock: this row is the floor under it ('below'), or the one over it ('above').
    let flockRow = null;
    if (this.flockNext) { flockRow = 'above'; this.flockNext = false; }
    else if (!late && !doorRow && !this.flockPlan && !this.cutPlan && y >= this.nextFlockY && this.zoneMul(y, 'flock') > 0 && !P0.breather && !this.pacingAt(y + FLOCK_GAP).breather && !dark && !this.inDark(y + FLOCK_GAP)) flockRow = 'below';
    // A stage's last floor: across the whole width, like a flock's.
    const endRow = due && !flockRow && !this.flockPlan && !this.cutPlan && !dark;
    const solid = !!flockRow || endRow;      // this row is a floor
    // A gate: its landing on one side, a healthy branch on the other.
    const gateRow = !flockRow && !this.flockPlan && !this.cutPlan && !dark && y >= this.nextGateY && y < GATE_TO;
    // A golden door: the same row as a gate's, on its own plan.
    const hearth = y >= this.nextChimneyY;      // (a fireplace, the way into the chimney: a golden door's row, not on its plan)
    const vaultRow = !gateRow && !flockRow && !endRow && !doorRow && !this.flockPlan && !this.cutPlan && !dark && this.place.inside && (hearth || y >= this.nextVaultY);
    const P = solid || doorRow || gateRow || vaultRow ? { ...P0, dry: 0, short: 0, enemy: 0 }      // a flock's floors, a gate's row, a stage's end: nothing crumbles, nothing small, nobody on them
      : dark ? { ...P0, dry: 0, short: 0, enemy: P0.enemy * 0.7, lantern: P0.lantern * 2.2 }   // in the dark: nothing crumbles, nothing small, fewer creatures, more lanterns
      : this.inCut(y) ? { ...P0, dry: 0 } : P0;                      // no crumbling branch where the ribbons will go
    let layout = doorRow || this.nextLayout || this.pickLayout(T, y);
    if (this.inCut(y) && braidOnly(layout)) layout = this.pickLayout(T, y);   // chosen before the plan existed
    if (solid) layout = floorLayout(y, this.place);
    if (gateRow) { layout = this.rngGates.chance(0.5) ? 'gateL+branchR' : 'branchL+gateR'; this.nextGateY = y + this.rngGates.range(GATE_EVERY[0], GATE_EVERY[1]); this.nextVaultY = Math.max(this.nextVaultY, y + 1500); }
    if (vaultRow && hearth) {
      layout = 'vaultL+branchR'; this.hearthNext = true;
      this.nextChimneyY = Infinity;
      this.nextVaultY = Math.max(this.nextVaultY, y + 1500);
      this.nextGateY = Math.max(this.nextGateY, y + 1500);
    } else if (vaultRow) {
      layout = this.rngVault.chance(0.5) ? 'vaultL+branchR' : 'branchL+vaultR';
      this.nextVaultY = y + VAULT.rise + this.rngVault.range(VAULT_EVERY[0], VAULT_EVERY[1]);
      this.nextGateY = Math.max(this.nextGateY, y + 1500);        // two doors are not side by side
    }
    this.nextLayout = null;
    const kinds = layout.split('+');
    this.lastHadCenter = kinds.some((k) => k === 'ribbon' || k === 'bow' || k === 'swing' || k === 'cloudC' || k === 'chandelier' || k === 'bell' || k.startsWith('stairs') || k.startsWith('gate') || k.startsWith('vault'));
    if (kinds.includes('bow') || kinds.includes('bell')) this.lastBowY = y;
    const front = kinds.some((k) => k !== 'ribbon' && k !== 'bow' && !k.startsWith('balcony'));
    if (kinds.some((k) => k.startsWith('balcony') || k.startsWith('gallery') || k.startsWith('stairs'))) this.lastBalconyRow = this.rowIndex;
    const stairs = kinds[0].startsWith('stairs');
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
    for (const slot of kinds) {
      if (stairs) {
        // Four treads rising toward this side's pillar, the top one at its
        // face under a door. The row's height is the lowest tread's (the
        // one furthest into the room); the next row is measured from the
        // top one (below).
        const side = slot[6], sd = side === 'L' ? -1 : 1;
        for (let j = 0; j < STAIR.steps; j++) {
          const tread = new Platform('step', y + j * STAIR.rise, { side, x: sd * (284 - STAIR.run / 2 - STAIR.run * (STAIR.steps - 1 - j)) });
          tread.flight = j === 0;
          tread.door = j === STAIR.steps - 1;
          platforms.push(tread);
        }
        safe = true;
        continue;
      }
      const opts = {};
      let kind = slot;
      if (slot.startsWith('cloud') && !solid && r.chance(0.6 * lanternAmount(y))) {
        // from sunset on, a cloud slot often holds a sky lantern instead
        kind = 'skyLantern';
        const lane = slot[5];
        opts.x = lane === 'L' ? -190 + r.range(-40, 40) : lane === 'R' ? 190 + r.range(-40, 40) : r.range(-60, 60);
        opts.phase = r.range(0, 6.28);
        opts.variant = r.chance(0.75) ? 0 : 1;
      } else if (slot.startsWith('cloud')) {
        kind = 'cloud';
        const lane = slot[5];
        opts.phase = r.range(0, 6.28);
        opts.variant = r.int(0, 1);
        // sizes follow the branch logic: small ones are the aim test (never in
        // a breather), wide ones the relief
        if (solid) opts.size = 'wide';                    // three wide clouds make a floor
        else if (r.chance(T.cloudSmall * P.short)) opts.size = 'small';
        else if (r.chance(T.cloudWide * P.long)) opts.size = 'wide';
        // lanes: a wide cloud sits a little further in so it stays on screen
        const laneX = opts.size === 'wide' ? 160 : 190, jitter = opts.size === 'wide' ? 20 : 40;
        opts.x = lane === 'L' ? -laneX + r.range(-jitter, jitter) : lane === 'R' ? laneX + r.range(-jitter, jitter) : r.range(-60, 60);
        opts.cloud = 'thick';
        // wispy follows the dry-branch rules; a cloud drifts or is wispy, not
        // both; a storm cloud is thick, not small and never alone in its row
        if (solid) { /* a floor: thick, where it is */ }
        else if (canBeDry && opts.size !== 'small' && r.chance(T.dry * P.dry)) opts.dry = true;
        else if (opts.size !== 'wide' && r.chance(T.drift * (P.breather ? 0.6 : 1))) {
          // patrol around the lane centre; the swing keeps the cloud fully on screen
          opts.cloud = 'drift';
          opts.x = lane === 'L' ? -150 : lane === 'R' ? 150 : 0;
          const half = CLOUD_SIZE[opts.size || 'normal'].box / 2;
          opts.drift = { amp: Math.min(r.range(90, 140), 370 - Math.abs(opts.x) - half), omega: r.range(0.5, 0.75) * (P.breather ? 0.7 : 1), phase: r.range(0, 6.28) };
        }
        else if (kinds.length > 1 && opts.size !== 'small' && lane !== this.updraftLane && r.chance(T.storm * P.enemy * this.zoneMul(y, 'storm'))) opts.cloud = 'storm';
      }
      if (slot === 'balconyL' || slot === 'balconyR') {
        kind = 'balcony';
        opts.side = slot[7];
        opts.x = opts.side === 'L' ? -210 : 210;
        // stone, wooden, flowered, ivy; the dilapidated one is fragile
        opts.variant = r.weighted([[0, 3], [1, 3], [2, 2], [3, 2]]);
        if (canBeDry && r.chance(T.dry * P.dry)) { opts.dry = true; opts.variant = 4; }
      }
      if (slot === 'chandelier' && dark) opts.unlit = true;                                    // its candles are out until he lands on it
      if (slot === 'bell' && zoneAt(y, this.zones).name === 'the library') kind = 'tome';      // the library's spring is a chained book
      if (slot === 'gateL' || slot === 'gateR') {
        kind = 'gate';
        opts.side = slot[4];
        opts.x = opts.side === 'L' ? -GATE_X : GATE_X;
      }
      if (slot === 'vaultL' || slot === 'vaultR') {
        // a gate in gold: it leads into the treasury
        kind = 'gate';
        opts.gold = 'in';
        if (this.hearthNext) { opts.chimney = true; this.hearthNext = false; }      // not gold: a fireplace
        opts.side = slot[5];
        opts.x = opts.side === 'L' ? -GATE_X : GATE_X;
      }
      if (slot === 'galleryL' || slot === 'galleryR') {
        kind = 'gallery';
        opts.side = slot[7];
        opts.x = opts.side === 'L' ? -GALLERY_X : GALLERY_X;
        opts.variant = r.int(0, 1);
      }
      if (kind === 'branchL' || kind === 'branchR') {
        const len = solid ? 'long' : this.pickLen(T, P, y, kinds);   // a floor: two long branches that meet
        opts.len = len;
        if (len === 'normal' || len === 'long') {          // stubs and short branches are never dry
          if (canBeDry && r.chance(T.dry * P.dry)) opts.dry = true;
          opts.lenScale = solid ? 1.08 : r.range(0.88, 1.12);
        }
        opts.variant = len === 'stub' ? r.int(0, 1) : r.int(0, 5);
        opts.style = this.place.inside ? STONE_STYLE : treeStyleIndexAt(y);   // inside they are stone ledges
        opts.tint = r.pick([null, null, '#f2ece4', '#e4ddd2', '#d8d4cc', '#e8e0d0']);
      }
      const py = y + (kinds.length > 1 ? r.int(-16, 16) : 0);
      // (a stage's door is met with the camera resting on the floor under it, not where the climb would have taken it)
      if (kind === 'ribbon' || kind === 'bow' || kind === 'balcony' || kind === 'gate') opts.ly = Platform.worldToLayer(py, Platform.layerFactor(kind), doorRow ? st.floorY - this.route.floorShown : arrivalCam);
      const p = new Platform(kind, py, opts);
      platforms.push(p);
      if (p.cloud === 'storm') this.world.enemies.push(new Lightning(p, this.child()));
      if (!opts.dry) safe = true;
    }
    if (!safe && kinds.length === 1 && (y - this.lastSafeY) + T.gap[1] * BEAT > SAFE_GAP) {
      // Reachability: a lone dry branch needs a reachable follow-up row.
      platforms[0].dry = false; safe = true;
    }
    for (const p of platforms) this.world.platforms.push(p);
    if (doorRow) {
      // The stage ends here: its door, and no row above it. (The world keeps the camera on the floor below until he has gone through.)
      platforms[0].exit = true;
      st.end = { floorY: st.floorY, door: platforms[0] };
      this.lastSafeY = y; this.nextY = Infinity; this.rowIndex++;
      this.world.onStageEnd(st);
      return;
    }
    // A gallery's door covers the pillar where it stands: a pike guard who
    // was given a hatch there (from a row below) has no hatch any more.
    if (platforms.some(hasDoor)) {
      const galleries = this.world.platforms.filter(hasDoor);
      for (const e of this.world.enemies) if (e.kind === 'grabber' && e.win.f === 1 && pillarTile(e.win.i, e.win.side, galleries) !== HATCH) e.alive = false;
    }
    if (safe) this.lastSafeY = y;
    // a long branch reaches the centre lane too: no swing right above it (he would bounce into its underside)
    if (platforms.some((p) => (p.kind === 'branchL' || p.kind === 'branchR') && p.len === 'long')) this.lastHadCenter = true;

    // --- enemies -----------------------------------------------------------
    let gapMin = T.gap[0] * BEAT * P.gap, gapMax = T.gap[1] * BEAT * P.gap;
    if (!safe) gapMax = Math.min(gapMax, SAFE_GAP - (y - this.lastSafeY));
    // Decide the next row's layout now: from a front-plane row up to a row
    // that only has tower-layer platforms the effective gap grows while the
    // camera climbs, so that gap is kept short.
    const nextLayout = this.pickLayout(this.tierOf(y + gapMin), y + gapMin, this.rowIndex + 1);
    const nextTowerOnly = nextLayout.split('+').every((k) => k === 'ribbon' || k === 'bow' || k.startsWith('balcony'));
    if (front && nextTowerOnly) gapMax = Math.min(gapMax, platforms.some((p) => p.dry) ? LAYER_GAP_CAP_DRY : LAYER_GAP_CAP);
    gapMax = Math.max(gapMax, gapMin);
    let gap = r.range(gapMin, gapMax);
    this.nextLayout = nextLayout;
    if (stairs) {
      // from the lowest tread the next row is still within one bounce; from the top one it is close
      gap = (STAIR.steps - 1) * STAIR.rise + r.range(170, 300);
      // a sun over each tread shows the way up
      if (r.chance(0.7)) for (const p of platforms) if (p.kind === 'step') this.world.pickups.push(new Sun(p.x, p.y + 96, r));
    }
    if (flockRow === 'below') {
      gap = FLOCK_GAP;
      this.nextLayout = floorLayout(y + gap, this.place);
      this.flockNext = true;
      this.flockPlan = { from: y, to: y + gap, y: y + FLOCK_BAND, fired: false, span: Math.min(-Math.min(...platforms.map((p) => p.left)), Math.max(...platforms.map((p) => p.right))) };   // how far the floor reaches: its shorter side
      // the boost it takes, for certain: two lanterns that do not drift away
      for (const lx of [-170, 170]) { const l = new Lantern(lx, y + 96, this.rngFauna); l.vy = 0; this.world.pickups.push(l); }
    }
    // Updrafts (sky only): a column under the next row's first lane, from
    // just above this row to just below the next; more in breathers.
    this.updraftLane = null;
    const nextSlot = nextLayout.split('+')[0];
    if (this.place.sky && cloudAmount(y) >= 1 && !solid && nextSlot.startsWith('cloud') && r.chance(T.updraft * (P.breather ? 1.6 : 1))) {
      const lane = nextSlot[5];
      const ux = lane === 'L' ? -190 : lane === 'R' ? 190 : 0;
      this.world.spawnUpdraft(ux, y + 60, y + gap - 90);
      this.updraftLane = lane;
    }
    if (endRow) {
      // the door stands over this floor, on one side or the other, an easy jump up
      gap = this.route.doorGap;
      this.nextLayout = null;
      this.endNext = this.rngGates.chance(0.5) ? 'gateL' : 'gateR';
      st.floorY = y;
    }
    const bounceVy = kinds.includes('bow') || kinds.includes('bell') ? SPRING_VY : platforms.every((p) => p.dry) ? WEAK_JUMP_VY : JUMP_VY;
    this.prevRowY = y; this.prevRowApex = bounceVy * bounceVy / (2 * GRAVITY);

    if (y > 2200 && r.chance(T.crow * P.enemy * this.zoneMul(y, 'crow'))) {
      const dir = r.sign();
      const cy = y + gap * r.range(0.4, 0.7);
      const cx = r.range(-W / 2, W / 2);
      const track = clamp((T.index - 1.5) / 2.5, 0, 1);
      this.world.enemies.push(new Crow(cx, cy, dir, r.range(T.crowSpeed[0], T.crowSpeed[1]), track, this.child()));
    }
    // The ghost is the inside's crow: the same tier chance, half the pace.
    if (this.place.inside && y > 2200 && this.rngFauna.chance(T.crow * P.enemy * this.zoneMul(y, 'ghost'))) {
      const rf = this.rngFauna;
      this.world.enemies.push(new Ghost(rf.range(-220, 220), y + gap * rf.range(0.4, 0.7), rf.sign(), rf.range(T.crowSpeed[0], T.crowSpeed[1]) * 0.45, clamp((T.index - 2) / 2.5, 0, 1), this.child(rf)));
    }
    if (y > 6500 && r.chance(T.spider * P.enemy * this.zoneMul(y, 'spider'))) {
      const branch = platforms.find((p) => p.kind === 'branchL' || p.kind === 'branchR');
      if (branch) {
        const sx = branch.x + r.range(-50, 50);
        const lunge = clamp((T.index - 2) / 2, 0, 1);
        this.world.enemies.push(new Spider(sx, y - 28, 50, r.range(180, 300), r.range(1.4, 2.4), lunge, this.child()));
      }
    }

    if (r.chance(T.squirrel * P.enemy * this.zoneMul(y, 'squirrel'))) this.spawnSquirrel(platforms);
    // Bats roll on their own stream, so the rows are the same with and without them.
    if (this.rngFauna.chance(T.bat * P.enemy * this.zoneMul(y, 'bat'))) this.spawnBat(platforms);
    // Webs (inside only, from 65 m as the spiders outside): the spider's tier chance.
    if (this.place.inside && y > 6500 && this.rngFauna.chance(T.spider * P.enemy * this.zoneMul(y, 'web'))) this.spawnWeb(platforms);
    // The witch's cat (inside only): the squirrel's tier chance, on the ledges as the squirrel is on the branches.
    if (this.place.inside && this.rngFauna.chance(T.squirrel * P.enemy * this.zoneMul(y, 'cat'))) this.spawnCat(platforms);
    if (this.rngTower.chance(T.grabber * P.enemy * this.zoneMul(y, 'grabber'))) this.spawnGrabber(y, arrivalCam);
    // One thing per balcony (inside: per gallery), never on a dilapidated one: a guard, or a flowerpot.
    for (const p of platforms) {
      if ((p.kind !== 'balcony' && p.kind !== 'gallery') || p.dry) continue;
      if (r.chance(T.guard * P.enemy * this.zoneMul(y, 'guard'))) this.world.enemies.push(new Guard(p, this.child()));
      else if (r.chance(T.pot * P.enemy * this.zoneMul(y, 'pot'))) this.world.enemies.push(new Flowerpot(p, this.child()));
    }

    // --- pickups -----------------------------------------------------------
    // A stub is worth aiming for: most carry a small arc of suns.
    const stub = platforms.find((p) => p.len === 'stub');
    if (stub && r.chance(kinds.length > 1 ? 0.7 : 0.4)) {
      for (let i = 0; i < 3; i++) { const t = i - 1; this.world.pickups.push(new Sun(stub.x + t * 44, stub.y + 70 + (1 - t * t) * 30, r)); }
    }
    if (r.chance(Math.min(0.9, T.sun * P.sun))) {
      const n = r.int(3, 5);
      const cx = r.range(-W / 2 + 120, W / 2 - 120);
      const baseY = y + gap * 0.5;
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1;
        this.world.pickups.push(new Sun(cx + t * 110, baseY + (1 - t * t) * 70, r));
      }
    }
    // A lantern likes a long branch: a little likelier there, and it sits on it.
    const longBranch = platforms.find((p) => p.len === 'long' && !p.dry);
    if (r.chance(T.lantern * P.lantern * (longBranch ? 1.6 : 1))) {
      this.world.pickups.push(new Lantern(longBranch ? longBranch.x + longBranch.def.dir * 60 : r.range(-W / 2 + 100, W / 2 - 100), y + 80, r));
    }
    // Hearts: a chance once one is missing, and a pity timer that guarantees
    // one before long when the prince is down to his last heart. They roll on
    // their own stream so the geometry does not change with how he plays.
    this.rowsSinceHeart++;
    const hearts = this.world.player.hearts;
    const rh = this.rngHearts;
    const pity = hearts <= 1 && this.rowsSinceHeart > 8;
    if (pity || (this.rowsSinceHeart > 12 && hearts < 3 && rh.chance(0.25))) {
      this.world.pickups.push(new Heart(rh.range(-200, 200), y + gap * 0.5, rh));
      this.rowsSinceHeart = 0;
    }

    // A power-up between this row and the next, where the climb passes anyway.
    if (y >= this.nextPowerY) {
      const rp = this.rngPower;
      const kind = this.pickPower(y, P0);
      if (kind) {
        this.world.pickups.push(new PowerUp(kind, rp.range(-190, 190), y + gap * 0.5, rp));
        this.lastPower = kind;
        this.nextPowerY = y + rp.range(POWER_EVERY[0], POWER_EVERY[1]);
      }
    }

    this.nextY = y + gap;
    this.rowIndex++;
  }
}
