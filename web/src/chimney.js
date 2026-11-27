import { W, H, PARALLAX_TOWER } from './config.js';
import { Platform } from './platforms.js';
import { Sun } from './pickups.js';
import { CHIMNEY_LOOK as LOOK } from './art/chimney.js';
import { hash } from './altitude.js';

// The chimney: Lord Springalot's room (a trial, docs/DESIGN.md). A
// fireplace inside the tower leads into it (dev.js ?spawn=chimney builds
// one; world.js leads through, as through a golden door), and from the
// hearth up it is the lord who is played, not the prince: he is small
// enough for it. A brick shaft half as wide as the tower, some 25 m high,
// with a floor and a throat it narrows to, and at the top a soot door back
// into the tower, where the prince goes on.
//
// It is built for the lord's hops, which are short and quick (player.js
// FIGURES): ledges of brick out of the two walls and kettles on the pot
// chain, a hop and a half apart, and iron dampers that reach across more
// than half the shaft. A damper is a floor from above and a ceiling from
// below: he has to hop up past its end. The walls are walls: nobody goes
// out of one side of the picture and comes in at the other in here.
//
// To the world it is a room like the treasury (the same camera, the same
// bubble for one who drops out of the picture, nobody in it, nothing that
// crumbles): `world.vault` is this room while he is in it, with `chimney`
// set, and the place is CHIMNEY (places.js).
export const CHIMNEY = {
  half: 192,             // from the middle of the shaft to a wall
  ledgeX: 140,           // the middle of a ledge out of a wall
  damperX: 108,          // and of a damper
  exitX: 100,            // the soot door, on the back of the shaft
  exitOver: 160,         // above the last thing in the list
  headroom: 420,         // from the soot door up to the throat
  floorShown: 100,       // how far above the picture's bottom edge the hearth lies when he comes in
  ceilingShown: 60,      // how much of the throat the picture shows at the most
};

// What stands in the shaft, in px over the hearth, written with the first
// ledge on the left (the builder mirrors the whole shaft or not):
//   ['ledge', side, y]           brick out of that wall
//   ['kettle', y]                on the pot chain down the middle
//   ['damper', side, y]          an iron plate out of that wall
//   ['row', x, y, n, dx]         n suns side by side, centred on x
//   ['col', x, y, n, dy]         n suns one over the other, from y up
//   ['arc', x, y, half, rise, n] an arc of n suns over x
const SHAFT = [
  ['ledge', 'L', 160], ['row', -140, 250, 2, 48],
  ['ledge', 'R', 310], ['row', 140, 400, 2, 48],
  ['kettle', 470], ['col', 0, 560, 2, 56],
  ['ledge', 'L', 620], ['col', -150, 710, 3, 52],
  ['damper', 'R', 770], ['row', 110, 860, 3, 48],
  ['kettle', 930], ['col', 0, 1020, 2, 56],
  ['ledge', 'R', 1080], ['col', 150, 1170, 3, 52],
  ['damper', 'L', 1230], ['row', -110, 1320, 3, 48],
  ['kettle', 1390], ['col', 0, 1480, 2, 56],
  ['ledge', 'L', 1540], ['row', -140, 1630, 2, 48],
  ['ledge', 'R', 1690], ['row', 140, 1780, 2, 48],
  ['kettle', 1840], ['arc', 0, 1950, 120, 50, 5],
];
const LAST = 1840;

// Furnish the shaft whose hearth is at `floor` (the prince's plane).
// Everything goes into the world's lists; `rng` gives the suns their bob
// and says which way round the shaft is. Returns what the world and the
// painter need: { chimney, half, floor, top, exitY, exit (its gate), camLo, camHi, suns }.
export function furnishChimney(world, floor, rng) {
  const plats = world.platforms, picks = world.pickups;
  const room = { chimney: true, half: CHIMNEY.half, floor, top: 0, exitY: 0, exit: null, camLo: floor - CHIMNEY.floorShown, camHi: 0, suns: 0, sections: ['the chimney'] };
  const m = rng.chance(0.5) ? 1 : -1, at = (y) => floor + y, dir = (side) => (side === 'L' ? -m : m);
  const sun = (x, y) => { picks.push(new Sun(m * x, at(y), rng)); room.suns++; };
  plats.push(new Platform('vaultFloor', floor));
  for (const t of SHAFT) {
    switch (t[0]) {
      case 'ledge': plats.push(new Platform('flue', at(t[2]), { side: dir(t[1]) < 0 ? 'L' : 'R', x: dir(t[1]) * CHIMNEY.ledgeX })); break;
      case 'damper': plats.push(new Platform('damper', at(t[2]), { side: dir(t[1]) < 0 ? 'L' : 'R', x: dir(t[1]) * CHIMNEY.damperX })); break;
      case 'kettle': plats.push(new Platform('kettle', at(t[1]))); break;
      case 'row': for (let i = 0; i < t[3]; i++) sun(t[1] + (i - (t[3] - 1) / 2) * t[4], t[2]); break;
      case 'col': for (let i = 0; i < t[3]; i++) sun(t[1], t[2] + i * t[4]); break;
      case 'arc': for (let i = 0; i < t[5]; i++) { const u = t[5] > 1 ? (i / (t[5] - 1)) * 2 - 1 : 0; sun(t[1] + u * t[3], t[2] + (1 - u * u) * t[4]); } break;
    }
  }
  room.exitY = floor + LAST + CHIMNEY.exitOver;
  room.top = room.exitY + CHIMNEY.headroom;
  room.camHi = Math.max(room.camLo, room.top + CHIMNEY.ceilingShown - H);
  // the soot door: on the back of the shaft (the wall's layer), at its height in his plane when the camera is as high as it goes
  const es = m > 0 ? 'L' : 'R';
  room.exit = new Platform('gate', room.exitY, { side: es, x: (es === 'L' ? -1 : 1) * CHIMNEY.exitX, gold: 'out', chimney: true, ly: Platform.worldToLayer(room.exitY, PARALLAX_TOWER, room.camHi) });
  plats.push(room.exit);
  return room;
}

