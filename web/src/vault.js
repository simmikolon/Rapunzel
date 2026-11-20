import { W, H, PARALLAX_TOWER } from './config.js';
import { Platform, GATE_X } from './platforms.js';
import { Sun, Heart, PowerUp, Treasure } from './pickups.js';
import { STONE_STYLE, STAIR, INSIDE } from './art/interior.js';
import { VAULT_LOOK } from './art/vault.js';
import { TILE_H, TRUNK_W } from './art/tiles.js';
import { hash } from './altitude.js';
import { PILLAR_X, TORCH_Y, TORCH, PLAIN } from './pillars.js';

// The treasury: the witch's hoard, behind a golden door inside the tower
// (level.js builds the door's row; world.js leads through, as through a
// gate). A room of its own between the tower's two pillars, some 47 m high,
// with a floor and a ceiling, full of things to take. There is nobody in
// it, nothing crumbles, and nobody falls: the camera is the tower's (it
// only climbs, and stops under the ceiling), and a prince who drops out of
// the bottom of the picture is taken by a golden bubble and set down on the
// lowest thing in it he can stand on (world.js rescue). It is a reward, not
// a test: all one can lose in here is what hangs below the picture.
//
// The way out is a second golden door near the ceiling: he comes out into
// the tower that much higher than he went in (about VAULT.rise), and the
// climb counts.
//
// A room is put together, not drawn up as a whole: the floor (the hoard in
// its corners, a chest), then SECTIONS_A_ROOM of SECTIONS, no two the same,
// one on top of the other, each mirrored or not, then the top (two ledges,
// a crown of suns around the real one, the door out). Every section ends
// with a chandelier in the middle, so the next one knows what it stands
// over. What there is to take: suns (rows over the ledges, columns up the
// chain, arcs, rings), chests (a platform that opens the first time he
// lands on it: CHEST_SUNS at once), and pieces of the hoard, which count
// as suns (pickups.js TREASURE: a cut stone, a goblet, the crown). One
// heart, in the middle section. One section hangs the sun magnet over its
// first ledge and its suns where only that reaches.
export const VAULT = {
  rise: 4100,            // about how far the door out is above the floor (a room's own figure depends on its sections; the level plans with this)
  exitOver: 520,         // the door out, above the last section's chandelier
  headroom: 720,         // from the door out up to the ceiling: a bounce off the highest thing in the room stays under it (a boost reaches it: he bumps his head)
  chest: 64,             // how high a chest stands
  floorShown: 100,       // how far above the picture's bottom edge the floor lies when he comes in (the lawn's place at a round's start)
  ceilingShown: 60,      // how much of the ceiling's stone the picture shows at the most: the camera stops there
};
export const CHEST_SUNS = 8;
export const SECTIONS_A_ROOM = 3;

