// Development helpers, enabled through URL parameters (harmless in play):
//   ?at=150          start the round at 150 m
//   ?spawn=squirrel  put that element on the next branch above the prince
//   ?spawn=storm     turn the next cloud above the prince into a storm cloud
//   ?spawn=stork     send a stork across the screen now
//   ?spawn=guard     a guard on the next balcony above (a balcony is made if none is in view)
//   ?spawn=pot       a flowerpot on the next balcony above
//   ?spawn=updraft   put an updraft column under the next platform
//   ?dev=1           show altitude and zone in the corner
//   ?len=stub        every branch gets that length class (stub|short|normal|long)
import { PX_PER_METER } from './config.js';
import { Platform, BRANCH_LEN } from './platforms.js';
import { zoneAt } from './level.js';
import { TREELINE_Y } from './altitude.js';
import { Lightning, Guard, Flowerpot } from './enemies.js';

export function devParams() {
  const q = new URLSearchParams(location.search);
  return { at: +q.get('at') || 0, spawn: q.get('spawn') || '', dev: q.get('dev') === '1', len: q.get('len') || '' };
}

// Teleport a fresh round to an altitude (in metres) before it starts.
export function startAt(world, metres) {
  const y = Math.max(0, metres) * PX_PER_METER;
  if (!y) return;
  const p = world.player;
  p.y = y; p.prevY = y; p.maxY = y; p.vy = 0;
  world.cam.y = y - 520; world.cam.target = world.cam.y; world.cam.maxY = world.cam.y;
  world.level.nextY = y - 200; world.level.lastSafeY = y - 200;
  world.level.modelCam = world.cam.y;
  world.nextWitchY = Math.max(world.nextWitchY, y + 3000);
  world.nextStorkY = Math.max(world.nextStorkY, y + 400);
  world.nextMilestone = Math.floor(metres / 100) * 100 + 100;   // no stacked milestone toasts
  world.hintShown = true;
  world.platforms = world.platforms.filter((q) => q.kind === 'ground');
  world.platforms.push(y > TREELINE_Y ? new Platform('cloud', y - 10, { x: -190, cloud: 'thick' }) : new Platform('branchL', y - 10)); // something to land on at the start
  world.enemies.length = 0; world.pickups.length = 0;
  world.level.generateUpTo(world.cam.top + 900);
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
  if (element === 'guard' || element === 'pot') {
    // on the next healthy balcony above; make one if there is none in view
    let b = world.platforms.filter((q) => q.kind === 'balcony' && !q.dry && q.y > p.y + 50).sort((a, c) => a.y - c.y)[0];
    if (!b) {
      const y = p.y + 420, side = 'R';
      b = new Platform('balcony', y, { side, x: 210, variant: 0, ly: Platform.worldToLayer(y, Platform.layerFactor('balcony'), world.cam.y) });
      world.platforms.push(b);
    }
    world.enemies.push(element === 'guard' ? new Guard(b, world.level.child()) : new Flowerpot(b, world.level.child()));
  }
  if (element === 'stork') world.spawnStork();
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
  return `${world.heightM} m  ${zoneAt(world.player.maxY).name}  e${world.enemies.length}`;
}
