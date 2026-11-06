import { W, H, SAFE, setViewport, STORAGE_KEY, LEGACY_STORAGE_KEY, FX, CAMERA_START_Y, INTRO_FROM, INTRO_T } from './config.js';
import { buildAllArt } from './art/index.js';
import { Input } from './input.js';
import { audio, isIOS } from './audio.js';
import { World } from './world.js';
import { HUD, SIGNS, signTravel } from './hud.js';
import { drawTitle, drawCount } from './title.js';
import { clamp, easeOutBack, easeInOutCubic, easeOutCubic } from './util.js';
import { createRenderer, PRESETS } from './gfx/renderer.js';
import { devParams, startAt, spawnNear, forceLen, devLabel } from './dev.js';
import { platform } from './platform.js';

// Sir Bouncealot - browser port of the SpriteKit prototype (which was called Rapunzel).
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
    // intro -> title -> countdown -> playing -> paused | gameover; MENU leads back.
    this.mode = 'title';
    this.intro = null;      // { from, dur, t, ease } while the camera rides down to the lawn
    this.modeT = 0;
    this.round = { mode: 'endless' };   // what startRound() plays; a tower with its seed later
    this.best = 0;
    this.isNewBest = false;
    this.noticeText = '';
    this.noticeT = 0;
    this.iosSoundHintShown = false;
    this.fxPreset = 'full';
    this.dev = devParams();
    if (this.dev.len) { forceLen(this.world, this.dev.len); this.world.reset(); }   // regenerate with the forced class
    this.loadSave();
    // ?fx=full|bloom|off forces a preset for this visit.
    const param = new URLSearchParams(location.search).get('fx');
    this.fxPreset = this.gfx.setPreset(PRESETS.includes(param) ? param : this.fxPreset);
    this.last = performance.now();
    this.dt = 0;
    this.STEP = 1 / 120;      // longest physics step: a frame is split into equal steps no longer than this
    this.MAX_STEPS = 8;       // slower than that the game runs in slow motion rather than spiralling
    this.frameErrors = 0;
    this.halted = false;
    this.setupDpr();
    window.addEventListener('resize', () => this.setupDpr());
    // a mobile browser's toolbars collapsing, or the safe-area insets arriving late
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.setupDpr());
    // Pause when the page goes away. The native shell also calls this when the
    // app resigns active (Control Centre, a call, the lock screen), which a
    // WKWebView does not report as visibilitychange.
    const hide = () => {
      if (this.mode === 'playing') this.setMode('paused');
      else if (this.mode === 'countdown') this.toTitle();
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    platform.onPause(hide);
    // the dev teleport goes straight to the title; everyone else rides down to the lawn first
    this.setMode(this.dev.at || this.dev.spawn ? 'title' : 'intro');
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
      const s = JSON.parse(platform.storage.get(STORAGE_KEY) || platform.storage.get(LEGACY_STORAGE_KEY) || '{}');
      this.best = s.best || 0;
      if (PRESETS.includes(s.fx)) this.fxPreset = s.fx;
    } catch (_) { this.best = 0; }
  }
  save() {
    try { platform.storage.set(STORAGE_KEY, JSON.stringify({ best: this.best, fx: this.fxPreset })); } catch (_) { /* ignore */ }
  }
  recordBest() {
    this.isNewBest = this.world.heightM > this.best;
    if (this.isNewBest) { this.best = this.world.heightM; this.save(); }
  }

  cycleFx() {
    this.fxPreset = this.gfx.nextPreset();
    this.save();
    audio.click();
    this.notice(`Effects: ${this.fxLabel}`, 1.6);
  }

  // The backing store matches the CSS size in device pixels, so nothing is
  // resampled by the compositor; all drawing stays in logical coordinates,
  // 768 wide and as tall as the screen's shape asks for.
  setupDpr() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = measureViewport(this.canvas);
    const cssW = rect.width || W;
    const scale = (cssW * dpr) / W;
    this.gfx.resize(scale);
  }

  setMode(m) {
    this.mode = m; this.modeT = 0;
    if (m === 'title' || m === 'intro') this.world.hop();
    if (m === 'intro') this.startIntro();
  }

  // The ride down: the camera is drawn INTRO_FROM px above the lawn and eases
  // down over INTRO_T s while the world already runs on the lawn (the lift is
  // applied in draw() only, so nothing is generated or culled for it; the
  // rows it passes are made once here). A tap shortens the rest to half a second.
  startIntro() {
    this.intro = { from: INTRO_FROM, dur: INTRO_T, t: 0, ease: easeInOutCubic };
    this.world.level.generateUpTo(CAMERA_START_Y + INTRO_FROM + H + 900);
  }
  introLift() { const i = this.intro; return i ? i.from * (1 - i.ease(clamp(i.t / i.dur, 0, 1))) : 0; }
  skipIntro() {
    const i = this.intro;
    if (!i || i.t > i.dur - 0.5) return;
    this.intro = { from: this.introLift(), dur: 0.5, t: 0, ease: easeOutCubic };
  }

  // The one way into a round. `config` names the mode (endless now; a tower
  // with its seed later, once there is a selection screen). The prince is on
  // the lawn, hopping; the countdown runs on his next landings.
  startRound(config = this.round) {
    this.round = config;
    if (this.world.started) this.world.reset(config.seed);
    if (this.dev.at) {
      // the dev teleport skips the countdown; it needs the fresh lawn state first
      startAt(this.world, this.dev.at, this.dev.spawn);
      this.world.start();
      this.beginPlaying();
      return;
    }
    audio.click();
    this.world.countdown();
    this.setMode('countdown');
  }

  // The round is live: world.start() has run (the GO landing or the dev path).
  beginPlaying() {
    if (this.dev.spawn) spawnNear(this.world, this.dev.spawn);
    this.maybeIosSoundHint();
    this.setMode('playing');
  }

  toTitle() {
    if (this.mode === 'paused') this.recordBest();
    this.world.reset();
    this.setMode('title');
  }

  frame(now) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;        // tab was hidden: don't fast-forward
    if (dt < 0) dt = 0;
    this.dt = dt;
    // A thrown error must not end the loop: the frame is abandoned, the next
    // one runs, and only a persistent error stops the game with a message
    // instead of a frozen picture.
    try {
      this.input.poll(dt);
      this.update(dt);
      this.draw();
      this.frameErrors = 0;
    } catch (err) {
      this.onFrameError(err);
    } finally {
      this.input.endFrame();
    }
    if (!this.halted) requestAnimationFrame((t) => this.frame(t));
  }

  onFrameError(err) {
    console.error('frame failed', err);
    this.frameErrors++;
    if (this.frameErrors < 3) { this.notice('Something went wrong, carrying on', 2); return; }
    this.halted = true;
    showFallback(`Sir Bouncealot hit an error and stopped: ${err && err.message ? err.message : err}. Reload the page to play again.`);
  }

  // Semi-fixed step: the frame's time is split into equal steps no longer
  // than STEP, so the simulation advances exactly once per display refresh
  // at any rate (no skipped or doubled frames at 90 or 144 Hz, no tap lost in
  // a frame without a step) while every step stays short enough for stable
  // collisions at high speeds. The lawn phases use it too, so a countdown
  // landing is as exact as a bounce in the round.
  stepWorld(dt) {
    if (dt <= 0) return;
    let n = Math.ceil(dt / this.STEP);
    if (n > this.MAX_STEPS) { n = this.MAX_STEPS; dt = n * this.STEP; }
    const h = dt / n;
    for (let i = 0; i < n; i++) this.world.update(h);
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
    const tapOutsideButtons = () => input.consumeTap() && !input.taps.some((t) => input.zoneAt(t.x, t.y));

    switch (this.mode) {
      case 'intro': {
        this.stepWorld(dt);
        const tap = input.consumeTap(), boost = input.consumeBoost(), pause = input.consumePause();
        if (tap || boost || pause) this.skipIntro();
        this.intro.t += dt;
        if (this.intro.t >= this.intro.dur) { this.intro = null; this.setMode('title'); }
        break;
      }
      case 'title': {
        this.stepWorld(dt);
        input.consumeBoost();            // clicks, space and tilt-taps queue boosts; none belongs to the title
        input.consumePause();
        const play = input.consumeButton('play');
        if (this.modeT > 0.3 && (play || tapOutsideButtons())) this.startRound();
        break;
      }
      case 'countdown': {
        this.stepWorld(dt);
        input.consumeTap(); input.consumeBoost();   // taps during the count never reach the round's first step
        if (input.consumePause()) { this.toTitle(); break; }
        if (this.world.started) this.beginPlaying();
        break;
      }
      case 'playing': {
        if (input.consumePause() || input.consumeButton('pause')) { this.setMode('paused'); audio.click(); break; }
        this.stepWorld(dt);
        if (this.world.over) { this.recordBest(); this.setMode('gameover'); this.hud.beginSummary(this.world, this.isNewBest); }
        break;
      }
      case 'paused': {
        if (input.consumeButton('menu')) { this.toTitle(); audio.click(); break; }
        if (input.consumePause() || input.consumeButton('pause') || tapOutsideButtons()) { input.consumeBoost(); this.setMode('playing'); audio.click(); }
        break;
      }
      case 'gameover': {
        input.consumeBoost();
        this.hud.updateSummary(this.modeT);
        if (input.consumeButton('menu')) { this.toTitle(); audio.click(); break; }
        const again = input.consumeButton('again') || tapOutsideButtons();
        if (!this.hud.summaryDone(this.modeT)) {
          // a tap while the summary counts finishes it; the next one starts the round
          if (again && this.modeT > 0.8) this.modeT = this.hud.skipSummary();
        } else if (again) this.startRound(this.round);
        break;
      }
    }
  }

  draw() {
    const g = this.gfx, cam = this.world.cam;
    g.begin();
    const camY = cam.y;
    if (this.mode === 'intro') cam.y = camY + this.introLift();   // the ride is a drawing offset only
    this.world.draw(g);
    cam.y = camY;
    switch (this.mode) {
      case 'title': {
        // the sign is lowered in on its ropes and settles with a small dip;
        // once it hangs the scene behind it dims slowly
        const k = clamp(this.modeT / 0.7, 0, 1);
        drawTitle(g, this, this.world.time, { dy: -signTravel(SIGNS.title) * (1 - easeOutBack(k, 0.8)), dim: clamp((this.modeT - 0.6) / 1.4, 0, 1) });
        break;
      }
      case 'countdown': {
        // and pulled up out of the way as the count runs, the dim lifting with it
        const k = clamp(this.modeT / 0.55, 0, 1);
        drawTitle(g, this, this.world.time, { dy: -signTravel(SIGNS.title) * k * k, dim: 1 - clamp(this.modeT / 0.45, 0, 1) });
        drawCount(g, this.world);
        break;
      }
      case 'playing': this.hud.drawPlaying(g, this.world); drawCount(g, this.world); break;
      case 'paused': this.hud.drawPlaying(g, this.world); this.hud.drawPaused(g); break;
      case 'gameover': this.hud.drawPlaying(g, this.world); this.hud.drawGameOver(g, this.world, this.modeT, this.isNewBest); break;
    }
    if (this.noticeT > 0) this.hud.drawNotice(g, this.noticeText, this.noticeT);
    if (this.dev.dev) { g.layer('overlay'); g.text(devLabel(this.world), W / 2, H - 24 - SAFE.bottom, 12, '#8fd1c7', 'center'); }
    g.end(this.dt);
  }
}

