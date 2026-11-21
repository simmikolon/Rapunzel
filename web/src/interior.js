import { W, H, PARALLAX_TOWER } from './config.js';
import { TILE_H, TRUNK_W } from './art/tiles.js';
import { hash, nightAlpha } from './altitude.js';
import { mixHex, lerp, invLerp, smoothstep } from './util.js';
import { INSIDE, PICTURES } from './art/interior.js';
import { pillarTile, hasDoor, PILLAR_X, TORCH_Y, TORCH } from './pillars.js';
import { drawVaultBack, vaultLighting } from './vault.js';

// The painter for the inside of the tower (places.js); the background hands
// over to it when the round is climbed in there. Back to front:
//   the outside as the windows show it: sky, stars and far clouds, the
//   distant forest, the braid hanging down the wall outside (PARALLAX_BRAID)
//   -> the back wall with a tall window every third tile and the hall's
//      door at the bottom (PARALLAX_TOWER); the windows are holes in the
//      tiles, so the layers behind slide past their frames as he climbs
//   -> the light the windows let in, the chain down the middle of the shaft
//   -> the hall's floor and the two pillars with their torches (1.0, the
//      prince's plane; the pillars stand where the trees stand outside).
// Light: the room is dim (an ambient multiply), and everything that shines
// adds a pool of its colour after it (`glow`), as the string lights do: the
// torches, the windows in the colour of the sky outside, and whatever the
// world registers while it draws (the chandeliers).

const PARALLAX_BRAID = 0.8;
const WINDOW_EVERY = 3;            // wall tiles from one window to the next
const WINDOW_FIRST = 3;            // the first window's lower tile (the hall's door takes tiles 0 and 1)
const CHAIN_END = 280;             // the chain's loose end hangs this high above the hall's floor

// The floors of the tower as the painter sees them (level.js has the same
// bands for who lives there and what one stands on): the stone's tint, the
// room's dusk, and what hangs on the walls. A floor fades into the next
// over 30 m, like the trees outside.
const FLOORS = [
  { from: 0,     tint: '#ffffff', ambient: '#8f88c4', dim: 0.34, decor: [['banner', 3], ['pictures', 3], ['shield', 1], ['tapestry', 1], ['mirror', 1]], small: ['sconce'] },                     // the hall
  { from: 12000, tint: '#dde3ff', ambient: '#8286c8', dim: 0.36, decor: [['rack', 3], ['shield', 3], ['banner', 2], ['helmets', 2], ['table', 2], ['poster', 2], ['pictures', 1], ['tapestry', 1]], fill: 82, small: ['sconce', 'keys', 'horn', 'sconce'], galleried: 'guard' },      // the guard rooms: cool stone; a wall-walk with arms and the watch's things   // the guard rooms: cool stone, arms on the walls
  { from: 25000, tint: '#ffe8d0', ambient: '#a28cb2', dim: 0.31, decor: [['pictures', 1]], small: ['sconce', 'scroll', 'pile', 'sconce', 'scroll', 'herbs'], galleried: 'library' },    // the library: warm stone; furnished by storey, on walkways (storeyOn)
  { from: 40000, tint: '#cfe3da', ambient: '#7a88c0', dim: 0.38, decor: [['cog', 4], ['ropes', 3], ['truss', 3], ['dial', 2], ['bells', 2], ['clock', 1], ['banner', 1]], fill: 82, small: ['sconce', 'coil', 'gear', 'herbs'], galleried: 'belfry' },         // the belfry: weathered stone; staging, ropes, clockwork                  // the belfry: weathered stone, clockwork
];
// (`decor` and `fill` are a floor's open wall, the hall's way; a floor with
// `galleried` is laid out by storey instead and keeps them only so that
// taking `galleried` off brings the open wall back.)
const FLOOR_FADE = 1500;
const NO_DARK = () => 0;
const IVY_TO = 40000;
const LIBRARY = 2;                 // the library's row in FLOORS: its books fly
const libraryAmount = (y) => { const f = floorsAt(y); return (f.a === LIBRARY ? 1 - f.t : 0) + (f.b === LIBRARY ? f.t : 0); };
const BOOK_TINTS = ['#ffffff', '#cfe6ff', '#fff0c8'];               // ivy comes in at the windows up to where the trees end
// Which floors meet at height y (the prince's plane): { a, b, t }.
function floorsAt(y) {
  for (let i = 1; i < FLOORS.length; i++) {
    const b = FLOORS[i].from;
    if (y < b - FLOOR_FADE) return { a: i - 1, b: i - 1, t: 0 };
    if (y < b + FLOOR_FADE) return { a: i - 1, b: i, t: smoothstep(invLerp(b - FLOOR_FADE, b + FLOOR_FADE, y)) };
  }
  return { a: FLOORS.length - 1, b: FLOORS.length - 1, t: 0 };
}
const tintAt = (y) => { const f = floorsAt(y), c = f.t > 0 ? mixHex(FLOORS[f.a].tint, FLOORS[f.b].tint, f.t) : FLOORS[f.a].tint; return c === '#ffffff' ? undefined : { tint: c }; };

