// Deep forest atmosphere: falling leaves on a depth continuum, mist wisps,
// light shafts with dust motes, canopy dapple, boughs, and the small life
// of the forest (birds, butterflies, acorns). Slow dynamics (gusts, cloud
// cover) keep it from repeating. Everything here is visual; nothing drawn
// in front of the prince may hide a hazard, so fog, dapple and mist stay
// translucent.
//
// Coordinates: fog, leaves and dapple live in their own parallax layer
// (cam.layerY(f)); shafts and motes in screen space; life in world space.
import { W, H, PARALLAX_TOWER } from './config.js';
import { TILE_H, TOWER_W, TRUNK_W } from './art/tiles.js';
import { invLerp, lerp, TAU, clamp, approach } from './util.js';
import { deepForestAmount, shaftAmount, lifeAmount, hash } from './altitude.js';

const SHAFT_ROT = 1.12, SHAFT_LEN = 2600;

export class Atmosphere {
  constructor(art, r) {
    this.art = art;
    this.leaves = Array.from({ length: 60 }, () => this.newLeaf(r));
    this.fogFront = Array.from({ length: 6 }, () => this.newWisp(r, r.range(1.04, 1.2)));
    this.fogBack = Array.from({ length: 4 }, () => this.newWisp(r, 0.75));
    this.shafts = Array.from({ length: 4 }, (_, i) => ({ x: 120 + i * 190 + r.range(-40, 40), w: r.range(70, 150), ph: r.range(0, TAU), sp: r.range(0.08, 0.16) }));
    this.motes = Array.from({ length: 40 }, () => ({ s: r.int(0, 3), t: r.next(), u: r.range(-0.5, 0.5), v: r.range(0.015, 0.045), ph: r.range(0, TAU), size: r.chance(0.3) ? 5 : 3, jit: r.range(0.6, 1.4) }));
    this.dapple = Array.from({ length: 8 }, () => ({ f: PARALLAX_TOWER, x: r.range(W / 2 - TOWER_W / 2 + 40, W / 2 + TOWER_W / 2 - 40), ly: 0, rx: r.range(110, 200), ry: r.range(70, 130), ph: r.range(0, TAU), sp: r.range(0.2, 0.4), a: r.range(0.22, 0.34) }));
    this.lawnMist = Array.from({ length: 4 }, (_, i) => ({ x: -300 + i * 200 + r.range(-40, 40), y: r.range(14, 50), rx: r.range(240, 360), ry: r.range(38, 66), ph: r.range(0, TAU), drift: r.range(6, 14) * r.sign() }));
    this.birds = new Map();
    this.butterflies = Array.from({ length: 4 }, (_, i) => ({ color: i % 3, home: null, x: 0, y: 0, t: r.range(0, 10), a: r.range(1.3, 2.1), b: r.range(1.7, 2.6), flee: 0, vx: 0, vy: 0, alive: false }));
    this.acorns = [];
    this.acornTimer = 3;
    this.gust = { timer: 10, t: -1, dur: 3, strength: 0, dir: 1 };
    this.cloud = { cover: 0, target: 0, timer: 15, rate: 0.15 };
    this.nudge = 0;
    this.wasOff = true;
  }

  // A leaf somewhere between far (f 0.85, small, dim) and near (f 1.35, big).
  newLeaf(r) {
    const f = r.range(0.85, 1.35);
    const near = invLerp(0.85, 1.35, f);
    return {
      f, x: r.range(-40, W + 40), ly: 0, v: r.int(0, 2),
      vy: r.range(35, 95) * (0.7 + 0.6 * near),
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
      ph: r.range(0, TAU), pulse: r.range(0.08, 0.16), a: r.range(0.07, 0.11), wake: 0,
    };
  }

  // --- slow dynamics -----------------------------------------------------
  gustEnv() {
    const g = this.gust;
    if (g.t < 0) return 0;
    return g.strength * Math.sin(Math.PI * g.t / g.dur) ** 2;
  }
  get sun() { return 1 - 0.75 * this.cloud.cover; }

