import { W, H, PARALLAX_TOWER } from './config.js';
import { Platform, GATE_X } from './platforms.js';
import { Sun, Heart, PowerUp } from './pickups.js';
import { STONE_STYLE, INSIDE } from './art/interior.js';
import { VAULT_LOOK } from './art/vault.js';
import { TILE_H, TRUNK_W } from './art/tiles.js';
import { hash } from './altitude.js';
import { PILLAR_X, TORCH_Y, TORCH, PLAIN } from './pillars.js';

// The treasury: the witch's hoard, behind a golden door inside the tower
// (level.js builds the door's row; world.js leads through, as through a
// gate). A room of its own, VAULT.top high between the tower's two pillars,
// with a floor and a ceiling, full of suns. There is nobody in it, nothing
// crumbles, and nobody falls: the camera is the tower's (it only climbs,
// and stops under the ceiling), and a prince who drops out of the bottom of
// the picture is taken by a golden bubble and set down on the lowest thing
// in it he can stand on (world.js rescue). It is a reward, not a test: all
// one can lose in here is what hangs below the picture.
//
// The way out is that door, VAULT.exit above the floor: he comes out into
// the tower that much higher than he went in, and the climb counts.
//
// What is in a room is one of PLANS, laid out for a door on the left and
// mirrored for one on the right: ledges and chandeliers to stand on (the
// tower's own), chests (a platform that opens the first time he lands on
// it: CHEST_SUNS at once), suns in rows, columns, arcs, rings and one
// figure near the ceiling, a heart, and in one plan the sun magnet over the
// first ledge, with the suns spread wider than anyone would collect without it.
export const VAULT = {
  exit: 2040,            // the door out, above the floor
  top: 2760,             // the ceiling: high enough that a bounce off the highest thing in the room stays under it (a boost reaches it: he bumps his head)
  chest: 64,             // how high a chest stands
  floorShown: 100,       // how far above the picture's bottom edge the floor lies when he comes in (the lawn's place at a round's start)
  ceilingShown: 60,      // how much of the ceiling's stone the picture shows at the most: the camera stops there
};
export const CHEST_SUNS = 8;

// A plan's things, in px from the floor's middle, for a door on the left:
//   ['ledge', side, y, len]      a stone ledge from that side's pillar ('normal' or 'long')
//   ['chandelier', y]            on the chain down the middle
//   ['chest', x, y]              standing at height y (the floor is 0, a ledge its y)
//   ['row', x, y, n, dx]         n suns side by side, centred on x
//   ['col', x, y, n, dy]         n suns one over the other, from y up
//   ['arc', x, y, half, rise, n] an arc of n suns over x, `half` wide to each side, `rise` high
//   ['ring', x, y, r, n]         n suns in a circle
//   ['crown', x, y]              the figure under the ceiling: a crown of suns
//   ['heart', x, y]              a heart
//   ['power', kind, x, y]        a power-up
//   ['exit', side]               the door out
const PLANS = [
  // the stair: from side to side over the chain, a chest on the way
  [
    ['chest', 196, 0], ['arc', 20, 120, 150, 70, 5],
    ['ledge', 'R', 330, 'long'], ['row', 143, 440, 5, 52], ['col', -160, 400, 3, 60],
    ['chandelier', 640], ['col', 0, 750, 3, 60], ['arc', -170, 720, 80, 50, 4],
    ['ledge', 'L', 950, 'long'], ['chest', -232, 950], ['row', -100, 1060, 4, 52],
    ['chandelier', 1260], ['col', 0, 1370, 3, 60], ['heart', 200, 1300], ['arc', 180, 1150, 70, 40, 3],
    ['ledge', 'R', 1570, 'long'], ['chest', 232, 1570], ['row', 100, 1680, 4, 52],
    ['chandelier', 1830], ['col', 0, 1940, 3, 60], ['ring', 150, 2200, 96, 8],
    ['exit', 'L'],
  ],
  // the well: ledges on both sides, the chain between them, suns up the middle
  [
    ['chest', 196, 0], ['row', 20, 130, 5, 56],
    ['ledge', 'L', 330, 'normal'], ['ledge', 'R', 330, 'normal'], ['arc', 0, 450, 130, 80, 5], ['col', -195, 440, 2, 60], ['col', 195, 440, 2, 60],
    ['chandelier', 640], ['col', 0, 750, 4, 60],
    ['ledge', 'L', 960, 'long'], ['chest', -232, 960], ['row', -90, 1070, 4, 52],
    ['ledge', 'R', 1250, 'long'], ['chest', 232, 1250], ['row', 90, 1360, 4, 52],
    ['chandelier', 1540], ['ring', 0, 1700, 96, 6], ['heart', 0, 1700],
    ['ledge', 'L', 1820, 'normal'], ['ledge', 'R', 1820, 'normal'], ['row', -195, 1930, 3, 52], ['row', 195, 1930, 3, 52],
    ['crown', -110, 2260],
    ['exit', 'R'],
  ],
  // the magnet's room: the sun magnet hangs over the first ledge, and the suns hang where only it reaches
  [
    ['chest', 196, 0], ['arc', 20, 120, 150, 70, 4],
    ['ledge', 'R', 330, 'long'], ['power', 'magnet', 70, 560], ['ring', -150, 470, 80, 6], ['row', 170, 440, 3, 52],
    ['chandelier', 640], ['row', 200, 760, 3, 56], ['row', -200, 860, 3, 56], ['col', 0, 750, 3, 60],
    ['ledge', 'L', 950, 'long'], ['ring', 160, 1090, 80, 6], ['row', -143, 1060, 4, 52],
    ['chandelier', 1260], ['col', -230, 1300, 3, 60], ['col', 230, 1300, 3, 60], ['heart', 0, 1420],
    ['ledge', 'R', 1570, 'long'], ['chest', 232, 1570], ['ring', -150, 1700, 80, 6], ['row', 100, 1680, 3, 52],
    ['chandelier', 1830], ['col', 0, 1940, 3, 60], ['crown', 110, 2260],
    ['exit', 'L'],
  ],
];

