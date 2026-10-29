import { GRAVITY } from './config.js';

// An updraft: a column of rising air the prince can ride, no landing
// needed. Inside it he gets `lift` px/s^2 upward (more than gravity) up to
// a top speed, so a fall turns into a rise and a bounce reaches further.
// Feathers and leaves swirl up inside; the strength pulses with the gusts.
const LIFT = 3400, TOP_SPEED = 900, WIDTH = 150;

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
      pl.vy = Math.min(TOP_SPEED, pl.vy + (LIFT * gust + GRAVITY * (pl.vy < 0 ? 0.6 : 0)) * dt);
      if (pl.state === 'falling' && pl.vy > 0) pl.setState('jumping');
    } else if (this.inside && pl.y + 60 >= this.top) {
      // carried out of the top: rest, so a missed landing is a fall back to
      // the row below rather than an endless ride
      this.rest = 1.6;
    }
    this.inside = inside;
    // feathers rising inside the column, a few per second, more in a gust
    this.emit += dt * (this.rest > 0 ? 3 : 14) * gust;
    while (this.emit >= 1) { this.emit -= 1; world.particles.updraft(this.left + Math.random() * this.w, this.bottom + Math.random() * 40, this.top - this.bottom); }
    if (this.top < world.cam.y - 200) this.alive = false;
  }

  draw(g, cam, time) {
    const sx = cam.sx(this.x), yTop = cam.sy(this.top), yBot = cam.sy(this.bottom);
    if (yBot < -50 || yTop > cam.sy(cam.y) + 50) return;
    // faint streaks rising, a soft base puff
    const strength = this.rest > 0 ? 0.3 : 1;
    // the column itself: a faint bright band, streaks rising through it, a puff at the base
    g.rect(sx - this.w / 2, yTop, this.w, yBot - yTop, '#ffffff', 0.07 * strength);
    for (let i = 0; i < 9; i++) {
      const f = ((time * 0.7 * strength + i * 0.11 + this.t * 0.01) % 1);
      const x = sx - this.w / 2 + 12 + (i * 29) % (this.w - 24) + Math.sin(time * 2 + i) * 6;
      const y = yBot - f * (yBot - yTop);
      g.line(x, y, x, y - 56, '#ffffff', 3, (0.22 + 0.3 * (1 - f)) * strength);
    }
    g.puff(sx, yBot - 6, this.w * 0.7, 46, '#ffffff', 0.32 * strength, { soft: true });
    g.puff(sx, yTop + 20, this.w * 0.5, 30, '#ffffff', 0.14 * strength, { soft: true });
  }
}
