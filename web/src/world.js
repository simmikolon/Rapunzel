import { W, H, PX_PER_METER, PLAYER_H, PLAYER_BODY_W, PUNCH_SUNS } from './config.js';
import { Camera } from './camera.js';
import { Particles } from './particles.js';
import { Player } from './player.js';
import { Platform } from './platforms.js';
import { cloudAmount } from './altitude.js';
import { Level } from './level.js';
import { Background } from './background.js';
import { Witch } from './enemies.js';
import { audio } from './audio.js';
import { PAL as C } from './palette.js';
import { RNG, overlaps, clamp } from './util.js';

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
    this.nextStorkY = 47000;      // storks cross the sky every 400 to 700 px of climb
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
    this.bg.updateFireflies(dt, this.cam, this.time, this);
    this.bg.updateAtmosphere(dt, this.cam, this.time, this);
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
      if (e.kind === 'lightning') { if (e.hurtful && !pl.shielded) pl.hit(e); continue; }
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
    // Storks: once the clouds are fully in, a stork crosses the screen a few
    // bounces above the prince, from one edge to the other.
    if (pl.maxY > this.nextStorkY && cloudAmount(pl.maxY) >= 1) {
      this.spawnStork();
      this.nextStorkY = pl.maxY + this.rng.range(400, 700);
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

  spawnStork() {
    const pl = this.player, side = this.rng.sign();
    const stork = new Platform('stork', pl.y + this.rng.range(380, 640), { x: -side * (W / 2 + 140), vx: side * this.rng.range(150, 210), phase: this.rng.range(0, 6.28) });
    this.platforms.push(stork);
    this.audio.wings();
    return stork;
  }

  // ---------------------------------------------------------------- callbacks
  onPlayerLand(pl, p) {
    if (p.kind === 'bow') { this.audio.spring(); this.particles.petals(pl.x, pl.y, 10); this.particles.sparkles(pl.x, pl.y, 6, '#ffd1e3'); }
    else if (p.kind === 'cloud') { this.audio.poof(p.dry); this.particles.cloudPuff(pl.x, pl.y, 70, p.dry ? 6 : 9); return; }
    else if (p.kind === 'skyLantern') { this.audio.paper(); this.particles.sparkles(pl.x, pl.y + 10, 7, '#ffd04a'); return; }
    else if (p.kind === 'stork') {
      // riding a stork is the timing reward: suns and a squawk
      this.audio.squawk(); this.particles.feathers(pl.x, pl.y, true);
      this.suns += 3; this.toast('+3', '#ffe9a0', 0.9);
      return;
    }
    else if (p.dry) { this.audio.weakBounce(); this.particles.crumble(pl.x, pl.y, 60, true); }
    else { this.audio.bounce(pl.combo); }
    if (p.kind === 'branchL' || p.kind === 'branchR') this.particles.leaves(pl.x, pl.y, p.dry ? 2 : 5);
    else if (p.kind === 'ribbon') this.particles.petals(pl.x, pl.y, 4);
    else if (p.kind === 'swing') this.particles.landingDust(pl.x, pl.y, 0.6);
    else this.particles.landingDust(pl.x, pl.y, 1.4);
  }
  onPlayerJump(pl, p) {
    if (p && p.dry && p.used) {
      if (p.kind === 'stork') { opts.sy = 1 - p.squash * 0.15; opts.rot = (p.vx > 0 ? 1 : -1) * p.squash * 0.08; }
    else if (p.kind === 'skyLantern') {
      // the glow breathes; the paper crumples on a landing
      const fl = 0.3 + 0.08 * Math.sin(this.time * 7 + p.phase) + 0.05 * Math.sin(this.time * 2.3 + p.phase);
      g.halo(cam.sx(p.x), cam.sy(p.y) + 74, 170, p.variant ? '#ff9ab8' : '#ffbe50', fl, { glow: 1 });
      opts.sy = 1 - p.squash * 0.22; opts.sx = 1 + p.squash * 0.1;
      opts.rot = Math.sin(this.time * 0.7 + p.phase) * 0.05;
      opts.glow = 0.5;
    } else if (p.kind === 'cloud') { this.audio.dissolve(); this.particles.cloudPuff(p.x, p.y, p.w, 16); }
      else { this.audio.crumble(); this.particles.crumble(p.x, p.y, p.w, true); }
    }
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
  drawPlatform(g, p) {
    const A = this.art.platforms;
    let s;
    const T = this.art.trees;
    switch (p.kind) {
      case 'branchL': s = p.dry ? (T.branchLDry[p.len] || T.branchLDry.normal) : T.styles[p.style].branchL[p.len][p.variant]; break;
      case 'branchR': s = p.dry ? (T.branchRDry[p.len] || T.branchRDry.normal) : T.styles[p.style].branchR[p.len][p.variant]; break;
      case 'ribbon': s = p.squash > 0.4 ? A.ribbonSquash : A.ribbon; break;
      case 'bow': s = p.squash > 0.4 ? A.bowSquash : A.bow; break;
      case 'swing': s = A.plank; break;
      case 'cloud': s = this.art.clouds[p.cloud === 'storm' ? 'storm' : p.dry ? 'wispy' : 'thick'][p.size][p.variant]; break;
      case 'skyLantern': s = this.art.lanterns.big[p.variant]; break;
      case 'stork': s = (p.vx > 0 ? this.art.creatures.storkR : this.art.creatures.storkL)[Math.floor(this.time * 7 + p.phase) % 2]; break;
      default: return;
    }
    const cam = this.cam;
    const dip = p.squash * 10;
    const opts = {};
    if (p.kind === 'stork') { opts.sy = 1 - p.squash * 0.15; opts.rot = (p.vx > 0 ? 1 : -1) * p.squash * 0.08; }
    else if (p.kind === 'skyLantern') {
      // the glow breathes; the paper crumples on a landing
      const fl = 0.3 + 0.08 * Math.sin(this.time * 7 + p.phase) + 0.05 * Math.sin(this.time * 2.3 + p.phase);
      g.halo(cam.sx(p.x), cam.sy(p.y) + 74, 170, p.variant ? '#ff9ab8' : '#ffbe50', fl, { glow: 1 });
      opts.sy = 1 - p.squash * 0.22; opts.sx = 1 + p.squash * 0.1;
      opts.rot = Math.sin(this.time * 0.7 + p.phase) * 0.05;
      opts.glow = 0.5;
    } else if (p.kind === 'cloud') {
      // breathing, a soft squash on landing, translucent when wispy, and a
      // dissolve in place when it goes
      const br = Math.sin(this.time * 1.4 + p.phase) * 0.03;
      opts.sx = 1 + br + p.squash * 0.12; opts.sy = 1 - br - p.squash * 0.25;
      if (p.dry) opts.alpha = 0.78;
      if (p.state === 'breaking') { const k = p.t / 0.5; opts.alpha = (p.dry ? 0.78 : 1) * (1 - k); opts.sx += k * 0.5; opts.sy += k * 0.3; }
      if (p.vx) {
        // a drifting cloud trails thin streaks behind it
        const sx = cam.sx(p.x), sy = cam.sy(p.y), d = p.vx > 0 ? -1 : 1, half = p.w / 2;
        for (let i = 0; i < 3; i++) { const yy = sy + 10 + i * 10, x0 = sx + d * (half - 10 + i * 6); g.line(x0, yy, x0 + d * (34 + i * 10 + Math.sin(this.time * 3 + i) * 6), yy, '#e9f1f5', 3, 0.45 - i * 0.1); }
      }
    } else if (p.state === 'breaking') { opts.rot = (p.kind === 'branchL' ? -1 : 1) * p.t * 0.9; opts.alpha = clamp(1 - p.t / 0.6, 0, 1); }
    else if (p.wobble) opts.rot = p.wobble * 0.004;
    if (p.def.root != null) { opts.sx = p.lenScale; if (p.tint && !p.dry) opts.tint = p.tint; }
    if (p.kind === 'swing') {
      // ropes up into the canopy
      const sx = cam.sx(p.x), sy = cam.sy(p.y) + dip;
      const lean = (opts.rot || 0) * 60;
      for (const dx of [-94, 94]) g.line(sx + dx, sy + 4, sx + dx + lean, -40, C.rope, 4);
    }
    g.blit(s, cam.sx(p.x), cam.sy(p.y) + dip, Object.keys(opts).length ? opts : undefined);
  }

  // `g` is the renderer facade (gfx/renderer.js); everything is drawn in
  // screen coordinates, back to front, into the layer named by g.layer().
  draw(g) {
    const cam = this.cam;
    g.layer('bg');
    this.bg.drawBack(g, cam, this.time);
    g.layer('world');
    const order = { swing: 0, ribbon: 1, bow: 1, branchL: 2, branchR: 2, cloud: 2, skyLantern: 2, stork: 3 };
    const visible = this.platforms.filter((p) => p.kind !== 'ground' && p.y > cam.y - 120 && p.y < cam.top + 120);
    visible.sort((a, b) => (order[a.kind] || 0) - (order[b.kind] || 0));
    for (const p of visible) this.drawPlatform(g, p);
    for (const k of this.pickups) if (k.y > cam.y - 100 && k.y < cam.top + 100) k.draw(g, cam, this.art);
    for (const e of this.enemies) e.draw(g, cam, this.art);
    this.player.draw(g, cam, this.art);
    this.particles.draw(g, cam);
    this.bg.drawFront(g, cam, this.time);
    this.bg.drawFrontAtmosphere(g, cam, this.time, this);
    g.layer('light');
    this.bg.drawLighting(g, cam);
    this.bg.drawVignette(g);
  }
}
