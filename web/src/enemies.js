import { W, H, GRAVITY, PARALLAX_TOWER } from './config.js';
import { TAU, clamp, RNG } from './util.js';
import { Platform } from './platforms.js';
import { PAL as C } from './palette.js';

// Enemies that fit the fairy tale: crows patrol the air between the trees,
// spiders dangle from branches on a thread, and the witch sweeps in on her
// broom. Crows and spiders can be stomped from above (pogo!), the witch must
// be dodged.
//
// Every random value that can touch a collision (flight phase, thread phase,
// a squirrel's moods) comes from the RNG handed in, so a seeded round replays
// exactly and the simulator is reproducible; Math.random is only used for
// particles.
//
// What an enemy does about the prince hangs on `player.seen`: under the
// cloak of invisibility nobody homes in, lunges, dashes or thrusts, and
// those who would have stand puzzled with a "?" (PUZZLED) instead of a "!".
const PUZZLED = '#b9c8ff';

let nextId = 1;

class Enemy {
  constructor(x, y) { this.id = nextId++; this.x = x; this.y = y; this.alive = true; this.t = 0; this.dead = false; this.hurtful = true; }
  get rect() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
  get top() { return this.y + this.h / 2; }
  get stompable() { return true; }
}

export class Crow extends Enemy {
  // `track` (0..1) makes the crow drift toward the prince's height when he is
  // near; 0 at low altitude (pure patrol), 1 near the top of the tower.
  constructor(x, y, dir, speed, track = 0, rng = new RNG()) {
    super(x, y);
    this.kind = 'crow';
    this.dir = dir; this.speed = speed; this.track = track;
    this.baseY = y;
    this.w = 62; this.h = 40;
    this.phase = rng.range(0, TAU);
    this.vy = 0; this.spin = 0;
    this.flap = 0;
    this.alert = 0;
  }
  update(dt, world) {
    this.t += dt;
    if (this.dead) {
      this.vy -= GRAVITY * 0.8 * dt;
      this.y += this.vy * dt;
      this.x += this.dir * 80 * dt;
      this.spin += dt * 9;
      if (this.y < world.cam.y - 200) this.alive = false;
      return;
    }
    const p = world.player;
    let dx = p.x - this.x; if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
    const near = this.track > 0 && p.seen && Math.abs(dx) < 360 && Math.abs(p.y + 100 - this.y) < 700;
    this.alert = near ? Math.min(1, this.alert + dt * 3) : Math.max(0, this.alert - dt);
    if (this.alert > 0) {
      // Home in on the prince's body height, faster with altitude.
      const want = p.y + 110;
      const rate = this.track * 150 * this.alert;
      this.baseY += Math.max(-rate * dt, Math.min(rate * dt, want - this.baseY));
    }
    this.x += this.dir * this.speed * (1 + this.alert * 0.35) * dt;
    const margin = 70;
    if (this.x > W / 2 + margin) this.x = -W / 2 - margin;
    else if (this.x < -W / 2 - margin) this.x = W / 2 + margin;
    this.y = this.baseY + Math.sin(this.t * 4 + this.phase) * 16;
    this.flap = Math.floor(this.t * (9 + this.alert * 6)) % 2;
  }
  stomped(world) {
    this.dead = true; this.hurtful = false;
    this.vy = -150; this.dir = -this.dir;
    world.particles.feathers(this.x, this.y);
  }
  draw(g, cam, art) {
    const set = this.dir > 0 ? art.creatures.crowR : art.creatures.crowL;
    const s = this.dead ? set[2] : set[this.flap];
    g.blit(s, cam.sx(this.x), cam.sy(this.y), { rot: this.dead ? this.spin : 0 });
  }
}

export class Spider extends Enemy {
  // Bobs on its thread; with `lunge` > 0 it drops at the prince when he
  // passes underneath, then slowly climbs back up.
  constructor(x, anchorY, minLen, maxLen, speed, lunge = 0, rng = new RNG()) {
    super(x, anchorY - minLen);
    this.kind = 'spider';
    this.anchorY = anchorY;       // underside of the branch it hangs from
    this.minLen = minLen; this.maxLen = maxLen; this.speed = speed; this.lunge = lunge;
    this.w = 52; this.h = 40;
    this.phase = rng.range(0, TAU);
    this.squish = 0;
    this.frame = 0;
    this.extra = 0;               // extra thread length during a lunge
    this.lungeT = -1;             // <0 idle, else time since the lunge began
    this.cooldown = 0;
  }
  get len() { const m = (this.minLen + this.maxLen) / 2, a = (this.maxLen - this.minLen) / 2; return m + a * Math.sin(this.t * this.speed + this.phase) + this.extra; }
  update(dt, world) {
    this.t += dt;
    if (this.dead) {
      this.squish += dt;
      if (this.squish > 0.5) this.alive = false;
      return;
    }
    const p = world.player;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.lungeT < 0 && this.lunge > 0 && this.cooldown <= 0 && p.seen) {
      const below = this.y - this.h / 2 - p.headY;
      if (Math.abs(p.x - this.x) < 110 && below > 0 && below < 260 + this.lunge * 200) { this.lungeT = 0; this.frame = 0; }
    }
    if (this.lungeT >= 0) {
      this.lungeT += dt;
      const reach = 170 + this.lunge * 160;
      if (this.lungeT < 0.3) this.extra = reach * (this.lungeT / 0.3) * (2 - this.lungeT / 0.3);
      else if (this.lungeT < 1.6) this.extra = reach * (1 - (this.lungeT - 0.3) / 1.3);
      else { this.extra = 0; this.lungeT = -1; this.cooldown = 2.2; }
    }
    this.y = this.anchorY - this.len - this.h / 2;
    this.frame = this.lungeT >= 0 && this.lungeT < 0.3 ? 1 : Math.floor(this.t * 6) % 2;
  }
  stomped(world) {
    this.dead = true; this.hurtful = false;
    world.particles.sparkles(this.x, this.y, 8, '#b48ad6');
  }
  draw(g, cam, art) {
    const sx = cam.sx(this.x), top = cam.sy(this.y + this.h / 2);
    // thread
    g.line(sx, cam.sy(this.anchorY), sx, top, 'rgba(240,240,250,0.8)', 2);
    const sq = this.dead ? clamp(1 - this.squish * 2, 0.15, 1) : 1;
    g.blit(art.creatures.spider[this.frame], sx, top, { sy: sq, sx: 1 + (1 - sq) * 0.6, alpha: this.dead ? clamp(1 - this.squish * 1.5, 0, 1) : 1 });
  }
}