// --- the shaft's picture -----------------------------------------------------------
// Drawn by the inside's painter (interior.js hands over when the place is
// the chimney): the back of the shaft a little further away than the lord,
// as the tower's wall is; the pot chain; the two walls in his plane, from
// the corners out to the picture's edges; the throat at the top with the
// day above it; the hearth at the bottom, its coals the room's warm light.
export function drawChimneyBack(interior, g, cam, time, world) {
  const A = interior.art.interior, S = interior.art.chimney, room = world.vault, half = room.half;
  const camF = cam.layerY(PARALLAX_TOWER), TH = S.back[0].h;
  g.rect(0, 0, W, H, LOOK.dark);
  // the back of the shaft
  for (let k = Math.floor(camF / TH) - 1; k <= Math.ceil((camF + H) / TH); k++) g.blit(S.back[hash(k * 13 + 1) % 2], W / 2 + cam.ox, H - (k * TH - camF) + cam.oy);
  // the pot chain down the middle, from the throat to the lowest kettle's height over the hearth
  const step = 40, bottom = Math.max(room.floor + 200, Math.floor((cam.y - 60) / step) * step), topLink = Math.min(room.top, cam.top + 60);
  for (let y = Math.floor(topLink / step) * step; y >= bottom; y -= step) g.blit(A.chain, cam.sx(interior.chainX(y, time)), cam.sy(y + step));
  if (cam.y < room.floor + 260) g.blit(A.chainEnd, cam.sx(interior.chainX(room.floor + 200, time)), cam.sy(room.floor + 200));
  // soot on its way up: a few specks, each on its own slow path
  for (let i = 0; i < 14; i++) {
    const h = hash(i * 31 + 7), u = (time * (0.05 + (h % 7) * 0.012) + (h % 100) / 100) % 1;
    const x = ((h >>> 8) % (half * 2 - 40)) - half + 20 + Math.sin(time * 0.9 + i) * 14;
    g.rect(cam.sx(x), H - u * (H + 40) + 20, 4, 4, LOOK.soot, 0.5 * Math.sin(Math.PI * u));
  }
  // the hearth and what glows on it
  const fy = cam.sy(room.floor);
  if (fy < H + 60) {
    g.rect(0, fy, W, H - fy + 60, LOOK.dark);
    g.blit(S.hearth, W / 2 + cam.ox, fy, { glow: 0.25 });
    const fl = 0.85 + 0.15 * Math.sin(time * 7) * Math.sin(time * 2.3);
    g.halo(W / 2 + cam.ox, fy, 260, LOOK.emberLight, 0.22 * fl, { glow: 0.4 });
    interior.glow(W / 2 + cam.ox, fy - 40, 460, LOOK.emberLight, 0.3 * fl);
  }
  // the walls, in his plane
  const WH = S.wall[0].h, lx = W / 2 - half + cam.ox, rx = W / 2 + half + cam.ox;
  for (let k = Math.floor(cam.y / WH) - 1; k <= Math.ceil(cam.top / WH); k++) {
    const sy = cam.sy(k * WH);
    g.blit(S.wall[hash(k * 7 + 3) % 2], lx, sy);
    g.blit(S.wall[hash(k * 7 + 5) % 2], rx, sy, FLIP);
  }
  // their shadow on the back of the shaft
  g.rect(lx, 0, 14, H, 'rgba(0,0,0,0.25)');
  g.rect(rx - 14, 0, 14, H, 'rgba(0,0,0,0.25)');
  // the throat: the shaft draws in to a slit of daylight
  const cy = cam.sy(room.top);
  if (cy > -20) {
    g.rect(0, cy - H, W, H, LOOK.throat);
    g.rect(W / 2 - 44 + cam.ox, cy - 150, 88, 150, LOOK.dayLight, 0.5);
    g.rect(0, cy - 16, W, 16, LOOK.lip); g.rect(0, cy - 4, W, 4, LOOK.lipHi); g.rect(0, cy, W, 10, 'rgba(0,0,0,0.3)');
    interior.glow(W / 2 + cam.ox, cy + 60, 380, LOOK.dayLight, 0.14);
  }
}
const FLIP = { flip: true };

// The shaft's light: dim, so that the coals below and the day above count.
export function chimneyLighting(g) { g.lighting(LOOK.ambient, LOOK.dim); }
