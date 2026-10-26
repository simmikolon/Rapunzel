import { W, H, TILT_DEAD_ZONE, TILT_FULL } from './config.js';
import { clamp, approach } from './util.js';

// Unified input: keyboard (arrows / A D, space / up / W / enter, M mute, F effects), pointer
// (mouse + touch) and device tilt. The game reads `axis` (-1..1), the
// edge-triggered `boost` / `tap` flags and the list of pointer taps in
// logical canvas coordinates (for HUD buttons).
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
    this.tiltSupported = typeof DeviceOrientationEvent !== 'undefined';
    this.tiltNeedsPermission = this.tiltSupported && typeof DeviceOrientationEvent.requestPermission === 'function';
    this.isTouch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
    this.pointers = new Map();  // pointerId -> {x, y, role}
    this.taps = [];             // {x, y} logical coords, consumed each frame
    this.boostQueued = 0;
    this.tapQueued = 0;
    this.pauseQueued = 0;
    this.muteQueued = 0;
    this.fxQueued = 0;
    this.anyInteraction = null; // callback for unlocking audio
    // Regions where a touch acts as a button rather than steering. Set by HUD.
    this.buttonZones = [];      // {id, x, y, w, h}
    this.buttonHits = [];       // ids hit this frame
    this.tiltMessage = '';
    this.tiltMessageT = 0;

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
      if (zone) { role = 'button'; if (zone.id !== 'tilt') this.buttonHits.push(zone.id); }
      else if (e.pointerType === 'mouse' || this.tiltEnabled) { role = 'boost'; }
      this.pointers.set(e.pointerId, { x: p.x, y: p.y, role });
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
    };
    // Audio may only be unlocked from a "real" activation: on iOS that is the
    // end of a touch or a click, not its start, so fire the hook here too.
    const up = (e) => { this.pointers.delete(e.pointerId); this.anyInteraction && this.anyInteraction(); };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('touchend', () => { this.anyInteraction && this.anyInteraction(); }, { passive: true });
    // The tilt toggle is handled on 'click' because iOS only grants the
    // DeviceOrientation permission from inside a user-gesture handler.
    c.addEventListener('click', (e) => {
      this.anyInteraction && this.anyInteraction();
      const p = this.toLogical(e.clientX, e.clientY);
      const zone = this.zoneAt(p.x, p.y);
      if (!zone || zone.id !== 'tilt') return;
      if (this.tiltEnabled) this.disableTilt();
      else this.requestTilt().then((ok) => { this.tiltMessage = ok ? 'Tilt on: tap anywhere to boost' : 'Tilt not available'; this.tiltMessageT = 2.5; });
    });

    window.addEventListener('deviceorientation', (e) => this.onOrientation(e));
  }

  zoneAt(x, y) {
    for (const z of this.buttonZones) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  }

  onOrientation(e) {
    if (!this.tiltEnabled) return;
    let g = e.gamma; // left/right tilt in portrait, degrees
    let b = e.beta;
    if (g == null) return;
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    let v;
    if (angle === 90) v = b;
    else if (angle === -90 || angle === 270) v = -b;
    else if (angle === 180) v = -g;
    else v = g;
    // Phones held nearly flat report wild gamma values when beta flips sign;
    // the magnitude check keeps that from flinging the player.
    if (Math.abs(v) > 80) v = Math.sign(v) * 80;
    const dead = TILT_DEAD_ZONE;
    const mag = Math.max(0, Math.abs(v) - dead);
    this.tiltRaw = clamp(Math.sign(v) * (mag / (TILT_FULL - dead)), -1, 1);
  }

  // iOS 13+ needs a permission prompt triggered by a user gesture.
  async requestTilt() {
    if (!this.tiltSupported) return false;
    try {
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

  disableTilt() { this.tiltEnabled = false; this.tilt = 0; this.tiltRaw = 0; }

  // Called once per frame by the game loop before update.
  poll(dt) {
    if (this.tiltMessageT > 0) this.tiltMessageT -= dt;
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    this.keyAxis = (right ? 1 : 0) - (left ? 1 : 0);

    // Touch steering: a held finger on the left/right half of the screen.
    let ta = 0;
    for (const pt of this.pointers.values()) {
      if (pt.role !== 'steer') continue;
      ta += pt.x < W / 2 ? -1 : 1;
    }
    this.touchAxis = clamp(ta, -1, 1);

    this.tilt = this.tiltEnabled ? approach(this.tilt, this.tiltRaw, 18, dt) : 0;

    if (this.keyAxis !== 0) this.axis = this.keyAxis;
    else if (this.touchAxis !== 0) this.axis = this.touchAxis;
    else this.axis = this.tilt;
    this.usingTilt = this.tiltEnabled && this.keyAxis === 0 && this.touchAxis === 0;
  }

  consumeBoost() { const v = this.boostQueued > 0; this.boostQueued = 0; return v; }
  consumeTap() { const v = this.tapQueued > 0; this.tapQueued = 0; return v; }
  consumePause() { const v = this.pauseQueued > 0; this.pauseQueued = 0; return v; }
  consumeMute() { const v = this.muteQueued > 0; this.muteQueued = 0; return v; }
  consumeFx() { const v = this.fxQueued > 0; this.fxQueued = 0; return v; }
  consumeButton(id) {
    const i = this.buttonHits.indexOf(id);
    if (i < 0) return false;
    this.buttonHits.splice(i, 1);
    return true;
  }
  endFrame() { this.taps.length = 0; this.buttonHits.length = 0; this.boostQueued = 0; this.tapQueued = 0; this.pauseQueued = 0; this.muteQueued = 0; this.fxQueued = 0; }
}