// Squirrel: lives on a healthy branch. Sits nibbling an acorn, patrols the
// branch, and dashes at the prince when he comes within reach. Landing on it
// from above stomps it; it bites if it reaches him while he is crouched on
// the branch or passing through it. Falls with the branch if that crumbles.
export class Squirrel extends Enemy {
  constructor(platform, offset, speed, alertness = 1, rng = new RNG()) {
    super(platform.x + offset, platform.y);
    this.kind = 'squirrel';
    this.platform = platform;
    this.speed = speed; this.alertness = alertness;
    this.rng = rng;
    this.w = 52; this.h = 40;
    this.dir = rng.sign();
    this.state = 'sit';            // sit | run | dash | falling
    this.stateT = rng.range(0, 1.5);
    this.sitFor = rng.range(1.2, 2.7);   // how long the current sit / run lasts
    this.runFor = rng.range(1.4, 3.4);
    this.frame = 0;
    this.vy = 0; this.spin = 0;
    this.chirpCooldown = 0;
  }
  get left() { return this.platform.left + 18; }
  get right() { return this.platform.right - 18; }
  update(dt, world) {
    this.t += dt; this.stateT += dt;
    if (this.chirpCooldown > 0) this.chirpCooldown -= dt;
    const pf = this.platform;
    if (this.state === 'falling' || this.dead) {
      this.vy -= GRAVITY * 0.9 * dt;
      this.y += this.vy * dt; this.x += this.dir * 60 * dt;
      this.spin += dt * 7;
      if (this.y < world.cam.y - 200) this.alive = false;
      return;
    }
    if (!pf.landable) { this.state = 'falling'; this.hurtful = false; this.vy = 120; return; }
    const p = world.player;
    const dx = p.x - this.x;
    const within = Math.abs(dx) < 240 && p.y >= pf.y - 60 && p.y < pf.y + 420;
    const reach = p.seen && within;
    this.puzzled = p.hidden && within;
    if (reach && this.alertness > 0) {
      if (this.state !== 'dash') { this.state = 'dash'; this.stateT = 0; if (this.chirpCooldown <= 0) { world.audio.chirp(); this.chirpCooldown = 2.5; } }
      if (Math.abs(dx) > 6) this.dir = dx > 0 ? 1 : -1;
      // dash: quick, but slow enough that a prince landing on the far end of
      // the branch can bounce away before it arrives
      this.x += this.dir * this.speed * (1.3 + 0.6 * this.alertness) * dt;
    } else if (this.state === 'dash') {
      this.state = 'run'; this.stateT = 0; this.runFor = this.rng.range(1.4, 3.4);
    } else if (this.state === 'sit') {
      if (this.stateT > this.sitFor) { this.state = 'run'; this.stateT = 0; this.runFor = this.rng.range(1.4, 3.4); }
    } else {
      this.x += this.dir * this.speed * dt;
      if (this.stateT > this.runFor) { this.state = 'sit'; this.stateT = 0; this.sitFor = this.rng.range(1.2, 2.7); }
    }
    // stay on the branch, turn at the ends
    if (this.x < this.left) { this.x = this.left; this.dir = 1; }
    else if (this.x > this.right) { this.x = this.right; this.dir = -1; }
    this.y = pf.y + this.h / 2;
    const rate = this.state === 'dash' ? 14 : 8;
    this.frame = this.state === 'sit' ? 0 : 1 + (Math.floor(this.t * rate) % 2);
  }
  stomped(world) {
    this.dead = true; this.hurtful = false;
    this.state = 'falling'; this.vy = 260; this.dir = -this.dir || 1;
    world.particles.leaves(this.x, this.y, 4);
    world.particles.sparkles(this.x, this.y, 6, '#e8a65e');
  }
  draw(g, cam, art) {
    const set = this.dir > 0 ? art.creatures.squirrelR : art.creatures.squirrelL;
    const s = this.dead || this.state === 'falling' ? set[3] : set[this.frame];
    const sy = cam.sy(this.y - this.h / 2);
    g.blit(s, cam.sx(this.x), this.dead ? cam.sy(this.y) : sy, this.dead ? { rot: this.spin * this.dir } : undefined);
    if (this.state === 'dash') g.text('!', cam.sx(this.x), sy - 70, 22, '#ffe9a0', 'center', true);
    else if (this.puzzled && !this.dead && this.state !== 'falling') g.text('?', cam.sx(this.x), sy - 70, 22, PUZZLED, 'center', true);
  }
}

export class Witch extends Enemy {
  // phases: warn (off-screen, exclamation at the edge) -> cross (flies over the
  // player) -> dive (straight at where the player was) -> leave.
  constructor(player, side, dives = 1) {
    const y = player.y + 640;
    super(side * (W / 2 + 140), y);
    this.kind = 'witch';
    this.side = side;             // -1 enters from the left
    this.dir = -side;             // flight direction
    this.w = 96; this.h = 70;
    this.phase = 'warn';
    this.phaseT = 0;
    this.vx = 0; this.vy = 0;
    this.frame = 0;
    this.warnTime = 1.3;
    this.divesLeft = dives;
  }
  get stompable() { return false; }
  // Boosted into: she is thrown off her broom's course and leaves.
  deflect(world) {
    const p = world.player;
    this.phase = 'leave'; this.phaseT = 0;
    this.hurtful = false; this.deflected = true;
    this.dir = this.x >= p.x ? 1 : -1;
    this.vx = this.dir * 1000; this.vy = 450;
    this.spin = 0;
    world.audio.witchSwoosh();
  }
  update(dt, world) {
    this.t += dt; this.phaseT += dt;
    const p = world.player;
    this.frame = Math.floor(this.t * 7) % 2;
    if (this.phase === 'leave') {
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (!this.lost) { this.vy -= 600 * dt; this.spin += dt * 8; }   // thrown off her course; when she only lost him she flies on
      if (Math.random() < 0.6) world.particles.witchTrail(this.x, this.y);
      if (this.x > W / 2 + 220 || this.x < -W / 2 - 220 || this.y < world.cam.y - 300 || this.y > world.cam.top + 400) this.alive = false;
      return;
    }
    if (this.phase === 'warn') {
      // Keep level with the player while waiting so the warning is honest.
      this.y = Math.max(this.y, p.y + 640);
      if (this.phaseT > this.warnTime) { this.phase = 'cross'; this.phaseT = 0; this.vx = this.dir * 430; world.audio.witchSwoosh(); }
    } else if (this.phase === 'cross') {
      this.x += this.vx * dt;
      this.y += Math.sin(this.t * 5) * 30 * dt;
      if (world.particles.items.length < 400 && Math.random() < 0.5) world.particles.witchTrail(this.x - this.dir * 40, this.y - 10);
      if (((this.dir > 0 && this.x > W / 2 - 110) || (this.dir < 0 && this.x < -W / 2 + 110)) && !p.seen) {
        // nobody there to dive at: she flies on, puzzled, and is gone
        this.phase = 'leave'; this.phaseT = 0; this.lost = true; this.hurtful = false;
        this.vx = this.dir * 430; this.vy = 140; this.spin = 0;
      } else if ((this.dir > 0 && this.x > W / 2 - 110) || (this.dir < 0 && this.x < -W / 2 + 110)) {
        // turn around and dive at the player
        this.phase = 'dive'; this.phaseT = 0;
        this.dir = -this.dir;
        const tx = p.x + p.vx * 0.25, ty = p.y + 110 + p.vy * 0.2;
        const dx = tx - this.x, dy = ty - this.y;
        const len = Math.hypot(dx, dy) || 1;
        const sp = 860;
        this.vx = (dx / len) * sp; this.vy = (dy / len) * sp;
        if (Math.sign(this.vx) !== this.dir && this.vx !== 0) this.dir = Math.sign(this.vx);
        world.audio.witchSwoosh();
      }
    } else if (this.phase === 'dive') {
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (Math.random() < 0.7) world.particles.witchTrail(this.x - this.dir * 40, this.y);
      if (this.x > W / 2 + 200 || this.x < -W / 2 - 200 || this.y < world.cam.y - 200 || this.y > world.cam.top + 400) {
        this.divesLeft--;
        if (this.divesLeft > 0 && p.alive) {
          // Come back for another pass from the side she left on.
          this.side = this.x > 0 ? 1 : -1;
          this.dir = -this.side;
          this.x = this.side * (W / 2 + 140);
          this.y = p.y + 640;
          this.phase = 'warn'; this.phaseT = 0; this.warnTime = 0.8;
          world.audio.witchWarn();
        } else this.alive = false;
      }
    }
  }
  draw(g, cam, art) {
    if (this.phase === 'warn') {
      // exclamation marker at the screen edge where she will appear
      const sx = this.side < 0 ? 40 : W - 40, sy = clamp(cam.sy(this.y), 60, H - 60);
      const blink = Math.floor(this.phaseT * 8) % 2 === 0;
      g.text('!', sx, sy, 56, blink ? '#ff3b3b' : '#ffd1d1', 'center', true, { family: 'system-ui, sans-serif', weight: 'bold', glow: 0.6 });
      return;
    }
    const set = this.dir > 0 ? art.creatures.witchR : art.creatures.witchL;
    if (this.phase === 'leave') {
      g.blit(set[this.frame], cam.sx(this.x), cam.sy(this.y), { rot: this.spin * this.dir });
      if (this.lost) g.text('?', cam.sx(this.x), cam.sy(this.y) - 80, 26, PUZZLED, 'center', true);
      return;
    }
    const rot = this.phase === 'dive' ? Math.atan2(-this.vy, this.vx) * (this.dir > 0 ? 1 : -1) * 0.5 : 0;
    g.blit(set[this.frame], cam.sx(this.x), cam.sy(this.y), { rot: this.dir > 0 ? rot : -rot });
  }
}