// The crown of suns: a band and five points, the middle one highest.
const CROWN = [[-112, 0], [-56, 0], [0, 0], [56, 0], [112, 0], [-112, 64], [-56, 34], [0, 86], [56, 34], [112, 64]];

// Furnish the room whose floor is at `floor` (the prince's plane) for a
// prince who came in by a door on `side` ('L' | 'R'). Everything goes into
// the world's lists; `rng` picks the plan and gives the suns their bob.
// Returns what the world and the painter need to know about the room:
// { floor, top, exitY, exit (its gate), door: { x, ly } (the one he came by, on the wall's layer), camLo, camHi, suns }.
export function furnishVault(world, floor, side, rng, plan = null) {
  const m = side === 'L' ? 1 : -1;                       // plans are written for a door on the left
  const flip = (s) => (m > 0 ? s : s === 'L' ? 'R' : 'L');
  const things = PLANS[plan != null ? plan % PLANS.length : rng.int(0, PLANS.length - 1)];
  const camLo = floor - VAULT.floorShown, camHi = Math.max(camLo, floor + VAULT.top + VAULT.ceilingShown - H);
  const room = { floor, top: floor + VAULT.top, exitY: floor + VAULT.exit, exit: null, door: { x: (side === 'L' ? -1 : 1) * GATE_X, ly: Platform.worldToLayer(floor, PARALLAX_TOWER, camLo) }, camLo, camHi, suns: 0 };
  const plats = world.platforms, picks = world.pickups;
  const sun = (x, y) => { picks.push(new Sun(m * x, floor + y, rng)); room.suns++; };
  plats.push(new Platform('vaultFloor', floor));
  for (const t of things) {
    switch (t[0]) {
      case 'ledge': plats.push(new Platform(flip(t[1]) === 'L' ? 'branchL' : 'branchR', floor + t[2], { len: t[3], style: STONE_STYLE, variant: rng.int(0, 4), lenScale: 1 })); break;
      case 'chandelier': plats.push(new Platform('chandelier', floor + t[1])); break;
      case 'chest': plats.push(new Platform('chest', floor + t[2] + VAULT.chest, { x: m * t[1] })); room.suns += CHEST_SUNS; break;
      case 'row': for (let i = 0; i < t[3]; i++) sun(t[1] + (i - (t[3] - 1) / 2) * t[4], t[2]); break;
      case 'col': for (let i = 0; i < t[3]; i++) sun(t[1], t[2] + i * t[4]); break;
      case 'arc': for (let i = 0; i < t[5]; i++) { const u = t[5] > 1 ? (i / (t[5] - 1)) * 2 - 1 : 0; sun(t[1] + u * t[3], t[2] + (1 - u * u) * t[4]); } break;
      case 'ring': for (let i = 0; i < t[4]; i++) { const a = (i / t[4]) * Math.PI * 2 + Math.PI / 2; sun(t[1] + Math.cos(a) * t[3], t[2] + Math.sin(a) * t[3]); } break;
      case 'crown': for (const [dx, dy] of CROWN) sun(t[1] + dx, t[2] + dy); break;
      case 'heart': picks.push(new Heart(m * t[1], floor + t[2], rng)); break;
      case 'power': picks.push(new PowerUp(t[1], m * t[2], floor + t[3], rng)); break;
      case 'exit': {
        // on the wall's layer, at its height in his plane when the camera is as high as it goes
        const es = flip(t[1]);
        room.exit = new Platform('gate', room.exitY, { side: es, x: (es === 'L' ? -1 : 1) * GATE_X, gold: 'out', ly: Platform.worldToLayer(room.exitY, PARALLAX_TOWER, camHi) });
        plats.push(room.exit);
        break;
      }
    }
  }
  return room;
}

