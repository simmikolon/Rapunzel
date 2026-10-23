import {
  W, GRAVITY, JUMP_VY, BOOST_VY, MAX_FALL_SPEED, BONK_VY, HURT_VY,
  MOVE_SPEED, MOVE_ACCEL, MOVE_DECEL, TILT_SPEED,
  PLAYER_W, PLAYER_H, PLAYER_BODY_W, BOOST_CHARGES, BOOST_REFILL_PER_LANDING, BOOST_COOLDOWN,
  MAX_HEARTS, INVULNERABLE_TIME, STOMP_VY,
} from './config.js';
import { approach, clamp, moveToward, sign } from './util.js';
import { blit } from './art/sprite.js';

// The prince. Position (x, y) is the tip of the pogo stick (feet), world
// coordinates with y up. The state machine mirrors the original
// RPPlayer*State classes: standing, jumping, falling, bouncing (down/up),
// boost, bottom collision (bonk) plus the new hurt and dead states.
export class Player {
  constructor(world) {
    this.world = world;
    this.reset(0, 0);
  }

  reset(x, y) {
    this.x = x; this.y = y; this.prevY = y;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.state = 'standing';
    this.stateT = 0;
    this.invuln = 0;
    this.hearts = MAX_HEARTS;
    this.boost = BOOST_CHARGES;
    this.boostCooldown = 0;
    this.combo = 0;
    this.sx = 1; this.sy = 1;      // squash / stretch
    this.spin = 0;
    this.landedOn = null;
    this.maxY = 0;
    this.deathCause = null;
    this.idleT = 0;
  }

  get feetY() { return this.y; }
  get headY() { return this.y + PLAYER_H; }
  get bodyLeft() { return this.x - PLAYER_BODY_W / 2; }
  get bodyRight() { return this.x + PLAYER_BODY_W / 2; }
  get rect() { return { x: this.bodyLeft, y: this.y + 8, w: PLAYER_BODY_W, h: PLAYER_H - 24 }; }
  get alive() { return this.state !== 'dead'; }
  get airborne() { return this.state === 'jumping' || this.state === 'falling' || this.state === 'boosting' || this.state === 'hurt' || this.state === 'bonk'; }

  setState(s) {
    if (this.state === 'dead') return;
    this.state = s;
    this.stateT = 0;
  }

  // Called when the round starts: push off the ground.
  launch() {
    this.setState('bouncing');
    this.landedOn = null;
    this.bounceVy = JUMP_VY;
  }

  update(dt, input) {
    this.stateT += dt;
    this.idleT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.boostCooldown > 0) this.boostCooldown -= dt;
    this.prevY = this.y;

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

    // --- Boost (tap) --------------------------------------------------------
    if (this.state !== 'standing' && this.state !== 'dead' && this.state !== 'bonk' && input.consumeBoost()) {
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
          this.vy = this.bounceVy;
          this.setState('jumping');
          this.sx = 0.78; this.sy = 1.28;
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
      this.vy -= GRAVITY * dt;
      if (this.vy < -MAX_FALL_SPEED) this.vy = -MAX_FALL_SPEED;
      this.y += this.vy * dt;
    }
    this.x += this.vx * dt;
    // Screen wrap-around like the original (checkIfPlayerIsOutOfScreen).
    if (this.x < -W / 2) this.x += W;
    else if (this.x > W / 2) this.x -= W;

    if (this.y > this.maxY) this.maxY = this.y;

    // Spring the squash/stretch back to 1.
    this.sx = approach(this.sx, 1, 14, dt);
    this.sy = approach(this.sy, 1, 14, dt);
  }

  tryBoost() {
    if (this.boostCooldown > 0) return;
    if (this.boost < 1) { this.world.audio.boostEmpty(); return; }
    this.boost -= 1;
    this.boostCooldown = BOOST_COOLDOWN;
    this.vy = Math.max(this.vy, 0) * 0.45 + BOOST_VY;
    this.landedOn = null;
    this.setState('boosting');
    this.sx = 0.72; this.sy = 1.36;
    this.world.onPlayerBoost(this);
  }

  // World detected the feet crossing a platform surface while falling.
  land(platform) {
    if (!platform.jumpedOn()) return;
    this.y = platform.y;
    this.vy = 0;
    this.landedOn = platform;
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
    this.y = platform.bottom - PLAYER_H;
    this.vy = BONK_VY;
    this.setState('bonk');
    this.sx = 1.2; this.sy = 0.8;
    platform.hitFromBelow();
    this.world.onPlayerBonk(this, platform);
  }

  stomp(enemy) {
    this.vy = STOMP_VY;
    this.y = Math.max(this.y, enemy.top - 4);
    this.setState('jumping');
    this.sx = 0.8; this.sy = 1.25;
    this.combo++;
    this.world.onPlayerStomp(this, enemy);
  }

  hit(source) {
    if (this.invuln > 0 || this.state === 'dead') return false;
    this.hearts -= 1;
    this.invuln = INVULNERABLE_TIME;
    this.vy = HURT_VY;
    this.vx = (this.x < source.x ? -1 : 1) * 380;
    this.combo = 0;
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
    if (cause === 'caught') this.vy = 700;
    this.world.onPlayerDie(this, cause);
  }

  heal() { this.hearts = Math.min(MAX_HEARTS, this.hearts + 1); }

  // --- Rendering ----------------------------------------------------------------
  currentSprite(art) {
    const set = this.facing < 0 ? art.prince.left : art.prince.right;
    switch (this.state) {
      case 'standing': return set.standing;
      case 'bouncing': return this.stateT < 0.04 ? set.bounceDown : set.bounceUp;
      case 'jumping': return this.vy > 350 ? set.jumpUp : set.standing;
      case 'falling': return this.vy < -250 ? set.falling : set.standing;
      case 'boosting': return set.boosting;
      case 'hurt': return set.hurt;
      case 'bonk': return set.hurt;
      case 'dead': return set.hurt;
      default: return set.standing;
    }
  }

  draw(ctx, cam, art) {
    const s = this.currentSprite(art);
    const blink = this.invuln > 0 && this.state !== 'dead' && Math.floor(this.invuln * 14) % 2 === 0;
    const alpha = blink ? 0.35 : 1;
    const bob = this.state === 'standing' ? Math.sin(this.idleT * 3) * 0.03 : 0;
    const opts = { sx: this.sx, sy: this.sy + bob, alpha, rot: this.state === 'dead' ? this.spin : 0 };
    const sx = cam.sx(this.x), sy = cam.sy(this.y);
    blit(ctx, s, sx, sy, opts);
    // Draw the wrap-around twin when near the screen edge.
    if (this.x < -W / 2 + PLAYER_W) blit(ctx, s, sx + W, sy, opts);
    else if (this.x > W / 2 - PLAYER_W) blit(ctx, s, sx - W, sy, opts);
  }
}