// Lightning lives under a storm cloud. The cloud is safe on top; the bolt
// strikes straight down from its middle in a narrow column. Phases: calm
// (2.5 to 4.5 s, rain streaks mark the column) -> charge (1 s, the cloud
// flickers and rumbles) -> strike (0.25 s, hurtful). Never stompable; the
// boost shield simply protects.
export class Lightning extends Enemy {
  constructor(platform, rng = new RNG()) {
    super(platform.x, platform.y - 20);
    this.kind = 'lightning';
    this.platform = platform;
    this.rng = rng;              // its timing rolls on a seeded stream like every enemy's
    this.w = 70; this.h = 420;
    this.phase = 'calm'; this.phaseT = 0;
    this.wait = rng.range(1.5, 4);
    this.hurtful = false;
    this.seed = rng.range(0, 100);
    this.zig = [];
  }
  get stompable() { return false; }
  get rect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
  get top() { return this.y; }
  update(dt, world) {
    this.t += dt; this.phaseT += dt;
    const pf = this.platform;
    if (!pf.alive) { this.alive = false; return; }
    this.x = pf.x; this.y = pf.y - 20;
    const near = Math.abs(this.y - world.player.y) < 1400;
    if (this.phase === 'calm' && this.phaseT > this.wait) {
      this.phase = 'charge'; this.phaseT = 0;
      if (near) world.audio.thunderWarn();
    } else if (this.phase === 'charge' && this.phaseT > 1.0) {
      this.phase = 'strike'; this.phaseT = 0; this.hurtful = true;
      this.zig = []; let x = 0; for (let i = 0; i <= 8; i++) { this.zig.push([x, i / 8]); x += this.rng.range(-18, 18); }
      if (near) { world.audio.thunderCrack(); world.cam.shake(5, 0.25); }
    } else if (this.phase === 'strike' && this.phaseT > 0.25) {
      this.phase = 'calm'; this.phaseT = 0; this.hurtful = false;
      this.wait = this.rng.range(2.5, 4.5);
    }
  }
  stomped() {}   // the shield only protects
  draw(g, cam) {
    const sx = cam.sx(this.x), top = cam.sy(this.y), bottom = cam.sy(this.y - this.h);
    // rain streaks in the column, always
    for (let i = 0; i < 9; i++) {
      const f = ((this.t * 1.7 + i * 0.37 + this.seed) % 1);
      const x = sx - 30 + (i * 7.5) % 60 + Math.sin(i * 2.3 + this.seed) * 3;
      const y = top + f * (bottom - top);
      g.line(x, y, x - 3, y + 30, '#c9dcf2', 3, 0.42 + 0.3 * (1 - f));
    }
    if (this.phase === 'charge') {
      // flicker inside the cloud
      const fl = Math.random() < 0.35 ? 1 : 0.35;
      g.halo(sx, top + 10, 110 + fl * 30, '#f4f0ff', 0.3 * fl, { glow: 1 });
    } else if (this.phase === 'strike') {
      const k = 1 - this.phaseT / 0.25;
      g.halo(sx, top + 10, 180, '#ffffff', 0.5 * k, { glow: 1 });
      let px = sx, py = top;
      for (const [zx, f] of this.zig) {
        const x = sx + zx, y = top + f * (bottom - top);
        if (f > 0) {
          g.line(px, py, x, y, '#9ec5ff', 14, 0.35 * k);
          g.line(px, py, x, y, '#ffffff', 6, k);
          g.halo((px + x) / 2, (py + y) / 2, 40, '#cfe2ff', 0.35 * k, { glow: 1 });   // bloom along the bolt
        }
        px = x; py = y;
      }
      g.halo(px, py, 90, '#ffffff', 0.45 * k, { glow: 1 });
    }
  }
}