// A section's things, in px from the middle of what it stands on (the
// floor, or the chandelier the section below ends with), written with its
// first ledge on the right (the builder mirrors):
//   ['ledge', side, y, len]      a stone ledge from that side's pillar ('normal' or 'long')
//   ['chandelier', y]            on the chain down the middle
//   ['stairs', side, y]          a flight of stairs up to that side's pillar, its lowest tread at y, a sun over each tread
//   ['chest', x, y]              standing at height y (on the floor, or on a ledge at that height)
//   ['row', x, y, n, dx]         n suns side by side, centred on x
//   ['col', x, y, n, dy]         n suns one over the other, from y up
//   ['arc', x, y, half, rise, n] an arc of n suns over x, `half` wide to each side, `rise` high
//   ['ring', x, y, r, n]         n suns in a circle
//   ['crown', x, y]              the figure under the ceiling: a crown of suns
//   ['gem' | 'goblet' | 'crownT', x, y]   a piece of the hoard to take (the last is the crown itself)
//   ['heart', x, y]              the room's heart (only the middle section's is hung)
//   ['power', kind, x, y]        a power-up
// `h` is where its last chandelier hangs: the next section stands on that.
const FLOOR = [['chest', 196, 0], ['goblet', 196, 210], ['arc', 20, 130, 130, 60, 5], ['gem', -70, 235], ['gem', 50, 235]];
const SECTIONS = [
  { name: 'the stair', h: 1250, things: [
    ['ledge', 'R', 320, 'long'], ['row', 143, 430, 5, 52], ['gem', -180, 430], ['gem', -230, 520], ['goblet', -110, 560],
    ['chandelier', 630], ['col', 0, 740, 2, 60], ['arc', -170, 720, 80, 50, 4], ['heart', 190, 700], ['gem', 240, 790], ['gem', 150, 850],
    ['ledge', 'L', 940, 'long'], ['chest', -232, 940], ['row', -100, 1050, 4, 52], ['goblet', 220, 1030], ['gem', 150, 1130], ['gem', 235, 1180],
    ['chandelier', 1250],
  ] },
  { name: 'the well', h: 1250, things: [
    ['gem', 0, 300],
    ['ledge', 'L', 320, 'normal'], ['ledge', 'R', 320, 'normal'], ['arc', 0, 440, 130, 80, 5], ['col', -195, 430, 3, 60], ['col', 195, 430, 3, 60],
    ['chandelier', 630], ['col', 0, 740, 2, 60], ['gem', -150, 770], ['gem', 150, 770], ['goblet', -235, 660], ['goblet', 235, 660],
    ['ledge', 'L', 940, 'long'], ['ledge', 'R', 940, 'normal'], ['chest', -232, 940], ['row', -90, 1050, 3, 52], ['goblet', 195, 1060], ['heart', 55, 1090], ['gem', 150, 1160], ['gem', 240, 1160],
    ['chandelier', 1250],
  ] },
  { name: "the magnet's", h: 1250, things: [
    ['ledge', 'R', 320, 'long'], ['power', 'magnet', 70, 540], ['ring', -150, 470, 80, 6], ['gem', -150, 470], ['row', 170, 430, 3, 52],
    ['chandelier', 630], ['row', 200, 760, 3, 56], ['row', -200, 860, 3, 56], ['goblet', 0, 760], ['gem', -235, 700], ['gem', 235, 880],
    ['ledge', 'L', 940, 'long'], ['ring', 160, 1090, 80, 6], ['goblet', 160, 1090], ['row', -143, 1050, 4, 52], ['heart', 0, 1100], ['gem', -235, 1170], ['gem', -150, 1190],
    ['chandelier', 1250],
  ] },
  { name: 'the chests', h: 940, things: [
    // two long ledges that meet: a floor across the room, the chests on it
    ['ledge', 'L', 320, 'long'], ['ledge', 'R', 320, 'long'], ['chest', -200, 320], ['chest', 200, 320], ['goblet', 0, 440], ['row', 0, 540, 5, 56],
    ['gem', -200, 500], ['gem', 200, 500],
    ['chandelier', 630], ['ring', 0, 790, 104, 8], ['heart', 0, 790], ['gem', -215, 730], ['gem', 215, 730], ['goblet', -215, 850], ['goblet', 215, 850],
    ['chandelier', 940],
  ] },
  { name: 'the chain', h: 1240, things: [
    // chandeliers only, up the chain; what is worth most hangs out by the pillars
    ['chandelier', 310], ['gem', -220, 400], ['gem', 220, 400], ['row', -220, 560, 2, 52], ['row', 220, 560, 2, 52], ['col', 0, 420, 2, 60],
    ['chandelier', 620], ['col', 0, 730, 2, 60], ['goblet', -220, 720], ['goblet', 220, 720], ['heart', -130, 860], ['gem', 130, 860],
    ['chandelier', 930], ['col', 0, 1040, 2, 60], ['arc', -200, 1000, 60, 40, 3], ['arc', 200, 1000, 60, 40, 3], ['gem', -130, 1150], ['gem', 130, 1150],
    ['chandelier', 1240],
  ] },
  { name: 'the stairs', h: 1250, things: [
    ['stairs', 'R', 320], ['goblet', 252, 650], ['gem', -200, 420], ['gem', -200, 520], ['row', -110, 330, 3, 52],
    ['chandelier', 760], ['col', 0, 870, 2, 60], ['arc', -160, 860, 80, 50, 4], ['heart', 200, 900], ['gem', 150, 800], ['gem', 240, 840],
    ['ledge', 'L', 1000, 'long'], ['chest', -232, 1000], ['row', -100, 1110, 4, 52], ['goblet', 200, 1080], ['gem', 130, 1170], ['gem', 240, 1190],
    ['chandelier', 1250],
  ] },
];
// The top, over the last section's chandelier; the door out is on the left as written.
const TOP = [
  ['ledge', 'L', 310, 'normal'], ['ledge', 'R', 310, 'normal'], ['row', -195, 420, 3, 52], ['row', 195, 420, 3, 52],
  ['crown', 110, 730], ['crownT', 110, 790], ['gem', 0, 600], ['gem', 250, 560], ['gem', -30, 900], ['gem', 250, 900],
];
const OVER_A_CHANDELIER = ['col', 0, 110, 3, 60];        // hung over every chandelier a section ends with

// The crown of suns: a band and five points, the middle one highest (the real crown hangs inside it).
const CROWN = [[-112, 0], [-56, 0], [0, 0], [56, 0], [112, 0], [-112, 64], [-56, 40], [0, 120], [56, 40], [112, 64]];

