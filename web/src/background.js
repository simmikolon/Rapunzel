import { W, H, PARALLAX_FAR, PARALLAX_FOREST, PARALLAX_TOWER } from './config.js';
import { TILE_H, TOWER_W } from './art/tiles.js';
import { RNG, invLerp, smoothstep, lerp, mixHex, TAU, approach } from './util.js';
import { PAL as C } from './palette.js';
import { forestAlpha, cloudAlpha, nightAlpha, deepForestAmount, hash } from './altitude.js';
import { Atmosphere } from './atmosphere.js';

// Parallax environment. Layers from back to front:
//   sky gradient (altitude graded) -> stars / moon / clouds (PARALLAX_FAR)
//   -> distant forest (PARALLAX_FOREST, fades out above the canopy)
//   -> tower bricks with Rapunzel's braid and its ribbons (PARALLAX_TOWER)
//   -> tree trunks, branches, swings, prince (1.0, the gameplay plane)
//   -> fireflies (drawn after the actors) -> lighting and vignette.
// Stars, the moon and the fireflies also go into the bloom layer (`glow`).

// Keyed to the zone bands (100 px = 1 m): forest floor, deep forest from
// 120 m, dawn light at the windows from 250 m, open sky above the trees
// from 400 m, then sunset and night.
const SKY = [
  { y: 0,     top: '#173f50', bot: '#1e3c3f' },   // forest floor
  { y: 12000, top: '#0d2a2f', bot: '#143835' },   // deep forest: darker, greener
  { y: 25000, top: '#3b5f86', bot: '#a7c6d8' },   // windows: dawn through the canopy
  { y: 40000, top: '#3d8ec2', bot: '#a9ddf0' },   // above the trees: open sky
  { y: 55000, top: '#55397f', bot: '#f7a862' },   // sunset
  { y: 70000, top: '#060a22', bot: '#232a5a' },   // night
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
  { y: 12000, color: '#7fc98f', alpha: 0.30 },   // deep forest: green shade
  { y: 25000, color: '#ffe6c8', alpha: 0.08 },   // windows: warm dawn
  { y: 40000, color: '#ffffff', alpha: 0.0 },
  { y: 55000, color: '#ffb070', alpha: 0.26 },
  { y: 70000, color: '#5468b8', alpha: 0.42 },
];
export function lightAt(y) {
  let i = 0;
  while (i < LIGHT.length - 1 && y >= LIGHT[i + 1].y) i++;
  if (i === LIGHT.length - 1) return { color: LIGHT[i].color, alpha: LIGHT[i].alpha };
  const next = LIGHT[i + 1];
  const t = smoothstep(invLerp(next.y - TRANSITION, next.y, y));
  return { color: mixHex(LIGHT[i].color, next.color, t), alpha: lerp(LIGHT[i].alpha, next.alpha, t) };
}

export class Background {
  constructor(art) {
    this.art = art;
    const r = new RNG(42);
    this.stars = Array.from({ length: 90 }, () => ({ x: r.range(0, W), y: r.range(0, H), s: r.chance(0.2) ? 6 : 4, ph: r.range(0, TAU) }));
    this.clouds = Array.from({ length: 9 }, (_, i) => ({ x: r.range(-60, W + 60), y: r.range(0, 2 * H), v: i % 3, drift: r.range(4, 12) }));
    this.fireflies = Array.from({ length: 22 }, () => ({ x: r.range(-W / 2, W / 2), y: r.range(-100, H + 100), ph: r.range(0, TAU), sp: r.range(0.4, 1.1) }));
    this.swayAmp = 12;
    for (const f of this.fireflies) { f.vx = 0; f.vy = 0; }
    this.atmo = new Atmosphere(art, r);
  }

  // Horizontal offset of the braid at world height y (a slow travelling wave).
  braidX(y, time) {
    const amp = this.swayAmp + this.atmo.gustEnv() * 40;   // gusts swing the braid a little wider
    return Math.sin(y / 260 + time * 0.9) * amp + Math.sin(y / 90 - time * 1.7) * amp * 0.25;
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
    // atmospheric haze toward the wall's receding edges
    g.puff(W / 2 - TOWER_W / 2 + 18 + cam.ox, H / 2, 70, H * 0.9, '#8fb8cc', 0.16, { soft: true });
    g.puff(W / 2 + TOWER_W / 2 - 18 + cam.ox, H / 2, 70, H * 0.9, '#8fb8cc', 0.16, { soft: true });
  }

