import { W, H, TILT_DEAD_ZONE, TILT_FULL, SWIPE } from './config.js';
import { clamp, approach } from './util.js';
import { platform } from './platform.js';

// Unified input: keyboard (arrows / A D, space / up / W / enter, M mute, F effects), pointer
// (mouse + touch) and device tilt. The game reads `axis` (-1..1), the
// edge-triggered `boost` / `tap` flags and the list of pointer taps in
// logical canvas coordinates (for HUD buttons).
// A touch steers in one of three ways (`steer`, the player's setting):
// 'tap' holds a side of the screen, 'swipe' slides a finger from where it
// was set down, 'tilt' leans the phone (and any touch is a boost).

// How far the screen's right edge is dipped below its left, in degrees
// (-90..90), from a DeviceOrientation event's angles and the screen's turn.
// It is the gravity along the screen's width, sin(gamma) cos(beta) in
// portrait, taken as an angle: the same lean steers the same however the
// phone is pitched, upright, lying flat or tipped past upright towards the
// player. (gamma itself is the lean only while the phone lies flat: held
// upright it runs away at the smallest turn, and past upright it changes
// its sign.) The shell sends the same angle from CoreMotion (TiltSource.swift).
export function leanDegrees(beta, gamma, angle = 0) {
  const b = (beta * Math.PI) / 180, g = (gamma * Math.PI) / 180;
  const gx = Math.sin(g) * Math.cos(b), gy = -Math.sin(b);      // gravity along the device's width and its length
  const a = ((angle % 360) + 360) % 360;
  const across = a === 90 ? -gy : a === 270 ? gy : a === 180 ? -gx : gx;
  return (Math.asin(clamp(across, -1, 1)) * 180) / Math.PI;
}

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.axis = 0;
    this.keyAxis = 0;
    this.touchAxis = 0;
    this.tilt = 0;              // smoothed, -1..1
    this.tiltRaw = 0;
    this.tiltEnabled = false;
    this.tiltFull = TILT_FULL;  // degrees of lean for full speed (the setting "tilt")
    this.wantTilt = false;      // the player's setting is 'tilt': it is asked for at the next click (a browser grants it only from a gesture)
    this.tiltBusy = false;
    this.onTilt = null;         // (ok) => the answer to that
    this.steer = 'tap';         // 'tap' | 'swipe' | 'tilt'
    this.slideAxis = 0;
    // In the native shell tilt comes from CoreMotion through platform.js: no
    // permission prompt (the WKWebView would show one for DeviceOrientation).
    this.tiltSupported = platform.isNative ? platform.tilt.available : typeof DeviceOrientationEvent !== 'undefined';
    this.tiltNeedsPermission = !platform.isNative && this.tiltSupported && typeof DeviceOrientationEvent.requestPermission === 'function';
    this.isTouch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
    this.pointers = new Map();  // pointerId -> {x, y, role}
    this.taps = [];             // {x, y} logical coords, consumed each frame
    this.boostQueued = 0;
    this.tapQueued = 0;
    this.pauseQueued = 0;
    this.muteQueued = 0;
    this.fxQueued = 0;
    this.placeQueued = null;    // 'stages' | 'outside' | 'inside': T, O / I or left / right on the title
    this.anyInteraction = null; // callback for unlocking audio
    // Regions where a touch acts as a button rather than steering. Set by HUD.
    this.buttonZones = [];      // {id, x, y, w, h}
    this.buttonHits = [];       // ids hit this frame

    this.bind();
  }

  toLogical(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
  }

  bind() {
    const c = this.canvas;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) { e.preventDefault(); return; }
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') {
        this.boostQueued++; this.tapQueued++;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') this.pauseQueued++;
      if (e.code === 'KeyM') this.muteQueued++;
      if (e.code === 'KeyF') this.fxQueued++;
      if (e.code === 'KeyT') this.placeQueued = 'stages';
      if (e.code === 'KeyO' || e.code === 'ArrowLeft') this.placeQueued = 'outside';
      if (e.code === 'KeyI' || e.code === 'ArrowRight') this.placeQueued = 'inside';
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.anyInteraction && this.anyInteraction();
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); this.anyInteraction && this.anyInteraction(); });
    window.addEventListener('blur', () => { this.keys.clear(); this.pointers.clear(); });

    const down = (e) => {
      e.preventDefault();
      if (e.pointerType === 'touch') this.isTouch = true;
      const p = this.toLogical(e.clientX, e.clientY);
      const zone = this.zoneAt(p.x, p.y);
      let role = 'steer';
      if (zone) { role = 'button'; this.buttonHits.push(zone.id); }
      else if (e.pointerType === 'mouse' || this.tiltEnabled) { role = 'boost'; }
      else if (this.steer === 'swipe') {
        // the finger that slides, or, while one does, a second finger: a boost
        let sliding = false;
        for (const q of this.pointers.values()) if (q.role === 'slide') sliding = true;
        role = sliding ? 'boost' : 'slide';
      }
      this.pointers.set(e.pointerId, { x: p.x, y: p.y, role, x0: p.x, sx: p.x, sy: p.y, far: 0, t0: performance.now() });
      this.taps.push(p);
      this.tapQueued++;
      if (role === 'boost') this.boostQueued++;
      if (zone && zone.id === 'boost') this.boostQueued++;
      try { c.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      this.anyInteraction && this.anyInteraction();
    };
    const move = (e) => {
      const pt = this.pointers.get(e.pointerId);
      if (!pt) return;
      const p = this.toLogical(e.clientX, e.clientY);
      pt.x = p.x; pt.y = p.y;
      if (pt.role !== 'slide') return;
      pt.far = Math.max(pt.far, Math.abs(p.x - pt.sx), Math.abs(p.y - pt.sy));
      // past full speed the middle comes along with the finger
      if (pt.x - pt.x0 > SWIPE.full) pt.x0 = pt.x - SWIPE.full;
      else if (pt.x0 - pt.x > SWIPE.full) pt.x0 = pt.x + SWIPE.full;
    };
    // Audio may only be unlocked from a "real" activation: on iOS that is the
    // end of a touch or a click, not its start, so fire the hook here too.
    const up = (e) => {
      const pt = this.pointers.get(e.pointerId);
      // a sliding finger that only tapped: a boost
      if (pt && pt.role === 'slide' && e.type === 'pointerup' && performance.now() - pt.t0 < SWIPE.tapTime * 1000 && pt.far < SWIPE.tapMove) this.boostQueued++;
      this.pointers.delete(e.pointerId);
      this.anyInteraction && this.anyInteraction();
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('touchend', () => { this.anyInteraction && this.anyInteraction(); }, { passive: true });
    // Tilt is asked for on 'click', because iOS only grants the
    // DeviceOrientation permission from inside a user-gesture handler: the
    // click that chose it in the settings, or on a later visit the first click.
    c.addEventListener('click', () => {
      this.anyInteraction && this.anyInteraction();
      if (!this.wantTilt || this.tiltEnabled || this.tiltBusy) return;
      this.tiltBusy = true;
      this.requestTilt().then((ok) => { this.tiltBusy = false; if (this.onTilt) this.onTilt(ok); });
    });

    window.addEventListener('deviceorientation', (e) => this.onOrientation(e));
    platform.tilt.onSample((g) => this.onNativeTilt(g));
  }

  zoneAt(x, y) {
    for (const z of this.buttonZones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  }

  onOrientation(e) {
    if (!this.tiltEnabled) return;
    if (e.gamma == null || e.beta == null) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    this.setTiltDegrees(leanDegrees(e.beta, e.gamma, angle));
  }

  // The shell's CoreMotion samples: the same lean in degrees, portrait only.
  onNativeTilt(leanDeg) {
    if (!this.tiltEnabled || typeof leanDeg !== 'number') return;
    this.setTiltDegrees(leanDeg);
  }

  setTiltDegrees(v) {
    const dead = TILT_DEAD_ZONE;
    const mag = Math.max(0, Math.abs(v) - dead);
    this.tiltRaw = clamp(Math.sign(v) * (mag / (this.tiltFull - dead)), -1, 1);
  }

  // iOS 13+ needs a permission prompt triggered by a user gesture.
  async requestTilt() {
    if (!this.tiltSupported) return false;
    try {
      if (platform.isNative) { platform.tilt.start(); this.tiltEnabled = true; return true; }
      if (this.tiltNeedsPermission) {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return false;
      }
      this.tiltEnabled = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  disableTilt() {
    this.tiltEnabled = false; this.tilt = 0; this.tiltRaw = 0;
    if (platform.isNative) platform.tilt.stop();
  }

  // Called once per frame by the game loop before update.
  poll(dt) {
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    this.keyAxis = (right ? 1 : 0) - (left ? 1 : 0);

    // Touch steering: a held finger on the left/right half of the screen, or
    // a finger sliding away from where it was set down.
    let ta = 0, sliding = false;
    this.slideAxis = 0;
    for (const pt of this.pointers.values()) {
      if (pt.role === 'steer') ta += pt.x < W / 2 ? -1 : 1;
      else if (pt.role === 'slide') {
        sliding = true;
        const d = pt.x - pt.x0, m = Math.max(0, Math.abs(d) - SWIPE.dead);
        this.slideAxis = clamp((Math.sign(d) * m) / (SWIPE.full - SWIPE.dead), -1, 1);
      }
    }
    this.touchAxis = clamp(ta, -1, 1);

    this.tilt = this.tiltEnabled ? approach(this.tilt, this.tiltRaw, 18, dt) : 0;

    if (this.keyAxis !== 0) this.axis = this.keyAxis;
    else if (this.touchAxis !== 0) this.axis = this.touchAxis;
    else if (sliding) this.axis = this.slideAxis;
    else this.axis = this.tilt;
    // (steering by degrees, with the lean or the sliding finger: the player's top speed is the higher one then)
    this.usingTilt = (this.tiltEnabled || sliding) && this.keyAxis === 0 && this.touchAxis === 0;
  }

  consumeBoost() { const v = this.boostQueued > 0; this.boostQueued = 0; return v; }
  consumeTap() { const v = this.tapQueued > 0; this.tapQueued = 0; return v; }
  consumePause() { const v = this.pauseQueued > 0; this.pauseQueued = 0; return v; }
  consumeMute() { const v = this.muteQueued > 0; this.muteQueued = 0; return v; }
  consumeFx() { const v = this.fxQueued > 0; this.fxQueued = 0; return v; }
  consumePlace() { const v = this.placeQueued; this.placeQueued = null; return v; }
  consumeButton(id) {
    const i = this.buttonHits.indexOf(id);
    if (i < 0) return false;
    this.buttonHits.splice(i, 1);
    return true;
  }
  // Per-frame flags are cleared here. The boost queue is not: it is consumed
  // by the physics step that fires it, so a tap that arrives in a frame which
  // runs no step (high refresh rates) still counts in the next one.
  endFrame() { this.taps.length = 0; this.buttonHits.length = 0; this.tapQueued = 0; this.pauseQueued = 0; this.muteQueued = 0; this.fxQueued = 0; this.placeQueued = null; }
}
