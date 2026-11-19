// String lights in the deep forest: a wire slung from trunk to trunk with fat
// glowing bulbs on it, wound a few turns around each trunk where it is tied.
// Everything here is looks and a soft bell; nothing can be landed on or
// hurts, and nothing rolls on a seeded stream (where a string hangs comes
// from a hash of its height, so a height always shows the same string).
//
// A string lives in the prince's plane (the trunks are its posts) and is
// drawn behind the platforms and the prince, so it never hides anything to
// play with. It sags, swings with the wind and much more in a gust, its
// bulbs twinkle, and when the prince passes through it he brushes it: the
// wire bounces, a wave of light runs out along it from where he crossed,
// and it rings its own note (strings up the tower play a pentatonic tune).
// Small life keeps it company: moths circle the bulbs, on some strings a
// few birds sit side by side until he comes near, on some a dormouse warms
// its paws at a bulb and looks up when he passes.
import { W, H } from './config.js';
import { TILE_H, TRUNK_W } from './art/tiles.js';
import { hash, deepForestAmount, TREELINE_Y } from './altitude.js';
import { BULBS } from './art/lights.js';
import { clamp, lerp, approach } from './util.js';

const SLOT = 4 * TILE_H;                  // at most one string per 768 px of trunk
const DENSITY = 0.65;                     // of the slots, where the deep forest is at its fullest: about one string in view
const EDGE_X = W / 2 - TRUNK_W;           // |x| of the trunks' inner edge (world x is centred)
const KNOT_X = EDGE_X + 8;                // the wire is tied just inside it
const WIRE = '#1f2d27';
const SEGMENTS = 24;
// Which bulbs a string carries, in order: warm white only, a party mix, pink and white.
const STYLES = [[0], [0, 1, 2, 4, 3], [1, 0]];

export class StringLights {
  constructor(art) {
    this.art = art;
    this.strings = new Map();   // slot -> string or null (fixed by hash)
    this.states = new Map();    // slot -> what moves: bounce, wave, guests
    this.glows = [];            // this frame's bulbs for the light layer: [sx, sy, colour, brightness]
  }

  // A new round: the birds are back on their wires.
  reset() { this.states.clear(); }

  // The string of slot j, or null: where it is tied left and right, how far
  // it sags, its bulbs and who lives on it.
  stringAt(j) {
    if (this.strings.has(j)) return this.strings.get(j);
    let s = null;
    const seed = hash(j * 53 + 17);
    const yL = j * SLOT + 140 + (seed % (SLOT - 300));
    if (j >= 0 && yL < TREELINE_Y - 3 * TILE_H && (hash(seed + 1) % 100) < DENSITY * 100 * deepForestAmount(yL)) {
      const pick = hash(seed + 4) % 100, guest = hash(seed + 5) % 100;
      const n = 8 + (hash(seed + 7) % 3);
      s = {
        j, seed, yL, yR: yL + (hash(seed + 2) % 241) - 120, sag: 80 + (hash(seed + 3) % 70),
        style: STYLES[pick < 35 ? 0 : pick < 80 ? 1 : 2], n,
        ph: (seed % 628) / 100,
        loose: hash(seed + 6) % 3 === 0 ? hash(seed + 8) % n : -1,     // a bulb with a loose contact
        wraps: [2 + (hash(seed + 9) % 2), 2 + (hash(seed + 10) % 2)],  // turns around the left and the right trunk
        guest: guest < 30 ? 'birds' : guest < 55 ? 'mouse' : null,
        note: ((j % 5) + 5) % 5,
      };
    }
    this.strings.set(j, s);
    return s;
  }

  stateOf(s) {
    let st = this.states.get(s.j);
    if (st) return st;
    const h = (k) => hash(s.seed + 100 + k);
    st = { bounce: 0, bv: 0, wave: null, side: 0, scare: 0, ring: 0, alert: false, birds: [], mouse: null };
    st.moths = Array.from({ length: 1 + (h(1) % 3) }, (_, i) => ({ i: h(10 + i) % s.n, ph: (h(20 + i) % 628) / 100, r: 16 + (h(30 + i) % 12), sp: 1.6 + (h(40 + i) % 10) / 10 }));
    if (s.guest === 'birds') {
      // two or three side by side in the gaps between bulbs
      const at = 1 + (h(2) % (s.n - 3)), count = 2 + (h(3) % 2);
      for (let i = 0; i < count; i++) st.birds.push({ u: (at + i + 1.5) / (s.n + 1), dir: h(50 + i) % 2 ? 1 : -1, t: (h(60 + i) % 300) / 100, state: 'perched', x: 0, y: 0, vx: 0, vy: 0 });
    } else if (s.guest === 'mouse') {
      // beside a bulb, facing it: left of it looking right, or the other way round
      const i = 1 + (h(4) % (s.n - 2)), dir = h(5) % 2 ? 1 : -1;
      st.mouse = { i, dir, u: (i + 1) / (s.n + 1) - dir * 0.05, ph: (h(6) % 628) / 100 };
    }
    this.states.set(s.j, st);
    return st;
  }

