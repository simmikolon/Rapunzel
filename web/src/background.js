import { W, H, PARALLAX_FAR, PARALLAX_FOREST, PARALLAX_TOWER } from './config.js';
import { TILE_H, TOWER_W } from './art/tiles.js';
import { RNG, invLerp, smoothstep, lerp, mixHex, TAU } from './util.js';
import { TRUNK_W } from './art/tiles.js';
import { PAL as C } from './palette.js';

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

export const forestAlpha = (y) => 1 - smoothstep(invLerp(27000, 40000, y));
export const cloudAlpha = (y) => smoothstep(invLerp(34000, 42000, y)) * (1 - 0.5 * smoothstep(invLerp(66000, 70000, y)));
export const nightAlpha = (y) => smoothstep(invLerp(66000, 70000, y));
// Deep forest atmosphere (fog, leaves, boughs): rises into the band and
// thins out toward the windows.
export const deepForestAmount = (y) => smoothstep(invLerp(7000, 13000, y)) * (1 - smoothstep(invLerp(22000, 29000, y)));
// Sunlight through the canopy: forest floor and deep forest, gone above the trees.
export const shaftAmount = (y) => 1 - smoothstep(invLerp(24000, 34000, y));

function hash(k) { let h = (k * 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; return (h ^ (h >>> 15)) >>> 0; }

export class Background {
  constructor(art) {
    this.art = art;
    const r = new RNG(42);
    this.stars = Array.from({ length: 90 }, () => ({ x: r.range(0, W), y: r.range(0, H), s: r.chance(0.2) ? 6 : 4, ph: r.range(0, TAU) }));
    this.clouds = Array.from({ length: 9 }, (_, i) => ({ x: r.range(-60, W + 60), y: r.range(0, 2 * H), v: i % 3, drift: r.range(4, 12) }));
    this.fireflies = Array.from({ length: 22 }, () => ({ x: r.range(-W / 2, W / 2), y: r.range(-100, H + 100), ph: r.range(0, TAU), sp: r.range(0.4, 1.1) }));
    this.swayAmp = 12;
    // Atmosphere: falling leaves on a depth continuum, mist wisps made of
    // overlapping soft puffs, light shafts, and boughs on the trunks.
    // Positions are in each object's own layer coordinates (cam.layerY(f)).
    this.leaves = Array.from({ length: 60 }, () => this.newLeaf(r));
    this.fogFront = Array.from({ length: 6 }, () => this.newWisp(r, r.range(1.04, 1.2)));
    this.fogBack = Array.from({ length: 4 }, () => this.newWisp(r, 0.75));
    this.shafts = Array.from({ length: 4 }, (_, i) => ({ x: 120 + i * 190 + r.range(-40, 40), w: r.range(70, 150), ph: r.range(0, TAU), sp: r.range(0.08, 0.16) }));
    this.atmoWasOff = true;
  }

  // A leaf somewhere between far (f 0.85, small, dim) and near (f 1.35, big).
  newLeaf(r) {
    const f = r.range(0.85, 1.35);
    const near = invLerp(0.85, 1.35, f);
    return {
      f, x: r.range(-40, W + 40), ly: 0, v: r.int(0, 2),
      vy: r.range(35, 95) * (0.7 + 0.6 * near),       // fall speed, nearer ones a little faster
      sway: r.range(15, 45), ph: r.range(0, TAU), sp: r.range(0.9, 2.2),
      rot: r.range(0, TAU), spin: r.range(-2.5, 2.5),
      s: lerp(0.55, 1.5, near), a: lerp(0.65, 1, near),
    };
  }
  // A wisp: three soft puffs around a centre, slightly tilted, pulsing slowly.
  newWisp(r, f) {
    return {
      f, x: r.range(-150, W + 150), ly: 0,
      rx: r.range(260, 420), ry: r.range(110, 180), rot: r.range(-0.18, 0.18),
      parts: [0, 1, 2].map(() => ({ dx: r.range(-0.5, 0.5), dy: r.range(-0.45, 0.45), k: r.range(0.55, 0.9) })),
      drift: r.range(6, 18) * r.sign(), vdrift: r.range(-10, 10),
      ph: r.range(0, TAU), pulse: r.range(0.08, 0.16), a: r.range(0.07, 0.11),
    };
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
    const deep = deepForestAmount(cam.y);
    this.drawSky(g, cam);
    this.drawFar(g, cam, time);
    this.drawForest(g, cam);
    if (deep > 0) this.drawFog(g, cam, time, this.fogBack, deep, '#9fd4c4');
    this.drawTower(g, cam);
    this.drawBraid(g, cam, time);
    if (deep > 0) this.drawLeaves(g, cam, false, deep);
    this.drawGround(g, cam);
    this.drawTrees(g, cam);
    this.drawBoughs(g, cam);
    this.drawShafts(g, cam, time);
  }

  // Closest layer: big leaves and mist drifting in front of everything.
  drawFrontAtmosphere(g, cam, time) {
    const deep = deepForestAmount(cam.y);
    if (deep <= 0) return;
    this.drawLeaves(g, cam, true, deep);
    this.drawFog(g, cam, time, this.fogFront, deep, '#d8efe6');
  }

  // Leaves fall with a shared slow wind plus their own flutter; wisps drift
  // and pulse. Whatever leaves the view below re-enters at a random height
  // above it, so arrivals are staggered rather than lined up.
  updateAtmosphere(dt, cam, time) {
    const amount = deepForestAmount(cam.y);
    if (amount <= 0) { this.atmoWasOff = true; return; }
    const reenter = (o, pad, spread) => {
      const camF = cam.layerY(o.f);
      if (o.ly < camF - pad) { o.ly = camF + H + pad + Math.random() * spread; o.x = Math.random() * (W + 80) - 40; }
      else if (o.ly > camF + H + pad + spread) o.ly = camF + H + pad + Math.random() * spread;
    };
    if (this.atmoWasOff) {
      // entering the band: scatter everything over the view and above it
      this.atmoWasOff = false;
      for (const o of this.leaves) o.ly = cam.layerY(o.f) + Math.random() * H * 1.6;
      for (const o of [...this.fogFront, ...this.fogBack]) o.ly = cam.layerY(o.f) + Math.random() * H * 1.3;
    }
    const wind = Math.sin(time * 0.23) * 28 + Math.sin(time * 0.61 + 1.7) * 14;
    for (const o of this.leaves) {
      o.ly -= o.vy * (1 + 0.25 * Math.sin(time * o.sp * 0.7 + o.ph)) * dt;
      o.x += (wind + Math.sin(time * o.sp + o.ph) * o.sway) * dt;
      o.rot += o.spin * dt;
      if (o.x < -60) o.x = W + 60; else if (o.x > W + 60) o.x = -60;
      reenter(o, 40, H * 0.8);
    }
    for (const o of [...this.fogFront, ...this.fogBack]) {
      o.x += o.drift * dt;
      o.ly += o.vdrift * dt;
      if (o.x < -o.rx - 80) o.x = W + o.rx + 80; else if (o.x > W + o.rx + 80) o.x = -o.rx - 80;
      reenter(o, o.ry + 40, H * 0.6);
    }
  }

  // `near` selects leaves in front of (true) or behind (false) the trunks.
  drawLeaves(g, cam, near, amount) {
    const t = this.art.tiles.leaves;
    for (const o of this.leaves) {
      if ((o.f >= 1) !== near) continue;
      const camF = cam.layerY(o.f);
      const sy = H - (o.ly - camF) + cam.oy;
      if (sy < -40 || sy > H + 40) continue;
      g.blit(t[o.v], o.x + cam.ox, sy, { rot: o.rot, sx: o.s, sy: o.s, alpha: amount * o.a });
    }
  }

  drawFog(g, cam, time, list, amount, color) {
    for (const o of list) {
      const camF = cam.layerY(o.f);
      const sy = H - (o.ly - camF) + cam.oy;
      if (sy < -o.ry * 1.6 || sy > H + o.ry * 1.6) continue;
      const pulse = 0.55 + 0.45 * Math.sin(time * o.pulse * TAU + o.ph);   // forms and dissolves in place
      const cos = Math.cos(o.rot), sin = Math.sin(o.rot);
      for (const part of o.parts) {
        const px = part.dx * o.rx, py = part.dy * o.ry;
        g.puff(o.x + cam.ox + px * cos - py * sin, sy + px * sin + py * cos, o.rx * part.k, o.ry * part.k, color, o.a * amount * pulse, { rot: o.rot });
      }
    }
  }

  // Sunlight through the canopy, in front of the trees, behind the prince.
  drawShafts(g, cam, time) {
    const a = shaftAmount(cam.y);
    if (a <= 0) return;
    const deep = deepForestAmount(cam.y);
    for (const sft of this.shafts) {
      const sway = Math.sin(time * sft.sp + sft.ph) * 40;
      const pulse = 0.8 + 0.2 * Math.sin(time * 0.3 + sft.ph * 2);
      g.beam(sft.x + sway + 180, H * 0.45, 2600, sft.w, 1.12, '#fff2c0', 0.07 * a * pulse * (1 + 0.5 * deep), { glow: 0.25 });
    }
  }

  // Leafy boughs reaching in from the trunks in the deep forest band.
  drawBoughs(g, cam) {
    const amount = deepForestAmount(cam.y);
    if (amount <= 0) return;
    const t = this.art.tiles;
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    for (let k = first; k <= last; k++) {
      const h = hash(k * 11 + 3) % 100;
      if (h < 45) continue;                              // not every tile
      const side = hash(k * 13 + 5) % 2 ? 'L' : 'R';
      const off = (hash(k * 17 + 7) % 140) + 20;
      const sy = cam.sy(k * TILE_H + off);
      if (side === 'L') g.blit(t.boughL, TRUNK_W - 8 + cam.ox, sy, { alpha: amount });
      else g.blit(t.boughR, W - TRUNK_W + 8 + cam.ox, sy, { alpha: amount });
    }
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
