import { W, H } from './config.js';
import { TILE_H, TOWER_W, TRUNK_W } from './art/tiles.js';
import { blit, makeCanvas } from './art/sprite.js';
import { RNG, invLerp, smoothstep, lerp, mixHex, TAU, clamp } from './util.js';
import { PAL as C } from './palette.js';

// Parallax environment. Layers from back to front:
//   sky gradient (altitude graded) -> stars / moon / clouds (0.3x)
//   -> distant forest (0.6x, fades out above the canopy)
//   -> tower bricks, Rapunzel's braid, tree trunks (1.0x, the gameplay layer)
//   -> fireflies (1.15x, drawn after the actors) -> vignette.

const SKY = [
  { y: 0,     top: '#173f50', bot: '#1e3c3f' },   // forest
  { y: 7000,  top: '#3d8ec2', bot: '#a9ddf0' },   // open sky
  { y: 15000, top: '#55397f', bot: '#f7a862' },   // sunset
  { y: 23000, top: '#060a22', bot: '#232a5a' },   // night
];
const TRANSITION = 3000;

export function skyAt(y) {
  let i = 0;
  while (i < SKY.length - 1 && y >= SKY[i + 1].y) i++;
  if (i === SKY.length - 1) return { top: SKY[i].top, bot: SKY[i].bot };
  const next = SKY[i + 1];
  const t = smoothstep(invLerp(next.y - TRANSITION, next.y, y));
  return { top: mixHex(SKY[i].top, next.top, t), bot: mixHex(SKY[i].bot, next.bot, t) };
}

// Global lighting: multiplied over the whole scene so the tower, trees and
// the prince pick up the time of day too (cool forest, warm sunset, blue night).
const LIGHT = [
  { y: 0,     color: '#b8e6d8', alpha: 0.16 },
  { y: 7000,  color: '#ffffff', alpha: 0.0 },
  { y: 15000, color: '#ffb070', alpha: 0.26 },
  { y: 23000, color: '#5468b8', alpha: 0.42 },
];
export function lightAt(y) {
  let i = 0;
  while (i < LIGHT.length - 1 && y >= LIGHT[i + 1].y) i++;
  if (i === LIGHT.length - 1) return { color: LIGHT[i].color, alpha: LIGHT[i].alpha };
  const next = LIGHT[i + 1];
  const t = smoothstep(invLerp(next.y - TRANSITION, next.y, y));
  return { color: mixHex(LIGHT[i].color, next.color, t), alpha: lerp(LIGHT[i].alpha, next.alpha, t) };
}

export const forestAlpha = (y) => 1 - smoothstep(invLerp(4000, 7000, y));
export const cloudAlpha = (y) => smoothstep(invLerp(5000, 8000, y)) * (1 - 0.5 * smoothstep(invLerp(20000, 23000, y)));
export const nightAlpha = (y) => smoothstep(invLerp(20000, 23000, y));

