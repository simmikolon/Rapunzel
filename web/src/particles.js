import { GRAVITY } from './config.js';
import { PAL as C } from './palette.js';
import { TAU } from './util.js';

// Lightweight pooled particle system drawn as squares (pixel-art friendly).
// Each particle: x, y (world), vx, vy, life, maxLife, size, color, gravity
// factor, drag, spin, shape ('square' | 'leaf' | 'spark' | 'feather'),
// glow (0..1: how strongly it feeds the bloom layer).
const MAX = 600;

export class Particles {
  constructor() {
    this.items = [];
  }
  clear() { this.items.length = 0; }

  spawn(o) {
    if (this.items.length >= MAX) this.items.shift();
    this.items.push({
      x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0,
      life: o.life || 0.6, maxLife: o.life || 0.6,
      size: o.size || 6, color: o.color || C.white,
      g: o.g == null ? 0.4 : o.g, drag: o.drag == null ? 1.5 : o.drag,
      spin: o.spin || 0, angle: o.angle || 0,
      shape: o.shape || 'square', shrink: o.shrink == null ? true : o.shrink,
      fade: o.fade == null ? true : o.fade,
      glow: o.glow || 0,
    });
  }

  burst(x, y, n, fn) { for (let i = 0; i < n; i++) this.spawn(fn(i)); }

