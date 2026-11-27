import { W, H } from './config.js';
import { clamp, lerp, mixHex, RNG, TAU } from './util.js';
import { nightAlpha, hash } from './altitude.js';

// The weather outside the tower: rain, a storm, snow, and the golden hour.
// Each is a look of the whole picture (the sky pulled toward its colours, a
// light over everything) and something in the air, in three depths that go
// by at different speeds when the camera climbs: far (behind the tower, seen
// in the gaps beside it), mid (in front of the wall, behind the trees and
// the prince) and near (in front of everything: few and thin, so that
// nothing hides a hazard).
//
//   rain    slanting streaks, a grey veil, a cooler, darker light
//   storm   harder rain, gusts that come as white curls, lean the rain over
//           and carry the prince along, the colours taken half out of the
//           picture, and lightning that turns it black and white for an
//           instant
//   snow    flakes swaying down, big ones close by, and snow lying on what
//           one stands on and on the lawn
//   golden  a low sun, its rays across the picture, dust shining in them
//
// Which weather it is where is the world's to say (world.js weatherKind: a
// stage's own, or in the endless tower the fronts below); a change fades
// out and in. What falls is not kept as particles: a drop's place is worked
// out from the clock and the camera each frame, from tables made once.
// All of it is for the eye and the ear but one thing: a storm's gust leans
// on the prince (`push`, read by world.js windPush where the world has
// gusts: the game's has, the simulator's bots are not blown about yet).
export const WEATHER = {
  clear: {},
  rain: { rain: 1, breeze: 0.22, sky: ['#2e3f4a', '#5b6e76'], skyMix: 0.6, light: ['#93a9bb', 0.2], haze: ['#6f8794', 0.1] },
  storm: { rain: 1.5, breeze: 0.4, gusts: true, lightning: true, grey: 0.5, sky: ['#18212b', '#3b4954'], skyMix: 0.8, light: ['#7389a3', 0.32], haze: ['#4f6272', 0.13] },
  snow: { snow: 1, breeze: 0.12, caps: true, sky: ['#56677f', '#b4c2d2'], skyMix: 0.55, light: ['#d9e6ff', 0.12], haze: ['#c5d2e2', 0.07] },
  golden: { sun: true, sky: ['#5d6db0', '#ffbf6b'], skyMix: 0.75, light: ['#ffc481', 0.3] },
};
const FADE = 2.2;            // seconds a weather takes to go, and the next to come

// What falls, far to near: how many, how fast the layer goes by (the tower's
// is 0.9, the prince's plane 1), and how it looks.
const RAIN = [
  { n: 90, f: 0.7, len: 18, w: 2, v: [700, 900], a: 0.34 },
  { n: 96, f: 0.95, len: 30, w: 3, v: [1000, 1250], a: 0.52 },
  { n: 30, f: 1.25, len: 46, w: 4, v: [1400, 1700], a: 0.6 },
];
const SNOW = [
  { n: 200, f: 0.7, size: 4, v: [34, 60], sway: 10, a: 0.55 },
  { n: 160, f: 0.95, size: 4, big: 0.3, v: [60, 100], sway: 18, a: 0.9 },     // some of the middle ones are two art pixels square
  { n: 42, f: 1.3, size: 12, scale: 2, v: [110, 160], sway: 30, a: 0.95 },    // the near ones are the flake sprite, doubled
];
const MOTES = { n: 56, v: [10, 26], a: 0.9 };
const CURLS = { n: 8, v: [520, 760] };
const RAIN_COLOR = '#c9dcf2', SNOW_COLOR = '#f4f8ff', SNOW_SHADE = '#cddbee', GOLD = '#ffe9a8';
// The lawn under snow: its body, the hollows in it, and the grass that still shows.
const LAWN = { body: '#e7eef9', far: '#d6e2f2', hollow: '#bccde3', grass: '#3f8a3a', grassDark: '#2c6a33' };
const SUN = { x: 0.8, y: 0.3 };
// A storm's gusts: so long calm, a moment in which the curls already show, then the blow.
// `push`: how fast the blow carries the prince sideways at its height, px/s (his own steering is 560).
export const GUSTS = { calm: [3.5, 6.5], warn: 0.9, blow: [1.8, 2.8], push: 230 };

// A storm comes over a stage now and then (the tower in stages): from the third stage on, an outside stage is a
// stormy one with this chance, by the round's seed, whatever its own weather would be; never two outside stages
// running. (The crumbling tower always has its storm.)
export const STORMS = { from: 2, chance: 0.3 };
const stormRoll = (seed, n) => n >= STORMS.from && (hash(seed + n * 977) % 1000) / 1000 < STORMS.chance;
export const stormStage = (seed, n) => stormRoll(seed, n) && !stormRoll(seed, n - 2);

