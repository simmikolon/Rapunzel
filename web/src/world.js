import { W, H, PX_PER_METER, PLAYER_H, PLAYER_BODY_W, PUNCH_SUNS } from './config.js';
import { Camera } from './camera.js';
import { Particles } from './particles.js';
import { Player } from './player.js';
import { Platform } from './platforms.js';
import { Level } from './level.js';
import { Background } from './background.js';
import { Witch } from './enemies.js';
import { audio } from './audio.js';
import { RNG, overlaps, clamp } from './util.js';
import { blit } from './art/sprite.js';

// One round of the game: entities, collisions, generation, FX callbacks.
export class World {
  constructor(game) {
    this.game = game;
    this.art = game.art;
    this.input = game.input;
    this.audio = audio;
    this.particles = new Particles();
    this.cam = new Camera();
    this.bg = new Background(this.art);
    this.player = new Player(this);
    this.rng = new RNG();
    this.level = new Level(this, this.rng);
    this.reset();
  }

  reset(seed) {
    this.rng = new RNG(seed);
    this.level.rng = this.rng;
    this.time = 0;
    this.platforms = [new Platform('ground', 0)];
    this.enemies = [];
    this.pickups = [];
    this.particles.clear();
    this.cam.reset();
    this.player.reset(0, 0);
    this.level.reset();
    this.suns = 0;
    this.stomps = 0;
    this.nextWitchY = 12000;
    this.nextMilestone = 100;
    this.hintShown = false;
    this.toasts = [];
    this.over = false;
    this.overT = 0;
    this.started = false;
    this.level.generateUpTo(H + 900);
  }

  get heightM() { return Math.max(0, Math.floor(this.player.maxY / PX_PER_METER)); }

  start() {
    this.started = true;
    this.player.launch();
    this.audio.start();
  }

  toast(text, color = '#fff2a8', life = 1.6) { this.toasts.push({ text, color, life, maxLife: life }); }

  // ------------------------------------------------------------------ update
  update(dt, idle = false) {
    this.time += dt;
    // Ribbons ride on the braid, so a wilder braid is the 'moving platform' mechanic.
    this.bg.swayAmp = 12 + clamp(this.level.difficulty.index, 0, 4) * 14;
    this.bg.updateFireflies(dt, this.cam, this.time);
    for (const t of this.toasts) t.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);
    if (idle) { this.player.idleT += dt; this.particles.update(dt); return; }

    const braidX = (ly) => this.bg.braidX(ly, this.time);
    for (const p of this.platforms) p.update(dt, this.time, braidX, this.cam);

    const pl = this.player;
    pl.update(dt, this.input);
    if (pl.alive) this.collide();

    for (const e of this.enemies) e.update(dt, this);
    for (const k of this.pickups) k.update(dt);
    this.particles.update(dt);
    this.cam.follow(pl, dt);

    this.level.generateUpTo(this.cam.top + 900);
    this.cull();
    this.events();

