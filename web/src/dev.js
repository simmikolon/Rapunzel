// Development helpers, enabled through URL parameters (harmless in play):
//   ?at=150          start the round at 150 m
//   ?spawn=squirrel  put that element on the next branch above the prince
//   ?spawn=storm     turn the next cloud above the prince into a storm cloud
//   ?spawn=stork     send a stork across the screen now
//   ?spawn=guard     a guard on the next balcony above (a balcony is made if none is in view; inside: a gallery)
//   ?spawn=pot       a flowerpot on the next balcony above
//   ?spawn=updraft   put an updraft column under the next platform
//   ?spawn=grabber   a guard in the nearest window above the prince (inside: the nearest hatch in a pillar)
//   ?spawn=scissors  with ?at: plan a braid cut right above the start (the witch comes at once)
//   ?spawn=star      that power-up right above the prince (star|cloak|spring|magnet|feather)
//   ?spawn=bat       a bat under the next healthy branch above the prince
//   ?spawn=dark      (inside) with ?at: a dark stretch begins five metres above the start
//   ?spawn=gate      with ?at (below 400 m): a gate to the other place right above the start
//   ?spawn=vault     (inside) with ?at: a golden door to the treasury right above the start (vault1 to vault6: the room begins with that section)
//   ?spawn=chimney   (inside) with ?at: a fireplace right above the start, the way into Lord Springalot's chimney (chimney.js)
//   ?spawn=stairs    (inside) with ?at: a flight of stairs right above the start
//   ?spawn=cat       (inside) the witch's cat on the next healthy ledge above the prince
//   ?spawn=ghost     (inside) a ghost with its candle a few metres above the prince
//   ?spawn=web       (inside) a spider's web under the next healthy ledge above the prince (a ledge is made if none is in view)
//   ?spawn=flock     with ?at: a flock of starlings a dozen metres above the start
//   ?place=inside    the round is climbed inside the tower (or outside), whatever the title's choice
//   ?dev=1           show altitude and zone in the corner
//   ?veil=0.5        how strongly the tower's wall is set back outside (0 not at all, up to 0.9; background.js TOWER_VEIL)
//   ?wall=ivy        one look of the tower's wall all the way up (ivy|worn|stone|moss|mended|briar; plain: none of them)
//   ?len=stub        every branch gets that length class (stub|short|normal|long)
//   ?stages=1        the tower in stages for this visit (0: the endless game), whatever the title's choice (stages.js)
//   ?stage=3         start at the door into that stage (the first is 1)
//   ?lives=5         how many lives a round of stages has (stages.js STAGES.lives; inf: he goes on for ever)
//   ?story=1         tell the opening story on this visit (0: not; none given: once per device; story.js)
//   ?perf=1          the performance readout: frame times, where they go, the longest frames; a tap on its numbers takes the next
//                    resolution, a tap on its graph scales the picture up with hard pixels or smoothly (perf.js)
//   ?res=1.5         the drawing resolution in pixels per logical pixel (1.5, 1.25, 1, 0.75 or 0.5; screen: the screen's own;
//                    none given: config.js RESOLUTION)
//   ?px=hard         the screen scales the picture up with hard pixels, not smoothly (what keeps a resolution below 1 sharp)
//   ?weather=snow    the weather outside for this visit: rain, storm, snow, blizzard, golden or clear (weather.js)
//   ?storm=8         the endless tower's first storm draws up after so many seconds of the round (weather.js STORM_CLOCK)
//   ?season=winter   as around Christmas, the lawn and the title snowed in (summer: not, whatever the date)
//   ?who=lord        Lord Springalot climbs the tower on this visit, whatever the title's switch says (prince: the prince; player.js FIGURES)
//   ?letters=0       paint every text with the browser as before the letter sheets (gfx/renderer.js _sheet), to compare
import { PX_PER_METER, PARALLAX_TOWER } from './config.js';
import { Platform, BRANCH_LEN, GALLERY_X } from './platforms.js';
import { zoneAt } from './level.js';
import { TREELINE_Y } from './altitude.js';
import { Lightning, Guard, Flowerpot, Grabber, Ghost } from './enemies.js';
import { windowsBetween } from './windows.js';
import { hatchesBetween, hasDoor } from './pillars.js';
import { STONE_STYLE } from './art/interior.js';
import { PowerUp } from './pickups.js';
import { stageAt } from './stages.js';
import { POWERS } from './powerups.js';

export function devParams() {
  const q = new URLSearchParams(location.search);
  return { at: +q.get('at') || 0, spawn: q.get('spawn') || '', dev: q.get('dev') === '1', len: q.get('len') || '', place: q.get('place') || '', veil: q.get('veil'), wall: q.get('wall') || '',
    stages: q.get('stages') || '', stage: Math.max(0, Math.floor(+q.get('stage') || 0)), lives: q.get('lives') || '', story: q.get('story') || '', perf: q.get('perf') || '', res: q.get('res') || '', letters: q.get('letters') || '', px: q.get('px') || '', weather: q.get('weather') || '', season: q.get('season') || '', storm: q.get('storm'), who: q.get('who') || '' };
}

