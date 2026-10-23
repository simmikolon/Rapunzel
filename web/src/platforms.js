import { JUMP_VY, WEAK_JUMP_VY, SPRING_VY } from './config.js';
import { TAU } from './util.js';

// Platform kinds. Collision rects are relative to the platform center.
// - branchL / branchR: grows from the left / right trunk. Dry ones crumble
//   after one bounce (the original "breakable" flag).
// - ribbon: a bow tied to Rapunzel's braid; it sways with the hair.
// - bow: a big ribbon bow that works as a spring.
// - swing: a plank hung on ropes between the trees: landable on top and
//   solid from below (the original "bottomCollidable" flag -> bonk).
export const KIND = {
  branchL: { w: 178, cx: -195, surface: 0, bounce: JUMP_VY, trunk: 'L' },
  branchR: { w: 178, cx: 195, surface: 0, bounce: JUMP_VY, trunk: 'R' },
  ribbon:  { w: 104, cx: 0, surface: 0, bounce: JUMP_VY, onBraid: true },
  bow:     { w: 124, cx: 0, surface: 0, bounce: SPRING_VY, onBraid: true },
  swing:   { w: 224, cx: 0, surface: 0, bounce: JUMP_VY, solidBelow: true, thickness: 32 },
  ground:  { w: 2400, cx: 0, surface: 0, bounce: JUMP_VY, ground: true },
};

let nextId = 1;

export class Platform {
  constructor(kind, y, opts = {}) {
    this.id = nextId++;
    this.kind = kind;
    this.def = KIND[kind];
    this.baseX = opts.x != null ? opts.x : this.def.cx;
    this.x = this.baseX;              // current center x (ribbons sway)
    this.y = y;                       // surface height
    this.dry = !!opts.dry;            // breakable
    this.sway = opts.sway || 0;       // horizontal sway amplitude (ribbons)
    this.swayPhase = opts.swayPhase || 0;
    this.state = 'normal';            // normal | jumpedOn | bottomHit | breaking | gone
    this.t = 0;                       // time in state
    this.alive = true;
    this.used = false;                // dry branches: bounced on once
    this.squash = 0;                  // visual squash 0..1
    this.wobble = 0;
    this.prevX = this.x;
  }

  get w() { return this.def.w; }
  get left() { return this.x - this.def.w / 2; }
  get right() { return this.x + this.def.w / 2; }
  get bounceVy() { return this.dry ? WEAK_JUMP_VY : this.def.bounce; }
  get solidBelow() { return !!this.def.solidBelow; }
  get bottom() { return this.y - (this.def.thickness || 0); }

  // Called by the world each frame. `braidX(y)` gives the hair's sway offset.
  update(dt, time, braidX) {
    this.t += dt;
    if (this.def.onBraid) this.x = this.baseX + braidX(this.y) + this.sway * Math.sin(time * 1.3 + this.swayPhase);
    if (this.state === 'jumpedOn') {
      this.squash = Math.max(0, 1 - this.t / 0.18);
      if (this.t > 0.18) { this.state = this.used && this.dry ? 'breaking' : 'normal'; this.t = 0; }
    } else if (this.state === 'bottomHit') {
      this.wobble = Math.sin(this.t * 40) * Math.max(0, 1 - this.t / 0.3) * 4;
      if (this.t > 0.3) { this.state = 'normal'; this.t = 0; this.wobble = 0; }
    } else if (this.state === 'breaking') {
      // falls away, spinning slightly
      this.y -= 400 * this.t * dt * 4;
      this.wobble = this.t * 25;
      if (this.t > 0.6) { this.state = 'gone'; this.alive = false; }
    }
  }

  // The player bounced on it.
  jumpedOn() {
    if (this.state === 'breaking' || this.state === 'gone') return false;
    this.state = 'jumpedOn';
    this.t = 0;
    if (this.dry) this.used = true;
    return true;
  }

  hitFromBelow() {
    if (this.state === 'normal') { this.state = 'bottomHit'; this.t = 0; }
  }

  get landable() { return this.alive && this.state !== 'breaking' && this.state !== 'gone'; }
}
