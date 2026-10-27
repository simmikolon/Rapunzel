// Development helpers, enabled through URL parameters (harmless in play):
//   ?at=150          start the round at 150 m
//   ?spawn=squirrel  put that element on the next branch above the prince
//   ?dev=1           show altitude and zone in the corner
import { PX_PER_METER } from './config.js';
import { Platform } from './platforms.js';
import { zoneAt } from './level.js';

export function devParams() {
  const q = new URLSearchParams(location.search);
  return { at: +q.get('at') || 0, spawn: q.get('spawn') || '', dev: q.get('dev') === '1' };
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
  world.platforms = world.platforms.filter((q) => q.kind === 'ground');
  world.platforms.push(new Platform('branchL', y - 10)); // something to land on at the start
  world.enemies.length = 0; world.pickups.length = 0;
  world.level.generateUpTo(world.cam.top + 900);
}

// Spawn an element on the first healthy branch above the prince.
export function spawnNear(world, element) {
  if (!element) return;
  const p = world.player;
  const branches = world.platforms.filter((q) => (q.kind === 'branchL' || q.kind === 'branchR') && !q.dry && q.y > p.y + 50).sort((a, b) => a.y - b.y);
  if (element === 'squirrel' && branches[0]) world.level.spawnSquirrel([branches[0]]);
}

export function devLabel(world) {
  return `${world.heightM} m  ${zoneAt(world.player.maxY).name}  e${world.enemies.length}`;
}
