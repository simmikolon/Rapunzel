import { TAU, RNG } from './util.js';
import { POWERS, rainbow } from './powerups.js';

let nextId = 1;

// The bob phase comes from the RNG handed in, so a seeded round replays exactly.
class Pickup {
  constructor(x, y, rng = new RNG()) { this.id = nextId++; this.x = x; this.y = y; this.t = rng.range(0, TAU); this.alive = true; }
  get rect() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
  // Moved by the sun magnet: the place it bobs around moves with it.
  shift(dx, dy) {
    this.x += dx; this.y += dy;
    if (this.baseX != null) this.baseX += dx;
    if (this.baseY != null) this.baseY += dy;
  }
}

// Sun drop: +score, little sparkle. Spawned in arcs between platforms.
export class Sun extends Pickup {
  constructor(x, y, rng) { super(x, y, rng); this.kind = 'sun'; this.w = 40; this.h = 40; this.baseY = y; }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 3) * 6; }
  draw(g, cam, art) { g.blit(art.creatures.sun[Math.floor(this.t * 4) % 2], cam.sx(this.x), cam.sy(this.y), { glow: 0.9 }); }
}

// Floating lantern: drifts upward, refills the boost meter.
export class Lantern extends Pickup {
  constructor(x, y, rng) { super(x, y, rng); this.kind = 'lantern'; this.w = 44; this.h = 60; this.baseX = x; this.vy = 36; }
  update(dt) { this.t += dt; this.y += this.vy * dt; this.x = this.baseX + Math.sin(this.t * 1.2) * 24; }
  draw(g, cam, art) {
    const sx = cam.sx(this.x), sy = cam.sy(this.y);
    g.halo(sx, sy, 70, '#ffbe50', 0.45, { glow: 1 });
    g.blit(art.creatures.lantern[Math.floor(this.t * 6) % 2], sx, sy, { rot: Math.sin(this.t * 1.2) * 0.12, glow: 0.7 });
  }
}

// Heart: restores one heart.
export class Heart extends Pickup {
  constructor(x, y, rng) { super(x, y, rng); this.kind = 'heart'; this.w = 40; this.h = 40; this.baseY = y; }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 2.5) * 8; }
  draw(g, cam, art) { const s = 1 + Math.sin(this.t * 6) * 0.08; g.blit(art.creatures.heart, cam.sx(this.x), cam.sy(this.y), { sx: s, sy: s, glow: 0.5 }); }
}

// A power-up (POWERS in powerups.js): floats between two rows in a soap
// bubble tinted in its signal colour, which is why it hangs in the air and
// what tells it from everything else up there; the bubble is the thing to
// catch (it pops). Each moves in its own way inside: the star rocks, the
// cloak fades out and in, the spring hops, the magnet twitches, the feather
// swings like a falling leaf.
export class PowerUp extends Pickup {
  constructor(power, x, y, rng) { super(x, y, rng); this.kind = 'power'; this.power = power; this.w = 88; this.h = 88; this.baseY = y; }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 2.2) * 10; }
  draw(g, cam, art) {
    const t = this.t, P = POWERS[this.power], A = art.powerups, frames = A[this.power];
    const sx = cam.sx(this.x), sy = cam.sy(this.y);
    const color = this.power === 'star' ? rainbow(t * 0.8) : P.color;
    g.halo(sx, sy, 110, color, 0.5 + 0.1 * Math.sin(t * 4), { glow: 0.3 });
    // the bubble wobbles as it floats
    const wob = Math.sin(t * 3.1) * 0.04, bo = { sx: 1 + wob, sy: 1 - wob };
    g.blit(A.bubbleFill, sx, sy, { ...bo, alpha: 0.2, tint: color });
    let frame = Math.floor(t * 3) % 2, ix = sx, iy = sy;
    const o = { glow: 0.2 };
    if (this.power === 'star') o.rot = Math.sin(t * 2.4) * 0.22;
    else if (this.power === 'cloak') { const k = (t * 0.8) % 1; frame = k > 0.72 ? 1 : 0; }
    else if (this.power === 'spring') iy += frame ? 4 : -6;
    else if (this.power === 'magnet') o.rot = Math.sin(t * 9) * (frame ? 0.14 : 0.04);
    else if (this.power === 'feather') { ix += Math.sin(t * 1.8) * 8; o.rot = Math.sin(t * 1.8 + 1.2) * 0.35; }
    g.blit(frames[frame], ix, iy, o);
    g.blit(A.bubble, sx, sy, { ...bo, alpha: 0.9, glow: 0.1 });
    // two sparkles twinkle on the shell
    for (let i = 0; i < 2; i++) {
      const k = (t * 0.9 + i * 0.5) % 1, a = 2.4 + i * 3.4 + Math.floor(t * 0.9 + i * 0.5) * 1.9;
      g.blit(art.sign.sparkle, sx + Math.cos(a) * 46, sy + Math.sin(a) * 46, { alpha: Math.sin(Math.PI * k), sx: 0.6 + 0.5 * Math.sin(Math.PI * k), sy: 0.6 + 0.5 * Math.sin(Math.PI * k), glow: 0.5 });
    }
  }
}

// A piece of the hoard one can take (the treasury, vault.js): a cut stone,
// a golden goblet, the crown. It counts as suns (its `value`), bobs and
// glints like everything one can take, and glows a little more than the
// gold that only furnishes the room.
export const TREASURE = { gem: 3, goblet: 5, crown: 10 };
export class Treasure extends Pickup {
  constructor(what, x, y, rng) { super(x, y, rng); this.kind = 'treasure'; this.what = what; this.value = TREASURE[what]; this.look = Math.floor(this.t * 7) % 4; this.w = 44; this.h = 44; this.baseY = y; }
  update(dt) { this.t += dt; this.y = this.baseY + Math.sin(this.t * 2.6) * 6; }
  draw(g, cam, art) {
    const A = art.vault.treasure, s = this.what === 'gem' ? A.gem[this.look] : A[this.what], sx = cam.sx(this.x), sy = cam.sy(this.y);
    g.halo(sx, sy, this.what === 'crown' ? 74 : 48, '#ffe9a0', 0.3 + 0.1 * Math.sin(this.t * 4), { glow: 0.5 });
    g.blit(s, sx, sy, { glow: 0.6 });
    const k = (this.t * 0.9) % 1, sc = 0.5 + 0.4 * Math.sin(Math.PI * k);          // a glint that comes and goes
    g.blit(art.sign.sparkle, sx + 14, sy - 14, { alpha: Math.sin(Math.PI * k), sx: sc, sy: sc, glow: 0.5 });
  }
}