  // Boughs reach in from the trunks on some tiles; same rule for drawing,
  // birds and acorns. Returns null or { side, x, y } (world coords of the tip).
  boughAt(k) {
    if (hash(k * 11 + 3) % 100 < 45) return null;
    const side = hash(k * 13 + 5) % 2 ? 'L' : 'R';
    const off = (hash(k * 17 + 7) % 140) + 20;
    const y = k * TILE_H + off;
    const x = side === 'L' ? -W / 2 + TRUNK_W - 8 + 96 : W / 2 - TRUNK_W + 8 - 96;
    return { side, x, y, root: side === 'L' ? -W / 2 + TRUNK_W - 8 : W / 2 - TRUNK_W + 8 };
  }

  // --- update ------------------------------------------------------------
  update(dt, cam, time, world) {
    const deep = deepForestAmount(cam.y);
    const p = world.player;
    // gusts
    const g = this.gust;
    if (g.t >= 0) { g.t += dt; if (g.t > g.dur) g.t = -1; }
    else { g.timer -= dt; if (g.timer <= 0) { g.t = 0; g.dur = 2.5 + Math.random() * 1.5; g.strength = 0.6 + Math.random() * 0.4; g.dir = Math.random() < 0.5 ? -1 : 1; g.timer = 14 + Math.random() * 10; } }
    const gust = this.gustEnv();
    // cloud cover: a slow random walk
    const c = this.cloud;
    c.timer -= dt;
    if (c.timer <= 0) { c.target = Math.random() < 0.4 ? 0 : Math.random() * 0.7; c.rate = 1 / (6 + Math.random() * 4); c.timer = 12 + Math.random() * 18; }
    c.cover = approach(c.cover, c.target, c.rate * 3, dt);
    // sideways nudge against the prince's motion (smoothed; no pop on wrap)
    this.nudge = approach(this.nudge, -(p.vx || 0) * 0.045, 4, dt);
    // motes drift down their beam
    for (const m of this.motes) { m.t += m.v * (1 + 2 * gust) * dt; if (m.t > 1) m.t -= 1; }
    // lawn mist
    for (const o of this.lawnMist) { o.x += o.drift * dt; if (o.x < -W / 2 - o.rx) o.x = W / 2 + o.rx; else if (o.x > W / 2 + o.rx) o.x = -W / 2 - o.rx; }

    this.updateLife(dt, cam, time, world);

    if (deep <= 0) { this.wasOff = true; return; }
    const reenter = (o, pad, spread) => {
      const camF = cam.layerY(o.f);
      if (o.ly < camF - pad) { o.ly = camF + H + pad + Math.random() * spread; o.x = Math.random() * (W + 80) - 40; }
      else if (o.ly > camF + H + pad + spread) o.ly = camF + H + pad + Math.random() * spread;
    };
    if (this.wasOff) {
      this.wasOff = false;
      for (const o of this.leaves) o.ly = cam.layerY(o.f) + Math.random() * H * 1.6;
      for (const o of [...this.fogFront, ...this.fogBack]) o.ly = cam.layerY(o.f) + Math.random() * H * 1.3;
      for (const o of this.dapple) o.ly = cam.layerY(o.f) + Math.random() * H * 1.4;
    }
    const wind = Math.sin(time * 0.23) * 28 + Math.sin(time * 0.61 + 1.7) * 14 + gust * 230 * g.dir;
    for (const o of this.leaves) {
      o.ly -= o.vy * (1 + 0.25 * Math.sin(time * o.sp * 0.7 + o.ph)) * dt;
      o.x += (wind + Math.sin(time * o.sp + o.ph) * o.sway * (1 + 1.5 * gust)) * dt;
      o.rot += o.spin * (1 + 2 * gust) * dt;
      if (o.x < -60) o.x = W + 60; else if (o.x > W + 60) o.x = -60;
      reenter(o, 40, H * 0.8);
    }
    const px = cam.sx(p.x), py = cam.sy(p.y + 110);
    for (const o of [...this.fogFront, ...this.fogBack]) {
      o.x += (o.drift + gust * 60 * g.dir) * dt;
      o.ly += o.vdrift * dt;
      // wake: a wisp the prince passes through is pushed aside and thins out
      if (o.f >= 1 && p.alive) {
        const sy = H - (o.ly - cam.layerY(o.f));
        const dx = o.x - px, dy = sy - py;
        const ix = 1 - Math.abs(dx) / (o.rx * 0.9), iy = 1 - Math.abs(dy) / (o.ry * 1.3);
        if (ix > 0 && iy > 0) { const inf = ix * iy; o.wake = Math.max(o.wake, inf); o.x += Math.sign(dx || 1) * 160 * inf * dt; }
      }
      o.wake = Math.max(0, o.wake - dt * 0.5);
      if (o.x < -o.rx - 80) o.x = W + o.rx + 80; else if (o.x > W + o.rx + 80) o.x = -o.rx - 80;
      reenter(o, o.ry + 40, H * 0.6);
    }
    for (const o of this.dapple) reenter(o, o.ry + 20, H * 0.5);
  }

