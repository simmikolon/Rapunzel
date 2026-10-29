import { W, H, GRAVITY } from './config.js';
import { TAU, clamp, RNG } from './util.js';

// Enemies that fit the fairy tale: crows patrol the air between the trees,
// spiders dangle from branches on a thread, and the witch sweeps in on her
// broom. Crows and spiders can be stomped from above (pogo!), the witch must
// be dodged.
//
// Every random value that can touch a collision (flight phase, thread phase,
// a squirrel's moods) comes from the RNG handed in, so a seeded round replays
// exactly and the simulator is reproducible; Math.random is only used for
// particles.

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
    const near = this.track > 0 && p.alive && Math.abs(dx) < 360 && Math.abs(p.y + 100 - this.y) < 700;
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
    if (this.lungeT < 0 && this.lunge > 0 && this.cooldown <= 0 && p.alive) {
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
    const reach = p.alive && Math.abs(dx) < 240 && p.y >= pf.y - 60 && p.y < pf.y + 420;
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
      this.x += this.vx * dt; this.y += this.vy * dt; this.vy -= 600 * dt; this.spin += dt * 8;
      if (Math.random() < 0.6) world.particles.witchTrail(this.x, this.y);
      if (this.x > W / 2 + 220 || this.x < -W / 2 - 220 || this.y < world.cam.y - 300) this.alive = false;
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
      if ((this.dir > 0 && this.x > W / 2 - 110) || (this.dir < 0 && this.x < -W / 2 + 110)) {
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
      g.text('!', sx, sy, 56, blink ? '#ff3b3b' : '#ffd1d1', 'center', false, { family: 'system-ui, sans-serif', weight: 'bold', glow: 0.6 });
      return;
    }
    const set = this.dir > 0 ? art.creatures.witchR : art.creatures.witchL;
    if (this.phase === 'leave') { g.blit(set[this.frame], cam.sx(this.x), cam.sy(this.y), { rot: this.spin * this.dir }); return; }
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
