// Tiny WebAudio synthesizer. No audio files: every effect is generated.
// The context is created lazily on the first user gesture (browser policy).
import { STORAGE_KEY } from './config.js';

class Synth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noiseBuf = null;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + '.audio') || '{}');
      this.muted = !!saved.muted;
    } catch (_) { /* ignore */ }
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
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
  milestone() {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone({ type: 'sine', freq: f, dur: 0.3, vol: 0.14, delay: i * 0.06 }));
  }
}

export const audio = new Synth();