  // Birds perch on bough tips and take off when the prince comes near;
  // butterflies loop around branch tips and flee a landing; acorns drop.
  updateLife(dt, cam, time, world) {
    const p = world.player;
    const life = lifeAmount(cam.y), deep = deepForestAmount(cam.y);
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    // birds: one per bough tile that the hash grants, created when the tile comes into view
    for (const [k, b] of this.birds) if (k < first - 1 && b.state === 'perched') this.birds.delete(k);
    if (deep > 0) {
      for (let k = first; k <= last + 1; k++) {
        if (this.birds.has(k)) continue;
        const bough = this.boughAt(k);
        if (!bough || hash(k * 19 + 11) % 100 >= 55) continue;
        this.birds.set(k, { state: 'perched', x: bough.x, y: bough.y + 8, dir: bough.side === 'L' ? 1 : -1, t: Math.random() * 3, vx: 0, vy: 0, hop: 0 });
      }
    }
    for (const [k, b] of this.birds) {
      b.t += dt;
      if (b.state === 'perched') {
        if (p.alive && Math.abs(p.x - b.x) < 200 && Math.abs(p.y - b.y) < 170) {
          b.state = 'flying'; b.vx = (b.x < p.x ? -1 : 1) * (240 + Math.random() * 80); b.vy = 260; b.dir = Math.sign(b.vx); b.t = 0;
        }
      } else {
        b.vy = approach(b.vy, 110, 1.2, dt);
        b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(b.t * 9) * 30 * dt;
        if (b.x < -W / 2 - 120 || b.x > W / 2 + 120 || b.y > cam.top + 150) this.birds.delete(k);
      }
    }
    // butterflies
    const branches = world.platforms.filter((q) => (q.kind === 'branchL' || q.kind === 'branchR') && q.landable);
    const homeFor = (minY) => {
      const cands = branches.filter((q) => q.y > minY && q.y < cam.top + 300);
      if (!cands.length) return null;
      const q = cands[Math.floor(Math.random() * cands.length)];
      return { x: q.x + (q.kind === 'branchL' ? 85 : -85), y: q.y + 55, pf: q };
    };
    for (const bf of this.butterflies) {
      if (life <= 0) { bf.alive = false; continue; }
      if (!bf.alive || !bf.home || bf.home.y < cam.y - 60 || !bf.home.pf.landable) {
        const h = homeFor(cam.y + H * 0.3);
        if (!h) { bf.alive = false; continue; }
        bf.home = h; bf.alive = true; bf.flee = 0; bf.x = h.x; bf.y = h.y;
      }
      bf.t += dt;
      if (bf.flee > 0) {
        bf.flee -= dt;
        bf.x += bf.vx * dt; bf.y += bf.vy * dt;
        if (bf.flee <= 0) { const h = homeFor(bf.y + 150); if (h) { bf.home = h; } else bf.alive = false; }
      } else {
        const tx = bf.home.x + Math.sin(bf.t * bf.a) * 44, ty = bf.home.y + Math.sin(bf.t * bf.b) * 26 + 10;
        bf.x = approach(bf.x, tx, 2.5, dt); bf.y = approach(bf.y, ty, 2.5, dt);
        if (p.alive && Math.abs(p.x - bf.x) < 150 && Math.abs(p.y + 60 - bf.y) < 160) {
          bf.flee = 1.2; bf.vx = (bf.x < p.x ? -1 : 1) * 200; bf.vy = 140;
        }
      }
    }
    // acorns
    this.acornTimer -= dt;
    if (deep > 0 && this.acornTimer <= 0) {
      this.acornTimer = 2.5 + Math.random() * 3.5;
      const boughs = [];
      for (let k = first; k <= last; k++) { const b = this.boughAt(k); if (b && b.y > cam.y + 200 && b.y < cam.top - 50) boughs.push(b); }
      if (boughs.length) { const b = boughs[Math.floor(Math.random() * boughs.length)]; this.acorns.push({ x: b.x + (Math.random() - 0.5) * 50, y: b.y + 6, vx: (Math.random() - 0.5) * 40, vy: 0, rot: 0, spin: (Math.random() - 0.5) * 10 }); }
    }
    for (const a of this.acorns) { a.vy -= 1500 * dt; a.y += a.vy * dt; a.x += a.vx * dt; a.rot += a.spin * dt; }
    this.acorns = this.acorns.filter((a) => a.y > cam.y - 60);
  }

