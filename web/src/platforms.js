import { W, JUMP_VY, WEAK_JUMP_VY, SPRING_VY, CAMERA_START_Y, PARALLAX_TOWER } from './config.js';
import { TAU } from './util.js';

// Platform kinds. Collision rects are relative to the platform center.
// - branchL / branchR: grows from the left / right trunk. Dry ones crumble
//   after one bounce (the original "breakable" flag).
// - ribbon: a bow tied to Rapunzel's braid; it sways with the hair. The
//   braid is part of the slower tower layer, so a ribbon stores its height
//   in layer coordinates (`ly`) and its position in the prince's plane
//   (`y`) is derived from the camera every frame, like the original did by
//   converting node positions to scene space on contact.
// - bow: a big ribbon bow that works as a spring (also on the braid).
// - swing: a plank hung on ropes between the trees: landable on top and
//   solid from below (the original "bottomCollidable" flag -> bonk).
export const KIND = {
  // Branches are anchored at their root on the trunk (|x| = 284) and reach
  // inward. Their box comes from the length class (BRANCH_LEN) times a
  // small scale (0.88 .. 1.12 for normal and long ones); `w` is the normal.
  branchL: { w: 178, cx: -195, root: -284, dir: 1, surface: 0, bounce: JUMP_VY, trunk: 'L' },
  branchR: { w: 178, cx: 195, root: 284, dir: -1, surface: 0, bounce: JUMP_VY, trunk: 'R' },
  ribbon:  { w: 104, cx: 0, surface: 0, bounce: JUMP_VY, onBraid: true, layer: PARALLAX_TOWER },
  // Balconies on the tower itself (windows zone): on the tower layer like
  // the ribbons, at the wall's left or right edge (x = -210 / +210). The
  // dilapidated variant is fragile under the dry rules.
  balcony: { w: 120, cx: 0, surface: 0, bounce: JUMP_VY, layer: PARALLAX_TOWER, balcony: true },
  bow:     { w: 124, cx: 0, surface: 0, bounce: SPRING_VY, onBraid: true, layer: PARALLAX_TOWER },
  swing:   { w: 224, cx: 0, surface: 0, bounce: JUMP_VY, solidBelow: true, thickness: 32 },
  // Clouds (above the trees): in the prince's plane, free x in three lanes,
  // box by size (CLOUD_SIZE); `cloud` names the behaviour (thick | wispy |
  // drift | storm). Wispy clouds use the dry flag: weak bounce, gone after one.
  cloud:   { w: 180, cx: 0, surface: 0, bounce: JUMP_VY, cloud: true },
  // Sky lanterns (sunset and night): hover with a slow bob and sway around
  // the row's height; the surface is the top of the paper. Never fragile.
  skyLantern: { w: 136, cx: 0, surface: 0, bounce: JUMP_VY, lantern: true },
  // A stork crossing the screen once: its back is a 150 px perch. Never part
  // of the row structure, so never the only way up; gone past the far edge.
  stork: { w: 150, cx: 0, surface: 0, bounce: JUMP_VY, stork: true },
  ground:  { w: 2400, cx: 0, surface: 0, bounce: JUMP_VY, ground: true },
};

// Branch length classes: the box width (the sprite is 22 px longer: 11 px
// of root inside the trunk, 11 px of leaves past the tip) and the sprite
// length in art px. The prince's 40 px body must overlap the box, so the
// landing window is the box plus 40 px.
export const BRANCH_LEN = {
  stub:   { box: 58,  art: 20 },
  short:  { box: 106, art: 32 },
  normal: { box: 178, art: 50 },
  long:   { box: 282, art: 76 },
};

// Cloud sizes: box width in px (the sprite is the box; a cloud is soft to
// its edge) and the sprite size in art px.
export const CLOUD_SIZE = {
  small:  { box: 150, art: [38, 15] },
  normal: { box: 225, art: [56, 17] },
  wide:   { box: 325, art: [81, 20] },
};

let nextId = 1;

