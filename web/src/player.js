import {
  W, GRAVITY, JUMP_VY, BOOST_VY, MAX_FALL_SPEED, BONK_VY, HURT_VY,
  MOVE_SPEED, MOVE_ACCEL, MOVE_DECEL, TILT_SPEED,
  PLAYER_W, PLAYER_H, PLAYER_BODY_W, LORD_H, LORD_BODY_W, LORD_W, KID_JUMP, ROCKET_ACCEL, ROCKET_MAX_VY, ROCKET_BURN, ROCKET_TAP, ROCKET_SHIELD, BOOST_CHARGES, BOOST_REFILL_PER_LANDING, BOOST_COOLDOWN, BOOST_SHIELD_TIME,
  MAX_HEARTS, INVULNERABLE_TIME, STOMP_VY, PX,
  POWER_TIME, POWER_WARN, POWER_GRACE, SUPER_JUMP_MUL, SUPER_BOOST_VY, SUPER_MAX_VY, SALTO_TIME,
  FEATHER_GRAVITY, FEATHER_MAX_FALL, CARRY_ABOVE, CARRY_VY, CARRY_VX,
} from './config.js';
import { approach, clamp, moveToward, sign, easeInOutCubic, TAU } from './util.js';
import { rainbow, POWER_FX } from './powerups.js';

// Who is played. The prince and Lord Springalot climb the same tower with
// the same jump; what differs is the master ability: the prince's boost is
// a tap that takes a charge, the lord's is a rocket that burns for as long
// as the boost is held (`rocket`, updateRocket below). `kid` is whoever is
// played in the chimney (chimney.js; drawn as the lord for now): smaller
// hops, a boost like the prince's.
//   art     whose sprites (art/index.js): right, rightSil, and left, leftSil or `flip`
//   h, bodyW, w   his height, the width of what can be hit, his sprite's width (px)
//   jump    scales what pushes him up (a platform's bounce, a boost)
//   halo, wingX, wingY   the boost shield's radius, where the feather's wings sit
//   nozzleY  where his rocket's nozzle is over his feet while it burns (the lord's size is his sprites': art/lord.js `fig`)
//   rocket  null, or his rocket's numbers (config.js ROCKET_*): accel, maxVy, burn, tap, shield
const ROCKET = { accel: ROCKET_ACCEL, maxVy: ROCKET_MAX_VY, burn: ROCKET_BURN, tap: ROCKET_TAP, shield: ROCKET_SHIELD };
export const FIGURES = {
  prince: { art: 'prince', h: PLAYER_H, bodyW: PLAYER_BODY_W, w: PLAYER_W, jump: 1, rocket: null, halo: 150, wingX: 16, wingY: 138 },
  lord: { art: 'lord', h: LORD_H, bodyW: LORD_BODY_W, w: LORD_W, jump: 1, rocket: ROCKET, halo: 116, wingX: 13, wingY: 100, nozzleY: 88 },
  kid: { art: 'lord', h: LORD_H, bodyW: LORD_BODY_W, w: LORD_W, jump: KID_JUMP, rocket: null, halo: 116, wingX: 13, wingY: 100, nozzleY: 88 },
};

// The prince. Position (x, y) is the tip of the pogo stick (feet), world
// coordinates with y up. The state machine mirrors the original
// RPPlayer*State classes: standing, jumping, falling, bouncing (down/up),
// boost, bottom collision (bonk) plus the new hurt and dead states.
export class Player {
  constructor(world) {
    this.world = world;
    this.be('prince');
    this.reset(0, 0);
  }

  // Who he is from now on (FIGURES): the world says so at a room's door.
  be(who) { this.who = who; this.fig = FIGURES[who]; this.h = this.fig.h; this.bodyW = this.fig.bodyW; }