// Teleport a fresh round to an altitude (in metres) before it starts.
// `spawn` is the ?spawn element: a braid cut must be planned before the
// rows above are generated, so it is handled here.
export function startAt(world, metres, spawn = '', overBranch = false) {
  const y = Math.max(0, metres) * PX_PER_METER;
  if (!y) return;
  if (spawn === 'scissors') world.level.nextCutY = y - 400;
  if (spawn === 'dark' && world.place.inside) world.level.nextDarkY = y + 500;          // the lights go out five metres above the start
  else if (world.level.nextDarkY < y + 2500) world.level.nextDarkY = y + 2500 + world.level.rngDark.range(0, 6000);   // not on top of the start (a dark stretch that was due below it)
  if (spawn === 'gate') world.level.nextGateY = y + 100;                               // the first row above the start is a gate's
  else world.level.nextGateY = Math.max(world.level.nextGateY, y + 2500);              // not on top of the start
  const vault = /^vault(\d)?$/.exec(spawn);
  if (vault && world.place.inside) { world.level.nextVaultY = y + 100; if (vault[1]) world.level.forcePlan = +vault[1] - 1; }   // the first row above the start has a golden door
  else world.level.nextVaultY = Math.max(world.level.nextVaultY, y + 2500);              // not on top of the start
  if (spawn === 'chimney' && world.place.inside) world.level.nextChimneyY = y + 100;   // the first row above the start has a fireplace: the way into the chimney
  if (spawn === 'stairs' && world.place.inside) world.level.forceLayout = 'stairsR';   // the row above the start is a flight of stairs
  // the flock a dozen metres up (so its stream is whole before he gets there), and no braid cut in its way
  if (spawn === 'flock') { world.level.nextFlockY = y + 1200; world.level.nextCutY = Math.max(world.level.nextCutY, y + 5000); }
  else world.level.nextFlockY = Math.max(world.level.nextFlockY, y + 2500);   // not on top of the start
  const p = world.player;
  p.y = y; p.prevY = y; p.maxY = y; p.vy = 0;
  world.cam.y = y - 520; world.cam.target = world.cam.y; world.cam.maxY = world.cam.y;
  world.level.nextY = y - 200; world.level.lastSafeY = y - 200;
  world.level.modelCam = world.cam.y;
  world.nextWitchY = Math.max(world.nextWitchY, y + 3000);
  world.nextStorkY = Math.max(world.nextStorkY, y + 400);
  world.level.nextPowerY = y + world.level.rngPower.range(600, 2500);   // one within the first 25 m of the start
  world.nextMilestone = Math.floor(metres / 100) * 100 + 100;   // no stacked milestone toasts
  world.hintShown = true;
  world.platforms = world.platforms.filter((q) => q.kind === 'ground');
  world.platforms.push(y > TREELINE_Y && world.place.sky ? new Platform('cloud', y - 10, { x: -190, cloud: 'thick' }) : new Platform('branchL', y - 10, { style: world.place.inside ? STONE_STYLE : 0 })); // something to land on at the start
  // In the browser the prince starts over that branch, so a round nobody
  // steers bounces there instead of dropping past it (the simulator keeps
  // its start in the middle: its reports are measured from there).
  if (overBranch) p.x = world.platforms[world.platforms.length - 1].x;
  world.enemies.length = 0; world.pickups.length = 0;
  world.level.generateUpTo(world.cam.top + 900);
}

// A fresh round in stages begins at stage n (0 is the first) instead of on
// the lawn: he stands where that stage's door would have let him in, in its
// place, and goes on from there after a fall.
export function startStage(world, n) {
  if (!world.route || n <= 0) return;
  const st = stageAt(world.route, n);
  // as if he had come through every door below without going back once: he has climbed what those stages are long
  let base = 0;
  for (let i = 0; i < n; i++) base += stageAt(world.route, i).len * PX_PER_METER;
  world.setPlace(st.place);
  world.level.stage = { ...st, base, y0: st.from };
  world.level.restartFrom(st.from, 300);      // (the place's zones)
  world.level.beginStage();
  startAt(world, st.from / PX_PER_METER, '', true);
  world.scoreBase = base; world.scoreFrom = st.from; world.topY = st.from;
  world.bg.setWall(st.wall, world.cam, st.n, st.roses);
  world.nextMilestone = Math.floor(world.heightM / 100) * 100 + 100;
  // the branch startAt put under him stands in for the door
  const start = world.platforms.find((q) => q.kind !== 'ground' && Math.abs(q.y - (st.from - 10)) < 1);
  world.checkpoint = start ? { door: start, camY: world.cam.y } : null;
}