  // --- draw ---------------------------------------------------------------
  drawLeaves(g, cam, near, amount) {
    const t = this.art.tiles.leaves;
    for (const o of this.leaves) {
      if ((o.f >= 1) !== near) continue;
      const camF = cam.layerY(o.f);
      const sy = H - (o.ly - camF) + cam.oy;
      if (sy < -40 || sy > H + 40) continue;
      const nx = near ? this.nudge * (o.f - 1) / 0.35 : 0;
      g.blit(t[o.v], o.x + nx + cam.ox, sy, { rot: o.rot, sx: o.s, sy: o.s, alpha: amount * o.a });
    }
  }

  drawFog(g, cam, time, list, amount, color, nudge) {
    for (const o of list) {
      const camF = cam.layerY(o.f);
      const sy = H - (o.ly - camF) + cam.oy;
      if (sy < -o.ry * 1.6 || sy > H + o.ry * 1.6) continue;
      const pulse = 0.55 + 0.45 * Math.sin(time * o.pulse * TAU + o.ph);
      const cos = Math.cos(o.rot), sin = Math.sin(o.rot);
      const thin = 1 - 0.65 * o.wake, spread = 1 + 0.6 * o.wake;
      for (const part of o.parts) {
        const px = part.dx * o.rx * spread, py = part.dy * o.ry * spread;
        g.puff(o.x + nudge + cam.ox + px * cos - py * sin, sy + px * sin + py * cos, o.rx * part.k, o.ry * part.k, color, o.a * amount * pulse * thin, { rot: o.rot });
      }
    }
  }

  drawBackFog(g, cam, time) { const d = deepForestAmount(cam.y); if (d > 0) this.drawFog(g, cam, time, this.fogBack, d, '#9fd4c4', 0); }
  drawBackLeaves(g, cam) { const d = deepForestAmount(cam.y); if (d > 0) this.drawLeaves(g, cam, false, d); }

  // Canopy shadows on the wall: soft dark blobs in the tower layer, swaying.
  drawDapple(g, cam, time) {
    const d = deepForestAmount(cam.y) * this.sun;
    if (d <= 0) return;
    for (const o of this.dapple) {
      const camF = cam.layerY(o.f);
      const sy = H - (o.ly - camF) + cam.oy;
      if (sy < -o.ry || sy > H + o.ry) continue;
      const sway = Math.sin(time * o.sp + o.ph) * (30 + 40 * this.gustEnv());
      g.puff(o.x + sway + cam.ox, sy, o.rx, o.ry, '#3d5a48', o.a * d, { blend: 'multiply', rot: Math.sin(time * 0.1 + o.ph) * 0.3 });
    }
  }