// Wall tile k: which drawing (art/interior.js drawWall).
function wallTile(k, walled) {
  if (k === 0) return 4;
  if (k === 1) return 5;
  if (k >= WINDOW_FIRST && k % WINDOW_EVERY === 0) return walled ? 6 : 2;       // where the lights are out the windows are walled up
  if (k > WINDOW_FIRST && k % WINDOW_EVERY === 1) return walled ? 7 : 3;
  return hash(k * 13 + 1) % 10 < 7 ? 0 : 1;
}

// The floor a wall tile belongs to: that of its storey (a storey is the
// three tiles from one window's lower tile up), so a storey is furnished as one.
const storeyOf = (k) => k - (k % WINDOW_EVERY);
const floorOfStorey = (k) => { const f = floorsAt(storeyOf(k) * TILE_H / PARALLAX_TOWER); return FLOORS[f.t < 0.5 ? f.a : f.b]; };
const pickFrom = (table, n) => { let pick = n % table.reduce((sum, d) => sum + d[1], 0); for (const [name, w] of table) { if (pick < w) return name; pick -= w; } return table[0][0]; };

// A storey of a floor above the hall. Nobody nails a bookcase (or a rack
// of pikes, or a table) to a wall he cannot get to, so every storey there
// has a walkway across the whole back wall, just under the window's sill,
// its railing toward the room. On it, left and right of the window, stands
// or hangs within reach what is used (`furniture`); above, where a ladder
// reaches, hangs what is only looked at (`hung`). (Ladders from one walkway
// up to the next were tried and taken out: long uprights across the whole
// picture drew the eye away from the play.) Each floor has its
// own walkway and its own things (GALLERIES); `top` is how high a piece's
// top is over the walkway's boards, so that it stands on them or hangs at
// a hand's height.
// Returns { L, walk, sides: [{ side, furniture, hung, small }] }
// with L the walkway's height (layer px) and each piece as decorAt returns them.
const GALLERIES = {
  // the guards' wall-walk: arms, helmets, the watch's table, the notice
  guard: { walk: 'walkwayGuard', smallAt: 196,
    furniture: [['rack', 4], ['table', 3], ['helmets', 2], ['poster', 2], ['none', 2]], top: { rack: 184, table: 108, helmets: 244, poster: 206 },
    hung: [['shield', 3], ['banner', 3], ['pictures', 1], ['tapestry', 1], ['none', 3]] },
  // the library's galleries: cases, the spell book, scrolls
  library: { walk: 'walkway', smallAt: 336,
    furniture: [['bookcase', 7], ['lectern', 2], ['scrolls', 2], ['none', 1]], top: { bookcase: 248, lectern: 136, scrolls: 216 },
    hung: [['pictures', 4], ['shelf', 1], ['niche', 1], ['mirror', 1], ['tapestry', 1], ['none', 3]] },
  // the belfry's staging: the ropes come down to it, the clockwork is beside it
  belfry: { walk: 'walkwayBelfry', smallAt: 196,
    furniture: [['ropes', 4], ['cog', 3], ['clock', 2], ['none', 2]], top: { ropes: 262, cog: 224, clock: 236 },
    hung: [['truss', 3], ['dial', 2], ['bells', 2], ['cog', 2], ['banner', 1], ['none', 2]] },
};
function storeyOn(kb, floor) {
  const G = GALLERIES[floor.galleried], L = kb * TILE_H, sides = [];
  for (const side of [-1, 1]) {
    const h = hash(kb * 31 + (side < 0 ? 17 : 19)), h2 = hash(h + 5);
    const fk = pickFrom(G.furniture, h >>> 8), hk = pickFrom(G.hung, h2 >>> 8);
    sides.push({
      side,
      furniture: fk === 'none' ? null : { kind: fk, look: (h >>> 5) % 2, x: side * 186, ly: L + G.top[fk], h, onWalk: true },
      hung: hk === 'none' ? null : { kind: hk, look: (h2 >>> 5) % 2, x: side * (172 + (h2 >>> 12) % 26), ly: L + 500 - (h2 >>> 16) % 12, h: h2 },
      small: (h2 >>> 3) % 100 < 55 ? { kind: floor.small[(h2 >>> 20) % floor.small.length], lit: (h2 >>> 4) % 100 < 65, x: side * 104, ly: L + G.smallAt, h: h2 } : null,
    });
  }
  return { L, walk: G.walk, sides };
}

