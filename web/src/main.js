import { W, H, STORAGE_KEY, FX } from './config.js';
import { buildAllArt } from './art/index.js';
import { Input } from './input.js';
import { audio, isIOS } from './audio.js';
import { World } from './world.js';
import { HUD } from './hud.js';
import { createRenderer, PRESETS } from './gfx/renderer.js';

// Rapunzel - browser port of the SpriteKit prototype.
// Logical resolution is fixed at 768 x 1364 (portrait phone); CSS scales the
// canvas to the viewport while keeping that aspect ratio. Rendering is WebGL
// through PixiJS (see src/gfx/), which makes the bloom and CRT passes possible.

export const FX_LABELS = { full: 'bloom + CRT', bloom: 'bloom only', off: 'off' };

class Game {
  constructor(canvas, gfx, art) {
    this.canvas = canvas;
    this.gfx = gfx;
    this.art = art;
    this.input = new Input(canvas);
    this.input.anyInteraction = () => audio.unlock();
    this.hud = new HUD(this);
    this.world = new World(this);
    this.mode = 'title';
    this.modeT = 0;
    this.best = 0;
    this.isNewBest = false;
    this.noticeText = '';
    this.noticeT = 0;
    this.iosSoundHintShown = false;
    this.fxPreset = 'full';
    this.loadSave();
    // ?fx=full|bloom|off forces a preset for this visit.
    const param = new URLSearchParams(location.search).get('fx');
    this.fxPreset = this.gfx.setPreset(PRESETS.includes(param) ? param : this.fxPreset);
    this.last = performance.now();
    this.dt = 0;
    this.acc = 0;
    this.STEP = 1 / 120;
    this.setupDpr();
    window.addEventListener('resize', () => this.setupDpr());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.mode === 'playing') this.setMode('paused'); });
    requestAnimationFrame((t) => this.frame(t));
  }

  get muted() { return audio.muted; }
  get fxLabel() { return FX_LABELS[this.fxPreset] || this.fxPreset; }

  notice(text, seconds = 3.5) { this.noticeText = text; this.noticeT = seconds; }

  // iOS mutes Web Audio with the ring/silent switch; tell the player once.
  maybeIosSoundHint() {
    if (!isIOS || audio.muted || this.iosSoundHintShown) return;
    this.iosSoundHintShown = true;
    this.notice('No sound? Flip the ring/silent switch on the side of the phone', 4.5);
  }

  loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      this.best = s.best || 0;
      if (PRESETS.includes(s.fx)) this.fxPreset = s.fx;
    } catch (_) { this.best = 0; }
  }
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ best: this.best, fx: this.fxPreset })); } catch (_) { /* ignore */ }
  }

  cycleFx() {
    this.fxPreset = this.gfx.nextPreset();
    this.save();
    audio.click();
    this.notice(`Effects: ${this.fxLabel}`, 1.6);
  }

  // The backing store matches the CSS size in device pixels, so nothing is
  // resampled by the compositor; all drawing stays in logical 768 x 1364.
  setupDpr() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = this.canvas.getBoundingClientRect();
    const cssW = rect.width || W;
    const scale = (cssW * dpr) / W;
    this.gfx.resize(scale);
  }

  setMode(m) {
    this.mode = m; this.modeT = 0;
    if (m === 'playing' && !this.world.started) { this.world.start(); this.maybeIosSoundHint(); }
  }

  frame(now) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;        // tab was hidden: don't fast-forward
    this.dt = dt;
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
    if (this.noticeT > 0) this.noticeT -= dt;
    if (input.consumeMute() || input.consumeButton('sound')) {
      audio.unlock();
      const muted = audio.toggleMute();
      audio.click();
      if (!muted) this.maybeIosSoundHint();
    }
    if (input.consumeFx() || input.consumeButton('fx')) this.cycleFx();

    switch (this.mode) {
      case 'title': {
        this.world.update(dt, true);
        const tapped = input.consumeTap();
        // Taps on the title buttons (tilt, effects, sound) must not start the game.
        const onButton = input.taps.some((t) => input.zoneAt(t.x, t.y));
        if (onButton) { input.consumeBoost(); break; }
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
    const g = this.gfx;
    g.begin();
    this.world.draw(g);
    switch (this.mode) {
      case 'title': this.hud.drawTitle(g, this.world, this.modeT); break;
      case 'playing': this.hud.drawPlaying(g, this.world); break;
      case 'paused': this.hud.drawPlaying(g, this.world); this.hud.drawPaused(g); break;
      case 'gameover': this.hud.drawPlaying(g, this.world); this.hud.drawGameOver(g, this.world, this.modeT, this.isNewBest); break;
    }
    if (this.noticeT > 0) this.hud.drawNotice(g, this.noticeText, this.noticeT);
    g.end(this.dt);
  }
}

function showFallback(message) {
  const stage = document.getElementById('stage');
  const box = document.createElement('div');
  box.id = 'nowebgl';
  box.textContent = message;
  stage.appendChild(box);
}

const boot = async () => {
  const canvas = document.getElementById('game');
  const art = buildAllArt();
  let gfx;
  try {
    gfx = await createRenderer(canvas, art, FX);
  } catch (err) {
    console.error('WebGL renderer failed to start', err);
    showFallback('Rapunzel needs WebGL for this preview, and the browser did not provide it.');
    return;
  }
  window.game = new Game(canvas, gfx, art);
};
if (document.fonts && document.fonts.load) {
  // Give the pixel font a moment to arrive; fall back to monospace if offline.
  Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]).then(boot, boot);
} else boot();