// A guard on a balcony: patrols inside the railing like the squirrel on its
// branch, and lunges with his halberd when the prince comes near (a wind-up
// with a "!", then a thrust that reaches past the railing). A pogo on the
// helmet dazes him and he sinks back through the door.
export class Guard extends Enemy {
  constructor(platform, rng = new RNG()) {
    super(platform.x + rng.range(-16, 16), platform.y);
    this.kind = 'guard';
    this.platform = platform;
    this.rng = rng;
    this.w = 80; this.h = 192;
    this.dir = platform.side === 'L' ? 1 : -1;      // faces the open side
    this.state = 'stand';          // stand | walk | windup | thrust | dazed
    this.stateT = 0;
    this.standFor = rng.range(1, 2.5); this.walkFor = rng.range(0.8, 1.8);
    this.cooldown = 0;
    this.frame = 0;
    this.sink = 0;
  }
  get left() { return this.platform.left + 44; }
  get right() { return this.platform.right - 44; }
  get rect() {
    const r = { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    if (this.state === 'thrust') { r.w += 90; if (this.dir < 0) r.x -= 90; }   // the halberd's reach
    return r;
  }
  update(dt, world) {
    this.t += dt; this.stateT += dt;
    const pf = this.platform;
    if (this.dead) {
      this.sink += dt;
      if (this.sink > 0.9) this.alive = false;
      this.y = pf.y + this.h / 2 - this.sink * 120;
      return;
    }
    if (!pf.landable) { this.dead = true; this.hurtful = false; return; }   // the balcony went
    if (this.cooldown > 0) this.cooldown -= dt;
    const p = world.player;
    const dx = p.x - this.x;
    const within = Math.abs(dx) < 230 && p.y >= pf.y - 100 && p.y < pf.y + 420;
    const near = p.seen && within;
    this.puzzled = p.hidden && within;
    if (this.state === 'windup') {
      if (this.stateT > 0.35) { this.state = 'thrust'; this.stateT = 0; }
    } else if (this.state === 'thrust') {
      if (this.stateT > 0.45) { this.state = 'stand'; this.stateT = 0; this.cooldown = 1.2; this.standFor = this.rng.range(0.8, 1.6); }
    } else if (near && this.cooldown <= 0) {
      this.state = 'windup'; this.stateT = 0;
      this.dir = dx > 0 ? 1 : -1;
      world.audio.grunt();
    } else if (this.state === 'stand') {
      if (near) this.dir = dx > 0 ? 1 : -1;
      if (this.stateT > this.standFor) { this.state = 'walk'; this.stateT = 0; this.walkFor = this.rng.range(0.8, 1.8); this.dir = this.rng.sign(); }
    } else {
      this.x += this.dir * 45 * dt;
      if (this.stateT > this.walkFor) { this.state = 'stand'; this.stateT = 0; this.standFor = this.rng.range(1, 2.5); }
    }
    if (this.x < this.left) { this.x = this.left; this.dir = 1; }
    else if (this.x > this.right) { this.x = this.right; this.dir = -1; }
    this.y = pf.y + this.h / 2;
    this.frame = this.state === 'walk' ? 1 + (Math.floor(this.t * 6) % 2) : this.state === 'thrust' ? 3 : 0;
  }
  stomped(world) {
    this.dead = true; this.hurtful = false; this.state = 'dazed';
    world.audio.clank();
    world.particles.stars(this.x, this.y + this.h / 2);
  }
  draw(g, cam, art) {
    const set = this.dir > 0 ? art.creatures.guardR : art.creatures.guardL;
    const s = this.dead ? set[4] : set[this.frame];
    const sy = cam.sy(this.y - this.h / 2);
    g.blit(s, cam.sx(this.x), sy, this.dead ? { alpha: Math.max(0, 1 - this.sink / 0.9) } : undefined);
    if (this.state === 'windup') g.text('!', cam.sx(this.x), sy - this.h - 26, 22, '#ffe9a0', 'center', true);
    else if (this.puzzled && !this.dead && this.state !== 'thrust') g.text('?', cam.sx(this.x), sy - this.h - 26, 22, PUZZLED, 'center', true);
  }
}

// A flowerpot on a balcony's railing. When the prince is below it, it
// wobbles with a rattle, then falls; hurtful only while falling; shatters
// on him, on a platform or below the view. One shot.
export class Flowerpot extends Enemy {
  constructor(platform, rng = new RNG()) {
    super(platform.x + (platform.side === 'L' ? -1 : 1) * 40, platform.y + 72 + 26);   // on the railing's top
    this.kind = 'pot';
    this.platform = platform;
    this.rng = rng;
    this.w = 48; this.h = 52;
    this.state = 'sit';            // sit | wobble | fall
    this.stateT = 0;
    this.hurtful = false;
    this.vy = 0; this.rot = 0;
    this.flower = rng.int(0, 2);
  }
  get stompable() { return false; }
  update(dt, world) {
    this.t += dt; this.stateT += dt;
    const pf = this.platform, p = world.player;
    if (this.dead) { this.alive = false; return; }
    if (this.state === 'sit') {
      if (!pf.alive) { this.alive = false; return; }
      this.y = pf.y + 72 + this.h / 2;
      const dy = this.y - (p.y + 110);
      if (p.seen && Math.abs(p.x - this.x) < 90 && dy > 120 && dy < 620) { this.state = 'wobble'; this.stateT = 0; world.audio.rattle(); }
    } else if (this.state === 'wobble') {
      this.rot = Math.sin(this.stateT * 38) * 0.22;
      if (this.stateT > 0.7) { this.state = 'fall'; this.stateT = 0; this.hurtful = true; this.vy = 0; }
    } else {
      const prevY = this.y;
      this.vy -= GRAVITY * dt;
      this.y += this.vy * dt;
      this.rot += dt * 3;
      // shatters on the first platform it crosses, or below the view
      for (const q of world.platforms) {
        if (q === pf || !q.landable || q.kind === 'ground') continue;
        if (prevY - this.h / 2 >= q.y && this.y - this.h / 2 <= q.y && Math.abs(this.x - q.x) < q.w / 2 + 10) { this.shatter(world); return; }
      }
      if (this.y < world.cam.y - 100) this.alive = false;
    }
  }
  shatter(world) {
    this.dead = true; this.hurtful = false; this.alive = false;
    world.audio.shatter();
    world.particles.shards(this.x, this.y);
  }
  onHit(world) { this.shatter(world); }
  stomped(world) { this.shatter(world); }     // the shield smashes it
  draw(g, cam, art) {
    const s = art.creatures.pots[this.flower];
    g.blit(s, cam.sx(this.x), cam.sy(this.y - this.h / 2), this.rot ? { rot: this.rot } : undefined);
    if (this.state === 'wobble') g.text('!', cam.sx(this.x), cam.sy(this.y + this.h / 2) - 26, 22, '#ffe9a0', 'center', true);
  }
}

// The window's opening starts 16 px above the sill height; the guard's bust
// rises from there and his pike leaves from his hands.
const ARM_ABOVE_SILL = 40;
const PIKE_UP = Math.PI / 2;        // the pike's rest angle: upright beside him (from the inward horizontal, world y up)
const PIKE_AIM = 0.35;              // how far he can aim a thrust above or below level, in rad

// A guard in a tower window. He stays hidden until the prince is inward of
// his window and about level with it, then his bust rises behind the sill
// with his pike upright ("!"), he leans out and the pike sweeps down into a
// thrust aimed at the prince, holds there a moment and comes back up. The
// window sits on the tower layer, so his height follows it every frame like
// a ribbon's. The pike costs a heart on contact; the boost shield knocks it
// back and he keeps his head down for a while; there is nothing to stomp,
// he stands behind the plane.
export class Grabber extends Enemy {
  // `camY` is the view bottom at spawn time: the height starts in the
  // prince's plane (the cull runs before the first update would convert it).
  constructor(win, rng = new RNG(), reach = 130, camY = 0) {
    super(win.x, Platform.layerToWorld(win.ly, win.f || PARALLAX_TOWER, camY) + ARM_ABOVE_SILL);
    this.kind = 'grabber';
    this.win = win;                 // { i, side, ly, x } from windows.js, or a pillar's hatch inside the tower (pillars.js, with its layer `f`)
    this.f = win.f || PARALLAX_TOWER;
    this.ly = win.ly;               // the sill, in layer coordinates
    this.dir = win.side === 'L' ? 1 : -1;   // the thrust goes inward
    this.rng = rng;
    this.reach = reach;             // the pike's length, hands to tip
    this.state = 'hidden';          // hidden | peek | grab | retract
    this.stateT = 0;
    this.cooldown = rng.range(0, 1.5);
    this.punishT = 0;               // a longer cooldown after a punch
    this.ext = 0;                   // how far into the thrust 0..1
    this.head = 0;                  // how far the bust is up 0..1
    this.lean = 0;                  // how far he leans out 0..1
    this.ang = PIKE_UP;             // the pike's angle now
    this.aim = 0;                   // the angle of the current thrust
    this.hurtful = false;
    this.w = 44; this.h = 44;
    this.sillY = this.y; this.armY = this.y;
  }
  get stompable() { return false; }
  // His hands, where the pike leaves the window, and the pike's tip.
  get gripX() { return this.win.x + this.dir * 22; }
  get gripY() { return this.armY + 8; }
  get tipX() { return this.gripX + this.dir * this.reach * Math.cos(this.ang); }
  get tipY() { return this.gripY + this.reach * Math.sin(this.ang); }
  // The pike: a box around the shaft from the hands to the tip, for the
  // coarse test; `hits` then checks the shaft itself, so a slanted pike
  // does not hit with the empty corners of its box.
  get rect() {
    const x0 = this.gripX, y0 = this.gripY, x1 = this.tipX, y1 = this.tipY, pad = 10;
    return { x: Math.min(x0, x1) - pad, y: Math.min(y0, y1) - pad, w: Math.abs(x1 - x0) + 2 * pad, h: Math.abs(y1 - y0) + 2 * pad };
  }
  hits(r) {
    const x0 = this.gripX, y0 = this.gripY, dx = this.tipX - x0, dy = this.tipY - y0, pad = 10;
    for (let i = 0; i <= 12; i++) {
      const x = x0 + dx * i / 12, y = y0 + dy * i / 12;
      if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return true;
    }
    return false;
  }
  update(dt, world) {
    this.t += dt; this.stateT += dt;
    const p = world.player;
    this.sillY = Platform.layerToWorld(this.ly, this.f, world.cam.y);
    this.armY = this.sillY + ARM_ABOVE_SILL;
    this.y = this.armY;
    if (this.cooldown > 0) this.cooldown -= dt;
    const inward = (p.x - this.win.x) * this.dir;
    const near = p.seen && inward > -30 && inward < this.reach + 40 && Math.abs(p.y + 110 - this.armY) < 120;
    if (this.state === 'hidden') {
      this.head = Math.max(0, this.head - dt * 3); this.ang = PIKE_UP; this.lean = 0;
      if (near && this.cooldown <= 0) { this.state = 'peek'; this.stateT = 0; world.audio.creak(); }
    } else if (this.state === 'peek') {
      this.head = Math.min(1, this.stateT / 0.35);
      if (this.stateT > 0.5) {
        // aim the thrust at the prince's body, within reason
        this.aim = clamp(Math.atan2(p.y + 110 - this.gripY, Math.max(40, inward)), -PIKE_AIM, PIKE_AIM);
        this.state = 'grab'; this.stateT = 0; world.audio.grab();
      }
    } else if (this.state === 'grab') {
      const k = Math.min(1, this.stateT / 0.15);
      this.ext = k * (2 - k);
      this.hurtful = this.ext > 0.6;          // the sweep down is harmless, the thrust is not
      if (this.stateT > 0.55) { this.state = 'retract'; this.stateT = 0; this.hurtful = false; }
    } else {
      this.ext = Math.max(0, 1 - this.stateT / 0.35);
      if (this.stateT > 0.35) { this.state = 'hidden'; this.stateT = 0; this.ext = 0; this.cooldown = this.punishT || this.rng.range(2, 3.5); this.punishT = 0; }
    }
    if (this.state === 'grab' || this.state === 'retract') { this.ang = PIKE_UP + (this.aim - PIKE_UP) * this.ext; this.lean = this.ext; }
    // the shaft's middle, so a hit pushes the prince away from the window
    this.x = (this.gripX + this.tipX) / 2;
  }
  // The shield met the pike: a clank, he pulls it in and keeps his head down.
  stomped(world) {
    this.hurtful = false;
    this.state = 'retract'; this.stateT = 0.1; this.punishT = 5;
    world.audio.clank();
    world.particles.stars(this.tipX, this.tipY);
  }
  draw(g, cam, art) {
    const sx = cam.sx(this.win.x), sill = cam.sy(this.sillY) - 16;   // the opening's bottom edge
    const busts = this.dir > 0 ? art.creatures.guardHeadR : art.creatures.guardHeadL;
    if (this.head > 0) {
      // the bust leans out with the thrust
      g.blit(busts[this.state === 'peek' || this.state === 'grab' ? 1 : 0], sx + this.dir * 14 * this.lean, sill, { sy: this.head, rot: this.dir * 0.14 * this.lean });
      // the pike: a wooden shaft from his hands to a steel head with a red
      // collar, his fists on the shaft (screen space, y down)
      const gx = cam.sx(this.gripX), gy = cam.sy(this.gripY), tx = cam.sx(this.tipX), ty = cam.sy(this.tipY);
      const ux = (tx - gx) / this.reach, uy = (ty - gy) / this.reach;
      const rot = Math.atan2(uy, ux);
      g.line(gx, gy, tx - ux * 20, ty - uy * 20, C.plankDark, 7);
      g.line(gx, gy, tx - ux * 20, ty - uy * 20, C.plank, 3);
      g.box(tx - ux * 26, ty - uy * 26, 12, 14, C.cape, 1, { rot });
      g.path((pth) => {
        pth.moveTo(tx + ux * 6, ty + uy * 6);
        pth.lineTo(tx - ux * 20 - uy * 7, ty - uy * 20 + ux * 7);
        pth.lineTo(tx - ux * 24, ty - uy * 24);
        pth.lineTo(tx - ux * 20 + uy * 7, ty - uy * 20 - ux * 7);
        pth.closePath();
      }, { fill: C.poleHi, stroke: C.pole, width: 2 });
      const fist = art.creatures.gauntletR[1];
      g.blit(fist, gx + ux * 4, gy + uy * 4, { rot });
      g.blit(fist, gx + ux * 30, gy + uy * 30, { rot });
    }
    if (this.state === 'peek') g.text('!', sx - this.dir * 30, sill - 92, 22, '#ffe9a0', 'center', true);
  }
}

// The witch with scissors (in the tale she is the one who cuts the braid).
// She rides SCISSORS_ABOVE px above the prince's highest point, inside the
// stretch the generator planned (hFrom .. hTo), stops beside the braid,
// snips it there and leaves; the braid below the cut falls with its
// ribbons and bows (world.cutBraid). Phases: warn (edge marker with the
// scissors, cackle) -> approach (level flight to the braid) -> snip ->
// leave. Hurtful on the way in and while snipping; the boost shield throws
// her off before the snip (deflect), which saves the braid.
const SCISSORS_ABOVE = 640;
export class Scissors extends Enemy {
  constructor(side, hFrom, hTo, player) {
    super(side * (W / 2 + 100), clamp(player.maxY + SCISSORS_ABOVE, hFrom, hTo));
    this.kind = 'scissors';
    this.side = side; this.dir = -side;
    this.hFrom = hFrom; this.hTo = hTo;   // the planned stretch, in the prince's plane
    this.ly = 0;                    // her height on the tower layer, fixed once the snipping starts
    this.lyFixed = null;
    this.w = 96; this.h = 70;
    this.phase = 'warn'; this.phaseT = 0;
    this.warnTime = 1.0;
    this.vx = 0; this.vy = 0; this.spin = 0;
    this.frame = 0; this.blade = 0;  // scissors open (0) or closed (1)
    this.hurtful = false;
    this.cut = false; this.aborted = false; this.deflected = false;
  }
  get stompable() { return false; }
  // Boosted into: thrown off her broom's course. Before the snip that saves the braid.
  deflect(world) {
    this.phase = 'leave'; this.phaseT = 0;
    this.hurtful = false; this.deflected = true;
    this.dir = this.x >= world.player.x ? 1 : -1;
    this.vx = this.dir * 1000; this.vy = 450;
    world.audio.witchSwoosh();
    if (!this.cut) { this.aborted = true; world.onCutAborted(this); }
  }
  update(dt, world) {
    this.t += dt; this.phaseT += dt;
    this.frame = Math.floor(this.t * 7) % 2;
    if (this.phase === 'leave') {
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.deflected) { this.vy -= 600 * dt; this.spin += dt * 8; }
      if (Math.random() < 0.6) world.particles.witchTrail(this.x, this.y);
      if (this.x > W / 2 + 220 || this.x < -W / 2 - 220 || this.y < world.cam.y - 300 || this.y > world.cam.top + 400) this.alive = false;
      return;
    }
    // Above the prince's highest point until the snipping starts; from then
    // on glued to that point of the braid (a layer height) like a ribbon.
    const p = world.player;
    if (this.lyFixed == null) {
      this.y = clamp(p.maxY + SCISSORS_ABOVE, this.hFrom, this.hTo);
      this.ly = Platform.worldToLayer(this.y, PARALLAX_TOWER, world.cam.y);
    } else {
      this.ly = this.lyFixed;
      this.y = Platform.layerToWorld(this.ly, PARALLAX_TOWER, world.cam.y);
    }
    const braidX = world.bg.braidX(this.ly, world.time);
    const targetX = braidX + this.side * 70;            // she stops on her side of the braid
    if (this.phase === 'warn') {
      if (this.phaseT > this.warnTime) { this.phase = 'approach'; this.phaseT = 0; this.hurtful = true; world.audio.witchSwoosh(); }
    } else if (this.phase === 'approach') {
      const dx = targetX - this.x, step = 850 * dt;
      if (Math.abs(dx) <= step) { this.x = targetX; this.phase = 'snip'; this.phaseT = 0; this.lyFixed = this.ly; world.audio.snip(); }
      else this.x += Math.sign(dx) * step;
      if (world.particles.items.length < 400 && Math.random() < 0.5) world.particles.witchTrail(this.x - this.dir * 40, this.y - 10);
    } else if (this.phase === 'snip') {
      this.x = targetX;                                 // the braid sways: stay beside it
      this.blade = Math.floor(this.phaseT * 6) % 2;
      if (!this.cut && this.phaseT > 0.35) { this.cut = true; world.cutBraid(this.ly, braidX, this.y); }
      if (this.cut) this.blade = 1;
      if (this.phaseT > 0.7) {
        this.phase = 'leave'; this.phaseT = 0; this.hurtful = false;
        this.dir = this.side; this.vx = this.side * 600; this.vy = 520;
        world.audio.witchWarn();
      }
    }
  }
  draw(g, cam, art) {
    if (this.phase === 'warn') {
      // the marker at the edge where she will come in, with her scissors snapping
      const sx = this.side < 0 ? 40 : W - 40, sy = clamp(cam.sy(this.y), 60, H - 60);
      const blink = Math.floor(this.phaseT * 8) % 2 === 0;
      g.text('!', sx, sy, 56, blink ? '#ff3b3b' : '#ffd1d1', 'center', true, { family: 'system-ui, sans-serif', weight: 'bold', glow: 0.6 });
      g.blit(art.creatures.scissors[blink ? 0 : 1], sx - this.side * 52, sy, { flip: this.side > 0, glow: 0.3 });
      return;
    }
    const set = this.dir > 0 ? art.creatures.witchR : art.creatures.witchL;
    const sx = cam.sx(this.x), sy = cam.sy(this.y);
    g.blit(set[this.frame], sx, sy, { rot: this.deflected ? this.spin * this.dir : 0 });
    // the scissors in her outstretched hand, toward the braid
    if (!this.deflected) g.blit(art.creatures.scissors[this.blade], sx + this.dir * 56, sy + 4 + this.frame * 2, { flip: this.dir < 0 });
  }
}