// What hangs on the back wall, by hash, left and right of the window column
// (never in it): at most one piece a side per storey, at different heights
// on the two sides; which things, the floor says (FLOORS). That is the
// hall's way; the floors above it are laid out by storey (storeyOn). By
// the hall's door hang a banner and, within reach from the floor, the
// pegs with the witch's spare hat and a broom; above them her portrait
// and a second banner: it is her house.
// Returns { kind, look, x, ly, h } with `ly` the height it hangs from
// (layer px) and `h` the hash the piece may vary by.
function decorAt(k, side) {
  if (k === 1) return side < 0 ? { kind: 'banner', look: 0, x: -196, ly: 352 } : { kind: 'hook', x: 196, ly: 262, h: 0 };
  if (k === 2) return side < 0 ? { kind: 'pictures', only: 'witch', x: -196, ly: 556, h: 0 } : { kind: 'banner', look: 1, x: 196, ly: 556 };
  if (k < WINDOW_FIRST) return null;
  // what this floor hangs on its walls (the nearer floor's, where two meet)
  const floor = floorOfStorey(k), table = floor.decor;
  if (floor.galleried || k % WINDOW_EVERY !== (side < 0 ? 2 : 1)) return null;      // a floor with walkways is furnished by storey (storeyOn)
  const h = hash(k * 19 + (side < 0 ? 7 : 11));
  if (h % 100 < 100 - (floor.fill || 66)) return null;
  let pick = (h >>> 8) % table.reduce((n, d) => n + d[1], 0), kind = table[0][0];
  for (const [name, w] of table) { if (pick < w) { kind = name; break; } pick -= w; }
  return { kind, look: (h >>> 5) % 2, x: side * (168 + (h >>> 12) % 34), ly: k * TILE_H + 150 + (h >>> 16) % 30, h };
}

// The pictures of one hanging: one to three of different sizes, the way a
// wall fills up over the years, each a little off the one above. Returns
// [{ pic, ox, oy, tilt }] with offsets in px from where the hanging hangs.
function hanging(d) {
  if (d.only) return [{ pic: PICTURES.find((q) => q.key === d.only), ox: 0, oy: 0, tilt: 0 }];
  const out = [], n = 1 + (d.h >>> 20) % 3, first = (d.h >>> 9) % PICTURES.length;
  let y = 0;
  for (let j = 0; j < n; j++) {
    const pic = PICTURES[(first + j * 3) % PICTURES.length];
    if (j > 0 && y + pic.h * 4 > 250) break;
    // faces hang straight (their eyes are put in at runtime), the rest a little askew
    out.push({ pic, ox: j === 0 ? 0 : ((d.h >>> (j * 3 + 2)) % 3 - 1) * 22, oy: y, tilt: pic.eyes || pic.key === 'rapunzel' ? 0 : ((d.h >>> (j * 4)) % 5 - 2) * 0.022 });
    y += pic.h * 4 + 12;
  }
  return out;
}

// The small things between: an old candle, the keys, a bunch of herbs,
// beside the window column at a height the big pieces leave free.
function smallAt(k, side) {
  if (k < WINDOW_FIRST || k % WINDOW_EVERY !== (side < 0 ? 0 : 2)) return null;
  const h = hash(k * 23 + (side < 0 ? 3 : 5));
  if (h % 100 < 38) return null;
  const floor = floorOfStorey(k), table = floor.small;
  if (floor.galleried) return null;
  return { kind: table[(h >>> 8) % table.length], lit: (h >>> 4) % 100 < 65, x: side * 108, ly: k * TILE_H + 118, h };
}