function hash(k) { let h = (k * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; return (h ^ (h >>> 15)) >>> 0; }

export class Background {
  constructor(art) {
    this.art = art;
    const r = new RNG(42);
    this.stars = Array.from({ length: 90 }, () => ({ x: r.range(0, W), y: r.range(0, H), s: r.chance(0.2) ? 6 : 4, ph: r.range(0, TAU) }));
    this.clouds = Array.from({ length: 9 }, (_, i) => ({ x: r.range(-60, W + 60), y: r.range(0, 2 * H), v: i % 3, drift: r.range(4, 12) }));
    this.fireflies = Array.from({ length: 22 }, () => ({ x: r.range(-W / 2, W / 2), y: r.range(-100, H + 100), ph: r.range(0, TAU), sp: r.range(0.4, 1.1) }));
    this.vignette = makeCanvas(W, H);
    const vctx = this.vignette.getContext('2d');
    const g = vctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    vctx.fillStyle = g; vctx.fillRect(0, 0, W, H);
    this.swayAmp = 12;
  }

  // Horizontal offset of the braid at world height y (a slow travelling wave).
  braidX(y, time) {
    return Math.sin(y / 260 + time * 0.9) * this.swayAmp + Math.sin(y / 90 - time * 1.7) * this.swayAmp * 0.25;
  }

  drawSky(ctx, cam) {
    const { top, bot } = skyAt(cam.y);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  drawFar(ctx, cam, time) {
    const camF = cam.y * 0.3;
    const night = nightAlpha(cam.y);
    if (night > 0) {
      ctx.globalAlpha = night;
      for (const s of this.stars) {
        const sy = ((s.y - camF) % H + H) % H;
        const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.ph);
        ctx.globalAlpha = night * (0.4 + 0.6 * tw);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(s.x), Math.round(sy), s.s, s.s);
      }
      ctx.globalAlpha = night;
      blit(ctx, this.art.tiles.moon, W - 150, 170 + Math.sin(time * 0.2) * 4);
      ctx.globalAlpha = 1;
    }
    const ca = cloudAlpha(cam.y);
    if (ca > 0) {
      ctx.globalAlpha = ca;
      for (const c of this.clouds) {
        const sy = ((c.y - camF) % (2 * H) + 2 * H) % (2 * H) - H / 2;
        const sx = ((c.x + time * c.drift) % (W + 240) + (W + 240)) % (W + 240) - 120;
        blit(ctx, this.art.tiles.clouds[c.v], sx, sy);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawForest(ctx, cam) {
    const a = forestAlpha(cam.y);
    if (a <= 0) return;
    const camF = cam.y * 0.6;
    ctx.globalAlpha = a;
    const first = Math.floor(camF / TILE_H), last = Math.ceil((camF + H) / TILE_H);
    for (let k = first; k <= last; k++) {
      const s = this.art.tiles.forest[Math.abs(k) % 2];
      blit(ctx, s, W / 2 + cam.ox, H - (k * TILE_H - camF) + cam.oy);
    }
    ctx.globalAlpha = 1;
  }

  drawTowerAndTrees(ctx, cam) {
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    const t = this.art.tiles;
    for (let k = first; k <= last; k++) {
      const h = hash(k + 7);
      let v = 0;
      if (k > 0) { const r = h % 100; v = r < 62 ? 0 : r < 80 ? 1 : r < 92 ? 2 : 3; }
      if (v === 2 && hash(k + 6) % 100 >= 92) v = 1; // no two windows stacked
      const sy = cam.sy(k * TILE_H);
      blit(ctx, t.tower[v], W / 2 + cam.ox, sy);
      const hl = hash(k * 3 + 1) % 100, hr = hash(k * 5 + 2) % 100;
      blit(ctx, t.trunkL[hl < 55 ? 0 : hl < 75 ? 1 : hl < 88 ? 2 : 3], cam.ox, sy);
      blit(ctx, t.trunkR[hr < 55 ? 0 : hr < 75 ? 1 : hr < 88 ? 2 : 3], W + cam.ox, sy);
    }
    // soft shadow of the trunks on the tower edge
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(W / 2 - TOWER_W / 2 + cam.ox, 0, 12, H);
    ctx.fillRect(W / 2 + TOWER_W / 2 - 12 + cam.ox, 0, 12, H);
  }

  drawBraid(ctx, cam, time) {
    const t = this.art.tiles;
    const step = 40;
    const yTop = Math.min(cam.top + 60, 1e9);
    const start = Math.floor(yTop / step) * step;
    for (let y = start; y >= Math.max(0, cam.y - 60); y -= step) {
      const x = this.braidX(y, time);
      blit(ctx, t.braid, cam.sx(x), cam.sy(y + step));
    }
    if (cam.y < 60) blit(ctx, t.braidEnd, cam.sx(this.braidX(0, time) + 30), cam.sy(-4));
  }

  drawGround(ctx, cam) {
    if (cam.y > 40) return;
    blit(ctx, this.art.tiles.ground, W / 2 + cam.ox, cam.sy(0));
    ctx.fillStyle = C.grassDark;
    const top = cam.sy(0) + this.art.tiles.ground.h - this.art.tiles.ground.ay;
    if (top < H) ctx.fillRect(0, top, W, H - top);
  }

  drawBack(ctx, cam, time) {
    this.drawSky(ctx, cam);
    this.drawFar(ctx, cam, time);
    this.drawForest(ctx, cam);
    this.drawTowerAndTrees(ctx, cam);
    this.drawBraid(ctx, cam, time);
    this.drawGround(ctx, cam);
  }

  updateFireflies(dt, cam, time) {
    for (const f of this.fireflies) {
      f.x += Math.sin(time * 0.7 * f.sp + f.ph) * 40 * dt;
      f.y += Math.cos(time * 0.5 * f.sp + f.ph) * 26 * dt + 8 * dt;
      const span = H + 240;
      if (f.y < cam.y - 120) f.y += span;
      else if (f.y > cam.top + 120) f.y -= span;
    }
  }

  drawFront(ctx, cam, time) {
    const a = forestAlpha(cam.y);
    const night = nightAlpha(cam.y);
    const alpha = Math.max(a, night * 0.7);
    if (alpha > 0) {
      for (const f of this.fireflies) {
        const blink = 0.25 + 0.75 * Math.abs(Math.sin(time * 1.6 * f.sp + f.ph));
        const sx = cam.sx(f.x), sy = cam.sy(f.y);
        const col = night > 0.5 ? '#bfe4ff' : '#c8ff7a';
        ctx.globalAlpha = alpha * blink * 0.35;
        ctx.fillStyle = col;
        ctx.fillRect(sx - 10, sy - 10, 20, 20);
        ctx.globalAlpha = alpha * blink;
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawLighting(ctx, cam) {
    const l = lightAt(cam.y);
    if (l.alpha <= 0.001) return;
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = l.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  drawVignette(ctx) { ctx.drawImage(this.vignette, 0, 0); }
}