// The canvas is sized by style.css (the whole screen on a phone, a 9:16 box
// on a wide window); the logical height follows its shape, and the safe-area
// insets come in through the custom properties the stylesheet sets from env().
function measureViewport(canvas) {
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || W, cssH = rect.height || cssW * 1364 / W;
  const perCss = W / cssW;
  const native = platform.safeArea;
  const cs = native ? null : getComputedStyle(document.documentElement);
  const inset = (name) => ((native ? native[name] : parseFloat(cs.getPropertyValue('--safe-' + name))) || 0) * perCss;
  setViewport(W * cssH / cssW, { top: inset('top'), bottom: inset('bottom'), left: inset('left'), right: inset('right') });
  return rect;
}

function showFallback(message) {
  if (document.getElementById('nowebgl')) return;
  const stage = document.getElementById('stage');
  const box = document.createElement('div');
  box.id = 'nowebgl';
  box.textContent = message;
  stage.appendChild(box);
}

const boot = async () => {
  const canvas = document.getElementById('game');
  try {
    measureViewport(canvas);     // H must be known before the renderer and the world exist
    const art = buildAllArt();
    let gfx;
    try {
      gfx = await createRenderer(canvas, art, FX);
    } catch (err) {
      console.error('WebGL renderer failed to start', err);
      showFallback('Sir Bouncealot needs WebGL for this preview, and the browser did not provide it.');
      return;
    }
    window.game = new Game(canvas, gfx, art);
  } catch (err) {
    console.error('Sir Bouncealot failed to start', err);
    showFallback(`Sir Bouncealot could not start: ${err && err.message ? err.message : err}`);
  }
};
// Errors outside the frame loop (event handlers, async work) are logged and,
// while the game is not up yet, shown instead of leaving a blank page.
const running = () => !!(window.game && window.game.gfx);
window.addEventListener('error', (e) => { if (!running()) showFallback(`Sir Bouncealot could not start: ${e.message}`); });
window.addEventListener('unhandledrejection', (e) => { const r = e.reason; console.error('unhandled rejection', r); if (!running()) showFallback(`Sir Bouncealot could not start: ${r && r.message ? r.message : r}`); });
if (document.fonts && document.fonts.load) {
  // Give the pixel font a moment to arrive; fall back to monospace if offline.
  Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]).then(boot, boot);
} else boot();