  // A point of the wire at u (0 at the left knot, 1 at the right), in world
  // coordinates: the chord between the knots, hung down by the sag and by
  // what the prince's last brush left in it, pushed sideways by the wind.
  pointAt(s, st, u, time, gust) {
    const k = 4 * u * (1 - u);
    const swing = Math.sin(time * 0.9 + s.ph) * (4 + 24 * gust) * k;
    return [lerp(-KNOT_X, KNOT_X, u) + swing, lerp(s.yL, s.yR, u) - (s.sag + st.bounce) * k];
  }
  bulbU(s, i) { return (i + 1) / (s.n + 1); }

  // How bright bulb i burns now (1 is its steady light): a slow twinkle of
  // its own, the loose one cutting out now and then, and the wave of light
  // after a brush.
  brightness(s, st, i, time) {
    let b = 0.82 + 0.18 * Math.sin(time * (1.3 + (i % 3) * 0.5) + i * 2.1 + s.ph);
    if (i === s.loose && Math.sin(time * 11 + s.ph) * Math.sin(time * 3.7 + i) > 0.55) b = 0.2;
    if (st.wave) {
      const d = Math.abs(this.bulbU(s, i) - st.wave.u0) - st.wave.t * 1.3;
      b += 0.9 * Math.exp(-(d * d) / 0.012) * (1 - st.wave.t / 1.3);
    }
    return b;
  }

  // ------------------------------------------------------------------ update
  update(dt, cam, time, world, gust) {
    const p = world.player;
    const j0 = Math.floor((cam.y - 500) / SLOT), j1 = Math.floor((cam.top + 500) / SLOT);
    for (const j of this.states.keys()) if (j < j0 - 1) this.states.delete(j);
    for (const j of this.strings.keys()) if (j < j0 - 3) this.strings.delete(j);
    for (let j = j0; j <= j1; j++) {
      const s = this.stringAt(j);
      if (!s) continue;
      const st = this.stateOf(s);
      // the wire is a damped spring around its rest sag
      st.bv += (-70 * st.bounce - 3.2 * st.bv) * dt;
      st.bounce += st.bv * dt;
      if (st.wave) { st.wave.t += dt; if (st.wave.t > 1.3) st.wave = null; }
      st.scare = Math.max(0, st.scare - dt * 0.8);
      if (st.ring > 0) st.ring -= dt;
      // the prince passing through it, upward or downward, brushes it
      const py = p.y + 110;
      if (world.started && p.alive && Math.abs(p.x) < KNOT_X) {
        const u = (p.x + KNOT_X) / (2 * KNOT_X);
        const [wx, wy] = this.pointAt(s, st, u, time, gust);
        const side = py > wy ? 1 : -1;
        if (st.side && side !== st.side && Math.abs(py - wy) < 120) this.brush(s, st, u, wx, wy, p, world);
        st.side = side;
        st.alert = p.seen && Math.abs(py - wy) < 300;
      } else { st.side = 0; st.alert = false; }
      // birds: sitting on the wire until he comes near, then off and away
      for (const b of st.birds) {
        b.t += dt;
        if (b.state === 'perched') {
          [b.x, b.y] = this.pointAt(s, st, b.u, time, gust);
          if (world.started && p.seen && Math.abs(p.x - b.x) < 200 && Math.abs(py - b.y) < 190) this.flush(b, p);
        } else {
          b.vy = approach(b.vy, 110, 1.2, dt);
          b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(b.t * 9) * 30 * dt;
        }
      }
      st.birds = st.birds.filter((b) => b.state === 'perched' || (Math.abs(b.x) < W / 2 + 120 && b.y < cam.top + 150));
    }
  }

  flush(b, p) {
    b.state = 'flying'; b.t = 0;
    b.vx = (b.x < p.x ? -1 : 1) * (240 + Math.random() * 80); b.vy = 260; b.dir = Math.sign(b.vx);
  }

  brush(s, st, u, wx, wy, p, world) {
    st.bv += clamp(-p.vy * 0.18, -230, 230);       // pushed the way he is going
    st.wave = { u0: u, t: 0 };
    st.scare = 1;
    for (const b of st.birds) if (b.state === 'perched') this.flush(b, p);
    const c = BULBS[s.style[Math.round(u * (s.n + 1)) % s.style.length]].glow;
    for (let i = 0; i < 3; i++) world.particles.glint(wx + (Math.random() - 0.5) * 60, wy - 20 + (Math.random() - 0.5) * 30, c);
    if (st.ring <= 0) { st.ring = 0.5; world.audio.chime(s.note); }
  }