// Furnish the room whose floor is at `floor` (the prince's plane) for a
// prince who came in by a door on `side` ('L' | 'R'). Everything goes into
// the world's lists; `rng` picks the sections and their sides and gives
// the pickups their bob. `first` (dev) makes the room begin with that
// section and go on with the ones after it.
// Returns what the world and the painter need to know about the room:
// { floor, top, exitY, exit (its gate), door: { x, ly } (the one he came by, on the wall's layer), camLo, camHi, suns, sections }.
export function furnishVault(world, floor, side, rng, first = null) {
  const plats = world.platforms, picks = world.pickups;
  const room = { floor, top: 0, exitY: 0, exit: null, door: null, camLo: floor - VAULT.floorShown, camHi: 0, suns: 0, sections: [] };
  const worth = (n) => { room.suns += n; };
  // one list of things, standing on `base` (px over the floor), mirrored for m < 0
  const place = (things, base, m, heart) => {
    const at = (y) => floor + base + y, flip = (sd) => (m > 0 ? sd : sd === 'L' ? 'R' : 'L');
    const sun = (x, y) => { picks.push(new Sun(m * x, at(y), rng)); worth(1); };
    for (const t of things) {
      switch (t[0]) {
        case 'ledge': plats.push(new Platform(flip(t[1]) === 'L' ? 'branchL' : 'branchR', at(t[2]), { len: t[3], style: STONE_STYLE, variant: rng.int(0, 4), lenScale: 1 })); break;
        case 'chandelier': plats.push(new Platform('chandelier', at(t[1]))); break;
        case 'stairs': {
          // as the level builds a flight (level.js): the treads rise toward the pillar, a door at the top one
          const sd = flip(t[1]), dir = sd === 'L' ? -1 : 1;
          for (let j = 0; j < STAIR.steps; j++) {
            const tread = new Platform('step', at(t[2]) + j * STAIR.rise, { side: sd, x: dir * (284 - STAIR.run / 2 - STAIR.run * (STAIR.steps - 1 - j)) });
            tread.flight = j === 0;
            tread.door = j === STAIR.steps - 1;
            plats.push(tread);
            picks.push(new Sun(tread.x, tread.y + 96, rng)); worth(1);
          }
          break;
        }
        case 'chest': plats.push(new Platform('chest', at(t[2]) + VAULT.chest, { x: m * t[1] })); worth(CHEST_SUNS); break;
        case 'row': for (let i = 0; i < t[3]; i++) sun(t[1] + (i - (t[3] - 1) / 2) * t[4], t[2]); break;
        case 'col': for (let i = 0; i < t[3]; i++) sun(t[1], t[2] + i * t[4]); break;
        case 'arc': for (let i = 0; i < t[5]; i++) { const u = t[5] > 1 ? (i / (t[5] - 1)) * 2 - 1 : 0; sun(t[1] + u * t[3], t[2] + (1 - u * u) * t[4]); } break;
        case 'ring': for (let i = 0; i < t[4]; i++) { const a = (i / t[4]) * Math.PI * 2 + Math.PI / 2; sun(t[1] + Math.cos(a) * t[3], t[2] + Math.sin(a) * t[3]); } break;
        case 'crown': for (const [dx, dy] of CROWN) sun(t[1] + dx, t[2] + dy); break;
        case 'gem': case 'goblet': case 'crownT': { const k = new Treasure(t[0] === 'crownT' ? 'crown' : t[0], m * t[1], at(t[2]), rng); picks.push(k); worth(k.value); break; }
        case 'heart': if (heart) picks.push(new Heart(m * t[1], at(t[2]), rng)); break;
        case 'power': picks.push(new PowerUp(t[1], m * t[2], at(t[3]), rng)); break;
      }
    }
  };
  // which sections, bottom to top: `first` and the ones after it, or SECTIONS_A_ROOM drawn without putting one back
  const pool = SECTIONS.map((_, i) => i), order = [];
  for (let k = 0; k < SECTIONS_A_ROOM; k++) order.push(first != null ? (first + k) % SECTIONS.length : pool.splice(rng.int(0, pool.length - 1), 1)[0]);
  const doorM = side === 'L' ? 1 : -1;
  plats.push(new Platform('vaultFloor', floor));
  place(FLOOR, 0, doorM, false);                         // the chest stands in the corner away from the door
  let base = 0;
  order.forEach((si, k) => {
    const sec = SECTIONS[si];
    place(sec.things, base, rng.chance(0.5) ? 1 : -1, k === Math.floor(SECTIONS_A_ROOM / 2));
    base += sec.h;
    place([OVER_A_CHANDELIER], base, 1, false);
    room.sections.push(sec.name);
  });
  const topM = rng.chance(0.5) ? 1 : -1;
  place(TOP, base, topM, false);
  room.exitY = floor + base + VAULT.exitOver;
  room.top = room.exitY + VAULT.headroom;
  room.camHi = Math.max(room.camLo, room.top + VAULT.ceilingShown - H);
  room.door = { x: (side === 'L' ? -1 : 1) * GATE_X, ly: Platform.worldToLayer(floor, PARALLAX_TOWER, room.camLo) };
  // the door out: on the wall's layer, at its height in his plane when the camera is as high as it goes
  const es = topM > 0 ? 'L' : 'R';
  room.exit = new Platform('gate', room.exitY, { side: es, x: (es === 'L' ? -1 : 1) * GATE_X, gold: 'out', ly: Platform.worldToLayer(room.exitY, PARALLAX_TOWER, room.camHi) });
  plats.push(room.exit);
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
