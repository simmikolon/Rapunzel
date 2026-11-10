import { GRAVITY } from './config.js';

// An updraft: a column of rising air that throws the prince into the sky,
// no landing needed. A little cloud with puffed cheeks blows from the base;
// inside the column the prince is accelerated hard up to a launch speed
// close to the bow spring's, so he flies past the next rows. Wind curls,
// feathers, leaves and petals ride up with him.
const LIFT = 9000, TOP_SPEED = 2300, WIDTH = 150;

let nextId = 1;

export class Updraft {
  constructor(x, bottom, top) {
    this.id = nextId++;
    this.x = x; this.bottom = bottom; this.top = top;
    this.w = WIDTH;
    this.alive = true;
    this.t = Math.random() * 10;
    this.inside = false;     // the prince was inside last frame (for the whoosh)
    this.rest = 0;           // after carrying him out of the top, the air rests a moment
    this.emit = 0;
  }
  get left() { return this.x - this.w / 2; }
  get right() { return this.x + this.w / 2; }
  contains(pl) { return pl.x > this.left && pl.x < this.right && pl.y > this.bottom && pl.y + 60 < this.top; }

  update(dt, world) {
    this.t += dt;
    const pl = world.player;
    const gust = 1 + 0.35 * (world.bg.atmo.gustEnv ? world.bg.atmo.gustEnv() : 0);
    if (this.rest > 0) this.rest -= dt;
    const inside = this.rest <= 0 && pl.alive && pl.state !== 'standing' && pl.state !== 'bouncing' && this.contains(pl);
    if (inside) {
      if (!this.inside) world.onUpdraftEnter(pl, this);
      pl.vy = Math.min(TOP_SPEED * Math.min(1.15, gust), pl.vy + (LIFT + GRAVITY) * dt);
      if (pl.state === 'falling' && pl.vy > 0) pl.setState('jumping');
      if (pl.vy > 600) { pl.sx = 0.74; pl.sy = 1.34; }   // stretched by the rush
    } else if (this.inside && pl.y + 60 >= this.top) {
      // carried out of the top: rest, so a missed landing is a fall back to
      // the row below rather than an endless ride
      this.rest = 1.6;
    }
    this.inside = inside;
    // feathers rising inside the column, a few per second, more in a gust
    this.emit += dt * (this.rest > 0 ? 2 : 10) * gust;
    while (this.emit >= 1) { this.emit -= 1; world.particles.updraft(this.left + 20 + Math.random() * (this.w - 40), this.bottom + Math.random() * 30, this.top - this.bottom); }
    if (this.top < world.cam.y - 200) this.alive = false;
  }

  draw(g, cam, time, art) {
    const sx = cam.sx(this.x), yTop = cam.sy(this.top), yBot = cam.sy(this.bottom);
    if (yBot < -80 || yTop > cam.sy(cam.y) + 80) return;
    const strength = this.rest > 0 ? 0.35 : 1;
    const h = yBot - yTop;
    // wind curls rising through the column, fading toward the top
    const n = Math.max(3, Math.round(h / 80));
    for (let i = 0; i < n; i++) {
      const f = ((time * 0.55 * strength + i / n + this.t * 0.013) % 1);
      const x = sx + Math.sin(time * 1.6 + i * 1.7) * 34 * (0.6 + 0.4 * f);
      const y = yBot - 10 - f * (h - 10);
      const a = Math.min(1, f * 4) * (1 - f * 0.85) * strength;
      const k = 1.7 + 0.2 * Math.sin(time * 5 + i);
      if (i % 2 === 0) g.puff(x, y, 44, 30, '#ffffff', 0.1 * a, { soft: true });     // the breath itself
      g.blit(art.wind.curls[i % 3], x, y, { alpha: a, sx: k, sy: k, rot: Math.sin(time * 2 + i) * 0.25, glow: 0.4 });
    }
    // a soft breath at the base, and the little cloud blowing it
    g.puff(sx, yBot - 24, this.w * 0.5, 44, '#ffffff', 0.24 * strength, { soft: true });
    const puff = this.rest > 0 ? 0 : Math.floor(time * 3 + this.t) % 2;
    const bs = 1.5;
    g.blit(art.wind.blower[puff], sx + Math.sin(time * 1.3 + this.t) * 6, yBot + 18 + Math.sin(time * 2.1 + this.t) * 4, { sx: bs * (puff ? 1.08 : 1), sy: bs * (puff ? 0.94 : 1) });
  }
}
