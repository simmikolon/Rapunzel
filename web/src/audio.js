// Tiny WebAudio synthesizer. No audio files: every effect is generated.
// The context is created lazily on the first user gesture (browser policy).
import { STORAGE_KEY } from './config.js';

// A 0.1 s silent WAV, built at runtime (no asset file). Playing it through an
// <audio> element on a user gesture switches iOS's audio session from
// "ambient" (silenced by the ring/silent switch) to "playback", which is the
// only way Web Audio output gets past that switch.
function silentWavUrl() {
  const rate = 8000, samples = 800;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);

class Synth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noiseBuf = null;
    this.silentEl = null;
    this.sessionPrimed = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      // iOS suspends ("interrupts") the context in the background; the next
      // gesture will resume it and re-prime the media session.
      this.sessionPrimed = false;
      if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    });
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + '.audio') || '{}');
      this.muted = !!saved.muted;
    } catch (_) { /* ignore */ }
  }

  // Must be called from inside a user-gesture handler (touchend / click /
  // keyup count on iOS; touchstart alone does not). Safe to call repeatedly.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      // 1 second of white noise, reused by every noisy effect.
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    // 'suspended' before the first gesture, 'interrupted' after backgrounding on iOS.
    if (this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
      // The classic iOS unlock: start an empty buffer inside the gesture.
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.ctx.createBuffer(1, 1, 22050);
        src.connect(this.ctx.destination);
        src.start(0);
      } catch (_) { /* ignore */ }
    }
    this.primeSession();
  }

  primeSession() {
    if (this.sessionPrimed) return;
    try {
      if (!this.silentEl) {
        this.silentEl = document.createElement('audio');
        this.silentEl.src = silentWavUrl();
        this.silentEl.setAttribute('playsinline', '');
        this.silentEl.preload = 'auto';
      }
      const p = this.silentEl.play();
      if (p && p.then) p.then(() => { this.sessionPrimed = true; }).catch(() => {});
    } catch (_) { /* ignore */ }
  }

  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
    try { localStorage.setItem(STORAGE_KEY + '.audio', JSON.stringify({ muted: m })); } catch (_) { /* ignore */ }
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  get ready() { return !!this.ctx && !this.muted; }

  // Helpers -------------------------------------------------------------
  tone({ type = 'sine', freq = 440, to = null, dur = 0.2, vol = 0.3, attack = 0.005, slide = 'exp', delay = 0 }) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to != null) {
      if (slide === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
      else o.frequency.linearRampToValueAtTime(to, t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.2, filter = 'lowpass', freq = 1000, to = null, q = 1, delay = 0 }) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t0);
    if (to != null) f.frequency.exponentialRampToValueAtTime(Math.max(10, to), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t0);
    s.stop(t0 + dur + 0.05);
  }

  // Effects --------------------------------------------------------------
  bounce(combo = 0) {
    const base = 300 + Math.min(combo, 12) * 18;
    this.tone({ type: 'triangle', freq: base, to: base * 2.2, dur: 0.16, vol: 0.22 });
    this.tone({ type: 'sine', freq: base * 0.5, to: base * 0.8, dur: 0.12, vol: 0.18 });
  }
  weakBounce() {
    this.tone({ type: 'triangle', freq: 240, to: 380, dur: 0.14, vol: 0.18 });
    this.noise({ dur: 0.25, vol: 0.12, filter: 'bandpass', freq: 1800, to: 600, q: 0.7 });
  }
  spring() {
    this.tone({ type: 'square', freq: 320, to: 1100, dur: 0.28, vol: 0.12 });
    this.tone({ type: 'sine', freq: 500, to: 1600, dur: 0.3, vol: 0.2 });
  }
  boost() {
    this.noise({ dur: 0.35, vol: 0.25, filter: 'bandpass', freq: 600, to: 4000, q: 1.2 });
    this.tone({ type: 'sine', freq: 420, to: 1300, dur: 0.3, vol: 0.14 });
  }
  boostEmpty() {
    this.tone({ type: 'square', freq: 200, to: 150, dur: 0.1, vol: 0.06 });
  }
  crumble() {
    this.noise({ dur: 0.35, vol: 0.3, filter: 'lowpass', freq: 2500, to: 300, q: 0.5 });
    this.tone({ type: 'square', freq: 140, to: 60, dur: 0.2, vol: 0.08 });
  }
  poof(soft = false) {
    // a cloud landing: a soft airy thump, rounder than the branch bounce
    this.noise({ dur: soft ? 0.22 : 0.18, vol: soft ? 0.16 : 0.2, filter: 'lowpass', freq: 1400, to: 300, q: 0.6 });
    this.tone({ type: 'sine', freq: soft ? 220 : 280, to: soft ? 300 : 420, dur: 0.14, vol: soft ? 0.1 : 0.14 });
  }
  dissolve() {
    // a wispy cloud coming apart
    this.noise({ dur: 0.45, vol: 0.2, filter: 'bandpass', freq: 2200, to: 700, q: 0.8 });
  }
  paper() {
    // landing on a paper lantern: a soft thump with a crackle
    this.noise({ dur: 0.16, vol: 0.18, filter: 'lowpass', freq: 900, to: 250, q: 0.7 });
    this.noise({ dur: 0.08, vol: 0.07, filter: 'highpass', freq: 3000, delay: 0.02 });
    this.tone({ type: 'sine', freq: 190, to: 280, dur: 0.12, vol: 0.1 });
  }
  wings() {
    // a stork beating its wings as it comes in
    for (let i = 0; i < 3; i++) this.noise({ dur: 0.14, vol: 0.1, filter: 'bandpass', freq: 500, to: 250, q: 1.2, delay: i * 0.22 });
  }
  squawk() {
    this.tone({ type: 'sawtooth', freq: 760, to: 420, dur: 0.12, vol: 0.1 });
    this.tone({ type: 'sawtooth', freq: 680, to: 380, dur: 0.14, vol: 0.09, delay: 0.14 });
  }
  thunderWarn() {
    // a low rumble while the storm cloud charges
    this.noise({ dur: 0.9, vol: 0.22, filter: 'lowpass', freq: 160, to: 70, q: 0.8 });
    this.tone({ type: 'sine', freq: 55, to: 40, dur: 0.8, vol: 0.12 });
  }
  thunderCrack() {
    this.noise({ dur: 0.08, vol: 0.32, filter: 'highpass', freq: 1800 });
    this.noise({ dur: 0.5, vol: 0.3, filter: 'lowpass', freq: 900, to: 120, q: 0.6, delay: 0.03 });
    this.tone({ type: 'sine', freq: 110, to: 38, dur: 0.45, vol: 0.2, delay: 0.03 });
  }
  bonk() {
    this.tone({ type: 'sine', freq: 140, to: 50, dur: 0.22, vol: 0.4 });
    this.noise({ dur: 0.08, vol: 0.2, filter: 'lowpass', freq: 900 });
  }
  stomp() {
    this.tone({ type: 'square', freq: 260, to: 90, dur: 0.14, vol: 0.14 });
    this.noise({ dur: 0.12, vol: 0.15, filter: 'bandpass', freq: 500, q: 2 });
  }
  hurt() {
    this.tone({ type: 'sawtooth', freq: 400, to: 90, dur: 0.35, vol: 0.18 });
    this.noise({ dur: 0.25, vol: 0.2, filter: 'highpass', freq: 800 });
  }
  pickup() {
    this.tone({ type: 'sine', freq: 880, dur: 0.1, vol: 0.18 });
    this.tone({ type: 'sine', freq: 1320, dur: 0.18, vol: 0.18, delay: 0.07 });
  }
  lantern() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.35, vol: 0.14, delay: i * 0.06 }));
  }
  heart() {
    [659, 784, 988, 1319].forEach((f, i) => this.tone({ type: 'sine', freq: f, dur: 0.3, vol: 0.16, delay: i * 0.08 }));
  }
  witchWarn() {
    // "heh-heh-heh" cackle: short descending FM-ish blips.
    for (let i = 0; i < 5; i++) {
      this.tone({ type: 'sawtooth', freq: 620 - i * 60, to: 380 - i * 40, dur: 0.11, vol: 0.09, delay: i * 0.13 });
      this.tone({ type: 'square', freq: 1240 - i * 120, to: 760 - i * 80, dur: 0.09, vol: 0.04, delay: i * 0.13 });
    }
  }
  witchSwoosh() {
    this.noise({ dur: 0.7, vol: 0.28, filter: 'bandpass', freq: 300, to: 2500, q: 0.8 });
  }
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.45, vol: 0.2, delay: i * 0.22 }));
  }
  start() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone({ type: 'triangle', freq: f, dur: 0.25, vol: 0.16, delay: i * 0.08 }));
  }
  click() { this.tone({ type: 'square', freq: 700, dur: 0.05, vol: 0.06 }); }
  chirp() {
    // squirrel alarm: two quick rising chirps
    this.tone({ type: 'square', freq: 1500, to: 2300, dur: 0.06, vol: 0.05 });
    this.tone({ type: 'square', freq: 1600, to: 2600, dur: 0.07, vol: 0.05, delay: 0.09 });
  }
  milestone() {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone({ type: 'sine', freq: f, dur: 0.3, vol: 0.14, delay: i * 0.06 }));
  }
}

export const audio = new Synth();