  // -------------------------------------------------------------------- draw
  // Behind the platforms and the prince: first every wire (so the vector
  // lines batch), then the bulbs and who sits among them.
  draw(g, cam, time, gust) {
    const A = this.art.lights;
    this.glows.length = 0;
    const j0 = Math.floor((cam.y - 400) / SLOT), j1 = Math.floor((cam.top + 300) / SLOT);
    const vis = [];
    for (let j = j0; j <= j1; j++) {
      const s = this.stringAt(j);
      if (!s) continue;
      const lo = Math.min(s.yL, s.yR) - s.sag - 160, hi = Math.max(s.yL, s.yR) + 200;
      if (hi < cam.y || lo > cam.top) continue;
      vis.push([s, this.stateOf(s)]);
    }
    if (!vis.length) return;
    for (const [s, st] of vis) {
      // the turns around each trunk: slanting bands from the inner edge to the screen's
      for (const side of [-1, 1]) {
        const yK = side < 0 ? s.yL : s.yR, turns = s.wraps[side < 0 ? 0 : 1];
        for (let i = 0; i < turns; i++) g.line(cam.sx(side * EDGE_X), cam.sy(yK + i * 46), cam.sx(side * (W / 2 + 4)), cam.sy(yK + i * 46 + 30), WIRE, 3);
      }
      let [px, py] = this.pointAt(s, st, 0, time, gust);
      for (let i = 1; i <= SEGMENTS; i++) {
        const [x, y] = this.pointAt(s, st, i / SEGMENTS, time, gust);
        g.line(cam.sx(px), cam.sy(py), cam.sx(x), cam.sy(y), WIRE, 3);
        px = x; py = y;
      }
    }
    for (const [s, st] of vis) {
      const color = (i) => s.style[((i % s.style.length) + s.style.length) % s.style.length];
      // on the trunks: one bulb in the middle of each turn, steady
      for (const side of [-1, 1]) {
        const yK = side < 0 ? s.yL : s.yR, turns = s.wraps[side < 0 ? 0 : 1];
        for (let i = 0; i < turns; i++) {
          const b = 0.85 + 0.15 * Math.sin(time * 1.7 + i * 2.3 + s.ph + side);
          this.bulb(g, A, cam.sx(side * (EDGE_X + 50)), cam.sy(yK + i * 46 + 15), color(side < 0 ? -1 - i : s.n + i), b, 0);
        }
      }
      // on the wire
      const pos = [];
      for (let i = 0; i < s.n; i++) {
        const [x, y] = this.pointAt(s, st, this.bulbU(s, i), time, gust);
        const rot = Math.sin(time * 2.1 + i * 1.3 + s.ph) * (0.05 + 0.25 * gust) + clamp(st.bv * 0.0025, -0.5, 0.5);
        pos.push([x, y]);
        this.bulb(g, A, cam.sx(x), cam.sy(y), color(i), this.brightness(s, st, i, time), rot);
      }
      if (st.mouse) {
        const m = st.mouse;
        const [x, y] = this.pointAt(s, st, m.u, time, gust);
        const frame = st.alert ? 2 : Math.floor(time * 1.6 + m.ph) % 2;
        g.blit((m.dir > 0 ? A.mouseR : A.mouseL)[frame], cam.sx(x), cam.sy(y));
      }
      for (const b of st.birds) {
        const frame = b.state === 'flying' ? Math.floor(b.t * 10) % 2 : (Math.floor(b.t * 0.5) % 4 === 0 ? 1 : 0);
        g.blit((b.dir > 0 ? this.art.tiles.birdR : this.art.tiles.birdL)[frame], cam.sx(b.x), cam.sy(b.y) + 2);
      }
      // moths circle their bulb, wider after a brush
      for (const m of st.moths) {
        const [x, y] = pos[m.i], a = time * m.sp + m.ph, r = m.r * (1 + 2.2 * st.scare);
        g.blit(A.moth[Math.floor(time * 12 + m.ph) % 2], cam.sx(x + Math.cos(a) * r), cam.sy(y - 20 + Math.sin(a * 1.3) * r * 0.7), { glow: 0.2 });
      }
    }
  }

  // One bulb hanging from (sx, sy) with brightness b: a small halo behind it,
  // the glass, white heat when the wave passes; dark and grey when it is out.
  bulb(g, A, sx, sy, ci, b, rot) {
    const c = BULBS[ci], spr = A.bulbs[ci];
    if (sy < -60 || sy > H + 60) return;
    g.halo(sx, sy + 20, 44, c.glow, 0.32 * Math.min(1.4, b), { glow: 0.3 });
    g.blit(spr, sx, sy, b < 0.4 ? { rot, tint: '#70747e' } : { rot, glow: 0.3 });
    if (b > 1.05) g.blit(spr, sx, sy, { rot, blend: 'add', alpha: Math.min(0.8, (b - 1) * 1.1) });
    this.glows.push([sx, sy + 20, c.glow, b]);
  }

  // In the light layer, over the forest's green shade: each bulb throws a
  // pool of its colour on whatever is near, the prince included.
  drawGlow(g) {
    for (const [sx, sy, color, b] of this.glows) g.puff(sx, sy, 92, 92, color, 0.13 * Math.min(1.6, b), { soft: true, blend: 'add' });
  }
}