// Around Christmas the lawn is snowed in, and the title with it: from the first of December to Epiphany.
// (?season=winter|summer says which it is for a visit.)
export const WINTER = { from: [12, 1], to: [1, 6] };
export function isWinter(d = new Date()) {
  const m = d.getMonth() + 1, day = d.getDate();
  return (m === WINTER.from[0] && day >= WINTER.from[1]) || (m === WINTER.to[0] && day <= WINTER.to[1]);
}
const SPAN_PAD = 120;
const mod = (v, m) => ((v % m) + m) % m;

// In the endless tower the weather comes in fronts: bands of the height,
// each with its own weather or none, by the round's seed and by what the
// height is like (rain in the forest, storms above the trees, the golden
// hour toward sunset, snow at night). The first band is always clear, or in
// winter snowed in.
const FRONT = 9000;
export function frontAt(seed, y, winter) {
  const k = Math.floor(y / FRONT);
  if (k < 1) return winter ? 'snow' : 'clear';
  const r = hash(seed + k * 101) % 100, mid = (k + 0.5) * FRONT;
  const storm = k >= 2 ? 1 : 0;      // (no storm in the first 180 m)
  if (mid < 42000) return r < 18 ? 'rain' : r < 18 + 14 * storm ? 'storm' : r < 42 ? 'golden' : 'clear';
  if (mid < 56000) return r < 12 ? 'rain' : r < 34 ? 'storm' : r < 48 ? 'golden' : 'clear';
  if (mid < 70000) return r < 55 ? 'golden' : r < 67 ? 'storm' : 'clear';
  return r < 40 ? 'snow' : r < 56 ? 'storm' : 'clear';
}

export class Weather {
  constructor(art) {
    this.art = art;
    this.kind = 'clear';      // what it is now
    this.target = 'clear';    // what it is to be
    this.amount = 0;          // how much of it is there, 0..1
    this.slant = 0;           // how far the rain leans: px sideways per px down
    this.flash = 0;           // sheet lightning, 1 fading to 0
    this.flashIn = 6;
    this.rng = new RNG();
    this.gust = { phase: 'calm', t: 0, dur: 5, dir: 1 };
    const r = new RNG(4711);
    const table = (n, more = 1) => { const m = Math.ceil(n * more); return { x: Float32Array.from({ length: m }, () => r.next()), y: Float32Array.from({ length: m }, () => r.next()), u: Float32Array.from({ length: m }, () => r.next()), ph: Float32Array.from({ length: m }, () => r.range(0, TAU)) }; };
    this.rainT = RAIN.map((L) => table(L.n, 1.5));
    this.snowT = SNOW.map((L) => table(L.n));
    this.motesT = table(MOTES.n);
    this.curlsT = table(CURLS.n);
  }

  get def() { return WEATHER[this.kind] || WEATHER.clear; }

  // A new round: the gusts' times come from the round's seed.
  reset(rng) {
    this.rng = rng || new RNG();
    this.gust = { phase: 'calm', t: 0, dur: this.rng.range(GUSTS.calm[0], GUSTS.calm[1]), dir: this.rng.sign() };
    this.flash = 0;
  }

  // The weather that is to be here. `snap`: at once (a stage begins behind a shut picture).
  want(kind, snap) {
    if (!WEATHER[kind]) kind = 'clear';
    this.target = kind;
    if (snap) { this.kind = kind; this.amount = kind === 'clear' ? 0 : 1; }
  }

  // How hard the gust blows now, 0..1 (the warning already shows a little of it), and which way.
  get blow() { const g = this.gust; return g.phase === 'blow' ? Math.sin((Math.PI * g.t) / g.dur) ** 2 : 0; }
  get warn() { const g = this.gust; return g.phase === 'warn' ? g.t / g.dur : g.phase === 'blow' ? 1 : 0; }
  // What the gust leans on the prince with, px/s sideways.
  get push() { return this.def.gusts ? this.blow * this.gust.dir * GUSTS.push * this.amount : 0; }

