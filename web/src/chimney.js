import { W, H, PARALLAX_TOWER, CAMERA_START_Y } from './config.js';
import { Platform } from './platforms.js';
import { Sun } from './pickups.js';
import { CHIMNEY_LOOK as LOOK } from './art/chimney.js';
import { hash } from './altitude.js';
import { clamp } from './util.js';

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
  ceilingShown: 176,     // how much of the throat the picture shows at the most: all of it (art/chimney.js drawThroat)
  dark: 0.66,            // how dark it is in there (world.js drawDarkness): his own light goes with him, and what glows shows
  lamp: 0.72,            // his own light in there, of the prince's in the dark rooms: the shaft is narrow
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
  const room = { chimney: true, half: CHIMNEY.half, dark: CHIMNEY.dark, lamp: CHIMNEY.lamp, floor, floorLy: Platform.worldToLayer(floor, PARALLAX_TOWER, floor - CHIMNEY.floorShown), top: 0, exitY: 0, exit: null, camLo: floor - CHIMNEY.floorShown, camHi: 0, suns: 0, sections: ['the chimney'] };
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
  room.pieces = backPieces(room, plats);
  room.niches = wallNiches(room);
  return room;
}

// What is on the back of the shaft: one piece a side every 290 px or so
// (BACK), never the same twice running on a side, and none behind a thing
// he stands on (the back is a little further away than he is, so a piece
// and a ledge drift past each other as the camera climbs: `level` is the
// height in his plane a piece is level with when it is in the middle of
// the picture, and nothing of his may be within 130 px of that).
function backPieces(room, plats) {
  const seed = Math.round(room.floor), f = PARALLAX_TOWER, list = [];
  const level = (ly) => (ly - (H * 0.45 + CAMERA_START_Y) * (1 - f)) / f;
  const taken = (ly, side) => plats.some((p) => (p.kind === 'flue' || p.kind === 'damper' || p.kind === 'gate') && (p.x < 0 ? -1 : 1) === side && Math.abs(p.y - level(ly)) < 130);
  const topL = Platform.worldToLayer(room.top, f, room.camHi) - 150;
  for (const side of [-1, 1]) {
    let last = null;
    for (let i = 0; room.floorLy + 330 + i * 290 < topL; i++) {
      const h = hash(seed + i * 37 + (side < 0 ? 5 : 11));
      let kind = pick(BACK, h >>> 8), ly = room.floorLy + 330 + i * 290 + (side < 0 ? 0 : 145) + (h >>> 16) % 40;
      if (kind === last) kind = BACK[(BACK.findIndex((b) => b[0] === kind) + 1) % BACK.length][0];
      if (taken(ly, side)) ly += 110;
      if (kind === 'none' || ly > topL || taken(ly, side)) continue;
      last = kind;
      list.push({ kind, side, ly, x: side * (84 + (h >>> 12) % 50), h });
    }
  }
  return list;
}

// The niches in the two walls: one a side every 370 px or so, at heights
// and depths that differ, and who or what is in each (NICHES). Never the
// same twice running on a side, and one teddy bear to a chimney: where the
// table would hide a second one, there are only eyes.
function wallNiches(room) {
  const seed = Math.round(room.floor), list = [];
  let teddy = false;
  for (const side of [-1, 1]) {
    let last = null;
    for (let i = 0; room.floor + 250 + i * 370 < room.top - 200; i++) {
      const h = hash(seed + i * 53 + (side < 0 ? 2 : 8));
      let kind = pick(NICHES, h >>> 8);
      if (kind === last) kind = NICHES[(NICHES.findIndex((n) => n[0] === kind) + 1) % NICHES.length][0];
      if (kind === 'teddy') { if (teddy) kind = last === 'eyes' ? 'stub' : 'eyes'; else teddy = true; }
      last = kind;
      list.push({ kind, side, i, h, x: side * (room.half + 80 + (h >>> 14) % 34), y: room.floor + 250 + i * 370 + (side < 0 ? 0 : 185) + (h >>> 20) % 110 });
    }
  }
  return list;
}

