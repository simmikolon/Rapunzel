import { W, H, PX_PER_METER, PLAYER_H, PUNCH_SUNS, PARALLAX_TOWER, HOP_VY, SHOWOFF_VY, COUNT_MIN_T, GRAVITY, MAGNET_RADIUS, MAGNET_SPEED, MAGNET_ACCEL } from './config.js';
import { Camera } from './camera.js';
import { Particles } from './particles.js';
import { Player } from './player.js';
import { Platform, fallDist } from './platforms.js';
import { cloudAmount } from './altitude.js';
import { Updraft } from './updraft.js';
import { Level, CUT_ROOM, FLOCK_LEAD, zoneAt } from './level.js';
import { treeStyleIndexAt } from './altitude.js';
import { BEAT } from './config.js';
import { Background } from './background.js';
import { Witch, Scissors, Flock } from './enemies.js';
import { audio } from './audio.js';
import { PAL as C } from './palette.js';
import { RNG, overlaps, clamp, TAU } from './util.js';
import { hash } from './altitude.js';
import { POWERS, RAINBOW } from './powerups.js';
import { placeOf } from './places.js';
import { STONE_STYLE, INSIDE } from './art/interior.js';

// Where the lights are out: how far the picture goes down (1 would be
// black: a ledge must still be a shape in it), and toward which colour.
const DARK_DEPTH = 0.86, DARK_COLOR = '#07061a';

// Through a gate: the door takes GATE_OPEN to open, then the picture closes
// in on the prince and opens again, GATE_IRIS each way.
const GATE_OPEN = 0.28, GATE_IRIS = 0.3;