// A bat sleeps under a healthy branch, hanging by its feet, wrapped in its
// wings. When the prince comes within its hearing it wakes (eyes open, a
// squeak, a "!"), lets go and swoops: one U-shaped pass through where he
// was, across to the other side, then back to its roost, where it needs a
// rest before it can be woken again. Harmless while it hangs; in flight it
// bites on contact, and a pogo from above or the boost shield knocks it
// out. `keen` (0..1, by altitude) widens its hearing and quickens the pass.
export class Bat extends Enemy {
  constructor(platform, offset, keen = 0, rng = new RNG()) {
    super(platform.x + offset, platform.y - 28 - 26);
    this.kind = 'bat';
    this.platform = platform; this.offset = offset; this.keen = keen; this.rng = rng;
    this.w = 56; this.h = 36;
    this.state = 'hang';           // hang | wake | swoop | back | away
    this.stateT = 0;
    this.rest = rng.range(0, 1.2);  // not to be woken while this runs
    this.hurtful = false;
    this.from = null; this.ctrl = null; this.to = null;   // the pass: start, control point, end
    this.dur = 1;
    this.vx = 0; this.vy = 0; this.spin = 0;
  }
  get stompable() { return this.state === 'swoop' || this.state === 'back'; }
  get roostX() { return this.platform.x + this.offset; }
  get roostY() { return this.platform.y - 28 - 26; }       // its middle, hanging from the branch's underside
  get hearing() { return 215 + 60 * this.keen; }
  update(dt, world) {
    this.t += dt; this.stateT += dt;
    if (this.dead) {
      this.vy -= GRAVITY * 0.8 * dt;
      this.y += this.vy * dt; this.x += this.vx * dt; this.spin += dt * 9;
      if (this.y < world.cam.y - 200) this.alive = false;
      return;
    }
    const p = world.player, pf = this.platform;
    if (this.state === 'away') {
      this.x += this.vx * dt; this.y += this.vy * dt + Math.sin(this.t * 14) * 60 * dt;
      if (Math.abs(this.x) > W / 2 + 120 || this.y > world.cam.top + 200) this.alive = false;
      return;
    }
    if (!pf.landable) {
      // its branch is gone: it flutters off for good
      this.state = 'away'; this.hurtful = false;
      this.vx = (this.x < 0 ? 1 : -1) * 220; this.vy = 260;
      return;
    }
    if (this.state === 'hang') {
      this.x = this.roostX; this.y = this.roostY;
      if (this.rest > 0) this.rest -= dt;
      else if (world.started && p.seen && Math.hypot(p.x - this.x, p.y + 110 - this.y) < this.hearing) {
        this.state = 'wake'; this.stateT = 0; world.audio.squeak();
      }
    } else if (this.state === 'wake') {
      this.x = this.roostX; this.y = this.roostY;
      if (this.stateT > 0.45) this.dive(p);
    } else if (this.state === 'swoop') {
      const u = Math.min(1, this.stateT / this.dur), v = 1 - u;
      const x = v * v * this.from[0] + 2 * u * v * this.ctrl[0] + u * u * this.to[0];
      this.dirX = x >= this.x ? 1 : -1;
      this.x = x;
      this.y = v * v * this.from[1] + 2 * u * v * this.ctrl[1] + u * u * this.to[1];
      if (u >= 1) { this.state = 'back'; this.stateT = 0; }
    } else {
      // back to the roost in a shallow arc
      const u = Math.min(1, this.stateT / 0.9), e = u * u * (3 - 2 * u);
      this.x = this.to[0] + (this.roostX - this.to[0]) * e;
      this.y = this.to[1] + (this.roostY - this.to[1]) * e + Math.sin(Math.PI * e) * 40;
      if (u >= 1) { this.state = 'hang'; this.stateT = 0; this.hurtful = false; this.rest = this.rng.range(2.5, 4); }
    }
  }
  // Let go and swoop: a curve from the roost through where the prince is
  // (a little ahead of him), ending as far on the other side.
  dive(p) {
    const x0 = this.roostX, y0 = this.roostY;
    const tx = clamp(p.x + p.vx * 0.2, -300, 300);
    const ty = clamp(p.y + 110 + p.vy * 0.12, y0 - 420, y0 + 160);
    let side = tx >= x0 ? 1 : -1;
    let x2 = x0 + side * Math.max(170, 2 * Math.abs(tx - x0));
    if (Math.abs(x2) > 320) { x2 = clamp(x2, -320, 320); if (Math.abs(x2 - x0) < 120) { side = -side; x2 = clamp(x0 + side * 240, -320, 320); } }
    this.from = [x0, y0]; this.to = [x2, y0 - 6];
    this.ctrl = [2 * tx - (x0 + x2) / 2, 2 * ty - (y0 + this.to[1]) / 2];   // so the curve's middle is the target
    this.dur = 1.2 - 0.25 * this.keen;
    this.state = 'swoop'; this.stateT = 0; this.hurtful = true;
  }
  stomped(world) {
    this.dead = true; this.hurtful = false;
    this.vy = -120; this.vx = (this.dirX || 1) * -90;
    world.particles.sparkles(this.x, this.y, 8, '#a595cc');
  }
  draw(g, cam, art) {
    const A = art.creatures;
    if (this.dead) { g.blit(A.bat[2], cam.sx(this.x), cam.sy(this.y), { rot: this.spin }); return; }
    if (this.state === 'hang' || this.state === 'wake') {
      const sx = cam.sx(this.x), top = cam.sy(this.y + 26);
      const awake = this.state === 'wake' || this.rest > 0;       // after a pass it hangs with its eyes open for a while
      // asleep it breathes, waking it shakes itself
      const o = this.state === 'wake' ? { rot: Math.sin(this.stateT * 40) * 0.12 } : { sx: 1 + Math.sin(this.t * 2.2) * 0.04 };
      g.blit(A.batHang[awake ? 1 : 0], sx, top, o);
      if (this.state === 'wake') g.text('!', sx + 34, top + 30, 22, '#ffe9a0', 'center', true);
      else if (!awake && Math.floor(this.t * 0.7) % 2 === 0) g.text('z', sx + 26, top + 44 - ((this.t * 0.7) % 1) * 14, 12, '#cfe8e3', 'center', true, { alpha: 0.8 });
      return;
    }
    g.blit(A.bat[Math.floor(this.t * 11) % 2], cam.sx(this.x), cam.sy(this.y), { rot: this.state === 'away' ? 0 : (this.dirX || 1) * 0.12 });
  }
}

