import { TAU } from './util.js';

let nextId = 1;

class Pickup {
  constructor(x, y) { this.id = nextId++; this.x = x; this.y = y; this.t = Math.random() * TAU; this.alive = true; }
  get rect() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
}

// Sun drop: +score, little sparkle. Spawned in arcs between platforms.
export class Sun extends Pickup {
  constructor(x, y) { super(x, y); this.kind = 'sun'; this.w = 40; this.h = 40; this.baseY = y; }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 3) * 6; }
  draw(g, cam, art) { g.blit(art.creatures.sun[Math.floor(this.t * 4) % 2], cam.sx(this.x), cam.sy(this.y), { glow: 0.9 }); }
}

// Floating lantern: drifts upward, refills the boost meter.
export class Lantern extends Pickup {
  constructor(x, y) { super(x, y); this.kind = 'lantern'; this.w = 44; this.h = 60; this.baseX = x; this.vy = 36; }
  update(dt) { this.t += dt; this.y += this.vy * dt; this.x = this.baseX + Math.sin(this.t * 1.2) * 24; }
  draw(g, cam, art) {
    const sx = cam.sx(this.x), sy = cam.sy(this.y);
    g.halo(sx, sy, 70, '#ffbe50', 0.45, { glow: 1 });
    g.blit(art.creatures.lantern[Math.floor(this.t * 6) % 2], sx, sy, { rot: Math.sin(this.t * 1.2) * 0.12, glow: 0.7 });
  }
}

// Heart: restores one heart.
export class Heart extends Pickup {
  constructor(x, y) { super(x, y); this.kind = 'heart'; this.w = 40; this.h = 40; this.baseY = y; }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 2.5) * 8; }
  draw(g, cam, art) { const s = 1 + Math.sin(this.t * 6) * 0.08; g.blit(art.creatures.heart, cam.sx(this.x), cam.sy(this.y), { sx: s, sy: s, glow: 0.5 }); }
}