export class Platform {
  constructor(kind, y, opts = {}) {
    this.id = nextId++;
    this.kind = kind;
    this.def = KIND[kind];
    this.len = opts.len || 'normal';      // branches: length class (BRANCH_LEN)
    this.lenScale = opts.lenScale || 1;   // branches: small scale on top of the class
    this.variant = opts.variant || 0;     // branches: which drawing of the class
    this.style = opts.style || 0;         // branches: tree style (zone look)
    this.tint = opts.tint || null;        // branches: slight bark tint
    this.side = opts.side || 'L';         // balconies: which edge of the wall
    this.size = opts.size || 'normal';    // clouds: size class (CLOUD_SIZE)
    this.cloud = opts.cloud || null;      // clouds: behaviour (thick | wispy | drift | storm)
    this.drift = opts.drift || null;      // drifting clouds: { amp, omega, phase } patrol around baseX
    this.vx = opts.vx || 0;               // sideways speed (storks fly, drifting clouds patrol)
    this.phase = opts.phase || 0;         // clouds: breathing phase
    this.boxW = (this.def.root != null ? BRANCH_LEN[this.len].box : this.def.cloud ? CLOUD_SIZE[this.size].box : this.def.w) * this.lenScale;
    this.baseX = opts.x != null ? opts.x : (this.def.root != null ? this.def.root + this.def.dir * this.boxW / 2 : this.def.cx);
    this.x = this.baseX;              // current center x (ribbons sway)
    this.layer = this.def.layer || 1; // parallax factor of the layer it belongs to
    this.ly = opts.ly != null ? opts.ly : y;   // height in layer coordinates
    this.y = y;                       // surface height in the prince's plane
    this.baseY = y;                   // rest height (lanterns bob around it)
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

  // Height in the prince's plane of a point at layer height `ly` on a layer
  // with parallax factor `f` while the view bottom is at `camY`.
  static layerToWorld(ly, f, camY) { return ly + (camY - CAMERA_START_Y) * (1 - f); }
  static worldToLayer(y, f, camY) { return y - (camY - CAMERA_START_Y) * (1 - f); }
  static layerFactor(kind) { return KIND[kind].layer || 1; }

  get w() { return this.boxW; }
  get left() { return this.x - this.boxW / 2; }
  get right() { return this.x + this.boxW / 2; }
  get bounceVy() { return this.dry ? WEAK_JUMP_VY : this.def.bounce; }
  get solidBelow() { return !!this.def.solidBelow; }
  get bottom() { return this.y - (this.def.thickness || 0); }

  // Called by the world each frame. `braidX(ly)` gives the hair's sway offset.
  update(dt, time, braidX, cam) {
    this.t += dt;
    if (this.layer < 1) this.y = Platform.layerToWorld(this.ly, this.layer, cam.y);
    if (this.def.onBraid) this.x = this.baseX + braidX(this.ly) + this.sway * Math.sin(time * 1.3 + this.swayPhase);
    if (this.def.stork) {
      this.x += this.vx * dt;
      this.y = this.baseY + 8 * Math.sin(time * 7 + this.phase);
      if (Math.abs(this.x) > W / 2 + 220) this.alive = false;
    }
    if (this.def.lantern) {
      this.y = this.baseY + 20 * Math.sin(time * 1.05 + this.phase);
      this.x = this.baseX + 12 * Math.sin(time * 0.7 + this.phase);
    }
    if (this.drift && this.state !== 'breaking') {
      // a drifting cloud patrols its lane: slow, smooth, always fully on screen
      const { amp, omega, phase } = this.drift;
      this.x = this.baseX + amp * Math.sin(time * omega + phase);
      this.vx = amp * omega * Math.cos(time * omega + phase);
    }
    if (this.state === 'jumpedOn') {
      this.squash = Math.max(0, 1 - this.t / 0.18);
      if (this.t > 0.18) { this.state = this.used && this.dry ? 'breaking' : 'normal'; this.t = 0; }
    } else if (this.state === 'bottomHit') {
      this.wobble = Math.sin(this.t * 40) * Math.max(0, 1 - this.t / 0.3) * 4;
      if (this.t > 0.3) { this.state = 'normal'; this.t = 0; this.wobble = 0; }
    } else if (this.state === 'breaking') {
      if (this.def.cloud) {
        // a wispy cloud dissolves where it is
        if (this.t > 0.5) { this.state = 'gone'; this.alive = false; }
      } else {
        // falls away, spinning slightly
        this.y -= 400 * this.t * dt * 4;
        this.wobble = this.t * 25;
        if (this.t > 0.6) { this.state = 'gone'; this.alive = false; }
      }
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