  // `sound`: the world's audio (the opening story's world has a silent one).
  update(dt, time, sound) {
    // one weather goes, the next comes
    if (this.kind !== this.target) {
      this.amount = Math.max(0, this.amount - dt / FADE);
      if (this.amount <= 0) this.kind = this.target;
    } else if (this.kind !== 'clear') this.amount = Math.min(1, this.amount + dt / FADE);
    const def = this.def;
    // gusts: calm, the warning, the blow
    const g = this.gust;
    g.t += dt;
    if (!def.gusts) { g.phase = 'calm'; g.t = 0; }
    else if (g.t >= g.dur) {
      const r = this.rng;
      if (g.phase === 'calm') { g.phase = 'warn'; g.dur = GUSTS.warn; g.dir = r.sign(); }
      else if (g.phase === 'warn') { g.phase = 'blow'; g.dur = r.range(GUSTS.blow[0], GUSTS.blow[1]); }
      else { g.phase = 'calm'; g.dur = r.range(GUSTS.calm[0], GUSTS.calm[1]); }
      g.t = 0;
    }
    // the rain leans with the breeze and far over in a gust
    const lean = (def.breeze || 0) * (0.5 + 0.2 * Math.sin(time * 0.37)) * (def.gusts ? g.dir : 1) + this.blow * g.dir * 0.75;
    this.slant += (lean - this.slant) * Math.min(1, dt * 3);
    // sheet lightning, now and then, a double flicker
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt / 0.45);
    if (def.lightning && this.amount > 0.6) {
      this.flashIn -= dt;
      if (this.flashIn <= 0) { this.flash = 1; this.flashIn = 5 + Math.random() * 9; if (sound && sound.thunder) sound.thunder(); }
    }
    // what is heard of it: the rain's hiss, the wind's rush
    if (sound && sound.weather) sound.weather((def.rain ? Math.min(1, def.rain / 1.5) : 0) * this.amount, ((def.breeze || 0) * 0.45 + this.blow * 0.9 + (g.phase === 'warn' ? 0.3 * g.t / g.dur : 0)) * this.amount);
  }

  // The sky's colours under this weather. At night it stays a night.
  sky(sky, y) {
    const def = this.def;
    if (!def.sky || this.amount <= 0) return sky;
    const k = def.skyMix * this.amount * (1 - 0.55 * nightAlpha(y));
    return { top: mixHex(sky.top, def.sky[0], k), bot: mixHex(sky.bot, def.sky[1], k) };
  }

  // --- what falls -----------------------------------------------------------
  rain(g, i, cam, time, k) {
    const L = RAIN[i], T = this.rainT[i], span = H + SPAN_PAD * 2, wide = W + 320;
    const n = Math.min(T.x.length, Math.round(L.n * k)), scroll = cam.layerY(L.f), slope = this.slant;
    const a = L.a * Math.min(1, this.amount * 1.4);
    for (let j = 0; j < n; j++) {
      const y = mod(T.y[j] * span + time * lerp(L.v[0], L.v[1], T.u[j]) + scroll, span) - SPAN_PAD;
      const x = mod(T.x[j] * wide + slope * y, wide) - 160;
      g.line(x - slope * L.len, y - L.len, x, y, RAIN_COLOR, L.w, a);
    }
  }
  snow(g, i, cam, time, k) {
    const L = SNOW[i], T = this.snowT[i], span = H + SPAN_PAD * 2, wide = W + 320;
    const n = Math.round(L.n * k), scroll = cam.layerY(L.f), slope = this.slant * 0.9;
    const flake = this.art.weather.flake;
    for (let j = 0; j < n; j++) {
      const y = mod(T.y[j] * span + time * lerp(L.v[0], L.v[1], T.u[j]) + scroll, span) - SPAN_PAD;
      const x = mod(T.x[j] * wide + slope * y + Math.sin(time * (0.6 + T.u[j]) + T.ph[j]) * L.sway, wide) - 160;
      if (L.size > 4) g.blit(flake, Math.round(x), Math.round(y), { alpha: L.a * this.amount, sx: L.scale, sy: L.scale });
      else { const s = L.big && T.ph[j] < TAU * L.big ? 8 : L.size; g.rect(Math.round(x), Math.round(y), s, s, SNOW_COLOR, L.a * this.amount * (0.7 + 0.3 * T.u[j])); }
    }
  }
  // A gust: white curls that cross the picture with it, and thin lines of the same wind beside them.
  curls(g, time, near) {
    const s = this.warn * (0.35 + 0.65 * this.blow) * this.amount;
    if (s <= 0.01) return;
    const T = this.curlsT, dir = this.gust.dir, wide = W + 520, sprites = this.art.weather.curls;
    for (let j = near ? 0 : 1; j < CURLS.n; j += 2) {
      const v = lerp(CURLS.v[0], CURLS.v[1], T.u[j]);
      const run = mod(T.x[j] * wide + time * v, wide);                 // how far along its way it is
      const x = dir > 0 ? run - 260 : W + 260 - run;
      const y = (0.1 + 0.8 * T.y[j]) * H + Math.sin(time * 2.2 + T.ph[j]) * 14;
      const a = s * Math.sin((Math.PI * run) / wide) * (near ? 0.85 : 0.6), sc = near ? 2 : 1;
      g.blit(sprites[j % sprites.length], x, y, { flip: dir < 0, alpha: a, sx: sc, sy: sc });
      g.rect(x - dir * 170 * sc - 70 * sc, y + 20 * sc, 140 * sc, 4 * sc, '#ffffff', a * 0.55);
      g.rect(x - dir * 60 * sc - 45 * sc, y - 22 * sc, 90 * sc, 4 * sc, '#ffffff', a * 0.4);
    }
  }
  // The golden hour's dust: specks that rise slowly through the rays and glint.
  motes(g, cam, time) {
    const T = this.motesT, span = H + 200, scroll = cam.layerY(1.1), k = this.amount;
    for (let j = 0; j < MOTES.n; j++) {
      const y = mod(T.y[j] * span - time * lerp(MOTES.v[0], MOTES.v[1], T.u[j]) + scroll, span) - 100;
      const x = T.x[j] * (W + 80) - 40 + Math.sin(time * 0.5 + T.ph[j]) * 26;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * (0.8 + T.u[j]) + T.ph[j])), s = T.u[j] > 0.8 ? 8 : 4;
      g.rect(Math.round(x), Math.round(y), s, s, GOLD, MOTES.a * tw * k, { glow: 0.7 * tw * k });
    }
  }

  // --- the layers, far to near (background.js draws them in their places) ----
  // Behind the tower: the sun, the veil, what falls far away.
  drawFar(g, cam, time) {
    const def = this.def, k = this.amount;
    if (k <= 0) return;
    if (def.sun) {
      const x = W * SUN.x, y = H * SUN.y;
      g.halo(x, y, 460, '#ffcf80', 0.24 * k);
      g.halo(x, y, 190, '#ffe2a8', 0.5 * k, { glow: 0.4 * k });
      g.halo(x, y, 78, '#fff6d8', 0.95 * k, { glow: 0.8 * k });
    }
    if (def.haze) g.rect(0, 0, W, H, def.haze[0], def.haze[1] * k);
    if (def.rain) this.rain(g, 0, cam, time, def.rain);
    if (def.snow) this.snow(g, 0, cam, time, def.snow);
  }
  // In front of the wall, behind the trees and the prince.
  drawMid(g, cam, time) {
    const def = this.def, k = this.amount;
    if (k <= 0) return;
    if (def.sun) {
      // the sun's rays, fanned out from it across the picture, breathing
      const x = W * SUN.x, y = H * SUN.y;
      for (let i = 0; i < 5; i++) {
        const rot = 2.05 + i * 0.26 + Math.sin(time * 0.11 + i) * 0.03, len = 2400;
        const a = (0.05 + 0.035 * Math.sin(time * 0.23 + i * 1.7)) * k;
        g.beam(x + Math.cos(rot) * len / 2, y + Math.sin(rot) * len / 2, len, 110 + i * 26, rot, '#ffd89a', a, { glow: a * 0.6 });
      }
    }
    if (def.rain) this.rain(g, 1, cam, time, def.rain);
    if (def.snow) this.snow(g, 1, cam, time, def.snow);
    if (def.gusts) this.curls(g, time, false);
  }
  // The lawn under snow: white from its edge down to the picture's foot, humps along the edge, hollows in it, and
  // here and there a tuft of grass that still shows.
  drawGround(g, cam) {
    const k = this.amount;
    if (!this.def.caps || k <= 0 || cam.y > 400) return;
    const y = Math.round(cam.sy(0));
    if (y > H + 20) return;
    g.rect(0, y + 4, W, H - y, LAWN.body, k);
    g.rect(0, y + 72, W, H - y, LAWN.far, k);
    g.rect(0, y - 8, W, 12, SNOW_COLOR, k);
    for (let x = 0; x < W; x += 32) { const h = hash(x) % 3; if (h) g.rect(x + (hash(x + 5) % 12), y - 8 - h * 4, 12 + (hash(x + 9) % 3) * 8, h * 4, SNOW_COLOR, k); }
    for (let i = 0; i < 46; i++) {
      const hx = hash(i * 13 + 1), hy = hash(i * 29 + 7), yy = y + 20 + (hy % 60) * 4;
      if (yy < H) g.rect((hx % 190) * 4, yy, 16 + (hx % 3) * 8, 4, LAWN.hollow, k * (0.45 + 0.1 * (hy % 4)));
    }
    for (let i = 0; i < 9; i++) {
      const x = (hash(i * 71 + 5) % 186) * 4, yy = y + 12 + (hash(i * 31 + 2) % 9) * 4;
      g.rect(x, yy - 8, 4, 8, LAWN.grass, k); g.rect(x + 8, yy - 12, 4, 12, LAWN.grass, k); g.rect(x + 4, yy - 4, 4, 4, LAWN.grassDark, k);
    }
  }
  // On what one stands on (world.js hands over the platforms in the picture): rain splashing, snow lying.
  drawCaps(g, cam, platforms, time) {
    const k = this.amount, def = this.def;
    if (k <= 0) return;
    if (def.rain) {
      // two drops at a time on each, at a new spot nine times a second: two pixels that leap apart and fade
      for (const p of platforms) {
        if (!(CAPPED[p.kind] || p.def.cloud) || !p.landable) continue;
        const y = cam.sy(p.y), x0 = cam.sx(p.left) + 8, w = p.boxW - 16;
        for (let j = 0; j < 2; j++) {
          const beat = time * 9 + p.id * 0.37 + j * 0.5, ph = beat - Math.floor(beat);
          const x = x0 + ((hash(Math.floor(beat) * 31 + p.id * 7 + j) % 1000) / 1000) * w;
          const a = (1 - ph) * 0.7 * k, up = 4 + ph * 10, out = 3 + ph * 7;
          g.rect(Math.round(x - out) - 2, Math.round(y - up) - 4, 4, 4, RAIN_COLOR, a);
          g.rect(Math.round(x + out) - 2, Math.round(y - up) - 4, 4, 4, RAIN_COLOR, a);
        }
      }
    }
    if (!def.caps) return;
    for (const p of platforms) {
      if (!CAPPED[p.kind] || !p.landable) continue;
      const inset = CAPPED[p.kind], x0 = Math.round(cam.sx(p.left) + inset), w = Math.round(p.boxW - inset * 2), y = Math.round(cam.sy(p.y));
      if (w < 16) continue;
      g.rect(x0, y - 8, w, 8, SNOW_COLOR, k);
      g.rect(x0 + 4, y, w - 8, 4, SNOW_SHADE, k * 0.9);
      // a few humps, the same ones every frame
      for (let j = 0, x = x0 + 4; x < x0 + w - 20; j++, x += 28) { const h = hash(p.id * 31 + j) % 3; if (h) g.rect(x + (hash(p.id + j * 7) % 8), y - 8 - h * 4, 12 + (h > 1 ? 8 : 0), h * 4, SNOW_COLOR, k); }
    }
  }
  // In front of everything: a few big drops or flakes, the gust's nearest curls, the lightning.
  drawFront(g, cam, time) {
    const def = this.def, k = this.amount;
    if (k <= 0) return;
    if (def.sun) {
      // two of the sun's rays come all the way forward, over the trees too, and the dust shines in them
      const x = W * SUN.x, y = H * SUN.y, len = 2600;
      for (let i = 0; i < 2; i++) { const rot = 2.2 + i * 0.42 + Math.sin(time * 0.09 + i * 2) * 0.03, a = (0.07 + 0.03 * Math.sin(time * 0.19 + i * 2.3)) * k; g.beam(x + Math.cos(rot) * len / 2, y + Math.sin(rot) * len / 2, len, 190 + i * 70, rot, '#ffdca0', a); }
      this.motes(g, cam, time);
    }
    if (def.rain) this.rain(g, 2, cam, time, def.rain);
    if (def.snow) this.snow(g, 2, cam, time, def.snow);
    if (def.gusts) this.curls(g, time, true);
    // (the lightning itself is the mood's: drawLight)
  }
  // The weather's light over everything, on top of the time of day's.
  drawLight(g) {
    const def = this.def;
    if (def.light && this.amount > 0) g.lighting(def.light[0], def.light[1] * this.amount * (1 - 0.5 * clamp(this.flash, 0, 1)));
    // the storm's grey, and the lightning: black and white for an instant, twice (a flicker, then the flash)
    const f = this.flash, bolt = f > 0.75 ? 1 : f > 0.62 ? 0.15 : f / 0.62;
    if (def.grey || f > 0) g.mood((def.grey || 0) * this.amount, f > 0 ? bolt * Math.min(1, this.amount * 1.5) : 0);
  }
}
// What snow lies on, and how far in from the landing box's ends.
const CAPPED = { branchL: 10, branchR: 10, balcony: 6, swing: 6, step: 4 };
