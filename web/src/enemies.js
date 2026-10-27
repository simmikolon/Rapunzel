import { W, H, GRAVITY } from './config.js';
import { TAU, clamp } from './util.js';

// Enemies that fit the fairy tale: crows patrol the air between the trees,
// spiders dangle from branches on a thread, and the witch sweeps in on her
// broom. Crows and spiders can be stomped from above (pogo!), the witch must
// be dodged.

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
  constructor(x, y, dir, speed, track = 0) {
    super(x, y);
    this.kind = 'crow';
    this.dir = dir; this.speed = speed; this.track = track;
    this.baseY = y;
    this.w = 62; this.h = 40;
    this.phase = Math.random() * TAU;
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
  constructor(x, anchorY, minLen, maxLen, speed, lunge = 0) {
    super(x, anchorY - minLen);
    this.kind = 'spider';
    this.anchorY = anchorY;       // underside of the branch it hangs from
    this.minLen = minLen; this.maxLen = maxLen; this.speed = speed; this.lunge = lunge;
    this.w = 52; this.h = 40;
    this.phase = Math.random() * TAU;
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