// --- the room's picture ------------------------------------------------------------
// Drawn by the inside's painter (interior.js hands over when the place is
// the treasury): the same masonry in a warmer stone, no window (a
// treasury has none), torches on both pillars, the hoard heaped in the
// corners of the floor, and on the wall what a witch keeps with her gold.
// What only furnishes is stepped back as in the tower (art/vault.js), so
// that the suns one can take are the brightest gold in the room.
const WALL_DECOR = [['shelf', 6], ['pictures', 2], ['shield', 2], ['banner', 2], ['mirror', 1], ['none', 2]];
const pick = (table, n) => { let k = n % table.reduce((s, d) => s + d[1], 0); for (const [name, w] of table) { if (k < w) return name; k -= w; } return table[0][0]; };

export function drawVaultBack(interior, g, cam, time, world) {
  const A = interior.art.interior, V = interior.art.vault, room = world.vault;
  const camF = cam.layerY(PARALLAX_TOWER), toLayer = (y) => Platform.worldToLayer(y, PARALLAX_TOWER, cam.y);
  const tint = { tint: VAULT_LOOK.stone };
  g.rect(0, 0, W, H, VAULT_LOOK.dark);
  // the back wall, plain courses from under the floor to over the ceiling
  const first = Math.floor(camF / TILE_H) - 1, last = Math.ceil((camF + H) / TILE_H);
  for (let k = first; k <= last; k++) g.blit(A.wall[hash(k * 13 + 1) % 10 < 7 ? 0 : 1], W / 2 + cam.ox, H - (k * TILE_H - camF) + cam.oy, tint);
  // what hangs on it: one piece a side every 400 px, at heights that differ left and right
  const fl = room.door.ly, seed = Math.round(room.floor);
  for (let i = 0; fl + 420 + i * 400 < toLayer(room.top); i++) {
    for (const side of [-1, 1]) {
      const h = hash(seed + i * 37 + (side < 0 ? 5 : 11)), kind = pick(WALL_DECOR, h >>> 8);
      const ly = fl + 420 + i * 400 + (side < 0 ? 0 : 190) + (h >>> 16) % 40;
      if (kind === 'none' || ly > toLayer(room.top) - 60) continue;
      if (i === 0 && (room.door.x < 0 ? -1 : 1) === side) continue;      // nothing hangs down over the door he came in by
      // nothing hangs where the door out is
      if (room.exit && (room.exit.x < 0 ? -1 : 1) === side && ly > room.exit.ly - 60 && ly < room.exit.ly + 420) continue;
      const x = side * (176 + (h >>> 12) % 22), dx = W / 2 + x + cam.ox, dy = H - (ly - camF) + cam.oy;
      if (dy < -420 || dy > H + 60) continue;
      if (kind === 'shelf') g.blit(V.shelf[hash(h + 3) % V.shelf.length], dx, dy);
      else interior.drawPiece(g, cam, { kind, look: (h >>> 5) % 2, x, ly, h, only: kind === 'pictures' && i === 0 ? 'witch' : undefined }, dx, dy, side, i, time, world, cam.sx(world.player.x));
    }
  }
  // the door he came in by, shut behind him
  g.blit(V.door.spent, W / 2 + room.door.x + cam.ox, H - (room.door.ly - camF) + cam.oy);
  // the pillars' shadow on the wall
  g.rect(TRUNK_W + cam.ox, 0, 18, H, 'rgba(0,0,0,0.2)');
  g.rect(W - TRUNK_W - 18 + cam.ox, 0, 18, H, 'rgba(0,0,0,0.2)');
  // the chain down the middle, from the ceiling to a man's height over the floor
  const step = 40, bottom = Math.max(room.floor + 280, Math.floor((cam.y - 60) / step) * step), topLink = Math.min(room.top, cam.top + 60);
  for (let y = Math.floor(topLink / step) * step; y >= bottom; y -= step) g.blit(A.chain, cam.sx(interior.chainX(y, time)), cam.sy(y + step));
  if (cam.y < room.floor + 340) g.blit(A.chainEnd, cam.sx(interior.chainX(room.floor + 280, time)), cam.sy(room.floor + 280));
  // the ceiling: a mass of stone with a cornice under it
  const cy = cam.sy(room.top);
  if (cy > -20) {
    g.rect(0, cy - H, W, H, VAULT_LOOK.ceiling);
    g.rect(0, cy - 20, W, 20, VAULT_LOOK.cornice); g.rect(0, cy - 4, W, 4, VAULT_LOOK.corniceHi); g.rect(0, cy, W, 10, 'rgba(0,0,0,0.25)');
  }
  // the pillars: plain, a torch on each every third tile (the floor's stones run in front of their feet)
  const k0 = Math.floor(cam.y / TILE_H), k1 = Math.ceil(cam.top / TILE_H);
  for (let k = k0; k <= k1; k++) {
    const sy = cam.sy(k * TILE_H), lit = (((k % 3) + 3) % 3) === 1;
    for (const side of ['L', 'R']) {
      const v = lit ? TORCH : hash(k * 7 + (side === 'L' ? 3 : 5)) % 10 < 7 ? PLAIN : PLAIN + 1;
      g.blit(side === 'L' ? A.pillarL[v] : A.pillarR[v], (side === 'L' ? 0 : W) + cam.ox, sy, tint);
      if (!lit) continue;
      const tx = cam.sx(side === 'L' ? -PILLAR_X : PILLAR_X), ty = cam.sy(k * TILE_H + TORCH_Y);
      if (k * TILE_H + TORCH_Y < room.floor + 60 || k * TILE_H + TORCH_Y > room.top - 60) continue;
      const fl2 = 0.85 + 0.15 * Math.sin(time * 11 + k * 1.7) * Math.sin(time * 3.1 + k);
      g.halo(tx, ty - 26, 84, INSIDE.torchLight, 0.5 * fl2, { glow: 0.5 });
      g.blit(A.torch[Math.floor(time * 9 + k * 1.3) % 3], tx, ty, { glow: 0.5 });
      interior.glow(tx + (side === 'L' ? 40 : -40), ty - 20, 360, INSIDE.torchLight, 0.24 * fl2);
    }
  }
  // the floor and the hoard on it, in his plane
  const fy = cam.sy(room.floor);
  if (fy < H + 400) {
    const s = A.floor;
    g.blit(s, W / 2 + cam.ox, fy, tint);
    const under = fy + s.h - s.ay;
    if (under < H) g.rect(0, under, W, H - under, INSIDE.floorDark);
    for (const side of [-1, 1]) {
      // the great heap in the far corner; by the door he came in at, a small one that leaves it in view
      const small = (room.door.x < 0 ? -1 : 1) === side;
      const hx = W / 2 + side * (small ? 238 : 196) + cam.ox;
      g.blit((small ? V.pile : V.hoard)[side < 0 ? 'L' : 'R'], hx, fy + 4);
      interior.glow(hx, fy - 50, small ? 180 : 300, VAULT_LOOK.goldLight, small ? 0.1 : 0.16);
      if (small) continue;
      // the gold glints: a few sparkles that come and go over each heap
      for (let i = 0; i < 4; i++) {
        const hh = hash(seed + i * 7 + (side < 0 ? 1 : 2)), u = (time * (0.5 + (hh % 5) * 0.11) + (hh % 100) / 100) % 1;
        const sc = 0.5 + 0.6 * Math.sin(Math.PI * u);
        g.blit(interior.art.sign.sparkle, hx + ((hh >>> 4) % 200) - 100, fy - 16 - (hh >>> 12) % 84, { alpha: Math.sin(Math.PI * u) * 0.9, sx: sc, sy: sc, glow: 0.5 });
      }
    }
  }
}

// The room's light: warm and a little dim, so that the gold and the torches count.
export function vaultLighting(g) { g.lighting(VAULT_LOOK.ambient, VAULT_LOOK.dim); }