  reset(x, y) {
    this.x = x; this.y = y; this.prevY = y;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.state = 'standing';
    this.stateT = 0;
    this.invuln = 0;
    this.shield = 0;               // boost shield time left
    this.hearts = MAX_HEARTS;
    this.boost = BOOST_CHARGES;
    this.boostCooldown = 0;
    this.boostDenied = 0;          // a tap with no boost to give: the HUD shakes what is empty for this long
    this.combo = 0;
    this.sx = 1; this.sy = 1;      // squash / stretch
    this.spin = 0;
    this.landedOn = null;
    this.maxY = 0;
    this.deathCause = null;
    this.deathPower = null;
    this.gentle = false;           // the bonk in progress is a flock's turning back
    this.idleT = 0;
    this.flip = 0;                 // rotation of a show-off hop on the title or of a somersault (radians)
    this.power = null;             // the power-up that runs (a key of POWERS), one at a time
    this.powerT = 0;               // seconds left
    this.powerMax = 0;
    this.salto = null;             // { t, dur, dir } while a golden-spring somersault turns
    this.sway = false;             // the feather rocks him as he comes down
    this.ghosts = [];              // the golden spring's after-images
    this.ghostT = 0;
    this.fxT = 0;                  // paces the power's particles
    this.frozen = false;           // going through a gate: he waits where he is (World.enterGate)
    this.carried = null;           // { platform, t }: in the bubble that carries him back up (the treasury, World.rescue)
    this.heldBy = null;            // the spider's web he hangs in (enemies.js Web)
    this.wriggle = 0;              // 1 right after a tug, fading
    this.thrusting = false;        // the rocket burns (a figure with one, updateRocket)
    this.burn = 0;                 // seconds of burn a tap has asked for
    this.wasHeld = false;          // the boost was held in the step before
    this.sinceBurn = 9;            // seconds since it last burned
    this.trailT = 0;               // paces its sparks
  }

  get feetY() { return this.y; }
  get headY() { return this.y + this.h; }
  get bodyLeft() { return this.x - this.bodyW / 2; }
  get bodyRight() { return this.x + this.bodyW / 2; }
  get rect() { return { x: this.bodyLeft, y: this.y + 8, w: this.bodyW, h: this.h - 24 }; }
  get alive() { return this.state !== 'dead'; }
  // Knocks away what he touches: for a moment after a boost, and all through the star.
  get shielded() { return (this.shield > 0 || this.power === 'star') && this.state !== 'dead'; }
  // Under the cloak nothing with eyes notices him, and he passes through it.
  get hidden() { return this.power === 'cloak' && this.state !== 'dead'; }
  get seen() { return this.state !== 'dead' && this.power !== 'cloak'; }
  get airborne() { return this.state === 'jumping' || this.state === 'falling' || this.state === 'boosting' || this.state === 'hurt' || this.state === 'bonk'; }

  setState(s) {
    if (this.state === 'dead') return;
    this.state = s;
    this.stateT = 0;
  }

  // Push off the ground: the round's start at JUMP_VY, or a smaller hop on
  // the title's lawn.
  launch(vy = JUMP_VY) {
    this.setState('bouncing');
    this.landedOn = null;
    this.bounceVy = vy;
  }

  update(dt, input) {
    this.stateT += dt;
    this.idleT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.shield > 0) this.shield -= dt;
    if (this.boostCooldown > 0) this.boostCooldown -= dt;
    if (this.boostDenied > 0) this.boostDenied -= dt;
    // In the treasury the power-up he brought waits (there is nothing to use it on); the magnet he finds there runs.
    if (this.power && !(this.world.vault && this.power !== 'magnet')) this.updatePower(dt);
    this.prevY = this.y;
    if (this.heldBy) { this.updateHeld(dt, input); return; }
    if (this.carried) { this.updateCarried(dt); return; }
    if (this.frozen) { this.vx = 0; this.vy = 0; if (this.landedOn) this.y = this.landedOn.y; this.sx = approach(this.sx, 1, 14, dt); this.sy = approach(this.sy, 1, 14, dt); return; }

