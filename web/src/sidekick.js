import { W } from './config.js';
import { approach } from './util.js';
import { POWER_FX } from './powerups.js';

// Lord Springalot, the prince's sidekick (a trial, docs/DESIGN.md): he does
// everything the prince does, a moment later. The prince's way is written
// down as he goes, and the lord is drawn where the prince was `delay`
// seconds ago, in the pose he had there: the same hops, the same boosts,
// the same somersaults, on a pogo pony of his own (art/lord.js).
//
// He is for the eye only. He stands on nothing, nothing meets him, and he
// asks no random number: a round is the same round with him or without,
// and so are the simulator's reports. Nothing is allocated while he runs.
export const LORD = {
  on: true,
  delay: 0.34,       // how far behind the prince he is (s)
  trail: 34,         // in the round he keeps this far behind the prince's back (px), so the two are not one figure when they hop on the spot
  beside: 96,        // on the lawn before the round he stands this far beside him
  ease: 5,           // how quickly he moves from the one to the other (1/s)
  height: 168,       // his sprite's (px): a somersault turns about its middle
  jump: 320,         // the prince further away than this from one step to the next was put there (a door, a new round): the lord is too
};

const POSES = ['standing', 'bounceDown', 'bounceUp', 'jumpUp', 'falling', 'boosting'];
// What he does where the prince is hurt or knocked out: wide eyes, the pot off his head.
const POSE_OF = { standing: 0, bounceDown: 1, bounceUp: 2, jumpUp: 3, falling: 4, boosting: 5, hurt: 4 };
const N = 256;       // steps kept: two seconds at the game's shortest step

export class Sidekick {
  constructor() {
    this.t = new Float64Array(N);
    this.px = new Float32Array(N); this.py = new Float32Array(N);
    this.psx = new Float32Array(N); this.psy = new Float32Array(N);
    this.prot = new Float32Array(N);
    this.ppose = new Uint8Array(N);
    this.pface = new Int8Array(N);
    this.o = { sx: 1, sy: 1, rot: 0, flip: false, alpha: 1, tint: null };
    this.reset();
  }

  reset() {
    this.clock = 0;
    this.head = 0;       // where the next step is written
    this.len = 0;        // how many are kept, the oldest at head - len
    this.x = 0; this.y = 0; this.sx = 1; this.sy = 1; this.rot = 0; this.pose = 0; this.face = 1;
    this.off = -LORD.beside;
  }

  // One step of the world: write down where the prince is, and find where he was.
  update(dt, pl, started) {
    this.clock += dt;
    if (this.len) {
      // put somewhere else (through a door, back to one, a new round): the lord is there with him
      const last = (this.head + N - 1) % N, dx = Math.abs(pl.x - this.px[last]);
      if (Math.abs(pl.y - this.py[last]) > LORD.jump || (dx > LORD.jump && Math.abs(dx - W) > LORD.jump)) this.len = 0;
    }
    const i = this.head, dead = pl.state === 'dead';
    this.t[i] = this.clock;
    this.px[i] = pl.x; this.py[i] = pl.y;
    this.psx[i] = pl.sx; this.psy[i] = pl.sy;
    this.prot[i] = dead ? 0 : pl.flip;
    this.ppose[i] = POSE_OF[pl.pose()] || 0;
    this.pface[i] = pl.facing < 0 ? -1 : 1;
    this.head = (i + 1) % N;
    if (this.len < N) this.len++;
    // the oldest step kept is the last one that is `delay` old (a step fresher than that is still to come)
    const at = this.clock - LORD.delay;
    while (this.len > 1 && this.t[(this.head + N - this.len + 1) % N] <= at) this.len--;
    const a = (this.head + N - this.len) % N;
    this.x = this.px[a]; this.y = this.py[a];
    if (this.len > 1 && this.t[a] <= at) {
      // between two steps (a frame is not always split the same way)
      const b = (a + 1) % N, k = (at - this.t[a]) / (this.t[b] - this.t[a]);
      this.y += (this.py[b] - this.y) * k;
      if (Math.abs(this.px[b] - this.x) < W / 2) this.x += (this.px[b] - this.x) * k;      // (not across the picture's edge)
    }
    this.sx = this.psx[a]; this.sy = this.psy[a]; this.rot = this.prot[a]; this.pose = this.ppose[a]; this.face = this.pface[a];
    // beside the prince on the lawn, behind his back in the round
    this.off = approach(this.off, started ? -this.face * LORD.trail : -LORD.beside, LORD.ease, dt);
  }

  draw(g, cam, art, pl) {
    if (!this.len) return;
    const s = art.lord[POSES[this.pose]], o = this.o;
    const cloak = pl.power === 'cloak' && pl.state !== 'dead';      // under the cloak he is as hard to see as the prince
    o.sx = this.sx; o.sy = this.sy; o.rot = this.rot; o.flip = this.face < 0;
    o.alpha = cloak ? 0.4 : 1; o.tint = cloak ? POWER_FX.cloakTint : null;
    let x = this.x + this.off;
    if (x < -W / 2) x += W; else if (x > W / 2) x -= W;
    // turned about his middle, as the prince is (player.js flipOffset)
    const r = LORD.height * 0.5, ox = this.rot ? -Math.sin(this.rot) * r : 0, oy = this.rot ? Math.cos(this.rot) * r - r : 0;
    const sx = cam.sx(x) + ox, sy = cam.sy(this.y) + oy;
    g.blit(s, sx, sy, o);
    if (x < -W / 2 + s.w) g.blit(s, sx + W, sy, o);
    else if (x > W / 2 - s.w) g.blit(s, sx - W, sy, o);
  }
}