// --- the shaft's picture -----------------------------------------------------------
// Drawn by the inside's painter (interior.js hands over when the place is
// the chimney). From the back to the front: the back of the shaft, a
// little further away than the lord, as the tower's wall is, and what is
// on it; the pot chain; smoke, soot and sparks; the hearth; the two walls
// in his plane with their niches; the throat at the top, the day in it and
// the stork who has built on the chimney.
//
// It is dark in there (CHIMNEY.dark), so what is seen is what has a light:
// the lord's own, the fires on the hearth, the candle ends in the niches,
// the day at the top, the suns. And eyes. Who lives in a chimney is shy,
// not dangerous: nothing in here is a bat or a spider (those bite in the
// tower), and nothing is drawn with spikes.
//
// What is where comes from the room's floor height alone (a hash), so a
// shaft looks the same every frame and no random number is asked.
//   on the back, a piece a side every 290 px or so (backPieces): BACK
//   in the walls, a niche a side every 370 px or so (wallNiches): NICHES
const BACK = [['sausages', 3], ['chalk', 3], ['eyes', 3], ['rungs', 2], ['brush', 2], ['none', 1]];
const NICHES = [['stub', 3], ['owl', 2], ['mouse', 2], ['nest', 2], ['eyes', 1], ['teddy', 1]];
const WALL_TILES = [3, 3, 3, 3, 0, 1, 2];               // mostly plain
const pick = (table, n) => { let k = n % table.reduce((sum, d) => sum + d[1], 0); for (const [name, w] of table) { if (k < w) return name; k -= w; } return table[0][0]; };
const BACK_TILES = [0, 0, 0, 1, 2];                     // mostly plain
const O = { flip: false, alpha: 1, tint: null, glow: 0 };      // the one set of options the painter draws with
const opt = (flip = false, alpha = 1, tint = null, glow = 0) => { O.flip = flip; O.alpha = alpha; O.tint = tint; O.glow = glow; return O; };
const GLOW = { glow: 0.6 }, SOFT = { soft: true };

