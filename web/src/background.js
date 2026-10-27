import { W, H, PARALLAX_FAR, PARALLAX_FOREST, PARALLAX_TOWER } from './config.js';
import { TILE_H, TOWER_W } from './art/tiles.js';
import { RNG, invLerp, smoothstep, lerp, mixHex, TAU } from './util.js';
import { PAL as C } from './palette.js';

// Parallax environment. Layers from back to front:
//   sky gradient (altitude graded) -> stars / moon / clouds (PARALLAX_FAR)
//   -> distant forest (PARALLAX_FOREST, fades out above the canopy)
//   -> tower bricks with Rapunzel's braid and its ribbons (PARALLAX_TOWER)
//   -> tree trunks, branches, swings, prince (1.0, the gameplay plane)
//   -> fireflies (drawn after the actors) -> lighting and vignette.
// Stars, the moon and the fireflies also go into the bloom layer (`glow`).

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
    this.swayAmp = 12;
  }

  // Horizontal offset of the braid at world height y (a slow travelling wave).
  braidX(y, time) {
    return Math.sin(y / 260 + time * 0.9) * this.swayAmp + Math.sin(y / 90 - time * 1.7) * this.swayAmp * 0.25;
  }

  drawSky(g, cam) {
    const { top, bot } = skyAt(cam.y);
    g.sky(top, bot);
  }

  drawFar(g, cam, time) {
    const camF = cam.layerY(PARALLAX_FAR);
    const night = nightAlpha(cam.y);
    if (night > 0) {
      for (const s of this.stars) {
        const sy = ((s.y - camF) % H + H) % H;
        const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.ph);
        g.rect(Math.round(s.x), Math.round(sy), s.s, s.s, '#ffffff', night * (0.4 + 0.6 * tw), { glow: 0.7 });
      }
      g.blit(this.art.tiles.moon, W - 150, 170 + Math.sin(time * 0.2) * 4, { alpha: night, glow: 0.6 });
    }
    const ca = cloudAlpha(cam.y);
    if (ca > 0) {
      for (const c of this.clouds) {
        const sy = ((c.y - camF) % (2 * H) + 2 * H) % (2 * H) - H / 2;
        const sx = ((c.x + time * c.drift) % (W + 240) + (W + 240)) % (W + 240) - 120;
        g.blit(this.art.tiles.clouds[c.v], sx, sy, { alpha: ca });
      }
    }
  }

  drawForest(g, cam) {
    const a = forestAlpha(cam.y);
    if (a <= 0) return;
    const camF = cam.layerY(PARALLAX_FOREST);
    const first = Math.floor(camF / TILE_H), last = Math.ceil((camF + H) / TILE_H);
    const o = a < 1 ? { alpha: a } : undefined;
    for (let k = first; k <= last; k++) {
      const s = this.art.tiles.forest[Math.abs(k) % 2];
      g.blit(s, W / 2 + cam.ox, H - (k * TILE_H - camF) + cam.oy, o);
    }
  }

  // The tower scrolls slower than the prince: it stands behind the trees.
  drawTower(g, cam) {
    const camF = cam.layerY(PARALLAX_TOWER);
    const first = Math.max(0, Math.floor(camF / TILE_H)), last = Math.ceil((camF + H) / TILE_H);
    const t = this.art.tiles;
    for (let k = first; k <= last; k++) {
      const h = hash(k + 7);
      let v = 0;
      if (k > 0) { const r = h % 100; v = r < 62 ? 0 : r < 80 ? 1 : r < 92 ? 2 : 3; }
      if (v === 2 && hash(k + 6) % 100 >= 92) v = 1; // no two windows stacked
      g.blit(t.tower[v], W / 2 + cam.ox, H - (k * TILE_H - camF) + cam.oy);
    }
    // push the wall back a little and let the trees cast a shadow on it
    g.rect(W / 2 - TOWER_W / 2 + cam.ox, 0, TOWER_W, H, 'rgba(10,24,30,0.14)');
    g.rect(W / 2 - TOWER_W / 2 + cam.ox, 0, 16, H, 'rgba(0,0,0,0.16)');
    g.rect(W / 2 + TOWER_W / 2 - 16 + cam.ox, 0, 16, H, 'rgba(0,0,0,0.16)');
  }

  // Trunks are the front layer: they share the prince's plane because the
  // branches and swings he bounces on hang from them.
  drawTrees(g, cam) {
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    const t = this.art.tiles;
    for (let k = first; k <= last; k++) {
      const sy = cam.sy(k * TILE_H);
      const hl = hash(k * 3 + 1) % 100, hr = hash(k * 5 + 2) % 100;
      g.blit(t.trunkL[hl < 55 ? 0 : hl < 75 ? 1 : hl < 88 ? 2 : 3], cam.ox, sy);
      g.blit(t.trunkR[hr < 55 ? 0 : hr < 75 ? 1 : hr < 88 ? 2 : 3], W + cam.ox, sy);
    }
  }

  // The braid hangs down the tower, so it scrolls with the tower layer.
  drawBraid(g, cam, time) {
    const t = this.art.tiles;
    const step = 40;
    const camF = cam.layerY(PARALLAX_TOWER);
    const start = Math.floor((camF + H + 60) / step) * step;
    for (let ly = start; ly >= Math.max(-240, camF - 60); ly -= step) {
      g.blit(t.braid, W / 2 + this.braidX(ly, time) + cam.ox, H - (ly + step - camF) + cam.oy);
    }
    // the loose end curls up on the lawn (which is in the prince's plane)
    if (cam.y < 60) g.blit(t.braidEnd, cam.sx(this.braidX(0, time) + 30), cam.sy(-4));
  }

  drawGround(g, cam) {
    if (cam.y > 40) return;
    g.blit(this.art.tiles.ground, W / 2 + cam.ox, cam.sy(0));
    const top = cam.sy(0) + this.art.tiles.ground.h - this.art.tiles.ground.ay;
    if (top < H) g.rect(0, top, W, H - top, C.grassDark);
  }

  drawBack(g, cam, time) {
    this.drawSky(g, cam);
    this.drawFar(g, cam, time);
    this.drawForest(g, cam);
    this.drawTower(g, cam);
    this.drawBraid(g, cam, time);
    this.drawGround(g, cam);
    this.drawTrees(g, cam);
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

  drawFront(g, cam, time) {
    const a = forestAlpha(cam.y);
    const night = nightAlpha(cam.y);
    const alpha = Math.max(a, night * 0.7);
    if (alpha <= 0) return;
    const col = night > 0.5 ? '#bfe4ff' : '#c8ff7a';
    for (const f of this.fireflies) {
      const blink = 0.25 + 0.75 * Math.abs(Math.sin(time * 1.6 * f.sp + f.ph));
      const sx = cam.sx(f.x), sy = cam.sy(f.y);
      g.rect(sx - 10, sy - 10, 20, 20, col, alpha * blink * 0.35, { glow: 0.6 });
      g.rect(sx - 3, sy - 3, 6, 6, col, alpha * blink, { glow: 1 });
    }
  }

  drawLighting(g, cam) {
    const l = lightAt(cam.y);
    if (l.alpha <= 0.001) return;
    g.lighting(l.color, l.alpha);
  }

  drawVignette(g) { g.vignette(); }
}