  // Low mist on the lawn at the start.
  drawLawnMist(g, cam, time) {
    if (cam.y > 320) return;
    const a = 1 - clamp((cam.y + 100) / 420, 0, 1);
    for (const o of this.lawnMist) {
      const breathe = 0.8 + 0.2 * Math.sin(time * 0.4 + o.ph);
      g.puff(cam.sx(o.x), cam.sy(o.y), o.rx * breathe, o.ry, '#cfe6dc', 0.2 * a);
    }
  }

  // Boughs with birds on them, acorns, butterflies: behind the prince.
  drawLife(g, cam, time) {
    const t = this.art.tiles;
    const deep = deepForestAmount(cam.y), life = lifeAmount(cam.y);
    const gust = this.gustEnv();
    if (deep > 0) {
      const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
      for (let k = first; k <= last; k++) {
        const b = this.boughAt(k);
        if (!b) continue;
        const rock = gust * 0.12 * Math.sin(time * 7 + k) * (b.side === 'L' ? 1 : -1);
        g.blit(b.side === 'L' ? t.boughL : t.boughR, cam.sx(b.root), cam.sy(b.y), { alpha: deep, rot: rock });
      }
      for (const b of this.birds.values()) {
        const frame = b.state === 'flying' ? Math.floor(b.t * 10) % 2 : (Math.floor(b.t * 0.5) % 4 === 0 ? 1 : 0);
        g.blit(b.dir > 0 ? t.birdR[frame] : t.birdL[frame], cam.sx(b.x), cam.sy(b.y), { alpha: deep });
      }
      for (const a of this.acorns) g.blit(t.acorn, cam.sx(a.x), cam.sy(a.y), { rot: a.rot, alpha: deep });
    }
    if (life > 0) {
      for (const bf of this.butterflies) {
        if (!bf.alive) continue;
        const frame = Math.floor(bf.t * 7) % 2;
        const set = t.butterflies[bf.color];
        g.blit(set[frame], cam.sx(bf.x), cam.sy(bf.y), { alpha: life, flip: bf.vx < 0 && bf.flee > 0 });
      }
    }
  }

  // Sunlight through the canopy with dust motes drifting in it.
  drawShafts(g, cam, time) {
    const a = shaftAmount(cam.y) * this.sun;
    if (a <= 0.01) return;
    const deep = deepForestAmount(cam.y);
    const cos = Math.cos(SHAFT_ROT), sin = Math.sin(SHAFT_ROT);
    const centers = this.shafts.map((sft) => ({ x: sft.x + Math.sin(time * sft.sp + sft.ph) * 40 + 180, y: H * 0.45, w: sft.w, pulse: 0.8 + 0.2 * Math.sin(time * 0.3 + sft.ph * 2) }));
    for (const c of centers) g.beam(c.x, c.y, SHAFT_LEN, c.w, SHAFT_ROT, '#fff2c0', 0.07 * a * c.pulse * (1 + 0.5 * deep), { glow: 0.25 });
    for (const m of this.motes) {
      const c = centers[m.s];
      const along = (m.t - 0.5) * SHAFT_LEN, across = m.u * c.w * 0.8 + Math.sin(time * m.jit + m.ph) * 6;
      const x = c.x + cos * along - sin * across, y = c.y + sin * along + cos * across;
      if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
      const tw = 0.45 + 0.55 * Math.sin(time * 2.2 * m.jit + m.ph);
      g.rect(x - m.size / 2, y - m.size / 2, m.size, m.size, '#fff6d0', 0.8 * a * tw * c.pulse, { glow: 1 });
    }
  }

  // Closest layer: big leaves and mist drifting in front of everything.
  drawFront(g, cam, time) {
    const d = deepForestAmount(cam.y);
    if (d <= 0) return;
    this.drawLeaves(g, cam, true, d);
    this.drawFog(g, cam, time, this.fogFront, d, '#d8efe6', this.nudge);
  }
}