    // --- Horizontal control -------------------------------------------------
    const axis = this.state === 'standing' || this.state === 'dead' ? 0 : input.axis;
    const top = input.usingTilt ? TILT_SPEED : MOVE_SPEED;
    const targetVx = axis * top;
    if (this.state === 'dead') {
      this.vx = approach(this.vx, 0, 1.5, dt);
    } else if (axis !== 0) {
      this.vx = moveToward(this.vx, targetVx, MOVE_ACCEL * dt);
    } else {
      this.vx = moveToward(this.vx, 0, MOVE_DECEL * dt);
    }
    if (Math.abs(this.vx) > 40) this.facing = sign(this.vx);

    // --- Boost (tap), or the rocket (held) -------------------------------------
    if (this.fig.rocket) this.updateRocket(dt, input);
    else if (this.state !== 'standing' && this.state !== 'dead' && this.state !== 'bonk' && input.consumeBoost()) {
      this.tryBoost();
    }

    // --- State updates --------------------------------------------------------
    switch (this.state) {
      case 'standing':
        this.vy = 0; this.vx = 0;
        break;
      case 'bouncing':
        // Landing squash: sit on the platform for a moment, then push off.
        this.vy = 0;
        if (this.landedOn) {
          // Ride a swaying ribbon while crouched on it.
          this.y = this.landedOn.y;
          this.x += this.landedOn.x - this.landedOn.prevX;
          this.landedOn.prevX = this.landedOn.x;
        }
        if (this.stateT >= 0.075) {
          this.vy = this.jumpVy(this.bounceVy);
          this.setState('jumping');
          this.sx = 0.78; this.sy = 1.28;
          if (this.power === 'spring') this.startSalto(SALTO_TIME);
          this.world.onPlayerJump(this, this.landedOn);
          this.landedOn = null;
        }
        break;
      case 'jumping':
        if (this.vy < 0) this.setState('falling');
        break;
      case 'boosting':
        if (this.stateT > 0.32) this.setState(this.vy > 0 ? 'jumping' : 'falling');
        else if (this.stateT < 0.25) this.world.particles.boostTrail(this.x, this.y);
        break;
      case 'falling':
        break;
      case 'hurt':
        if (this.stateT > 0.35) this.setState(this.vy > 0 ? 'jumping' : 'falling');
        break;
      case 'bonk':
        if (this.stateT > 0.2) this.setState('falling');
        break;
      case 'dead':
        this.spin += dt * 6;
        break;
    }

    // --- Physics ----------------------------------------------------------------
    if (this.state !== 'standing' && this.state !== 'bouncing') {
      // the feather: he comes down slowly (the way up is untouched)
      const floaty = this.power === 'feather' && this.vy < 0 && this.state !== 'dead';
      this.vy -= GRAVITY * (floaty ? FEATHER_GRAVITY : 1) * dt;
      if (floaty && this.vy < -FEATHER_MAX_FALL) this.vy = moveToward(this.vy, -FEATHER_MAX_FALL, 6000 * dt);   // caught in a fall: braked, not stopped dead
      if (this.vy < -MAX_FALL_SPEED) this.vy = -MAX_FALL_SPEED;
      this.y += this.vy * dt;
    }
    this.x += this.vx * dt;
    // A storm's gust carries him along while it blows (weather.js; world.js windPush says how fast, 0 without gusts).
    const wind = this.world.windPush ? this.world.windPush() : 0;
    if (wind && this.state !== 'dead' && this.state !== 'standing') this.x += wind * dt;
    // Screen wrap-around like the original (checkIfPlayerIsOutOfScreen); a room with walls (the chimney) stops him at them.
    const wall = this.world.walls;
    if (wall) { const lim = wall - this.bodyW / 2; if (this.x < -lim) { this.x = -lim; if (this.vx < 0) this.vx = 0; } else if (this.x > lim) { this.x = lim; if (this.vx > 0) this.vx = 0; } }
    else if (this.x < -W / 2) this.x += W;
    else if (this.x > W / 2) this.x -= W;

    if (this.y > this.maxY) this.maxY = this.y;

    // Spring the squash/stretch back to 1.
    this.sx = approach(this.sx, 1, 14, dt);
    this.sy = approach(this.sy, 1, 14, dt);