  trunkVariant(k, side) {
    const h = (side === 'L' ? hash(k * 3 + 1) : hash(k * 5 + 2)) % 100;
    return h < 55 ? 0 : h < 75 ? 1 : h < 88 ? 2 : 3;
  }

  // Trunks are the front layer: they share the prince's plane because the
  // branches and swings he bounces on hang from them.
  drawTrees(g, cam) {
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    const t = this.art.tiles;
    for (let k = first; k <= last; k++) {
      const sy = cam.sy(k * TILE_H);
      g.blit(t.trunkL[this.trunkVariant(k, 'L')], cam.ox, sy);
      g.blit(t.trunkR[this.trunkVariant(k, 'R')], W + cam.ox, sy);
    }
  }

  // Owls blink in the knot holes (trunk variant 2) in the deep forest and at night.
  drawOwls(g, cam, time) {
    const amount = Math.max(deepForestAmount(cam.y), nightAlpha(cam.y));
    if (amount <= 0) return;
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    for (let k = first; k <= last; k++) {
      for (const side of ['L', 'R']) {
        if (this.trunkVariant(k, side) !== 2) continue;
        const cx = (side === 'L' ? 48 : W - 48) + cam.ox;
        const cy = cam.sy(k * TILE_H) - TILE_H + 88 + cam.oy;
        const seed = hash(k * 23 + (side === 'L' ? 1 : 2));
        const blink = ((time * 0.6 + (seed % 700) / 100) % 6) < 0.22;     // a short blink every ~6 s
        if (blink) continue;
        const look = Math.round(Math.sin(time * 0.4 + seed % 10) * 2);
        for (const dx of [-9, 9]) {
          g.rect(cx + dx - 4 + look, cy - 4, 8, 8, '#ffd34a', amount, { glow: 0.9 });
          g.rect(cx + dx - 1 + look, cy - 1, 3, 3, '#2a1a10', amount);
        }
      }
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
    this.atmo.drawBackFog(g, cam, time);
    this.drawTower(g, cam);
    this.atmo.drawDapple(g, cam, time);
    this.drawBraid(g, cam, time);
    this.atmo.drawBackLeaves(g, cam);
    this.atmo.drawMidFog(g, cam, time);
    this.drawGround(g, cam);
    this.atmo.drawLawnMist(g, cam, time);
    this.drawTrees(g, cam);
    this.drawOwls(g, cam, time);
    this.atmo.drawLife(g, cam, time);
    this.atmo.drawShafts(g, cam, time);
  }

  // Closest layer: big leaves and mist drifting in front of everything.
  drawFrontAtmosphere(g, cam, time, world) { this.atmo.drawFront(g, cam, time, world); }

  updateAtmosphere(dt, cam, time, world) { this.atmo.update(dt, cam, time, world); }

  // Fireflies wander, gather in a loose orbit around lanterns and scatter
  // when the prince comes close.
  updateFireflies(dt, cam, time, world) {
    const lanterns = world ? world.pickups.filter((k) => k.alive && k.kind === 'lantern') : [];
    const p = world && world.player;
    for (const f of this.fireflies) {
      let wx = Math.sin(time * 0.7 * f.sp + f.ph) * 40, wy = Math.cos(time * 0.5 * f.sp + f.ph) * 26 + 8;
      let best = null, bd = 320;
      for (const l of lanterns) { const d = Math.hypot(l.x - f.x, l.y - f.y); if (d < bd) { bd = d; best = l; } }
      if (best) {
        const a = time * 1.4 * f.sp + f.ph;
        const tx = best.x + Math.cos(a) * 70, ty = best.y + Math.sin(a) * 50;
        wx = (tx - f.x) * 1.6; wy = (ty - f.y) * 1.6;
      }
      if (p && p.alive) {
        const dx = f.x - p.x, dy = f.y - (p.y + 110), d = Math.hypot(dx, dy);
        if (d < 130) { const k = (130 - d) / 130; wx += (dx / (d || 1)) * 320 * k; wy += (dy / (d || 1)) * 320 * k; }
      }
      f.vx = approach(f.vx, wx, 3, dt); f.vy = approach(f.vy, wy, 3, dt);
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -W / 2 - 20) f.x = W / 2 + 20; else if (f.x > W / 2 + 20) f.x = -W / 2 - 20;
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