    if (pl.alive && pl.headY < this.cam.y - 10) pl.die('fell');
    if (!pl.alive) {
      this.overT += dt;
      if ((pl.deathCause === 'caught' && this.overT > 1.3) || pl.headY < this.cam.y - 200 || this.overT > 3) this.over = true;
    }
  }

  collide() {
    const pl = this.player;
    const left = pl.bodyLeft, right = pl.bodyRight;
    const xOverlap = (p) => right > p.left && left < p.right;

    // Platforms: one-way surfaces, plus plank swings that are solid from below.
    if (pl.vy <= 0 && pl.state !== 'bouncing') {
      let best = null;
      for (const p of this.platforms) {
        if (!p.landable) continue;
        if (pl.prevY >= p.y && pl.y <= p.y && xOverlap(p)) { if (!best || p.y > best.y) best = p; }
      }
      if (best) pl.land(best);
    } else if (pl.vy > 0) {
      for (const p of this.platforms) {
        if (!p.solidBelow || !p.landable) continue;
        const prevHead = pl.prevY + PLAYER_H, head = pl.headY;
        if (prevHead <= p.bottom && head >= p.bottom && xOverlap(p)) { pl.bonk(p); break; }
      }
    }

    // Enemies
    const r = pl.rect;
    for (const e of this.enemies) {
      if (!e.alive || e.dead || !overlaps(r, e.rect)) continue;
      if (pl.shielded && e.hurtful) { this.boostPunch(e); continue; }
      if (e.stompable && pl.vy < 0 && pl.y > e.y - 10) { e.stomped(this); pl.stomp(e); }
      else if (e.hurtful) { pl.hit(e); }
    }

    // Pickups
    for (const k of this.pickups) {
      if (!k.alive || !overlaps(r, k.rect)) continue;
      k.alive = false;
      this.collect(k);
    }
  }

  // Boosting through an enemy knocks it away instead of hurting the prince.
  boostPunch(e) {
    if (e.kind === 'witch') { if (e.phase === 'warn' || e.deflected) return; e.deflect(this); }
    else e.stomped(this);
    this.suns += PUNCH_SUNS;
    this.onBoostPunch(this.player, e);
  }

  collect(k) {
    const pl = this.player;
    if (k.kind === 'sun') {
      this.suns++;
      this.audio.pickup();
      this.particles.sparkles(k.x, k.y, 8);
    } else if (k.kind === 'lantern') {
      pl.boost = 3;
      this.audio.lantern();
      this.particles.sparkles(k.x, k.y, 16, '#ffb347');
      this.toast('Boost refilled!', '#ffd98a', 1.2);
    } else if (k.kind === 'heart') {
      pl.heal();
      this.audio.heart();
      this.particles.hearts(k.x, k.y);
    }
  }

  cull() {
    const floor = this.cam.y - 320;
    this.platforms = this.platforms.filter((p) => p.alive && (p.y > floor || p.kind === 'ground'));
    this.enemies = this.enemies.filter((e) => e.alive && (e.kind === 'witch' || e.y > floor - 200));
    this.pickups = this.pickups.filter((k) => k.alive && k.y > floor && k.y < this.cam.top + 2500);
  }

  events() {
    const pl = this.player;
    if (!pl.alive) return;
    // The witch: telegraphed dives from a fixed altitude on, never during a
    // breather stretch, and with a long cooldown so she is an event.
    if (pl.maxY > this.nextWitchY && !this.enemies.some((e) => e.kind === 'witch') && !this.level.pacingAt(pl.maxY).breather) {
      const side = this.rng.sign();
      const dives = this.level.difficulty.index >= 3.5 ? 2 : 1;
      this.enemies.push(new Witch(pl, side, dives));
      this.audio.witchWarn();
      this.toast('The witch!', '#ff8a8a', 1.4);
      this.nextWitchY = pl.maxY + this.rng.range(7500, 10500);
    }
    // Teach the boost shield the first time an enemy comes into view.
    if (!this.hintShown && this.enemies.some((e) => e.alive && !e.dead && e.kind !== 'witch' && e.y < this.cam.top && e.y > this.cam.y)) {
      this.hintShown = true;
      this.toast('Boost to punch through enemies!', '#ffd98a', 2.6);
    }
    // Height milestones
    if (this.heightM >= this.nextMilestone) {
      this.toast(`${this.nextMilestone} m`, '#fff2a8', 1.4);
      if (this.nextMilestone % 500 === 0) this.audio.milestone();
      this.nextMilestone += 100;
    }
  }

  // ---------------------------------------------------------------- callbacks
  onPlayerLand(pl, p) {
    if (p.kind === 'bow') { this.audio.spring(); this.particles.petals(pl.x, pl.y, 10); this.particles.sparkles(pl.x, pl.y, 6, '#ffd1e3'); }
    else if (p.dry) { this.audio.weakBounce(); this.particles.crumble(pl.x, pl.y, 60, true); }
    else { this.audio.bounce(pl.combo); }
    if (p.kind === 'branchL' || p.kind === 'branchR') this.particles.leaves(pl.x, pl.y, p.dry ? 2 : 5);
    else if (p.kind === 'ribbon') this.particles.petals(pl.x, pl.y, 4);
    else if (p.kind === 'swing') this.particles.landingDust(pl.x, pl.y, 0.6);
    else this.particles.landingDust(pl.x, pl.y, 1.4);
  }
  onPlayerJump(pl, p) {
    if (p && p.dry && p.used) { this.audio.crumble(); this.particles.crumble(p.x, p.y, p.w, true); }
  }
  onPlayerBoost(pl) { this.audio.boost(); this.particles.sparkles(pl.x, pl.y, 8, '#ffd04a'); }
  onPlayerBonk(pl, p) { this.audio.bonk(); this.particles.stars(pl.x, pl.headY); this.cam.shake(5, 0.2); }
  onPlayerStomp(pl, e) { this.audio.stomp(); this.stomps++; this.cam.shake(3, 0.15); }
  onBoostPunch(pl, e) {
    this.audio.stomp(); this.stomps++;
    this.particles.sparkles(e.x, e.y, 14, '#ffd04a');
    this.cam.shake(4, 0.15);
    this.toast(`+${PUNCH_SUNS}`, '#ffe9a0', 0.9);
  }
  onPlayerHurt(pl, src) { this.audio.hurt(); this.particles.hurtPuff(pl.x, pl.y + 100); this.cam.shake(10, 0.35); }
  onPlayerDie(pl, cause) { this.audio.gameOver(); this.cam.shake(14, 0.5); }

  // ------------------------------------------------------------------- draw
  drawPlatform(ctx, p) {
    const A = this.art.platforms;
    let s;
    switch (p.kind) {
      case 'branchL': s = p.dry ? A.branchLDry : A.branchL; break;
      case 'branchR': s = p.dry ? A.branchRDry : A.branchR; break;
      case 'ribbon': s = p.squash > 0.4 ? A.ribbonSquash : A.ribbon; break;
      case 'bow': s = p.squash > 0.4 ? A.bowSquash : A.bow; break;
      case 'swing': s = A.plank; break;
      default: return;
    }
    const cam = this.cam;
    const dip = p.squash * 10;
    const opts = {};
    if (p.state === 'breaking') { opts.rot = (p.kind === 'branchL' ? -1 : 1) * p.t * 0.9; opts.alpha = clamp(1 - p.t / 0.6, 0, 1); }
    else if (p.wobble) opts.rot = p.wobble * 0.004;
    if (p.kind === 'swing') {
      // ropes up into the canopy
      const sx = cam.sx(p.x), sy = cam.sy(p.y) + dip;
      const lean = (opts.rot || 0) * 60;
      ctx.strokeStyle = '#d8c38a'; ctx.lineWidth = 4;
      for (const dx of [-94, 94]) { ctx.beginPath(); ctx.moveTo(sx + dx, sy + 4); ctx.lineTo(sx + dx + lean, -40); ctx.stroke(); }
    }
    blit(ctx, s, cam.sx(p.x), cam.sy(p.y) + dip, Object.keys(opts).length ? opts : undefined);
  }

  draw(ctx) {
    const cam = this.cam;
    this.bg.drawBack(ctx, cam, this.time);
    const order = { swing: 0, ribbon: 1, bow: 1, branchL: 2, branchR: 2 };
    const visible = this.platforms.filter((p) => p.kind !== 'ground' && p.y > cam.y - 120 && p.y < cam.top + 120);
    visible.sort((a, b) => (order[a.kind] || 0) - (order[b.kind] || 0));
    for (const p of visible) this.drawPlatform(ctx, p);
    for (const k of this.pickups) if (k.y > cam.y - 100 && k.y < cam.top + 100) k.draw(ctx, cam, this.art);
    for (const e of this.enemies) e.draw(ctx, cam, this.art);
    this.player.draw(ctx, cam, this.art);
    this.particles.draw(ctx, cam);
    this.bg.drawFront(ctx, cam, this.time);
    this.bg.drawLighting(ctx, cam);
    this.bg.drawVignette(ctx);
  }
}
