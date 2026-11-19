import { W, H, PARALLAX_TOWER } from './config.js';
import { TILE_H, TRUNK_W } from './art/tiles.js';
import { hash, nightAlpha } from './altitude.js';
import { mixHex } from './util.js';
import { INSIDE } from './art/interior.js';
import { pillarTile, PILLAR_X, TORCH_Y, TORCH } from './pillars.js';

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
const AMBIENT = '#8f88c4';

// Wall tile k: which drawing (art/interior.js drawWall).
function wallTile(k) {
  if (k === 0) return 4;
  if (k === 1) return 5;
  if (k >= WINDOW_FIRST && k % WINDOW_EVERY === 0) return 2;
  if (k > WINDOW_FIRST && k % WINDOW_EVERY === 1) return 3;
  return hash(k * 13 + 1) % 10 < 7 ? 0 : 1;
}

// What hangs on the back wall, by hash, left and right of the window column
// (never in it): at most one piece a side per storey, at different heights
// on the two sides. In the hall a banner hangs on each side of the door.
// Returns { kind, look, x, ly } with `ly` the height it hangs from (layer px).
function decorAt(k, side) {
  if (k === 1) return { kind: 'banner', look: side < 0 ? 0 : 1, x: side * 196, ly: 352 };
  if (k < WINDOW_FIRST || k % WINDOW_EVERY !== (side < 0 ? 2 : 1)) return null;
  const h = hash(k * 19 + (side < 0 ? 7 : 11));
  if (h % 100 < 34) return null;
  const pick = (h >>> 8) % 7;
  const kind = pick < 3 ? 'banner' : pick < 5 ? 'shield' : 'frame';
  return { kind, look: (h >>> 5) % 2, x: side * (168 + (h >>> 12) % 34), ly: k * TILE_H + 150 + (h >>> 16) % 30 };
}

export class Interior {
  constructor(art, bg) {
    this.art = art;
    this.bg = bg;                // the outside's painter: its sky, forest and braid are what the windows show
    this.glows = [];             // this frame's light pools: [sx, sy, radius, colour, alpha]
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

  drawWall(g, cam, time) {
    const A = this.art.interior;
    const camF = cam.layerY(PARALLAX_TOWER);
    const first = Math.max(0, Math.floor(camF / TILE_H)), last = Math.ceil((camF + H) / TILE_H);
    for (let k = first; k <= last; k++) g.blit(A.wall[wallTile(k)], W / 2 + cam.ox, H - (k * TILE_H - camF) + cam.oy);
    // banners, shields and a painting or two
    for (let k = first - 1; k <= last + 1; k++) {
      for (const side of [-1, 1]) {
        const d = decorAt(k, side);
        if (!d) continue;
        const dx = W / 2 + d.x + cam.ox, dy = H - (d.ly - camF) + cam.oy;
        if (d.kind === 'banner') g.blit(A.banner[d.look], dx, dy, { rot: Math.sin(time * 0.9 + k) * 0.025 });
        else if (d.kind === 'shield') g.blit(A.shield, dx, dy + 44);
        else {
          g.blit(A.frame, dx, dy);
          const blink = (time * 0.31 + k * 0.37) % 1 < 0.035;        // she blinks now and then
          g.blit(blink ? this.art.sign.rapunzelBlink : this.art.sign.rapunzel, dx, dy + 25 * 4);
        }
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
      if (wy < -500 || wy > H + 400) continue;
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
    const galleries = world ? world.platforms.filter((p) => p.kind === 'gallery') : [];
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    for (let k = first; k <= last; k++) {
      const sy = cam.sy(k * TILE_H);
      for (const side of ['L', 'R']) {
        const v = pillarTile(k, side, galleries);
        g.blit(side === 'L' ? A.pillarL[v] : A.pillarR[v], (side === 'L' ? 0 : W) + cam.ox, sy);
        if (v !== TORCH) continue;
        const tx = cam.sx(side === 'L' ? -PILLAR_X : PILLAR_X), ty = cam.sy(k * TILE_H + TORCH_Y);
        const fl = 0.85 + 0.15 * Math.sin(time * 11 + k * 1.7) * Math.sin(time * 3.1 + k);
        g.halo(tx, ty - 26, 84, INSIDE.torchLight, 0.5 * fl, { glow: 0.5 });
        g.blit(A.torch[Math.floor(time * 9 + k * 1.3) % 3], tx, ty, { glow: 0.5 });
        this.glow(tx + (side === 'L' ? 40 : -40), ty - 20, 330, INSIDE.torchLight, 0.2 * fl);
      }
    }
  }

  drawBack(g, cam, time, world) {
    const bg = this.bg;
    this.glows.length = 0;
    bg.drawSky(g, cam);
    bg.drawFar(g, cam, time);
    bg.drawForest(g, cam);
    bg.drawSkyLanterns(g, cam, time, false);
    this.drawBraid(g, cam, time);
    bg.drawSkyLanterns(g, cam, time, true);
    this.drawWall(g, cam, time);
    this.drawChain(g, cam, time);
    this.drawFloor(g, cam);
    this.drawPillars(g, cam, time, world);
  }

  // The room's dusk (a little deeper once it is night outside), then its lamps.
  drawLighting(g, cam) {
    g.lighting(AMBIENT, 0.34 + 0.12 * nightAlpha(cam.y));
    for (const [x, y, r, color, a] of this.glows) g.puff(x, y, r, r, color, a, { soft: true, blend: 'add' });
  }
}