// A flock of starlings: a stream of birds from one edge of the screen to
// the other, three lanes deep, in the gap between two rows the generator
// built as floors (level.js, the flock plan). There is no way around it and
// no way through it without a boost: a prince who flies into it is turned
// back down, no heart lost; the boost shield (or the star) bursts through
// and scatters the birds for a moment; coming down on it from above is a
// pogo on a bird's back. Phases: warn (a marker with birds at the edge they
// come from, their calls) -> stream (until he stands above it) -> leave (the
// last birds fly out). It never hurts, so `hurtful` stays false and the
// world handles the meeting (World.meetFlock).
const FLOCK_H = 130;
const FLOCK_SPEED = 560, FLOCK_BIRDS = 26, BIRD_W = 56, BIRD_H = 36, LANE = 42;
export class Flock extends Enemy {
  constructor(y, dir, rng = new RNG(), span = 284) {
    super(0, y);
    this.kind = 'flock';
    this.span = span;               // how far the floor below reaches to each side (see Player.shoo)
    this.dir = dir;                 // 1: they fly to the right
    this.w = W + 160; this.h = FLOCK_H;
    this.hurtful = false;
    this.phase = 'warn'; this.phaseT = 0;
    this.warnTime = 1.3;
    this.passT = 0;                 // while this runs he is in the hole he made: no second meeting
    this.done = false;
    this.L = W + 160;               // the track's length, edge to edge with room to come in and go out
    // staggered behind one another, lane by lane, so that somewhere in the band's depth there is always a bird
    // (`hole`: its place is empty until it comes round again, see scatter)
    this.birds = Array.from({ length: FLOCK_BIRDS }, (_, i) => ({ s: -(i + rng.range(0, 0.5)) * (this.L / FLOCK_BIRDS), lane: (i % 3) - 1, ph: rng.range(0, TAU), flap: rng.range(0, 2), hole: false }));
    this.fallen = [];               // birds knocked out of the stream, tumbling away (looks only)
    this.hitBottom = y - FLOCK_H / 2;
  }
  get stompable() { return this.phase !== 'warn'; }
  get blocking() { return this.phase === 'stream'; }
  get top() { return this.y + this.h / 2; }
  get bottom() { return this.y - this.h / 2; }
  get rect() { return { x: -this.w / 2, y: this.bottom, w: this.w, h: this.h }; }
  birdX(b) { return this.dir > 0 ? -this.L / 2 + b.s : this.L / 2 - b.s; }
  birdY(b) { return this.y + b.lane * LANE + Math.sin(this.t * 5 + b.ph) * 7; }
  // Is there a bird where the prince's body is? Notes the lowest one's underside.
  hits(r) {
    if (this.phase === 'warn' || this.passT > 0) return false;
    let low = Infinity;
    for (const b of this.birds) {
      if (b.hole || b.s < 0) continue;
      const x = this.birdX(b), y = this.birdY(b);
      if (x + BIRD_W / 2 > r.x && x - BIRD_W / 2 < r.x + r.w && y + BIRD_H / 2 > r.y && y - BIRD_H / 2 < r.y + r.h) low = Math.min(low, y - BIRD_H / 2);
    }
    if (low === Infinity) return false;
    this.hitBottom = low;
    return true;
  }
  update(dt, world) {
    this.t += dt; this.phaseT += dt;
    if (this.passT > 0) this.passT -= dt;
    const p = world.player;
    if (this.y < world.cam.y - 300) return this.finish(world);          // left behind below the view
    if (this.phase === 'warn') {
      if (this.phaseT > this.warnTime) { this.phase = 'stream'; this.phaseT = 0; world.audio.flockWings(); }
      return;
    }
    for (const f of this.fallen) { f.vy -= GRAVITY * 0.6 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += dt * 11; }
    this.fallen = this.fallen.filter((f) => f.y > world.cam.y - 80);
    for (const b of this.birds) {
      b.s += FLOCK_SPEED * dt;
      // round again: another bird takes an empty place, so the stream stays whole
      if (b.s > this.L) { if (this.phase === 'leave') b.gone = true; else { b.s -= this.L; b.hole = false; } }
    }
    this.birds = this.birds.filter((b) => !b.gone);
    // while he passes, the birds that reach him scatter: he ploughs a hole
    if (this.passT > 0 && p.alive) this.scatter(world, 70, p);
    if (this.phase === 'stream') {
      // he stands above it: the rest fly out
      if (p.alive && p.state === 'bouncing' && p.y > this.top) { this.phase = 'leave'; this.phaseT = 0; }
    } else if (!this.birds.length && !this.fallen.length) this.finish(world);
  }
  finish(world) {
    this.alive = false;
    if (!this.done) { this.done = true; world.level.flockDone(); }
  }
  // Knock the birds within `reach` px of the prince out of the stream: they
  // tumble away, and their places stay empty for the rest of the lap.
  scatter(world, reach, p = world.player) {
    for (const b of this.birds) {
      if (b.hole || b.s < 0) continue;
      const x = this.birdX(b), y = this.birdY(b);
      if (Math.abs(x - p.x) > reach || Math.abs(y - (p.y + 110)) > 190) continue;
      b.hole = true;
      this.fallen.push({ x, y, vx: (x < p.x ? -1 : 1) * (120 + Math.random() * 200) + this.dir * 160, vy: 180 + Math.random() * 260, rot: 0 });
      world.particles.feathers(x, y, false, 2);
    }
  }
  burst(world) { this.scatter(world, 120); this.passT = 0.7; }          // the boost shield went through
  stomped(world) { this.scatter(world, 90); this.passT = 0.3; }         // a pogo from above
  turnedBack(world) { this.passT = 0.25; }                              // he flew into it without a boost
  draw(g, cam, art) {
    const A = art.creatures;
    if (this.phase === 'warn') {
      // the marker at the edge they will come from, two birds beside it
      const side = -this.dir, sx = side < 0 ? 40 : W - 40, sy = clamp(cam.sy(this.y), 60, H - 60);
      const blink = Math.floor(this.phaseT * 8) % 2 === 0;
      g.text('!', sx, sy, 56, blink ? '#ffd04a' : '#fff2c0', 'center', true, { family: 'system-ui, sans-serif', weight: 'bold', glow: 0.6 });
      const set = this.dir > 0 ? A.starlingR : A.starlingL;
      for (let i = 0; i < 2; i++) g.blit(set[(Math.floor(this.phaseT * 10) + i) % 2], sx - side * (52 + i * 44), sy - 14 + i * 26);
      return;
    }
    const set = this.dir > 0 ? A.starlingR : A.starlingL;
    for (const b of this.birds) {
      if (b.hole || b.s < 0) continue;
      g.blit(set[Math.floor(this.t * 11 + b.flap) % 2], cam.sx(this.birdX(b)), cam.sy(this.birdY(b)));
    }
    for (const f of this.fallen) g.blit(set[0], cam.sx(f.x), cam.sy(f.y), { rot: f.rot });
  }
}