// Before the round starts the prince hops on the lawn by himself.
const IDLE_INPUT = { axis: 0, usingTilt: false, consumeBoost: () => false };

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
    this.placeName = (game.round && game.round.place) || 'outside';
    this.reset();
  }

  // A fresh round from `seed`, in `place` (places.js; the one it was in when none is named).
  reset(seed, place = this.placeName) {
    this.placeName = place;
    this.place = placeOf(place);
    this.level.place = this.place;
    this.bg.setPlace(this.place);
    // Streams from one seed: the level geometry, the hearts (their timing
    // depends on the prince's state), the events (the witch), the
    // background's gusts, what the tower itself does (window guards) and
    // the power-ups, so a seeded round lays out the same tower however it is
    // played and the tower's hazards or the power-ups can be switched off
    // without moving a branch.
    this.rng = new RNG(seed);
    this.rngEvents = new RNG(seed == null ? undefined : hash(seed + 1));
    this.level.rng = this.rng;
    this.level.rngHearts = new RNG(seed == null ? undefined : hash(seed + 2));
    this.level.rngTower = new RNG(seed == null ? undefined : hash(seed + 4));
    this.level.rngPower = new RNG(seed == null ? undefined : hash(seed + 5));
    this.level.rngFauna = new RNG(seed == null ? undefined : hash(seed + 6));
    this.level.rngGates = new RNG(seed == null ? undefined : hash(seed + 7));
    this.level.rngDark = new RNG(seed == null ? undefined : hash(seed + 8));
    this.passage = null;          // { gate, t, switched }: going through a gate (enterGate)
    this.bg.reset(new RNG(seed == null ? undefined : hash(seed + 3)));
    this.time = 0;
    this.platforms = [new Platform('ground', 0)];
    this.enemies = [];
    this.pickups = [];
    this.fields = [];             // updrafts
    this.braidCut = { ly: -Infinity, pieces: [] };   // where the braid ends now, and the pieces falling away
    this.particles.clear();
    this.cam.reset();
    this.player.reset(0, 0);
    this.level.reset();
    this.suns = 0;
    this.stomps = 0;
    this.nextWitchY = 12000;
    this.nextStorkY = 47000;      // storks cross the sky every 1200 to 2000 px of climb
    this.nextMilestone = 100;
    this.hintShown = false;
    this.floorName = 'the hall';    // the floor he is on inside the tower (events() says so when it changes)
    this.webHints = 0;            // how often this round has said how to get out of a web
    this.toasts = [];
    this.over = false;
    this.overT = 0;
    this.started = false;
    // The lawn before the round: 'idle' (title hops), 'countdown' (3-2-1 on
    // the landings), then 'play' from start() on.
    this.phase = 'idle';
    this.count = 3;
    this.countT = 0;
    this.hopN = 0;
    this.nextShowoff = 4 + Math.floor(Math.random() * 3);
    this.showoff = null;          // { t, dur } while a show-off hop flips
    this.showoffPending = false;
    this.level.generateUpTo(H + 900);
  }

  get heightM() { return Math.max(0, Math.floor(this.player.maxY / PX_PER_METER)); }

  start() {
    this.started = true;
    this.phase = 'play'; this.count = 0; this.countT = 0;
    this.showoff = null; this.showoffPending = false; this.player.flip = 0;
    this.player.maxY = this.player.y;    // the hops on the lawn were not a climb
    this.player.launch();
    this.audio.start();
  }

  // The title's idle hop; a no-op while he is already in the air.
  hop() { if (this.player.state === 'standing') this.player.launch(HOP_VY[this.count]); }

  // PLAY was pressed: "3" now, "2" and "1" on the next landings, then the launch.
  countdown() {
    if (this.phase !== 'idle') return;
    this.phase = 'countdown'; this.countT = 0;
    this.hop();
    this.audio.count(3);
  }

  // A toast that is already up is not said twice (two lanterns the magnet brings in at once).
  toast(text, color = '#fff2a8', life = 1.6) {
    const same = this.toasts.find((t) => t.text === text && t.life > 0.4);
    if (same) { same.life = Math.max(same.life, life * 0.75); return; }
    this.toasts.push({ text, color, life, maxLife: life });
  }

  // ------------------------------------------------------------------ update
  update(dt) {
    this.time += dt;
    this.countT += dt;
    // Ribbons ride on the braid, so a wilder braid is the 'moving platform' mechanic.
    this.bg.swayAmp = 12 + clamp(this.level.difficulty.index, 0, 4) * 14;
    this.bg.updateFireflies(dt, this.cam, this.time, this);
    this.bg.updateAtmosphere(dt, this.cam, this.time, this);
    for (const t of this.toasts) t.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);

    // (inside the tower it is the chain down the shaft that sways, with the chandeliers on it)
    const braidX = this.place.inside ? (y) => this.bg.interior.chainX(y, this.time) : (ly) => this.bg.braidX(ly, this.time);
    for (const p of this.platforms) p.update(dt, this.time, braidX, this.cam);

    const pl = this.player;
    pl.update(dt, this.started ? this.input : IDLE_INPUT);
    if (this.showoff) { this.showoff.t += dt; pl.flip = clamp(this.showoff.t / this.showoff.dur, 0, 1) * TAU; }
    if (pl.alive && !pl.frozen) this.collide();
    if (this.passage) this.updatePassage(dt);

    for (const e of this.enemies) e.update(dt, this);
    for (const f of this.fields) f.update(dt, this);
    for (const k of this.pickups) k.update(dt);
    this.magnet(dt);
    this.particles.update(dt);
    this.cam.follow(pl, dt);

    this.level.generateUpTo(this.cam.top + 900);
    this.cull();
    if (this.started) this.events();
    // cut braid pieces fall out of the view and are forgotten
    if (this.braidCut.pieces.length) {
      const camF = this.cam.layerY(PARALLAX_TOWER);
      for (const pc of this.braidCut.pieces) pc.t += dt;
      this.braidCut.pieces = this.braidCut.pieces.filter((pc) => pc.top - fallDist(pc.t) > camF - 200);
    }

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
    if (pl.vy <= 0 && pl.state !== 'bouncing' && !pl.heldBy) {
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
    if (!this.started) return;        // hopping on the lawn: nothing to collect, nothing that hurts

    // Enemies
    const r = pl.rect;
    for (const e of this.enemies) {
      if (!e.alive || e.dead || !overlaps(r, e.rect) || (e.hits && !e.hits(r))) continue;
      if (e.kind === 'lightning') { if (e.hurtful && !pl.shielded) pl.hit(e); continue; }
      if (e.kind === 'flock') { this.meetFlock(e); continue; }
      if (e.kind === 'web') { this.meetWeb(e); continue; }
      if (pl.shielded && e.hurtful) { this.boostPunch(e); continue; }
      if (e.stompable && pl.vy < 0 && pl.y > e.y - 10) { e.stomped(this); pl.stomp(e); }
      else if (e.hurtful && !pl.hidden) { pl.hit(e); if (e.onHit) e.onHit(this); }   // under the cloak he passes through
    }

    // Pickups
    for (const k of this.pickups) {
      if (!k.alive || !overlaps(r, k.rect)) continue;
      k.alive = false;
      this.collect(k);
    }
  }

  // The flock of starlings is a gate, not a bite: the boost shield (or the
  // star) bursts through it for the usual three suns, a prince coming down
  // on it bounces off a bird's back, and one who flies into it without a
  // boost is turned back down without losing a heart. Under the cloak he
  // slips through like through everything else.
  meetFlock(e) {
    const pl = this.player;
    if (pl.hidden) return;
    if (pl.shielded) {
      e.burst(this);
      e.x = pl.x;                     // where the sparks of the punch go
      this.suns += PUNCH_SUNS;
      this.onBoostPunch(pl, e);
      this.onFlockPass(pl, e);
    } else if (pl.vy < 0 && pl.y > e.y - 10) {
      e.stomped(this);
      pl.stomp(e);
    } else {
      e.turnedBack(this);
      pl.shoo(e.hitBottom, e.span);
      this.onFlockTurn(pl, e);
    }
  }
  onFlockPass(pl, e) { this.audio.flockWings(); if (e.bats) this.particles.sparkles(pl.x, pl.y + 120, 8, '#a595cc'); else this.particles.feathers(pl.x, pl.y + 120, false, 6); }
  onFlockTurn(pl, e) { this.audio.flockTurn(); if (e.bats) this.particles.sparkles(pl.x, pl.headY, 6, '#a595cc'); else this.particles.feathers(pl.x, pl.headY, false, 5); this.cam.shake(4, 0.18); }

  // --- Gates ------------------------------------------------------------------
  // He landed on a gate's landing: the door opens, the picture closes in on
  // him, the place is the other one, the picture opens again and he bounces
  // on, on the same landing at the same height. Nothing can touch him on
  // the way (he waits, `frozen`), and a gate leads through once.
  enterGate(gate) {
    gate.used = true;
    this.passage = { gate, t: 0, switched: false };
    this.player.frozen = true;
    this.audio.gate();
  }
  updatePassage(dt) {
    const ps = this.passage, pl = this.player;
    ps.t += dt;
    if (!ps.switched && ps.t >= GATE_OPEN + GATE_IRIS) { ps.switched = true; this.switchPlace(ps.gate); }
    if (ps.t >= GATE_OPEN + 2 * GATE_IRIS) {
      this.passage = null;
      pl.frozen = false;
      pl.invuln = Math.max(pl.invuln, 0.8);
      pl.launch();
    }
  }
  // How far the picture has closed in on him, 0 to 1.
  get iris() { const ps = this.passage; if (!ps) return 0; const u = (ps.t - GATE_OPEN) / GATE_IRIS; return clamp(u < 1 ? u : 2 - u, 0, 1); }
  // What a platform below a gate is on the other side (the place he is in
  // now): a branch is a ledge and a ledge a branch, a ribbon a chandelier
  // and a bow a bell (and back, where the braid still hangs), a gallery a
  // branch, a board a board. What has no like there is gone.
  twin(p) {
    const inside = this.place.inside, style = inside ? STONE_STYLE : treeStyleIndexAt(p.y);
    const onBraid = (kind) => { const ly = Platform.worldToLayer(p.y, PARALLAX_TOWER, this.cam.y); return ly > this.braidCut.ly ? new Platform(kind, p.y, { ly }) : null; };
    switch (p.kind) {
      case 'branchL': case 'branchR': p.style = style; return p;
      case 'swing': return p;
      case 'ribbon': return inside ? new Platform('chandelier', p.y) : null;
      case 'bow': return inside ? new Platform('bell', p.y) : null;
      case 'chandelier': return inside ? null : onBraid('ribbon');
      case 'bell': case 'tome': return inside ? null : onBraid('bow');
      case 'gallery': return inside ? null : new Platform(p.side === 'L' ? 'branchL' : 'branchR', p.y, { style });
      default: return null;
    }
  }
  // The other place, from the gate's height on. What was built above goes
  // (the level builds the new place's rows there), everything alive goes;
  // below, what he could stand on stays as its like on this side (`twin`),
  // so a prince who drops back off the landing still has something under him.
  switchPlace(gate) {
    const pl = this.player;
    this.placeName = this.place.other;
    this.place = placeOf(this.placeName);
    this.level.place = this.place;
    this.bg.setPlace(this.place);
    const top = gate.y + 60;
    this.platforms = this.platforms.map((p) => (p === gate || p.kind === 'ground' ? p : p.y > top || !p.landable ? null : this.twin(p))).filter(Boolean);
    this.enemies.length = 0;
    this.fields.length = 0;
    this.pickups = this.pickups.filter((k) => k.y <= top);
    this.particles.clear();
    this.level.restartFrom(gate.y, BEAT * 0.9);
    this.level.generateUpTo(this.cam.top + 900);
    this.nextWitchY = Math.max(this.nextWitchY, pl.maxY + 3000);
    this.floorName = zoneAt(pl.maxY, this.level.zones).name;      // the place is said, not the floor
    this.toast(this.place.arrive, '#fff2a8', 2);
    this.onGatePass(pl, gate);
  }
  onGatePass(pl, gate) {}                   // the simulator counts here
  onDark(pl, d) {}                          // and here

  // The spider's web holds whoever flies into it (enemies.js Web says how
  // he gets out); the boost shield or the star tear through it and knock
  // the spider out, for the usual three suns.
  meetWeb(e) {
    const pl = this.player;
    if (e.torn || pl.heldBy) return;
    if (pl.shielded) {
      e.tear(this, true);
      this.suns += PUNCH_SUNS;
      this.onBoostPunch(pl, e);
      return;
    }
    pl.catchIn(e);
    e.caught(this);
  }
  onWebCatch(pl, e) {
    this.audio.webCatch();
    this.particles.silk(pl.x, pl.y + 170, 5);
    if (this.webHints < 2) { this.webHints++; this.toast('Tap to tear free!', '#f6f3ff', 1.8); }
  }
  onWebTug(pl, e) { this.audio.webTug(e.tugs); this.particles.silk(pl.x, pl.y + 170, 6); this.cam.shake(2, 0.1); }
  onWebTear(pl, e, punched) { this.audio.webTear(); this.particles.silk(e.x, e.y, 14); }
  onWebBite(pl, e) {}

  // Boosting through an enemy knocks it away instead of hurting the prince.
  boostPunch(e) {
    if (e.kind === 'witch' || e.kind === 'scissors') { if (e.phase === 'warn' || e.deflected) return; e.deflect(this); }
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
    } else if (k.kind === 'power') {
      this.givePower(k.power, k.x, k.y);
    }
  }

  // A power-up starts (a pickup, or the dev helper). One at a time: the one
  // that ran is over without a word.
  givePower(kind, x = this.player.x, y = this.player.y + PLAYER_H * 0.5) {
    const P = POWERS[kind];
    this.player.givePower(kind);
    this.audio.power(kind);
    this.particles.powerBurst(x, y, P.color);
    if (kind === 'star') for (let i = 0; i < 12; i++) this.particles.rainbowSpark(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, RAINBOW[i * 2]);
    this.toast(P.toast, P.color, 1.6);
    this.onPowerStart(this.player, kind);
  }
  onPowerStart(pl, kind) {}                 // the simulator counts here
  onPowerWarn(pl, kind) { this.audio.powerWarn(); }
  onPowerEnd(pl, kind) { this.audio.powerEnd(); this.particles.powerBurst(pl.x, pl.y + PLAYER_H * 0.5, POWERS[kind].color, 10); }

  // The sun magnet: suns, lanterns and hearts within its reach fly to the
  // prince's middle and are collected there. Never another power-up (it
  // would end the magnet). What is on its way keeps coming when the magnet
  // runs out, so nothing stops in mid-air.
  magnet(dt) {
    const pl = this.player;
    if (!pl.alive || !this.started) return;
    const on = pl.power === 'magnet';
    const tx = pl.x, ty = pl.y + PLAYER_H * 0.5;
    for (const k of this.pickups) {
      if (!k.alive || k.kind === 'power') continue;
      const dx = tx - k.x, dy = ty - k.y, d = Math.hypot(dx, dy);
      if (!k.pulled) {
        if (!on || d > MAGNET_RADIUS) continue;
        k.pulled = true; k.pullV = MAGNET_SPEED[0];
      }
      k.pullV = Math.min(MAGNET_SPEED[1], k.pullV + MAGNET_ACCEL * dt);
      const step = Math.min(d, k.pullV * dt);
      if (d > 0.01) k.shift((dx / d) * step, (dy / d) * step);
      if (Math.random() < dt * 40) this.particles.pullSpark(k.x, k.y, k.kind === 'heart' ? C.heartHi : C.sun1);
    }
  }

  cull() {
    const floor = this.cam.y - 320;
    this.platforms = this.platforms.filter((p) => p.alive && (p.y > floor || p.kind === 'ground'));
    this.enemies = this.enemies.filter((e) => e.alive && (e.kind === 'witch' || e.y > floor - 200));
    this.pickups = this.pickups.filter((k) => k.alive && k.y > floor && k.y < this.cam.top + 2500);
    this.fields = this.fields.filter((f) => f.alive);
  }

  events() {
    const pl = this.player;
    if (!pl.alive) return;
    // The witch: telegraphed dives from a fixed altitude on, never during a
    // breather stretch, and with a long cooldown so she is an event.
    const witchAbout = this.enemies.some((e) => e.kind === 'witch' || e.kind === 'scissors');
    // The flock: the generator built its two floors; once the prince comes
    // within FLOCK_LEAD of the height the birds fly at and no witch is
    // about, they are announced and come. A plan he has already climbed
    // past (a long boost chain) is dropped. The witches keep away while a
    // flock is near.
    const fp = this.level.flockPlan;
    const flockNear = this.enemies.some((e) => e.kind === 'flock') || (!!fp && pl.maxY > fp.from - 1600);
    if (fp && !fp.fired) {
      if (pl.maxY > fp.y) this.level.flockDone();
      else if (pl.maxY >= fp.y - FLOCK_LEAD && !witchAbout) {
        fp.fired = true;
        const rf = this.level.rngFauna;
        const bats = this.place.inside;      // in the tower the gate is a swarm of bats
        this.enemies.push(new Flock(fp.y, rf.sign(), this.level.child(rf), fp.span, bats));
        if (bats) this.audio.swarmWarn(); else this.audio.flockWarn();
        this.toast(bats ? 'Bats! Boost through!' : 'A flock! Boost through!', '#ffd98a', 2.2);
      }
    }
    if (this.place.witch && pl.maxY > this.nextWitchY && !witchAbout && !flockNear && pl.seen && !this.level.pacingAt(pl.maxY).breather) {   // she does not set out for a prince she cannot see
      const side = this.rngEvents.sign();
      const dives = this.level.difficulty.index >= 3.5 ? 2 : 1;
      this.enemies.push(new Witch(pl, side, dives));
      this.audio.witchWarn();
      this.toast('The witch!', '#ff8a8a', 1.4);
      this.nextWitchY = pl.maxY + this.rngEvents.range(7500, 10500);
    }
    // The witch with scissors: the generator planned a cut stretch; once the
    // prince has reached its foot and no witch is about, she comes for the
    // braid above him, but only while he still has CUT_ROOM below the
    // stretch's top (so the cut lands above him however fast he climbs); a
    // plan that waited too long is dropped. Her side rolls on the tower
    // stream so the diving witch's own rolls stay untouched.
    const plan = this.level.cutPlan;
    if (plan && !plan.fired) {
      if (pl.maxY > plan.yc - CUT_ROOM) this.level.cutDone();
      else if (pl.maxY >= plan.from && !witchAbout && !flockNear) {
        plan.fired = true;
        this.enemies.push(new Scissors(this.level.rngTower.sign(), plan.from, plan.yc, pl));
        this.audio.witchWarn();
        this.toast('The witch has scissors!', '#ff8a8a', 1.6);
      }
    }
    // Storks: once the clouds are fully in, a stork crosses the screen a few
    // bounces above the prince, from one edge to the other.
    if (this.place.storks && pl.maxY > this.nextStorkY && cloudAmount(pl.maxY) >= 1) {
      this.spawnStork();
      this.nextStorkY = pl.maxY + this.rngEvents.range(1200, 2000);
    }
    // Teach the boost shield the first time an enemy comes into view.
    if (!this.hintShown && this.enemies.some((e) => e.alive && !e.dead && e.kind !== 'witch' && e.y < this.cam.top && e.y > this.cam.y)) {
      this.hintShown = true;
      this.toast('Boost to punch through enemies!', '#ffd98a', 2.6);
    }
    // Where the lights are out, it is said as he comes up to it.
    if (this.place.inside) {
      for (const d of this.level.darks) {
        if (d.said || pl.maxY < d.from - 800) continue;
        d.said = true;
        if (pl.maxY < d.to) { this.toast('The lights are out!', '#cfc8ff', 2.4); this.audio.lightsOut(); this.onDark(pl, d); }
      }
    }
    // Inside the tower a new floor says its name.
    if (this.place.inside) {
      const floor = zoneAt(pl.maxY, this.level.zones).name;
      if (floor !== this.floorName) { this.floorName = floor; this.toast(floor[0].toUpperCase() + floor.slice(1), '#e9e6f7', 2.2); }
    }
    // Height milestones
    if (this.heightM >= this.nextMilestone) {
      this.toast(`${this.nextMilestone} m`, '#fff2a8', 1.4);
      if (this.nextMilestone % 500 === 0) this.audio.milestone();
      this.nextMilestone += 100;
    }
  }

  // The witch cut the braid at layer height `ly`: the braid ends there now,
  // the piece below falls away with every ribbon and bow on it.
  cutBraid(ly, braidX, y) {
    const cut = this.braidCut;
    cut.pieces.push({ top: ly, bottom: cut.ly, t: 0 });
    cut.ly = ly;
    for (const p of this.platforms) if (p.def.onBraid && p.ly < ly) p.fallAway();
    this.audio.snip(); this.audio.braidFall();
    this.particles.hairStrands(braidX, y);
    this.cam.shake(8, 0.3);
    this.toast('The braid is cut!', '#ffd98a', 1.6);
    this.level.cutDone();
  }
  // The shield threw her off before the snip.
  onCutAborted() { this.toast('Saved the braid!', '#c8ff7a', 1.4); this.level.cutDone(); }

  // An updraft column under a lane, from just above a row to just below the next.
  spawnUpdraft(x, bottom, top) {
    const u = new Updraft(x, bottom, top);
    this.fields.push(u);
    return u;
  }
  onUpdraftEnter(pl, u) { this.audio.whoosh(); this.audio.spring(); this.particles.cloudPuff(pl.x, pl.y + 40, 60, 6); this.particles.petals(pl.x, pl.y + 60, 6); }

  // Storks depend on where the prince is, so like the witch they roll on the
  // events stream and leave the tower's geometry untouched.
  spawnStork() {
    const pl = this.player, r = this.rngEvents, side = r.sign();
    const stork = new Platform('stork', pl.y + r.range(380, 640), { x: -side * (W / 2 + 140), vx: side * r.range(150, 210), phase: r.range(0, 6.28) });
    this.platforms.push(stork);
    this.audio.wings();
    return stork;
  }

  // ---------------------------------------------------------------- callbacks
  onPlayerLand(pl, p) {
    if (p.kind === 'ground' && !this.started) return this.groundLanding(pl);
    if (p.kind === 'gate' && !p.used && this.started && !this.passage) this.enterGate(p);
    if (p.kind === 'bow') { this.audio.spring(); this.particles.petals(pl.x, pl.y, 10); this.particles.sparkles(pl.x, pl.y, 6, '#ffd1e3'); }
    else if (p.kind === 'bell') { this.audio.bell(); p.rungAt = this.time; this.particles.sparkles(pl.x, pl.y, 8, '#ffe9a0'); return; }
    else if (p.kind === 'tome') { this.audio.tome(); this.particles.pages(pl.x, pl.y + 10, 8); this.particles.sparkles(pl.x, pl.y, 8, '#d9c8ff'); return; }
    else if (p.kind === 'chandelier') {
      this.audio.bounce(pl.combo); this.audio.clink();
      // where the lights are out, a landing lights its candles: he brings the light back as he climbs
      if (p.unlit) { p.unlit = false; this.audio.candleLit(); this.particles.sparkles(pl.x, pl.y + 20, 14, INSIDE.candleLight); }
      else this.particles.sparkles(pl.x, pl.y + 8, 5, INSIDE.candleLight);
      return;
    }
    else if (p.kind === 'cloud') { this.audio.poof(p.dry); this.particles.cloudPuff(pl.x, pl.y, 70, p.dry ? 6 : 9); return; }
    else if (p.kind === 'skyLantern') { this.audio.paper(); this.particles.sparkles(pl.x, pl.y + 10, 7, '#ffd04a'); return; }
    else if (p.kind === 'stork') {
      // riding a stork is the timing reward: suns and a squawk
      this.audio.squawk(); this.particles.feathers(pl.x, pl.y, true);
      this.suns += 3; this.toast('+3', '#ffe9a0', 0.9);
      return;
    }
    else if (p.dry) { this.audio.weakBounce(); this.particles.crumble(pl.x, pl.y, 60, true, p.style === STONE_STYLE ? INSIDE.rubble : null); }
    else { this.audio.bounce(pl.combo); }
    if (p.style === STONE_STYLE) this.particles.landingDust(pl.x, pl.y, 0.9);      // a stone ledge: dust, no leaves
    else if (p.kind === 'branchL' || p.kind === 'branchR') this.particles.leaves(pl.x, pl.y, p.dry ? 2 : 5);
    else if (p.kind === 'ribbon') this.particles.petals(pl.x, pl.y, 4);
    else if (p.kind === 'swing') this.particles.landingDust(pl.x, pl.y, 0.6);
    else this.particles.landingDust(pl.x, pl.y, 1.4);
  }
  // The lawn before the round: small hops at rest, the countdown's beats, then
  // the launch. Player.land() set bounceVy from the ground; this has the last word.
  groundLanding(pl) {
    pl.flip = 0; this.showoff = null;
    if (this.phase === 'countdown' && this.countT >= COUNT_MIN_T) {
      this.count--; this.countT = 0;
      if (this.count === 0) {
        this.start();                 // GO: launch() set JUMP_VY, audio.start() is the jingle
        this.particles.landingDust(pl.x, pl.y, 1.4);
        this.particles.sparkles(pl.x, pl.y + 60, 14, '#ffd04a');
        return;
      }
      this.audio.count(this.count);
    }
    pl.bounceVy = HOP_VY[this.count];
    if (this.phase === 'idle') {
      this.audio.hop();
      if (++this.hopN >= this.nextShowoff) {
        this.hopN = 0; this.nextShowoff = 4 + Math.floor(Math.random() * 3);
        pl.bounceVy = SHOWOFF_VY; this.showoffPending = true;
      }
    } else this.audio.bounce(0);
    this.particles.landingDust(pl.x, pl.y, 0.8);
  }

  onPlayerJump(pl, p) {
    if (this.showoffPending) {
      // a show-off hop: a full flip over the flight, sparkles on the way up
      this.showoffPending = false;
      this.showoff = { t: 0, dur: (2 * SHOWOFF_VY) / GRAVITY };
      this.particles.sparkles(pl.x, pl.y + 40, 10, '#ffd04a');
    }
    if (p && p.dry && p.used) {
      if (p.kind === 'cloud') { this.audio.dissolve(); this.particles.cloudPuff(p.x, p.y, p.w, 16); }
      else { this.audio.crumble(); this.particles.crumble(p.x, p.y, p.w, true, p.style === STONE_STYLE ? INSIDE.rubble : null); }
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
  // The slope of the shaft's chain at height y, as a rotation for what hangs on it.
  chainLean(y) { const c = this.bg.interior; return (c.chainX(y + 30, this.time) - c.chainX(y - 30, this.time)) / 60; }

  drawPlatform(g, p) {
    const A = this.art.platforms;
    let s;
    const T = this.art.trees, I = this.art.interior;
    // a ledge inside the tower is a branch in stone: the same lengths and variants
    const stone = p.style === STONE_STYLE;
    switch (p.kind) {
      case 'branchL': { const dry = stone ? I.stone.dryL : T.branchLDry; s = p.dry ? (dry[p.len] || dry.normal) : (stone ? I.stone : T.styles[p.style]).branchL[p.len][p.variant]; break; }
      case 'branchR': { const dry = stone ? I.stone.dryR : T.branchRDry; s = p.dry ? (dry[p.len] || dry.normal) : (stone ? I.stone : T.styles[p.style]).branchR[p.len][p.variant]; break; }
      case 'chandelier': s = p.unlit ? I.chandelierOut : I.chandelier[Math.floor(this.time * 8 + p.id) % 2]; break;
      case 'bell': s = I.bell; break;
      case 'tome': s = I.tome[p.squash > 0.4 ? 1 : 0]; break;
      case 'gallery': s = I.gallery[p.side][p.variant % 2]; break;
      case 'gate': s = I.gate[this.place.inside ? 'out' : 'in'][this.passage && this.passage.gate === p ? 1 : 0]; break;   // it shows where it leads
      case 'step': if (!p.flight) return; s = I.stairs[p.side]; break;      // the flight is one piece, drawn for its lowest tread
      case 'ribbon': s = p.squash > 0.4 ? A.ribbonSquash : A.ribbon; break;
      case 'bow': s = p.squash > 0.4 ? A.bowSquash : A.bow; break;
      case 'swing': s = A.plank; break;
      case 'balcony': s = this.art.balconies[p.side][p.dry ? 4 : p.variant]; break;
      case 'cloud': s = this.art.clouds[p.cloud === 'storm' ? 'storm' : p.dry ? 'wispy' : 'thick'][p.size][p.variant]; break;
      case 'skyLantern': s = this.art.lanterns.big[p.variant]; break;
      case 'stork': s = (p.vx > 0 ? this.art.creatures.storkR : this.art.creatures.storkL)[Math.floor(this.time * 7 + p.phase) % 2]; break;
      default: return;
    }
    const cam = this.cam;
    const dip = p.kind === 'balcony' || p.kind === 'step' || p.kind === 'gate' ? 0 : p.kind === 'gallery' ? p.squash * 4 : p.squash * 10;   // stone does not give, a wooden landing hardly
    const opts = {};
    if (p.kind === 'stork') { opts.sy = 1 - p.squash * 0.15; opts.rot = (p.vx > 0 ? 1 : -1) * p.squash * 0.08; }
    else if (p.kind === 'skyLantern') {
      // the glow breathes around the bright dome above the flame; the paper
      // crumples on a landing
      const fl = 0.3 + 0.08 * Math.sin(this.time * 7 + p.phase) + 0.05 * Math.sin(this.time * 2.3 + p.phase);
      g.halo(cam.sx(p.x), cam.sy(p.y) + 108, 170, p.variant ? '#ff9ab8' : '#ffbe50', fl, { glow: 1 });
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
    } else if (p.state === 'breaking') { opts.rot = (p.kind === 'branchL' || p.side === 'L' ? -1 : 1) * p.t * 0.9; opts.alpha = clamp(1 - p.t / 0.6, 0, 1); }
    else if (p.wobble) opts.rot = p.wobble * 0.004;
    if (p.def.root != null) { opts.sx = p.lenScale; if (p.tint && !p.dry) opts.tint = p.tint; }
    if (p.kind === 'swing') {
      // ropes up into the canopy; inside the tower the board hangs on chains
      const sx = cam.sx(p.x), sy = cam.sy(p.y) + dip;
      const lean = (opts.rot || 0) * 60;
      for (const dx of [-94, 94]) {
        if (!this.place.inside) { g.line(sx + dx, sy + 4, sx + dx + lean, -40, C.rope, 4); continue; }
        g.line(sx + dx, sy + 4, sx + dx + lean, -40, INSIDE.chainDark, 6);
        g.line(sx + dx, sy + 4, sx + dx + lean, -40, INSIDE.chain, 2);
      }
    }
    if (p.kind === 'chandelier') {
      // its candles: a halo on the ring and a pool of light in the room
      const sx = cam.sx(p.x), sy = cam.sy(p.y) + dip;
      const fl = 0.88 + 0.12 * Math.sin(this.time * 9 + p.id) * Math.sin(this.time * 2.7 + p.id * 2);
      if (!p.unlit) {
        g.halo(sx, sy - 14, 96, INSIDE.candleLight, 0.42 * fl, { glow: 0.45 });
        this.bg.interior.glow(sx, sy - 10, 300, INSIDE.candleLight, 0.2 * fl);
        opts.glow = 0.25;
      }
      opts.rot = this.chainLean(p.y) * 0.5;              // it leans a little the way the chain hangs there
    }
    if (p.kind === 'tome') {
      // it hangs the way the chain hangs, and there is magic in it
      const sx = cam.sx(p.x), sy = cam.sy(p.y) + dip;
      g.halo(sx, sy + 20, 80, '#b9a0ff', 0.2 + 0.08 * Math.sin(this.time * 2.4 + p.id), { glow: 0.35 });
      this.bg.interior.glow(sx, sy + 10, 180, '#b9a0ff', 0.1);
      opts.rot = this.chainLean(p.y) * 0.5;
    }
    if (p.kind === 'bell') {
      // rung by a landing: it rocks under its headstock and comes to rest
      const dt = this.time - p.rungAt;
      opts.rot = this.chainLean(p.y) * 0.5 + (dt < 3 ? Math.sin(dt * 13) * 0.2 * Math.exp(-dt * 1.8) : 0);
    }
    g.blit(s, cam.sx(p.x), cam.sy(p.y) + dip, Object.keys(opts).length ? opts : undefined);
  }

  // Where the lights are out (level.js, the dark stretches): the picture is
  // multiplied down to nearly nothing and brought back around every light.
  // His own light goes with the prince; the room's lamps are the pools the
  // painter and the platforms already registered this frame (the lit
  // chandeliers, a ghost's candle, the spell book; the torches and windows
  // of a dark stretch are out and register none); what one picks up
  // glimmers; and every creature has a light of its own, so nothing that
  // bites comes out of the black.
  get darkness() { return this.place.inside ? this.level.darkAt(this.cam.y + H * 0.45) : 0; }
  drawDarkness(g) {
    const dk = this.darkness;
    if (dk <= 0.01) return;
    const cam = this.cam, pl = this.player;
    g.dark(dk * DARK_DEPTH, DARK_COLOR);
    g.lamp(cam.sx(pl.x), cam.sy(pl.y + 120), 560, '#ffe6c4', 0.4);
    g.lamp(cam.sx(pl.x), cam.sy(pl.y + 120), 340, '#fff0da', 0.9);
    for (const [x, y, r, color, a] of this.bg.interior.glows) g.lamp(x, y, r * 1.15, color, a * 4.5);
    for (const p of this.platforms) {
      if (p.y < cam.y - 200 || p.y > cam.top + 200) continue;
      if (p.kind === 'gate') g.lamp(cam.sx(p.x), cam.sy(p.y + 90), 230, '#ffe2b0', 0.8);
      else if (p.kind === 'gallery') g.lamp(cam.sx(p.x + (p.side === 'L' ? -70 : 70)), cam.sy(p.y + 70), 190, '#ffd596', 0.6);   // the light in its door
    }
    for (const k of this.pickups) {
      if (!k.alive || k.y < cam.y - 100 || k.y > cam.top + 100) continue;
      const r = k.kind === 'sun' ? 62 : k.kind === 'lantern' ? 170 : k.kind === 'power' ? 150 : 90;
      g.lamp(cam.sx(k.x), cam.sy(k.y), r, k.kind === 'sun' ? '#fff3a0' : k.kind === 'heart' ? '#ffb0c0' : '#ffd98a', k.kind === 'sun' ? 0.75 : 0.9);
    }
    for (const e of this.enemies) {
      if (!e.alive || e.dead || e.y < cam.y - 200 || e.y > cam.top + 200) continue;
      if (e.kind === 'bat') g.lamp(cam.sx(e.x), cam.sy(e.y), e.state === 'hang' ? 70 : 120, '#d9c8ff', e.state === 'hang' ? 0.45 : 0.8);        // its eyes
      else if (e.kind === 'ghost') g.lamp(cam.sx(e.x), cam.sy(e.y), 150, '#e9e6f7', 0.75 * e.vis);
      else if (e.kind === 'guard') g.lamp(cam.sx(e.x), cam.sy(e.y), 190, '#ffd596', 0.7);                                                    // he has a lantern by him
      else if (e.kind === 'grabber') { if (e.head > 0) g.lamp(cam.sx(e.win.x), cam.sy(e.armY), 170, '#ffd596', 0.8 * e.head); }              // light from behind him as he looks out
      else if (e.kind === 'web') { if (!e.torn) g.lamp(cam.sx(e.x), cam.sy(e.y), 130, '#f6f3ff', 0.4); g.lamp(cam.sx(e.spX), cam.sy(e.spY), 60, '#ffb0b0', 0.5); }   // dew on the threads, the spider's eyes
    }
  }

  // `g` is the renderer facade (gfx/renderer.js); everything is drawn in
  // screen coordinates, back to front, into the layer named by g.layer().
  draw(g) {
    const cam = this.cam;
    g.layer('bg');
    this.bg.drawBack(g, cam, this.time, this);
    g.layer('world');
    const order = { swing: 0, step: 0, gate: 1, balcony: 1, gallery: 1, ribbon: 1, bow: 1, chandelier: 1, bell: 1, tome: 1, branchL: 2, branchR: 2, cloud: 2, skyLantern: 2, stork: 3 };
    const visible = this.platforms.filter((p) => p.kind !== 'ground' && p.y > cam.y - (p.flight ? 360 : 120) && p.y < cam.top + (p.flight ? 220 : 120));   // a flight of stairs reaches well above and below its lowest tread
    visible.sort((a, b) => (order[a.kind] || 0) - (order[b.kind] || 0));
    for (const f of this.fields) f.draw(g, cam, this.time, this.art);
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
    this.drawDarkness(g);
    // going through a gate: the picture closes in on the prince and opens again
    const k = this.iris;
    if (k > 0) {
      const cx = clamp(cam.sx(this.player.x), 0, W), cy = clamp(cam.sy(this.player.y + PLAYER_H * 0.5), 0, H);
      const e = k * k * (3 - 2 * k), l = cx * e, r = W - (W - cx) * e, t = cy * e, b = H - (H - cy) * e;
      g.rect(0, 0, W, t, '#0b0a12'); g.rect(0, b, W, H - b, '#0b0a12'); g.rect(0, t, l, b - t, '#0b0a12'); g.rect(r, t, W - r, b - t, '#0b0a12');
    }
  }
}