// Force a branch length class for the whole round (before the level generates).
export function forceLen(world, len) {
  if (len && BRANCH_LEN[len]) world.level.forceLen = len;
}

// Spawn an element on the first healthy branch above the prince.
export function spawnNear(world, element) {
  if (!element) return;
  const p = world.player;
  const branches = world.platforms.filter((q) => (q.kind === 'branchL' || q.kind === 'branchR') && !q.dry && q.y > p.y + 50).sort((a, b) => a.y - b.y);
  if (element === 'squirrel' && branches[0]) world.level.spawnSquirrel([branches[0]]);
  if (element === 'bat') {
    // the first branch above that has room for one (no stub, no spider on it)
    for (const b of branches) { const bat = world.level.spawnBat([b]); if (bat) { bat.rest = 0; break; } }
  }
  if (element === 'cat') {
    // on the first ledge above that has room for it; a ledge is made if none is in view
    let cat = null;
    for (const b of branches) { cat = world.level.spawnCat([b]); if (cat) break; }
    if (!cat) { const b = new Platform('branchR', p.y + 430, { style: STONE_STYLE }); world.platforms.push(b); cat = world.level.spawnCat([b]); }
    if (cat) cat.rest = 0;
  }
  if (element === 'web') {
    // under the first ledge above that can carry one; a ledge is made if none is in view
    let web = null;
    for (const b of branches) { web = world.level.spawnWeb([b]); if (web) break; }
    if (!web) { const b = new Platform('branchR', p.y + 430, { style: STONE_STYLE }); world.platforms.push(b); world.level.spawnWeb([b]); }
  }
  if (element === 'guard' || element === 'pot') {
    // on the next healthy balcony above; make one if there is none in view
    // (inside the tower: on a gallery)
    const kind = world.place.inside ? 'gallery' : 'balcony';
    let b = world.platforms.filter((q) => q.kind === kind && !q.dry && q.y > p.y + 50).sort((a, c) => a.y - c.y)[0];
    if (!b) {
      const y = p.y + 420, side = 'R';
      b = kind === 'gallery' ? new Platform('gallery', y, { side, x: GALLERY_X })
        : new Platform('balcony', y, { side, x: 210, variant: 0, ly: Platform.worldToLayer(y, Platform.layerFactor('balcony'), world.cam.y) });
      world.platforms.push(b);
    }
    world.enemies.push(element === 'guard' ? new Guard(b, world.level.child()) : new Flowerpot(b, world.level.child()));
  }
  if (element === 'grabber' && world.place.inside) {
    // the nearest hatch in a pillar above the prince
    const h = hatchesBetween(p.y + 100, p.y + 3000, world.platforms.filter(hasDoor))[0];
    if (h) world.enemies.push(new Grabber(h, world.level.child(world.level.rngTower), 180, world.cam.y));
  } else if (element === 'grabber') {
    // the nearest window above the prince, in layer coordinates
    const ly = Platform.worldToLayer(p.y, PARALLAX_TOWER, world.cam.y);
    const balconies = world.platforms.filter((q) => q.kind === 'balcony');
    const w = windowsBetween(ly + 100, ly + 3000, balconies)[0];
    if (w) world.enemies.push(new Grabber(w, world.level.child(world.level.rngTower), 150, world.cam.y));
  }
  if (element === 'ghost') world.enemies.push(new Ghost(-120, p.y + 460, 1, 90, 0.5, world.level.child(world.level.rngFauna)));
  if (element === 'stork') world.spawnStork();
  if (POWERS[element]) world.pickups.push(new PowerUp(element, p.x, p.y + 360));
  if (element === 'updraft') {
    const next = world.platforms.filter((q) => q.kind !== 'ground' && q.y > p.y + 380).sort((a, b) => a.y - b.y)[0];
    if (next) world.spawnUpdraft(next.x, p.y + 80, next.y - 90);
  }
  if (element === 'storm') {
    const cloud = world.platforms.filter((q) => q.kind === 'cloud' && !q.dry && q.y > p.y + 50).sort((a, b) => a.y - b.y)[0];
    if (cloud) { cloud.cloud = 'storm'; cloud.drift = null; cloud.vx = 0; world.enemies.push(new Lightning(cloud)); }
  }
}

export function devLabel(world) {
  const st = world.route && world.level.stage;
  return `${world.heightM} m  ${world.vault ? 'the treasury' : zoneAt(world.player.maxY, world.level.zones).name}  e${world.enemies.length}${st ? `  stage ${st.n + 1} ${st.key}: at ${Math.round(world.player.maxY / PX_PER_METER)} of ${Math.round(st.from / PX_PER_METER)}-${Math.round(st.to / PX_PER_METER)} m` : ''}`;
}