  update(dt) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0) { items[i] = items[items.length - 1]; items.pop(); continue; }
      p.vy -= GRAVITY * p.g * dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.angle += p.spin * dt;
    }
  }

  draw(g, cam) {
    for (const p of this.items) {
      const t = p.life / p.maxLife;
      const a = p.fade ? Math.min(1, t * 2) : 1;
      const s = p.shrink ? p.size * (0.4 + 0.6 * t) : p.size;
      const o = p.glow ? { glow: p.glow } : undefined;
      const sx = cam.sx(p.x), sy = cam.sy(p.y);
      if (p.shape === 'square') {
        g.rect(Math.round(sx - s / 2), Math.round(sy - s / 2), Math.round(s), Math.round(s), p.color, a, o);
      } else if (p.shape === 'spark') {
        g.rect(Math.round(sx - s / 2), Math.round(sy - 1), Math.round(s), 2, p.color, a, o);
        g.rect(Math.round(sx - 1), Math.round(sy - s / 2), 2, Math.round(s), p.color, a, o);
      } else {
        // leaf / feather: rotated rectangle
        g.box(sx, sy, s * 2, (s * 2) / 3, p.color, a, p.glow ? { rot: p.angle, glow: p.glow } : { rot: p.angle });
      }
    }
  }

  // --- Presets -------------------------------------------------------------
  landingDust(x, y, strength = 1) {
    this.burst(x, y, 8, (i) => ({
      x: x + (Math.random() - 0.5) * 50, y: y + 4,
      vx: (Math.random() - 0.5) * 260 * strength, vy: Math.random() * 120 * strength,
      life: 0.35 + Math.random() * 0.25, size: 6 + Math.random() * 6, color: i % 2 ? '#d8e4df' : '#aab8b4', g: 0.05, drag: 3,
    }));
  }
  leaves(x, y, n = 6) {
    this.burst(x, y, n, () => ({
      x: x + (Math.random() - 0.5) * 120, y: y + Math.random() * 20,
      vx: (Math.random() - 0.5) * 220, vy: 80 + Math.random() * 220,
      life: 0.8 + Math.random() * 0.6, size: 5 + Math.random() * 4, color: Math.random() < 0.5 ? C.grassLight : C.leaf,
      g: 0.12, drag: 2.5, spin: (Math.random() - 0.5) * 12, angle: Math.random() * TAU, shape: 'leaf', shrink: false,
    }));
  }
  petals(x, y, n = 6) {
    this.burst(x, y, n, () => ({
      x: x + (Math.random() - 0.5) * 80, y,
      vx: (Math.random() - 0.5) * 240, vy: 100 + Math.random() * 240,
      life: 0.7 + Math.random() * 0.5, size: 5, color: Math.random() < 0.5 ? C.ribbonHi : C.ribbon,
      g: 0.1, drag: 2.5, spin: (Math.random() - 0.5) * 10, shape: 'leaf', shrink: false,
    }));
  }
  crumble(x, y, w, dry = true) {
    this.burst(x, y, 14, () => ({
      x: x + (Math.random() - 0.5) * w, y: y - Math.random() * 30,
      vx: (Math.random() - 0.5) * 160, vy: -40 + Math.random() * 160,
      life: 0.8 + Math.random() * 0.6, size: 6 + Math.random() * 8, color: Math.random() < 0.5 ? (dry ? C.dry : C.barkMid) : (dry ? C.dryDark : C.barkDark),
      g: 0.9, drag: 0.4, spin: (Math.random() - 0.5) * 8, shape: 'leaf', shrink: false,
    }));
  }
  cloudPuff(x, y, w, n = 10) {
    this.burst(x, y, n, () => ({
      x: x + (Math.random() - 0.5) * w, y: y + Math.random() * 12 - 4,
      vx: (Math.random() - 0.5) * 140, vy: -20 + Math.random() * 90,
      life: 0.5 + Math.random() * 0.4, size: 10 + Math.random() * 12, color: Math.random() < 0.6 ? '#f4f7f8' : '#d6e2e8',
      g: -0.02, drag: 2.2, shape: 'square', shrink: true,
    }));
  }
  boostTrail(x, y) {
    this.burst(x, y, 3, () => ({
      x: x + (Math.random() - 0.5) * 24, y: y + Math.random() * 10,
      vx: (Math.random() - 0.5) * 120, vy: -200 - Math.random() * 200,
      life: 0.25 + Math.random() * 0.25, size: 5 + Math.random() * 7, color: Math.random() < 0.5 ? C.flame1 : (Math.random() < 0.5 ? C.flame2 : C.flame3), g: -0.1, drag: 2, glow: 1,
    }));
  }
  sparkles(x, y, n = 10, color = C.sun1) {
    this.burst(x, y, n, () => {
      const a = Math.random() * TAU, sp = 120 + Math.random() * 260;
      return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + Math.random() * 0.4, size: 6 + Math.random() * 6, color: Math.random() < 0.3 ? C.white : color, g: 0.1, drag: 3, shape: 'spark', glow: 0.8 };
    });
  }
  feathers(x, y) {
    this.burst(x, y, 9, () => ({
      x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 320, vy: 60 + Math.random() * 260,
      life: 0.9 + Math.random() * 0.6, size: 5, color: Math.random() < 0.7 ? C.crow : C.crowHi,
      g: 0.08, drag: 2.2, spin: (Math.random() - 0.5) * 14, shape: 'feather', shrink: false,
    }));
  }
  stars(x, y) {
    this.burst(x, y, 6, (i) => {
      const a = (i / 6) * TAU;
      return { x, y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200 + 100, life: 0.5, size: 10, color: C.gold, g: 0.3, drag: 2, shape: 'spark', glow: 0.7 };
    });
  }
  hearts(x, y) {
    this.burst(x, y, 7, () => ({
      x: x + (Math.random() - 0.5) * 60, y, vx: (Math.random() - 0.5) * 80, vy: 150 + Math.random() * 150,
      life: 0.8, size: 8, color: Math.random() < 0.5 ? C.heart : C.heartHi, g: -0.05, drag: 1.5, glow: 0.5,
    }));
  }
  hurtPuff(x, y) {
    this.burst(x, y, 12, () => {
      const a = Math.random() * TAU, sp = 100 + Math.random() * 300;
      return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, size: 8, color: Math.random() < 0.5 ? C.tunicHi : C.white, g: 0.2, drag: 2.5 };
    });
  }
  witchTrail(x, y) {
    this.spawn({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.5 + Math.random() * 0.4, size: 6 + Math.random() * 6, color: Math.random() < 0.5 ? '#8b5cf6' : '#4c1d95', g: -0.05, drag: 1.5, glow: 0.7 });
  }
}
