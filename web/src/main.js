import { W, H, STORAGE_KEY } from './config.js';
import { buildAllArt } from './art/index.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import { World } from './world.js';
import { HUD } from './hud.js';

// Rapunzel - browser port of the SpriteKit prototype.
// Logical resolution is fixed at 768 x 1364 (portrait phone); CSS scales the
// canvas to the viewport while keeping that aspect ratio.

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.art = buildAllArt();
    this.input = new Input(canvas);
    this.input.anyInteraction = () => audio.unlock();
    this.hud = new HUD(this);
    this.world = new World(this);
    this.mode = 'title';
    this.modeT = 0;
    this.best = 0;
    this.isNewBest = false;
    this.loadSave();
    this.last = performance.now();
    this.acc = 0;
    this.STEP = 1 / 120;
    this.setupDpr();
    window.addEventListener('resize', () => this.setupDpr());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'playing') this.setMode('paused'); });
    requestAnimationFrame((t) => this.frame(t));
  }

  get muted() { return audio.muted; }

  loadSave() {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); this.best = s.best || 0; } catch (_) { this.best = 0; }
  }
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ best: this.best })); } catch (_) { /* ignore */ }
  }

  // The backing store matches the CSS size in device pixels, so nothing is
  // resampled by the compositor; all drawing stays in logical 768 x 1364.
  setupDpr() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.canvas.getBoundingClientRect();
    const cssW = rect.width || W;
    const scale = (cssW * dpr) / W;
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round(H * scale);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  setMode(m) {
    this.mode = m; this.modeT = 0;
    if (m === 'playing' && !this.world.started) this.world.start();
  }

  frame(now) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;        // tab was hidden: don't fast-forward
    this.input.poll(dt);
    this.update(dt);
    this.draw();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    this.modeT += dt;
    const input = this.input;
    this.hud.layout(this.mode);
    if (input.consumeMute() || input.consumeButton('sound')) { audio.unlock(); audio.toggleMute(); audio.click(); }

    switch (this.mode) {
      case 'title': {
        this.world.update(dt, true);
        const tapped = input.consumeTap();
        const onTiltButton = input.taps.some((t) => { const z = input.zoneAt(t.x, t.y); return z && z.id === 'tilt'; });
        if (onTiltButton) { input.consumeBoost(); break; }
        if (this.modeT > 0.3 && tapped) { input.consumeBoost(); this.setMode('playing'); }
        break;
      }
      case 'playing': {
        if (input.consumePause() || input.consumeButton('pause')) { this.setMode('paused'); audio.click(); break; }
        // Fixed-step simulation for stable collisions at high speeds.
        this.acc += dt;
        let steps = 0;
        while (this.acc >= this.STEP && steps < 8) { this.world.update(this.STEP); this.acc -= this.STEP; steps++; }
        if (steps === 8) this.acc = 0;
        if (this.world.over) {
          this.isNewBest = this.world.heightM > this.best;
          if (this.isNewBest) { this.best = this.world.heightM; this.save(); }
          this.setMode('gameover');
        }
        break;
      }
      case 'paused': {
        if (input.consumePause() || input.consumeButton('pause') || input.consumeTap()) { input.consumeBoost(); this.setMode('playing'); audio.click(); }
        break;
      }
      case 'gameover': {
        if (this.modeT > 0.8 && input.consumeTap()) {
          input.consumeBoost();
          this.world.reset();
          this.setMode('playing');
        }
        break;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    this.world.draw(ctx);
    switch (this.mode) {
      case 'title': this.hud.drawTitle(ctx, this.world, this.modeT); break;
      case 'playing': this.hud.drawPlaying(ctx, this.world); break;
      case 'paused': this.hud.drawPlaying(ctx, this.world); this.hud.drawPaused(ctx); break;
      case 'gameover': this.hud.drawPlaying(ctx, this.world); this.hud.drawGameOver(ctx, this.world, this.modeT, this.isNewBest); break;
    }
  }
}

const boot = () => { window.game = new Game(document.getElementById('game')); };
if (document.fonts && document.fonts.load) {
  // Give the pixel font a moment to arrive; fall back to monospace if offline.
  Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]).then(boot, boot);
} else boot();