// The spider's web (inside the tower): a quarter web in the corner under a
// ledge at its pillar, with its spider in the hub. It is a thing, not a
// creature: it does not hurt, it holds. A prince who flies into it hangs
// there by the shoulders with the pogo dangling; every tap is a tug that
// tears it further (WEB_TUGS free him, no boost is spent), and the spider
// comes down from the hub for him, slowly at first: after WEB_BITE seconds
// in the web it bites (a heart) and the web lets go of him all the same.
// Freed either way he is tossed up through the ledge the web hangs under
// and comes down on it, so a web is never a fall and never for ever. The
// boost shield and the star tear straight through and knock the spider out
// (the usual three suns). Under the cloak the web still holds (it has no
// eyes) but the spider does not come. The world handles the meeting
// (World.meetWeb); nothing here is stompable.
export const WEB_W = 120, WEB_H = 136, WEB_TUGS = 3, WEB_BITE = 2.2;
const LEDGE_THICK = 28;
export class Web extends Enemy {
  constructor(platform, rng = new RNG()) {
    const dir = platform.def.dir, face = platform.def.root;
    super(face + dir * WEB_W / 2, platform.y - LEDGE_THICK - WEB_H / 2);
    this.kind = 'web';
    this.platform = platform;
    this.dir = dir;                          // inward, away from the pillar
    this.face = face;                        // the pillar's face
    this.topY = platform.y - LEDGE_THICK;    // the ledge's underside
    this.w = WEB_W; this.h = WEB_H;
    this.hurtful = false;
    this.tugs = 0;
    this.torn = false;
    this.prey = null;                        // the prince while he hangs in it
    this.comeT = 0;                          // how long the spider has been on its way
    this.shake = 0;
    this.puzzled = false;
    this.spider = 'wait';                    // wait | come | back | sulk | out | gone
    this.spX = this.hubX; this.spY = this.hubY; this.spVy = 0; this.spSpin = 0;
    this.phase = rng.range(0, TAU);
  }
  get stompable() { return false; }
  get hubX() { return this.face + this.dir * 28; }
  get hubY() { return this.topY - 32; }
  // Where the prince hangs: his head just under the ledge, the web about his shoulders.
  get holdX() { return this.face + this.dir * 62; }
  get holdY() { return this.topY - 236; }
  // The toss that frees him: up through the ledge with room to spare.
  get tossVy() { return Math.sqrt(2 * GRAVITY * (this.platform.y - this.holdY + 60)); }
  inside(x, y) {
    const dx = (x - this.face) * this.dir, dy = this.topY - y;
    return dx > -12 && dy > 0 && (dx / WEB_W) ** 2 + (dy / WEB_H) ** 2 < 1;
  }
  // His head or his chest in the threads; the pogo below him does not catch.
  hits(r) { const x = r.x + r.w / 2; return !this.torn && (this.inside(x, r.y + r.h - 24) || this.inside(x, r.y + r.h * 0.62)); }
  update(dt, world) {
    this.t += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
    const p = world.player;
    if (!this.platform.alive) { if (p.heldBy === this) p.release(this.tossVy); this.alive = false; return; }
    const held = this.prey && p.heldBy === this;
    if (this.prey && !held) { this.prey = null; if (this.spider === 'come') this.spider = 'back'; }   // something else knocked him out of it
    this.puzzled = !!held && !p.seen;
    if (held && p.seen) {
      if (this.spider === 'wait' || this.spider === 'back') { this.spider = 'come'; world.audio.skitter(); }
      if (this.spider === 'come') {
        this.comeT += dt;
        const k = clamp(this.comeT / WEB_BITE, 0, 1), e = k * k;      // slow at first: time to see it coming
        this.spX = this.hubX + (p.x - this.dir * 8 - this.hubX) * e;
        this.spY = this.hubY + (p.y + 176 - this.hubY) * e;
        if (this.comeT >= WEB_BITE) this.bite(world);
      }
    } else if (this.spider === 'back' || this.spider === 'come') {
      // home to the hub, where it sulks if the web is in tatters
      const dx = this.hubX - this.spX, dy = this.hubY - this.spY, d = Math.hypot(dx, dy), step = 170 * dt;
      if (d <= step) { this.spX = this.hubX; this.spY = this.hubY; this.spider = this.torn ? 'sulk' : 'wait'; this.comeT = 0; }
      else { this.spX += dx / d * step; this.spY += dy / d * step; this.spider = 'back'; }
    } else if (this.spider === 'out') {
      this.spVy -= GRAVITY * 0.8 * dt; this.spY += this.spVy * dt; this.spX += this.dir * 80 * dt; this.spSpin += dt * 10;
      if (this.spY < world.cam.y - 120) this.spider = 'gone';
    }
  }
  caught(world) { this.prey = world.player; this.comeT = 0; this.shake = 1; world.onWebCatch(world.player, this); }
  // A tap while he hangs in it.
  tug(world) {
    if (this.torn) return;
    this.tugs++; this.shake = 1;
    world.onWebTug(world.player, this);
    if (this.tugs >= WEB_TUGS) this.tear(world, false);
  }
  // Torn for good: by his tugs, or `punched` through with the shield.
  tear(world, punched) {
    const p = world.player, held = p.heldBy === this;
    this.torn = true; this.tugs = WEB_TUGS; this.prey = null;
    if (punched && this.spider !== 'gone') { this.spider = 'out'; this.spVy = 300; }
    else if (this.spider === 'wait' || this.spider === 'come') this.spider = 'back';
    if (held) p.release(this.tossVy);
    world.onWebTear(p, this, punched);
  }
  bite(world) {
    const p = world.player;
    p.heldBy = null;
    p.hit(this);
    this.torn = true; this.tugs = WEB_TUGS; this.prey = null; this.spider = 'back';
    if (p.state === 'held') p.release(this.tossVy);           // he could not be hurt just now: let go all the same
    else if (p.alive) { p.vx = 0; p.vy = this.tossVy; }        // the hurt hop, but straight up, onto the ledge
    world.onWebBite(p, this);
  }
  // A few threads across him while he hangs in it (the player draws himself, then this).
  drawFront(g, cam, p) {
    const hx = cam.sx(p.x), hy = cam.sy(p.y + 176), j = Math.sin(this.t * 40) * 4 * this.shake;
    const c = 'rgba(246,243,255,0.85)';
    g.line(cam.sx(this.hubX), cam.sy(this.hubY), hx - this.dir * 26 + j, hy + 40, c, 2);
    g.line(cam.sx(this.face + this.dir * 110), cam.sy(this.topY - 6), hx + this.dir * 22 - j, hy + 66, c, 2);
    g.line(hx - this.dir * 30, hy + 8 + j, hx + this.dir * 30, hy + 26 - j, c, 2);
  }
  draw(g, cam, art) {
    const A = art.interior.web[this.dir > 0 ? 'L' : 'R'];
    const cx = cam.sx(this.face), cy = cam.sy(this.topY);
    g.blit(A[this.torn ? 3 : this.tugs], cx, cy, this.shake > 0 ? { rot: Math.sin(this.t * 55) * 0.06 * this.shake * -this.dir } : undefined);
    if (!this.torn) {
      // dew catching the light now and then
      for (const [ax, ay, ph] of [[88, 76, 0], [58, 108, 2.1], [40, 44, 4.2]]) {
        const tw = Math.sin(this.t * 1.7 + this.phase + ph);
        if (tw > 0.86) g.rect(cx + this.dir * ax - 4, cy + ay - 4, 8, 8, '#ffffff', (tw - 0.86) * 6, { glow: 0.5 });
      }
    }
    if (this.spider === 'gone') return;
    const S = art.creatures.spider, sx = cam.sx(this.spX), sy = cam.sy(this.spY);
    if (this.spider === 'out') { g.blit(S[0], sx, sy - 24, { rot: this.spSpin }); return; }
    const walking = this.spider === 'come' || this.spider === 'back';
    g.blit(S[walking ? Math.floor(this.t * 12) % 2 : Math.floor(this.t * 1.5 + this.phase) % 2], sx, sy - 24, this.spider === 'sulk' ? { sy: 0.85 } : undefined);
    if (this.spider === 'come') g.text('!', sx + this.dir * 34, sy - 40, 22, '#ffe9a0', 'center', true);
    else if (this.puzzled) g.text('?', sx + this.dir * 34, sy - 40, 22, PUZZLED, 'center', true);
  }
}