export class Interior {
  constructor(art, bg) {
    this.art = art;
    this.bg = bg;                // the outside's painter: its sky, forest and braid are what the windows show
    this.glows = [];             // this frame's light pools: [sx, sy, radius, colour, alpha]
    this.vault = false;          // this frame is the treasury's (vault.js draws it)
    this.darkAt = NO_DARK;
  }

  // Where the chain hangs at height y: a slow heavy wave, wider as the
  // climb gets harder (the amplitude is the braid's, world.js sets it).
  // Chandeliers and the bell ride on it.
  chainX(y, time) {
    const amp = this.bg.swayAmp;
    return Math.sin(y / 420 + time * 0.75) * amp + Math.sin(y / 150 - time * 1.4) * amp * 0.18;
  }

  // A light pool for this frame, in screen coordinates.
  glow(sx, sy, r, color, alpha) { this.glows.push([sx, sy, r, color, alpha]); }

  // The braid outside, as far as the windows show it.
  drawBraid(g, cam, time) {
    const s = this.art.tiles.braid, step = 40, camF = cam.layerY(PARALLAX_BRAID);
    for (let ly = Math.floor((camF + H + 60) / step) * step; ly >= camF - 60; ly -= step) {
      g.blit(s, W / 2 + this.bg.braidX(ly, time) + cam.ox, H - (ly + step - camF) + cam.oy);
    }
  }