export function drawChimneyBack(interior, g, cam, time, world) {
  const A = interior.art.interior, S = interior.art.chimney, room = world.vault, half = room.half, pl = world.player;
  const camF = cam.layerY(PARALLAX_TOWER), TH = S.back[0].h, seed = Math.round(room.floor);
  const mid = W / 2 + cam.ox, lyY = (ly) => H - (ly - camF) + cam.oy;      // the screen's y of a height on the back's layer
  const plx = cam.sx(pl.x), ply = cam.sy(pl.y + pl.h * 0.5);
  const near = (x, y, r) => (plx - x) ** 2 + (ply - y) ** 2 < r * r;
  g.rect(0, 0, W, H, LOOK.dark);
  // the back of the shaft
  for (let k = Math.floor(camF / TH) - 1; k <= Math.ceil((camF + H) / TH); k++) g.blit(S.back[BACK_TILES[hash(k * 13 + 1) % 5]], mid, lyY(k * TH));
  // what is on it
  for (const pc of room.pieces) {
    const y = lyY(pc.ly), x = mid + pc.x, h = pc.h, side = pc.side;
    if (y < -140 || y > H + 240) continue;
    if (pc.kind === 'sausages') g.blit(S.sausages, mid + side * 104, y, opt(!!(h & 1), 1, LOOK.back));
    else if (pc.kind === 'chalk') g.blit(S.chalk[(h >>> 4) % 3], x, y, opt(false, 0.55));
    else if (pc.kind === 'rungs') { for (let j = 0; j < 5; j++) g.blit(S.rung, mid + side * 152, y + j * 44, opt(false, 1, LOOK.back)); }
    else if (pc.kind === 'brush') { g.rect(x - 2, y - 180, 4, 180, LOOK.rope, 0.45); g.blit(S.brush, x, y, opt(false, 1, LOOK.back)); }
    else {
      // somebody in a hole: two eyes that follow him, blink, and shut when he comes close
      g.blit(S.hole, x, y);
      if (near(x, y, 120) || (time * 0.31 + (h % 97) / 97) % 1 < 0.05) continue;
      const look = clamp(Math.round((plx - x) / 150), -1, 1) * 4;
      g.rect(x - 12 + look, y - 4, 4, 4, LOOK.eyes, 1, GLOW); g.rect(x + 4 + look, y - 4, 4, 4, LOOK.eyes, 1, GLOW);
      interior.glow(x, y, 40, LOOK.eyes, 0.12);
    }
  }
  // the pot chain down the middle, from the throat to a man's height over the hearth
  const step = 40, bottom = Math.max(room.floor + 200, Math.floor((cam.y - 60) / step) * step), topLink = Math.min(room.top, cam.top + 60);
  for (let y = Math.floor(topLink / step) * step; y >= bottom; y -= step) g.blit(A.chain, cam.sx(interior.chainX(y, time)), cam.sy(y + step));
  if (cam.y < room.floor + 260) g.blit(A.chainEnd, cam.sx(interior.chainX(room.floor + 200, time)), cam.sy(room.floor + 200));
  // smoke on its way up, slow and thin, and soot in it
  for (let i = 0; i < 4; i++) {
    const u = (time * (0.035 + i * 0.007) + i * 0.27) % 1;
    g.puff(mid + (i - 1.5) * 56 + Math.sin(time * 0.4 + i * 2) * 50, H + 120 - u * (H + 260), 96 + i * 18, 70 + i * 12, LOOK.smoke, 0.11 * Math.sin(Math.PI * u), SOFT);
  }
  for (let i = 0; i < 14; i++) {
    const h = hash(i * 31 + 7), u = (time * (0.05 + (h % 7) * 0.012) + (h % 100) / 100) % 1;
    g.rect(mid + ((h >>> 8) % (half * 2 - 40)) - half + 20 + Math.sin(time * 0.9 + i) * 14, H - u * (H + 40) + 20, 4, 4, LOOK.soot, 0.6 * Math.sin(Math.PI * u));
  }
  // what the things in the shaft have about them: steam over the kettles, a cobweb under a ledge
  for (const p of world.platforms) {
    if (p.y < cam.y - 80 || p.y > cam.top + 80) continue;
    if (p.kind === 'kettle') {
      const sx = cam.sx(p.x), sy = cam.sy(p.y + 28), f = Math.floor(time * 3 + p.y * 0.01) % 2;
      g.blit(S.steam[f], sx - 12, sy - (time * 14 + p.y) % 10, opt(false, 0.3));
      g.blit(S.steam[1 - f], sx + 14, sy - 8 - (time * 11 + p.y) % 12, opt(false, 0.22));
    } else if (p.kind === 'flue' && hash(Math.round(p.y - room.floor)) % 2 === 0) {
      g.blit(S.cobweb, cam.sx(p.side === 'L' ? -half : half), cam.sy(p.y - 32), opt(p.side === 'R', 0.4));
    }
  }
  // the hearth: its two fires, their sparks, their light
  const fy = cam.sy(room.floor);
  if (fy < H + 100) {
    g.rect(0, fy, W, H - fy + 100, LOOK.dark);
    g.blit(S.hearth[Math.floor(time * 6) % 2], mid, fy, GLOW);
    const fl = 0.85 + 0.15 * Math.sin(time * 7) * Math.sin(time * 2.3);
    for (const side of [-1, 1]) {
      const x = mid + side * (half - 30);
      g.halo(x, fy - 30, 150, LOOK.emberLight, 0.3 * fl, GLOW);
      interior.glow(x, fy - 50, 330, LOOK.emberLight, 0.22 * fl);
      for (let i = 0; i < 5; i++) {
        const h = hash(i * 17 + (side < 0 ? 3 : 9)), u = (time * (0.45 + (h % 5) * 0.08) + (h % 100) / 100) % 1;
        g.rect(x + ((h >>> 8) % 44) - 22 + Math.sin(time * 3 + i) * 8 * u, fy - 40 - u * 240, 4, 4, LOOK.spark[i % 3], 1 - u, GLOW);
      }
    }
    interior.glow(mid, fy - 20, 300, LOOK.emberLight, 0.1 * fl);
  }
  // the walls, in his plane
  const WH = S.wall[0].h, lx = W / 2 - half + cam.ox, rx = W / 2 + half + cam.ox;
  for (let k = Math.floor(cam.y / WH) - 1; k <= Math.ceil(cam.top / WH); k++) {
    const sy = cam.sy(k * WH);
    g.blit(S.wall[WALL_TILES[hash(k * 7 + 3) % 7]], lx, sy);
    g.blit(S.wall[WALL_TILES[hash(k * 7 + 5) % 7]], rx, sy, opt(true));
  }
  // their niches, and who or what is in each
  for (const n of room.niches) {
    const sx = cam.sx(n.x), sy = cam.sy(n.y), i = n.i, h = n.h, kind = n.kind;
    if (sy < -40 || sy > H + 90) continue;
    g.blit(S.niche, sx, sy);
    if (kind === 'stub') {
      g.halo(sx, sy - 28, 44, LOOK.candleLight, 0.4, GLOW);
      g.blit(S.stub[Math.floor(time * 7 + i) % 2], sx, sy, GLOW);
      interior.glow(sx, sy - 26, 170, LOOK.candleLight, 0.2 + 0.03 * Math.sin(time * 9 + i));
    } else if (kind === 'owl') {
      // it watches him; its pupils are the painter's
      const blink = (time * 0.27 + (h % 89) / 89) % 1 < 0.06;
      g.blit(S.owl[blink ? 1 : 0], sx, sy);
      if (!blink) {
        const dx = clamp(Math.round((plx - sx) / 110), -1, 1), dy = clamp(Math.round((ply - (sy - 30)) / 170), -1, 1);
        g.rect(sx - 20 + (2 + dx) * 4, sy - 44 + (3 + dy) * 4, 4, 4, '#000000'); g.rect(sx - 20 + (7 + dx) * 4, sy - 44 + (3 + dy) * 4, 4, 4, '#000000');
        interior.glow(sx, sy - 32, 54, LOOK.eyes, 0.12);
      }
    } else if (kind === 'mouse') {
      // it nibbles its cheese until he comes close: then it is two eyes at the back of the niche
      if (near(sx, sy - 20, 170)) { g.rect(sx - 8, sy - 16, 4, 4, LOOK.mouseEyes, 1, GLOW); g.rect(sx + 4, sy - 16, 4, 4, LOOK.mouseEyes, 1, GLOW); interior.glow(sx, sy - 14, 34, LOOK.mouseEyes, 0.1); }
      else g.blit(S.mouse[Math.floor(time * 2.5 + i) % 2], sx, sy, opt(n.side > 0));
    } else if (kind === 'nest') {
      g.blit(S.nest[near(sx, sy - 20, 240) ? Math.floor(time * 8) % 2 : 0], sx, sy);      // the chicks cheep when somebody comes by
    } else if (kind === 'eyes') {
      // nobody knows who: two big eyes far back, which follow him and blink
      if ((time * 0.22 + (h % 71) / 71) % 1 < 0.07) continue;
      const look = clamp(Math.round((plx - sx) / 130), -1, 1) * 4;
      g.rect(sx - 14 + look, sy - 30, 8, 8, LOOK.eyes, 1, GLOW); g.rect(sx + 6 + look, sy - 30, 8, 8, LOOK.eyes, 1, GLOW);
      g.rect(sx - 10 + look * 2, sy - 28, 4, 4, '#000000'); g.rect(sx + 10 + look * 2, sy - 28, 4, 4, '#000000');
      interior.glow(sx, sy - 26, 50, LOOK.eyes, 0.12);
    } else {
      g.blit(S.teddy, sx - (world.winter ? 10 : 0), sy);
      if (world.winter) g.blit(S.stocking, sx + 22, sy + 8);                               // around Christmas a stocking hangs from the sill
    }
  }
  // the walls' shadow on the back of the shaft
  g.rect(lx, 0, 14, H, 'rgba(0,0,0,0.25)');
  g.rect(rx - 14, 0, 14, H, 'rgba(0,0,0,0.25)');
  // the throat: the shaft draws in to a slit with the day in it, and the stork looks down
  const cy = cam.sy(room.top);
  if (cy > -40) {
    const th = S.throat.h;
    g.rect(0, cy - th - H, W, H, LOOK.throat);
    g.blit(S.throat, mid, cy);
    g.rect(mid - 56, cy - 96, 112, 360, LOOK.dayLight, 0.05); g.rect(mid - 32, cy - 96, 64, 460, LOOK.dayLight, 0.05);      // the day falls in
    g.blit(S.stork[(time * 0.23) % 1 < 0.04 ? 1 : 0], mid + 62, cy - th + 20 + Math.round(Math.sin(time * 1.1) * 1.5) * 4);                // it looks down, and nods
    interior.glow(mid, cy - 90, 420, LOOK.dayLight, 0.22);
  }
}

// The shaft's light: a little dim under the dark (world.js drawDarkness does the rest).
export function chimneyLighting(g) { g.lighting(LOOK.ambient, LOOK.dim); }