// The ghost (inside the tower, in the crow's place): drifts to and fro
// between the pillars with a candle. It comes and goes: fading in (GHOST_IN,
// harmless, its candle flaring: the telegraph), there for a while (it
// bites, and a pogo on its head sends it off), fading out, gone but for the
// candle, which never fades, so one always knows where it is. With `track`
// > 0 it drifts toward the prince's height while it is there and sees him.
// Under the cloak it notices nothing and he passes through it, like through
// anything with eyes.
const GHOST_IN = 0.8, GHOST_OUT = 0.5, GHOST_FAINT = 0.13;
export class Ghost extends Enemy {
  constructor(x, y, dir, speed, track = 0, rng = new RNG()) {
    super(x, y);
    this.kind = 'ghost';
    this.baseY = y; this.dir = dir; this.speed = speed; this.track = track; this.rng = rng;
    this.w = 56; this.h = 64;
    this.phase = rng.range(0, TAU);
    this.state = rng.chance(0.5) ? 'gone' : 'solid';   // gone | in | solid | out
    this.stateT = 0;
    this.stateFor = this.state === 'gone' ? rng.range(0.4, 2) : rng.range(1.2, 2.8);
    this.hurtful = this.state === 'solid';
    this.vis = this.hurtful ? 1 : GHOST_FAINT;   // how much of it shows
    this.boo = 0;
    this.sink = 0;
    this.room = null;                             // the room's painter, for the candle's light
  }
  get stompable() { return this.state === 'solid'; }
  update(dt, world) {
    this.t += dt; this.stateT += dt;
    this.room = world.bg.interior;
    if (this.dead) { this.sink += dt; this.y += 90 * dt; this.vis = Math.max(0, 1 - this.sink / 0.6); if (this.sink > 0.6) this.alive = false; return; }
    const p = world.player;
    if (this.state === 'gone') {
      this.vis = GHOST_FAINT;
      if (this.stateT > this.stateFor) { this.state = 'in'; this.stateT = 0; if (Math.abs(this.y - world.cam.y - H / 2) < H / 2 + 60) world.audio.ghostIn(); }
    } else if (this.state === 'in') {
      this.vis = GHOST_FAINT + (1 - GHOST_FAINT) * (this.stateT / GHOST_IN) ** 2;
      if (this.stateT > GHOST_IN) { this.state = 'solid'; this.stateT = 0; this.stateFor = this.rng.range(2, 3.2); }
    } else if (this.state === 'solid') {
      this.vis = 1;
      if (this.stateT > this.stateFor) { this.state = 'out'; this.stateT = 0; }
    } else {
      this.vis = 1 - (1 - GHOST_FAINT) * (this.stateT / GHOST_OUT);
      if (this.stateT > GHOST_OUT) { this.state = 'gone'; this.stateT = 0; this.stateFor = this.rng.range(1.4, 2.4); }
    }
    this.hurtful = this.state === 'solid';
    this.x += this.dir * this.speed * dt;
    if (this.x > 236) { this.x = 236; this.dir = -1; } else if (this.x < -236) { this.x = -236; this.dir = 1; }
    const near = p.seen && this.state === 'solid' && Math.hypot(p.x - this.x, p.y + 110 - this.y) < 230;
    if (this.track > 0 && this.state === 'solid' && p.seen) {
      const want = clamp(p.y + 110, this.baseY - 260, this.baseY + 260);
      this.baseY += clamp(want - this.baseY, -1, 1) * 46 * this.track * dt;
    }
    this.boo = near ? Math.min(1, this.boo + dt * 6) : Math.max(0, this.boo - dt * 3);
    this.y = this.baseY + Math.sin(this.t * 1.9 + this.phase) * 14;
  }
  stomped(world) {
    this.dead = true; this.hurtful = false;
    world.audio.ghostPop();
    world.particles.cloudPuff(this.x, this.y, 60, 8);
  }
  draw(g, cam, art) {
    const A = art.interior, set = this.dir > 0 ? A.ghost.R : A.ghost.L;
    const sx = cam.sx(this.x), sy = cam.sy(this.y);
    const frame = this.dead ? 3 : this.boo > 0.5 ? 2 : Math.floor(this.t * 3 + this.phase) % 2;
    // fading in it shimmers
    const a = this.state === 'in' ? this.vis * (0.75 + 0.25 * Math.sin(this.t * 38)) : this.vis;
    g.blit(set[frame], sx, sy, { alpha: a, glow: 0.2 * this.vis });
    if (this.dead) return;
    // the candle in its hand (above its head for a boo): always there
    const hx = sx + this.dir * 34, hy = sy + (frame === 2 ? -22 : 14);
    const flare = this.state === 'in' ? 1 + 0.8 * Math.sin(Math.min(1, this.stateT / GHOST_IN) * Math.PI) : 1;
    const fl = (0.85 + 0.15 * Math.sin(this.t * 10 + this.phase)) * flare;
    g.halo(hx, hy - 22, 46 * flare, '#ffd596', 0.5 * fl, { glow: 0.5 });
    g.blit(A.ghostCandle[Math.floor(this.t * 8) % 2], hx, hy, { glow: 0.5 });
    if (this.room) this.room.glow(hx, hy - 20, 170 * flare, '#ffd596', 0.16 * fl);
    if (this.state === 'in') g.text('!', sx, sy - 58, 22, '#ffe9a0', 'center', true, { alpha: Math.min(1, this.stateT / 0.25) });
  }
}