  drawWall(g, cam, time, world) {
    const A = this.art.interior;
    const camF = cam.layerY(PARALLAX_TOWER);
    const first = Math.max(0, Math.floor(camF / TILE_H)), last = Math.ceil((camF + H) / TILE_H);
    for (let k = first; k <= last; k++) g.blit(A.wall[wallTile(k, this.walled(k))], W / 2 + cam.ox, H - (k * TILE_H - camF) + cam.oy, tintAt(k * TILE_H / PARALLAX_TOWER));
    // banners, shields, the gallery, books, clockwork
    const gates = world ? world.platforms.filter((p) => p.kind === 'gate') : [];
    const behindGate = (side, ly) => gates.some((q) => (q.x < 0 ? -1 : 1) === side && ly > q.ly - 30 && ly < q.ly + 350);   // nothing hangs where a gate's door is
    const princeX = world && world.player ? cam.sx(world.player.x) : W / 2;
    for (let k = first - 1; k <= last + 2; k++) {
      for (const side of [-1, 1]) {
        const d = decorAt(k, side);
        if (!d || behindGate(side, d.ly)) continue;
        const dx = W / 2 + d.x + cam.ox, dy = H - (d.ly - camF) + cam.oy;
        this.drawPiece(g, cam, d, dx, dy, side, k, time, world, princeX);
      }
    }
    // The floors above the hall, storey by storey from below: what hangs
    // high, what stands on the walkway, then the walkway itself with its
    // railing in front of it all.
    for (let kb = Math.max(WINDOW_FIRST, storeyOf(first) - WINDOW_EVERY); kb <= last + 1; kb += WINDOW_EVERY) {
      const floor = floorOfStorey(kb);
      if (!floor.galleried) continue;
      const st = storeyOn(kb, floor), wy = H - (st.L - camF) + cam.oy, cx = W / 2 + cam.ox;
      for (const sd of st.sides) {
        for (const d of [sd.hung, sd.furniture]) {
          if (!d || behindGate(sd.side, d.ly)) continue;
          this.drawPiece(g, cam, d, W / 2 + d.x + cam.ox, H - (d.ly - camF) + cam.oy, sd.side, kb, time, world, princeX);
        }
        if (sd.small && !behindGate(sd.side, sd.small.ly)) this.drawSmall(g, sd.small, W / 2 + sd.small.x + cam.ox, H - (sd.small.ly - camF) + cam.oy, kb, time);
      }
      g.blit(A[st.walk], cx, wy, tintAt(st.L / PARALLAX_TOWER));
      g.rect(TRUNK_W + cam.ox, wy + 64, W - 2 * TRUNK_W, 16, 'rgba(0,0,0,0.16)');                                  // its shadow on the wall
    }
    // Ivy has come in at some of the windows, as long as there are trees
    // outside: over the sill, or up the wall beside it.
    for (let k = Math.max(WINDOW_FIRST, Math.floor((first - 2) / WINDOW_EVERY) * WINDOW_EVERY); k <= last; k += WINDOW_EVERY) {
      if (k * TILE_H / PARALLAX_TOWER > IVY_TO) break;
      const h = hash(k * 29 + 13), sill = H - ((k + 1) * TILE_H - 120 - camF) + cam.oy, cx = W / 2 + cam.ox;
      if (h % 100 >= 55 || this.walled(k)) continue;
      const side = (h >>> 7) % 2 ? 1 : -1, what = (h >>> 9) % 3;                // over the sill, up the wall, or both
      if (what !== 1) g.blit(A.ivyHang, cx + side * 36, sill - 8, { rot: Math.sin(time * 0.8 + k) * 0.04 });
      if (what !== 0) g.blit(side < 0 ? A.ivyClimb.R : A.ivyClimb.L, cx - side * 62, sill + 6);
    }
    for (let k = first - 1; k <= last + 1; k++) {
      for (const side of [-1, 1]) {
        const d = smallAt(k, side);
        if (!d || behindGate(side, d.ly)) continue;
        const dx = W / 2 + d.x + cam.ox, dy = H - (d.ly - camF) + cam.oy;
        this.drawSmall(g, d, dx, dy, k, time);
      }
    }
    // In the library some of the books have taken wing: a few drift about
    // behind everything, their boards beating. The room's life, as the
    // butterflies are the forest's.
    const lib = libraryAmount(cam.y + H / 2);
    if (lib > 0.02) {
      for (let i = 0; i < 5; i++) {
        const sp = 0.33 + i * 0.07, ph = i * 1.9, span = H + 200;
        const bx = W / 2 + Math.sin(time * sp + ph) * (140 + i * 24) + cam.ox;
        const by = H + 100 - (((i * 331 + time * (14 + i * 3) + camF * 0.6) % span) + span) % span + Math.sin(time * 2 + i) * 6 + cam.oy;
        g.blit(A.flyingBook[Math.floor(time * (5 + i) + i) % 2], bx, by, { alpha: 0.85 * lib, tint: BOOK_TINTS[i % 3] });
      }
    }
    // the pillars' shadow on the wall behind them
    g.rect(TRUNK_W + cam.ox, 0, 18, H, 'rgba(0,0,0,0.2)');
    g.rect(W - TRUNK_W - 18 + cam.ox, 0, 18, H, 'rgba(0,0,0,0.2)');
    // What a window lets in: a bloom on the wall around it, a soft shaft
    // slanting down into the room with dust in it, and a pool of light for
    // whoever passes. All in the colour of the sky out there, so the forest's
    // green dusk, the open day, the sunset and the night show inside too.
    const sky = this.bg.skyColors(cam);
    const col = mixHex(sky.bot, '#ffffff', 0.3), night = nightAlpha(cam.y);
    const k0 = Math.max(WINDOW_FIRST, Math.floor((first - 2) / WINDOW_EVERY) * WINDOW_EVERY);
    for (let k = k0; k <= last; k += WINDOW_EVERY) {
      const wx = W / 2 + cam.ox, wy = H - ((k + 1) * TILE_H + 24 - camF) + cam.oy;     // the opening's middle
      if (wy < -500 || wy > H + 400 || this.walled(k)) continue;
      g.puff(wx, wy, 220, 310, col, 0.24, { soft: true, blend: 'add' });
      // the shaft: three beams of falling length laid over each other, so it fades in steps
      const rot = 0.95, len = 620;
      for (const f of [1, 0.66, 0.36]) g.beam(wx + Math.cos(rot) * len * f / 2, wy + Math.sin(rot) * len * f / 2, len * f, 150, rot, col, 0.075);
      for (let i = 0; i < 6; i++) {
        // dust drifting down the shaft
        const h = hash(k * 31 + i), u = ((h % 1000) / 1000 + time * (0.02 + (h % 7) * 0.004)) % 1;
        const across = ((hash(h + 3) % 100) / 100 - 0.5) * 110 * (0.6 + u), along = 60 + u * len * 0.8;
        const mx = wx + Math.cos(rot) * along - Math.sin(rot) * across, my = wy + Math.sin(rot) * along + Math.cos(rot) * across;
        g.rect(Math.round(mx / 4) * 4, Math.round(my / 4) * 4, 4, 4, col, (0.5 - 0.3 * night) * Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.sin(time * 2 + h)));
      }
      this.glow(wx, wy, 260, col, 0.13);
    }
  }

  // One big piece on the wall, hanging from (dx, dy) on the screen.
  drawPiece(g, cam, d, dx, dy, side, k, time, world, princeX) {
    const A = this.art.interior;
    if (d.kind === 'banner') g.blit(A.banner[d.look], dx, dy, { rot: Math.sin(time * 0.9 + k) * 0.025 });
    else if (d.kind === 'shield') g.blit(A.shield, dx, dy + 44);
    else if (d.kind === 'shelf') g.blit(A.shelf[d.look], dx, dy);
    else if (d.kind === 'cog') {
      // two wheels in mesh, turning slowly against each other
      const dir = d.look ? 1 : -1;
      g.blit(A.cog, dx, dy + 40, { rot: time * 0.45 * dir });
      g.blit(A.cog, dx - side * 62, dy + 104, { rot: -time * 0.45 * dir / 0.7 + 0.39, sx: 0.7, sy: 0.7 });
    } else if (d.kind === 'niche') {
      g.blit(A.niche[d.look], dx, dy);
      if (d.look === 1) g.halo(dx - 2, dy + 56, 34, '#9fd0ff', 0.3 + 0.15 * Math.sin(time * 1.6 + k), { glow: 0.4 });   // the crystal ball
    } else if (d.kind === 'rack') g.blit(A.rack, dx, dy);
    else if (d.kind === 'helmets') g.blit(A.helmets, dx, dy + 30);
    else if (d.kind === 'table') g.blit(A.table, dx, dy + 20);
    else if (d.kind === 'poster') g.blit(A.poster, dx, dy, { rot: (d.look ? 1 : -1) * 0.04 });
    else if (d.kind === 'dial') {
      // the great clock: its hands go round (an hour in a quarter of a minute)
      g.blit(A.dial, dx, dy + 70);
      g.blit(A.hand[1], dx, dy + 70, { rot: time * 0.035 + k });
      g.blit(A.hand[0], dx, dy + 70, { rot: time * 0.42 + k * 3 });
    } else if (d.kind === 'ropes') {
      // bell ropes down from the bells above, each swaying in its own time
      for (let i = 0; i < 3; i++) g.blit(A.bellRope, dx + (i - 1) * 30, dy - 20 - ((d.h >>> (i * 3)) % 4) * 14, { rot: Math.sin(time * (0.7 + i * 0.13) + k + i * 2) * 0.035 });
    } else if (d.kind === 'truss') {
      g.blit(A.truss, W / 2 + side * 180 + cam.ox, dy);
      if ((d.h >>> 18) % 100 < 45) g.blit(A.owl[(time * 0.27 + k * 0.41) % 1 < 0.05 ? 1 : 0], W / 2 + side * 180 + cam.ox + (d.look ? 44 : -44), dy + 8);   // an owl on the beam, blinking
    } else if (d.kind === 'bells') {
      // a row of small bells on a beam, each swinging a little
      g.rect(dx - 70, dy + 4, 140, 12, '#655065'); g.rect(dx - 70, dy + 4, 140, 4, '#8a6f5c');      // the beam, stepped back like the rest (art/interior.js RECEDE)
      for (let i = 0; i < 3; i++) { const sc = 1.15 - i * 0.2; g.blit(A.smallBell, dx - 44 + i * 44, dy + 16, { rot: Math.sin(time * (1.6 + i * 0.4) + k + i) * 0.16, sx: sc, sy: sc }); }
    } else if (d.kind === 'bookcase') {
      g.blit(A.bookcase[(d.h >>> 5) % 3], dx, dy);
      if ((d.h >>> 18) % 100 < 35) { const s = d.onWalk ? -side : (d.h >>> 3) % 2 ? 1 : -1; g.blit(A.ladder, dx + s * 66, dy + 250, { rot: -s * 0.13 }); }   // a ladder leant against it (on a walkway: on the window's side)
    } else if (d.kind === 'scrolls') g.blit(A.scrolls, dx, dy);
    else if (d.kind === 'lectern') {
      // the spell book: it glows, runes rise from it, now and then a page goes over by itself
      const turning = (time * 0.23 + k * 0.37) % 1 < 0.09;
      g.halo(dx, dy + 44, 64, '#b9a0ff', 0.32 + 0.1 * Math.sin(time * 2.2 + k), { glow: 0.4 });
      g.blit(A.lectern[turning ? 1 : 0], dx, dy);
      for (let i = 0; i < 3; i++) {
        const u = (time * 0.21 + i / 3 + k * 0.13) % 1;
        g.blit(A.rune[i], dx + (i - 1) * 16 + Math.sin(u * 6 + i * 2) * 12, dy + 26 - u * 120, { alpha: Math.sin(u * Math.PI) * 0.9, glow: 0.5 });
      }
      this.glow(dx, dy + 40, 180, '#b9a0ff', 0.13);
    } else if (d.kind === 'tapestry') g.blit(A.tapestry, W / 2 + side * 178 + cam.ox, dy, { rot: Math.sin(time * 0.6 + k) * 0.012 });
    else if (d.kind === 'hook') g.blit(A.hook, dx, dy);
    else if (d.kind === 'mirror') {
      // the nearer the prince, the plainer the witch in the glass
      g.blit(A.mirror, dx, dy);
      const pl = world && world.player, near = pl ? Math.hypot(cam.sx(pl.x) - dx, cam.sy(pl.y + 116) - (dy + 68)) : 1e9;
      const a = Math.max(0, Math.min(1, 1 - (near - 100) / 200));
      if (a > 0.02) { g.halo(dx, dy + 68, 70, '#bfe8a8', 0.25 * a, { glow: 0.3 }); g.blit(A.mirrorWitch, dx, dy, { alpha: a * (0.8 + 0.12 * Math.sin(time * 9)) }); }
    } else if (d.kind === 'clock') {
      g.blit(A.pendulum, dx, dy + 76, { rot: Math.sin(time * 2.6 + k) * 0.32 });
      g.blit(A.clock, dx, dy);
    } else this.drawHanging(g, d, dx, dy, time, k, princeX);
  }

  // One small thing on the wall.
  drawSmall(g, d, dx, dy, k, time) {
    const A = this.art.interior;
    if (d.kind === 'keys') g.blit(A.keys, dx, dy);
    else if (d.kind === 'scroll') g.blit(A.scroll, dx, dy, { rot: Math.sin(time * 0.8 + k) * 0.03 });
    else if (d.kind === 'pile') g.blit(A.pile, dx, dy);
    else if (d.kind === 'horn') g.blit(A.horn, dx, dy);
    else if (d.kind === 'coil') g.blit(A.coil, dx, dy);
    else if (d.kind === 'gear') g.blit(A.cog, dx, dy + 20, { rot: time * 0.6 * (d.lit ? 1 : -1), sx: 0.5, sy: 0.5 });
    else if (d.kind === 'herbs') g.blit(A.herbs, dx, dy, { rot: Math.sin(time * 0.7 + k) * 0.03 });
    else if (!d.lit || this.darkAt(d.ly / PARALLAX_TOWER) > 0.5) g.blit(A.sconce[2], dx, dy);     // burnt down, or where the lights are out
    else {
      const fl = 0.85 + 0.15 * Math.sin(time * 10 + k * 2.3) * Math.sin(time * 2.9 + k);
      g.halo(dx, dy - 40, 40, INSIDE.candleLight, 0.45 * fl, { glow: 0.4 });
      g.blit(A.sconce[Math.floor(time * 8 + k) % 2], dx, dy, { glow: 0.3 });
      this.glow(dx, dy - 30, 150, INSIDE.candleLight, 0.12 * fl);
    }
  }

  // One hanging of pictures. A face that looks out of its frame follows the
  // prince with its eyes (the pupils are put in here), and Rapunzel blinks.
  drawHanging(g, d, dx, dy, time, k, princeX) {
    const A = this.art.interior;
    for (const { pic, ox, oy, tilt } of hanging(d)) {
      const x = dx + ox, y = dy + oy;
      if (pic.key === 'rapunzel') {
        g.blit(A.frame, x, y);
        const blink = (time * 0.31 + k * 0.37) % 1 < 0.035;
        g.blit(blink ? this.art.sign.rapunzelBlink : this.art.sign.rapunzel, x, y + 25 * 4);
        continue;
      }
      g.blit(A.pictures[pic.key], x, y, tilt ? { rot: tilt } : undefined);
      if (!pic.eyes) continue;
      const look = Math.max(-1, Math.min(1, Math.round((princeX - x) / 130)));          // left, ahead, right
      const off = pic.ew === 3 ? 1 + look : look > 0 ? 1 : 0;
      for (const [ex, ey] of pic.eyes) g.rect(x - pic.w * 2 + (ex + off) * 4, y + ey * 4, 4, 8, pic.key === 'cat' ? '#1b1b2a' : '#000000');
    }
  }

  drawChain(g, cam, time) {
    const A = this.art.interior, step = 40;
    const bottom = Math.max(CHAIN_END, Math.floor((cam.y - 60) / step) * step);
    for (let y = Math.floor((cam.top + 60) / step) * step; y >= bottom; y -= step) g.blit(A.chain, cam.sx(this.chainX(y, time)), cam.sy(y + step));
    if (cam.y < CHAIN_END + 60) g.blit(A.chainEnd, cam.sx(this.chainX(CHAIN_END, time)), cam.sy(CHAIN_END));
  }

  // The hall's flagstones (the round starts on them, as on the lawn outside).
  drawFloor(g, cam) {
    if (cam.y > 60) return;
    const s = this.art.interior.floor;
    g.blit(s, W / 2 + cam.ox, cam.sy(0));
    const top = cam.sy(0) + s.h - s.ay;
    if (top < H) g.rect(0, top, W, H - top, INSIDE.floorDark);
  }

  drawPillars(g, cam, time, world) {
    const A = this.art.interior;
    const galleries = world ? world.platforms.filter(hasDoor) : [];
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    for (let k = first; k <= last; k++) {
      const sy = cam.sy(k * TILE_H);
      for (const side of ['L', 'R']) {
        const v = pillarTile(k, side, galleries);
        g.blit(side === 'L' ? A.pillarL[v] : A.pillarR[v], (side === 'L' ? 0 : W) + cam.ox, sy, tintAt(k * TILE_H));
        if (v !== TORCH) continue;
        const tx = cam.sx(side === 'L' ? -PILLAR_X : PILLAR_X), ty = cam.sy(k * TILE_H + TORCH_Y);
        if (this.darkAt(k * TILE_H + TORCH_Y) > 0.5) { g.blit(A.torch[3], tx, ty); continue; }      // where the lights are out, it is out
        const fl = 0.85 + 0.15 * Math.sin(time * 11 + k * 1.7) * Math.sin(time * 3.1 + k);
        g.halo(tx, ty - 26, 84, INSIDE.torchLight, 0.5 * fl, { glow: 0.5 });
        g.blit(A.torch[Math.floor(time * 9 + k * 1.3) % 3], tx, ty, { glow: 0.5 });
        this.glow(tx + (side === 'L' ? 40 : -40), ty - 20, 330, INSIDE.torchLight, 0.2 * fl);
      }
    }
  }

  // Is the window that wall tile k belongs to walled up (a dark stretch at its height)?
  walled(k) { const kb = k - (k % WINDOW_EVERY === 1 ? 1 : 0); return this.darkAt(((kb + 1) * TILE_H + 24) / PARALLAX_TOWER) > 0.5; }

  drawBack(g, cam, time, world) {
    // how dark it is at a height (the level's dark stretches)
    this.darkAt = world && world.level && world.place && world.place.inside && !world.place.vault ? (y) => world.level.darkAt(y) : NO_DARK;
    const bg = this.bg;
    this.glows.length = 0;
    // in the treasury the room is another (vault.js)
    this.vault = !!(world && world.vault && world.place.vault);
    if (this.vault) return drawVaultBack(this, g, cam, time, world);
    bg.drawSky(g, cam);
    bg.drawFar(g, cam, time);
    bg.drawForest(g, cam);
    bg.drawSkyLanterns(g, cam, time, false);
    this.drawBraid(g, cam, time);
    bg.drawSkyLanterns(g, cam, time, true);
    this.drawWall(g, cam, time, world);
    this.drawChain(g, cam, time);
    this.drawFloor(g, cam);
    this.drawPillars(g, cam, time, world);
  }

  // The room's dusk (a little deeper once it is night outside), then its lamps.
  drawLighting(g, cam) {
    const f = floorsAt(cam.y + H / 2), A = FLOORS[f.a], B = FLOORS[f.b];
    if (this.vault) vaultLighting(g);
    else g.lighting(f.t > 0 ? mixHex(A.ambient, B.ambient, f.t) : A.ambient, lerp(A.dim, B.dim, f.t) + 0.12 * nightAlpha(cam.y));
    for (const [x, y, r, color, a] of this.glows) g.puff(x, y, r, r, color, a, { soft: true, blend: 'add' });
  }
}