    // The golden spring's somersault, or the feather's rocking on the way down.
    if (this.salto) {
      const s = this.salto;
      s.t += dt;
      const k = clamp(s.t / s.dur, 0, 1);
      this.flip = easeInOutCubic(k) * TAU * s.dir;
      if (k >= 1) { this.salto = null; this.flip = 0; }
    } else if (this.power === 'feather' && this.state === 'falling') {
      this.sway = true; this.flip = Math.sin(this.idleT * 4) * 0.09;
    } else if (this.sway) { this.sway = false; this.flip = 0; }
    this.updatePowerFx(dt);
  }

  // --- The treasury's bubble ----------------------------------------------------------
  // Taken where he fell out of the picture: nothing steers, nothing falls.
  // The bubble rises with him, quickly at first and gently at the end, to a
  // little above `platform`, drifting over its middle, and lets him go
  // there: he drops onto it and bounces on.
  carry(platform) {
    this.carried = { platform, t: 0 };
    this.vx = 0; this.vy = 0;
    this.landedOn = null;
    this.salto = null; this.sway = false; this.flip = 0;
    this.setState('held');
  }
  updateCarried(dt) {
    const c = this.carried, p = c.platform;
    c.t += dt;
    const tx = p.x, ty = p.y + CARRY_ABOVE;
    this.vx = 0; this.vy = 0;
    this.x += clamp(tx - this.x, -CARRY_VX * dt, CARRY_VX * dt);
    this.y = Math.min(ty, this.y + clamp((ty - this.y) * 3.2, CARRY_VY[0], CARRY_VY[1]) * dt);
    this.flip = Math.sin(this.idleT * 3.2) * 0.07;
    this.sx = approach(this.sx, 1, 14, dt);
    this.sy = approach(this.sy, 1, 14, dt);
    this.updatePowerFx(dt);
    if ((ty - this.y < 2 && Math.abs(tx - this.x) < 10) || c.t > 4 || !p.landable) {
      this.carried = null; this.flip = 0;
      this.setState('falling');
      this.world.onCarryEnd(this);
    }
  }

  // --- The spider's web ------------------------------------------------------------
  // Caught: he hangs where the web holds him, nothing steers, nothing falls.
  catchIn(web) {
    this.heldBy = web;
    this.vx = 0; this.vy = 0;
    this.landedOn = null;
    this.salto = null; this.sway = false; this.flip = 0;
    this.wriggle = 1;
    this.setState('held');
    this.sx = 1.2; this.sy = 0.85;
  }
  // A tap is a tug at the threads (no boost is spent on it); the web says when it gives.
  updateHeld(dt, input) {
    const web = this.heldBy;
    this.vx = 0; this.vy = 0;
    this.x = approach(this.x, web.holdX, 12, dt);
    this.y = approach(this.y, web.holdY, 12, dt);
    this.wriggle = Math.max(0, this.wriggle - dt * 2.2);
    this.flip = Math.sin(this.idleT * 34) * 0.13 * this.wriggle + Math.sin(this.idleT * 4.5) * 0.035;
    this.sx = approach(this.sx, 1, 14, dt);
    this.sy = approach(this.sy, 1, 14, dt);
    this.updatePowerFx(dt);
    if (input.consumeBoost()) { this.wriggle = 1; this.sx = 1.18; this.sy = 0.86; web.tug(this.world); }
  }
  // Out of the web: tossed straight up.
  release(vy) {
    this.heldBy = null;
    this.wriggle = 0; this.flip = 0;
    this.vx = 0; this.vy = vy;
    if (this.state === 'dead') return;
    this.setState('jumping');
    this.sx = 0.78; this.sy = 1.28;
  }

  // --- Power-ups ----------------------------------------------------------------
  // One at a time: a new one ends the one that runs (World.givePower is the way in).
  givePower(kind) {
    this.power = kind;
    this.powerT = this.powerMax = POWER_TIME[kind];
    this.salto = null; this.sway = false; this.flip = 0;
  }
  updatePower(dt) {
    const before = this.powerT;
    this.powerT -= dt;
    // three blips count it out
    for (let i = 1; i <= 3; i++) { const th = POWER_WARN * i / 3; if (before > th && this.powerT <= th) this.world.onPowerWarn(this, this.power); }
    if (this.powerT <= 0) this.endPower();
  }
  endPower() {
    const kind = this.power;
    if (!kind) return;
    this.power = null; this.powerT = 0;
    // losing the star or the cloak inside an enemy would be a trap: a moment of grace
    if (kind === 'star' || kind === 'cloak') this.invuln = Math.max(this.invuln, POWER_GRACE);
    this.world.onPowerEnd(this, kind);
  }
  // The golden spring makes every push-off stronger (a bow spring only up to SUPER_MAX_VY).
  jumpVy(v) { v *= this.fig.jump; return this.power === 'spring' ? Math.max(v, Math.min(v * SUPER_JUMP_MUL, SUPER_MAX_VY)) : v; }
  startSalto(dur) { this.salto = { t: 0, dur, dir: this.facing < 0 ? -1 : 1 }; }

  // What the power leaves in the air around him (looks only, so Math.random is fine).
  updatePowerFx(dt) {
    const ps = this.world.particles;
    for (const gh of this.ghosts) gh.life -= dt;
    if (this.ghosts.length && this.ghosts[0].life <= 0) this.ghosts.shift();
    if (!this.power || this.state === 'dead') return;
    this.fxT += dt;
    const every = (period) => { const n = Math.floor(this.fxT / period) - Math.floor((this.fxT - dt) / period); return n > 0; };
    const bx = this.x + (Math.random() - 0.5) * 70, by = this.y + 20 + Math.random() * 190;
    if (this.power === 'star') { if (every(0.03)) ps.rainbowSpark(bx, by, rainbow(this.idleT * 1.2 + Math.random() * 0.3)); }
    else if (this.power === 'cloak') { if (every(0.09)) ps.glint(bx, by, POWER_FX.cloakTint); }
    else if (this.power === 'spring') {
      if (this.vy > 500) {
        if (every(0.035)) ps.glint(bx, this.y + Math.random() * 60, POWER_FX.ghost);
        this.ghostT -= dt;
        if (this.ghostT <= 0) { this.ghostT = 0.05; this.ghosts.push({ x: this.x, y: this.y, flip: this.flip, left: this.facing < 0, pose: this.pose(), life: 0.28 }); }
      }
    } else if (this.power === 'feather') { if (this.vy < -80 && every(0.16)) ps.featherDrift(bx, this.y + 120 + Math.random() * 60); }
  }

  tryBoost() {
    if (this.boostCooldown > 0) return;
    if (this.boost < 1) { this.world.audio.boostEmpty(); this.boostDenied = 0.3; return; }
    this.boost -= 1;
    this.boostCooldown = BOOST_COOLDOWN;
    const spring = this.power === 'spring';
    this.vy = Math.max(this.vy, 0) * 0.45 + (spring ? SUPER_BOOST_VY : BOOST_VY) * this.fig.jump;
    this.landedOn = null;
    this.shield = BOOST_SHIELD_TIME;
    this.setState('boosting');
    this.sx = 0.72; this.sy = 1.36;
    if (spring) this.startSalto(SALTO_TIME * 0.7);
    this.world.onPlayerBoost(this);
  }

  // The rocket (Lord Springalot's): it burns for as long as the boost is held
  // (a tap is a short burn), on the boost's charges, one in `burn` seconds
  // (the figure's `rocket`). While it burns he is pushed up over and above
  // gravity, to `maxVy` at the most (faster than that, it only holds him
  // against gravity), and knocks away what he touches as under the boost's shield.
  // Not while he is crouched on a platform for the moment of a landing, and
  // not with his head just bumped.
  updateRocket(dt, input) {
    const R = this.fig.rocket;
    const can = this.state !== 'standing' && this.state !== 'dead' && this.state !== 'bonk' && this.state !== 'bouncing';
    const pressed = (can && input.consumeBoost()) || (input.boostHeld && !this.wasHeld);
    this.wasHeld = !!input.boostHeld;
    if (pressed && can) this.burn = Math.max(this.burn, R.tap);
    const want = can && (input.boostHeld || this.burn > 0);
    if (this.burn > 0) this.burn -= dt;
    this.sinceBurn += dt;
    if (!want || this.boost <= 0) {
      if (pressed && can && this.boost <= 0 && this.boostDenied <= 0) { this.world.audio.boostEmpty(); this.boostDenied = 0.3; }      // nothing in the tank: the HUD shakes what is empty
      this.thrusting = false;
      return;
    }
    const spring = this.power === 'spring' ? SUPER_BOOST_VY / BOOST_VY : 1;
    if (!this.thrusting) {
      this.thrusting = true; this.trailT = 0;
      if (this.sinceBurn > 0.25) { this.sx = 0.8; this.sy = 1.25; if (spring > 1) this.startSalto(SALTO_TIME * 0.7); this.world.onPlayerBoost(this); }      // lit: not said again for a flame that only stuttered
    }
    this.sinceBurn = 0;
    this.boost = Math.max(0, this.boost - dt / R.burn);
    const top = R.maxVy * spring;
    this.vy += GRAVITY * dt;                                                        // (the step below takes gravity off again: held against it)
    if (this.vy < top) this.vy = Math.min(top, this.vy + R.accel * spring * dt);
    if (this.state === 'falling' && this.vy > 0) this.setState('jumping');
    this.shield = Math.max(this.shield, R.shield);
    this.boostCooldown = Math.max(this.boostCooldown, 0.06);                        // (the HUD's button is pressed in while it burns)
    this.landedOn = null;
    this.trailT -= dt;
    if (this.trailT <= 0) { this.trailT = 1 / 40; this.world.particles.boostTrail(this.x - this.facing * 26, this.y + this.fig.nozzleY - 42); }
  }

  // World detected the feet crossing a platform surface while falling.
  land(platform) {
    if (!platform.jumpedOn()) return;
    this.y = platform.y;
    this.vy = 0;
    this.landedOn = platform;
    if (this.salto) { this.salto = null; this.flip = 0; }
    platform.prevX = platform.x;
    this.bounceVy = platform.bounceVy;
    this.setState('bouncing');
    this.sx = 1.3; this.sy = 0.7;
    this.combo = platform.kind === 'ground' ? 0 : this.combo + 1;
    this.boost = clamp(this.boost + BOOST_REFILL_PER_LANDING, 0, BOOST_CHARGES);
    this.world.onPlayerLand(this, platform);
  }

  // Head hit the underside of a plank swing.
  bonk(platform) {
    this.y = platform.bottom - this.h;
    this.vy = BONK_VY;
    this.gentle = false;
    this.setState('bonk');
    this.sx = 1.2; this.sy = 0.8;
    platform.hitFromBelow();
    this.world.onPlayerBonk(this, platform);
  }

  // A flock in the way and no boost: turned back down, nothing lost. `bottom`
  // is the underside of the bird he met; he is put under it unless the birds
  // came upon him from the side (then they only push him down). `span` is how
  // far the floor under the flock reaches to each side: out beyond it (in
  // front of a trunk, at the screen's edge) the birds sweep him back over it,
  // so being turned back is never a fall.
  shoo(bottom, span = 0) {
    const y = bottom - this.h;
    if (this.y - y < 70) this.y = Math.min(this.y, y);
    if (span && Math.abs(this.x) > span - 30) { this.x = Math.sign(this.x) * (span - 30); this.vx = 0; }
    this.vy = Math.min(this.vy, BONK_VY);
    if (this.salto) { this.salto = null; this.flip = 0; }
    this.setState('bonk');
    this.gentle = true;            // startled, not hurt: no red face (see pose)
    this.sx = 1.2; this.sy = 0.8;
  }

  stomp(enemy) {
    this.vy = this.jumpVy(STOMP_VY);
    this.y = Math.max(this.y, enemy.top - 4);
    this.setState('jumping');
    this.sx = 0.8; this.sy = 1.25;
    this.combo++;
    this.world.onPlayerStomp(this, enemy);
  }

  hit(source) {
    if (this.invuln > 0 || this.shielded || this.state === 'dead') return false;
    this.hearts -= 1;
    this.heldBy = null; this.wriggle = 0;      // knocked out of a web, if he hung in one
    this.invuln = INVULNERABLE_TIME;
    this.vy = HURT_VY;
    this.vx = (this.x < source.x ? -1 : 1) * 380;
    this.combo = 0;
    if (this.salto) { this.salto = null; this.flip = 0; }
    this.setState('hurt');
    this.sx = 1.25; this.sy = 0.8;
    this.world.onPlayerHurt(this, source);
    if (this.hearts <= 0) this.die('caught');
    return true;
  }

  die(cause) {
    if (this.state === 'dead') return;
    this.deathCause = cause;
    this.state = 'dead';
    this.stateT = 0;
    this.heldBy = null;
    this.salto = null; this.sway = false; this.flip = 0;
    this.deathPower = this.power;          // what ran when it ended (the simulator asks)
    this.power = null; this.powerT = 0;    // over without a sound
    this.carried = null;
    if (cause === 'caught') this.vy = 700;
    this.world.onPlayerDie(this, cause);
  }

  // A heart restores all hearts: with a cap of three, one at a time was
  // too little to keep up with the attrition higher up.
  heal() { this.hearts = MAX_HEARTS; }

  // --- Rendering ----------------------------------------------------------------
  pose() {
    if (this.thrusting && this.state !== 'dead' && this.state !== 'hurt') return 'boosting';
    switch (this.state) {
      case 'bouncing': return this.stateT < 0.04 ? 'bounceDown' : 'bounceUp';
      case 'jumping': return this.vy > 350 ? 'jumpUp' : 'standing';
      case 'falling': return this.vy < -250 ? 'falling' : 'standing';
      case 'boosting': return 'boosting';
      case 'bonk': return this.gentle ? 'falling' : 'hurt';
      case 'held': return 'falling';
      case 'hurt': case 'dead': return 'hurt';
      default: return 'standing';
    }
  }

  // Where the sprite goes when it is turned by `flip`: it pivots at the feet,
  // so they are moved for the turn to go about the body's centre.
  flipOffset(flip) { const r = this.h * 0.5; return flip ? [-Math.sin(flip) * r, Math.cos(flip) * r - r] : [0, 0]; }

  draw(g, cam, art) {
    // His sprites: a figure that is drawn one way round only is mirrored on the draw call (`flip`).
    const A = art[this.fig.art], F = this.fig, left = this.facing < 0;
    let pose = this.pose();
    if (pose === 'boosting' && A.right.boosting2 && Math.floor(this.idleT * 16) % 2) pose = 'boosting2';      // the rocket's flame, two lengths of it
    const s = (left && A.left ? A.left : A.right)[pose];
    const t = this.idleT;
    const blink = this.invuln > 0 && this.state !== 'dead' && Math.floor(this.invuln * 14) % 2 === 0;
    const alpha = blink ? 0.35 : 1;
    const bob = this.state === 'standing' ? Math.sin(this.idleT * 3) * 0.03 : 0;
    const opts = { sx: this.sx, sy: this.sy + bob, alpha, rot: this.state === 'dead' ? this.spin : this.flip, flip: left && !A.left };
    const fx0 = cam.sx(this.x), fy0 = cam.sy(this.y);          // the pogo's tip on screen
    const bx = fx0, by = fy0 - this.h * 0.5;                   // his middle
    const [ox, oy] = this.flipOffset(this.state === 'dead' ? 0 : this.flip);
    const sx = fx0 + ox, sy = fy0 + oy;
    // The power-up's look. In its last moments it flickers, so the end is no surprise.
    const power = this.state === 'dead' ? null : this.power;
    const fx = power && (this.powerT > POWER_WARN || Math.floor(this.powerT * 9) % 2 === 0) ? power : null;

    // the golden spring's after-images, behind him
    for (const gh of this.ghosts) {
      const k = clamp(gh.life / 0.28, 0, 1), [gx, gy] = this.flipOffset(gh.flip);
      g.blit((gh.left && A.left ? A.left : A.right)[gh.pose], cam.sx(gh.x) + gx, cam.sy(gh.y) + gy, { rot: gh.flip, alpha: 0.4 * k, tint: POWER_FX.ghost, flip: gh.left && !A.left });
    }
    if (this.shield > 0 && this.state !== 'dead') {
      // boost shield: a warm aura around him that fades with the timer (the rocket's: there while it burns)
      const k = Math.min(1, this.shield / (F.rocket ? F.rocket.shield : BOOST_SHIELD_TIME));
      g.halo(bx, by, F.halo, '#ffc864', 0.5 * k, { glow: 1 });
    }

    if (this.thrusting && F.rocket && this.state !== 'dead') {
      // the rocket's flame, out of the nozzle on his back, and its glow
      const nx = sx - this.facing * 26 * this.sx, ny = sy - (F.nozzleY - 4) * this.sy;
      g.halo(nx, ny + 34, 76, '#ffb347', 0.55, { glow: 1 });
      g.blit(art.hud.flame[Math.floor(t * 18) % 2], nx, ny, { rot: Math.PI, sy: 1.25 + 0.2 * Math.sin(t * 40), alpha, glow: 1 });
    }

    // his shape in flat white, for the rims below
    const sil = (left && A.leftSil ? A.leftSil : A.rightSil)[pose];
    const rim = (x, d, a, colorAt, glow) => RIM.forEach(([rx, ry], i) => g.blit(sil, x + rx * d, sy + ry * d, { ...opts, alpha: alpha * a, tint: colorAt(i), glow }));
    const body = (dx) => {
      const x = sx + dx;
      if (fx === 'feather') {
        // two small wings on his back: spread and beating on the way down, folded on the way up
        const wing = art.powerups.wings[this.vy < 0 ? Math.floor(t * 7) % 2 : 1];
        const wy = fy0 - F.wingY * this.sy;
        g.blit(wing, fx0 + dx + F.wingX, wy, { alpha });
        g.blit(wing, fx0 + dx - F.wingX, wy, { alpha, flip: true });
      }
      if (fx === 'cloak') {
        // a glassy prince: a pale rim so the player still sees him, what is left of him inside it
        rim(x, PX, 0.3 + 0.08 * Math.sin(t * 6), () => POWER_FX.cloakGlow, 0.15);
        g.blit(s, x, sy, { ...opts, alpha: alpha * (0.42 + 0.08 * Math.sin(t * 7)), tint: POWER_FX.cloakTint });
        return;
      }
      if (fx === 'star') {
        // the rainbow: a rim two pixels wide around him, each side its own
        // hue, all of them running through the colours (no halo behind it:
        // the soft glow took away from the rim)
        rim(x, PX * 2, 0.5, (i) => rainbow(t * 1.2 + i / 4 + 0.12));
        rim(x, PX, 1, (i) => rainbow(t * 1.2 + i / 4), 0.15);
      }
      g.blit(s, x, sy, opts);
      if (fx === 'star') g.blit(sil, x, sy, { ...opts, alpha: 0.25, tint: rainbow(t * 1.2 + 0.5), blend: 'add' });   // and a wash of colour over him
    };
    body(0);
    if (this.heldBy) this.heldBy.drawFront(g, cam, this);     // the threads that hold him
    // Draw the wrap-around twin when near the screen edge (not in a room with walls).
    if (this.world.walls) return;
    if (this.x < -W / 2 + F.w) body(W);
    else if (this.x > W / 2 - F.w) body(-W);
  }
}

// The four sides a rim is drawn to.
const RIM = [[0, -1], [1, 0], [0, 1], [-1, 0]];
