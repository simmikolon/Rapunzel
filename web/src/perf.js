import { W, H, SAFE } from './config.js';

// The performance readout (?perf=1): what a frame costs on the device in
// one's hand, and a switch for the drawing resolution, so that a stutter can
// be told apart: too many pixels (a lower resolution cures it), too much
// work in the game's own step or in handing the picture to the GPU (the
// times say which), or single long frames (the graph shows them, and
// `worst` keeps what was going on).
// The panel is drawn with the game's own renderer, so it costs a little
// itself: its numbers are refreshed only twice a second.
// A tap on the panel's numbers takes the next resolution (RES): the game's
// backing store in pixels per logical pixel. Whole art pixels (an art pixel
// is four logical ones) come out even at every quarter: 0.5 is two pixels
// to an art pixel, 1 is four. The screen then scales the picture up to its
// own pixels, smoothly, or with hard pixels after a tap on the graph: below
// 1 the smooth way is what blurs, the hard way keeps the art's edges and
// makes small letters coarse.
const N = 120;                             // frames kept for the numbers and the graph
export const RES = [0, 1.5, 1.25, 1, 0.75, 0.5];      // 0: the screen's own resolution (the game's own is config.js RESOLUTION)

export class Perf {
  constructor(game) {
    this.game = game;
    this.on = false;
    this.every = new Float32Array(N);      // ms between frames
    this.upd = new Float32Array(N);        // ms in update()
    this.drw = new Float32Array(N);        // ms in draw() (the game's drawing and the renderer's own work on the CPU)
    this.i = 0; this.n = 0;
    this.lines = [];
    this.linesT = 0;
    this.worst = [];                       // the longest frames of this visit, longest first: { ms, upd, drw, out, m, mode, plats, enemies, pickups, sprites, texts, rasters }
    this.total = 0; this.long = 0;         // frames counted, and those that took more than one and a half of the usual
    this.skip = 0;                         // frames not to count: the app came back, the resolution changed
    this.round = null;                     // the round being played, or the last one: what the plan's aim is read from (roundStart())
  }

  // A round begins: its frames are counted apart from the title's and the menus', and the count stays on the panel
  // when the round is over, so that it can be read (and photographed) then and not while playing.
  roundStart() {
    this.round = { frames: 0, over20: 0, over25: 0, over50: 0, max: 0, upd: 0, drw: 0, updMax: 0, drwMax: 0, sprites: 0, worst: null };
  }

  // One frame is over: `every` ms since the one before, `upd` and `drw` ms spent in the game's step and its drawing.
  frame(every, upd, drw) {
    if (!this.on || !(every > 0) || every > 1000) return;
    if (this.skip > 0) { this.skip--; return; }
    const game = this.game, r = this.round;
    if (r && game.mode === 'playing') {
      r.frames++; r.upd += upd; r.drw += drw;
      if (every > 20) r.over20++;
      if (every > 25) r.over25++;
      if (every > 50) r.over50++;
      if (upd > r.updMax) r.updMax = upd;
      if (drw > r.drwMax) r.drwMax = drw;
      if (game.gfx.stats.sprites > r.sprites) r.sprites = game.gfx.stats.sprites;
      if (every > r.max) { r.max = every; r.worst = { ms: Math.round(every), ours: Math.round(upd + drw), m: game.world.heightM, rasters: game.gfx.stats.rasters, sprites: game.gfx.stats.sprites }; }
    }
    this.every[this.i] = every; this.upd[this.i] = upd; this.drw[this.i] = drw;
    this.i = (this.i + 1) % N; if (this.n < N) this.n++;
    const usual = this.median();
    this.total++;
    if (this.n > 30 && every > usual * 1.5) {
      this.long++;
      const w = this.game.world, s = this.game.gfx.stats;
      this.worst.push({ ms: Math.round(every), upd: +upd.toFixed(1), drw: +drw.toFixed(1), out: Math.round(every - upd - drw), m: w.heightM, mode: this.game.mode, plats: w.platforms.length, enemies: w.enemies.length, pickups: w.pickups.length, sprites: s.sprites, texts: s.texts, rasters: s.rasters });
      this.worst.sort((a, b) => b.ms - a.ms);
      if (this.worst.length > 12) this.worst.length = 12;
    }
  }
  median() {
    if (!this.n) return 16.7;
    const a = Array.from(this.every.subarray(0, this.n)).sort((x, y) => x - y);
    return a[a.length >> 1];
  }
  // The numbers over the frames kept: for the panel, and for whoever asks from outside (window.__perf()).
  summary() {
    const n = this.n || 1, ev = Array.from(this.every.subarray(0, this.n)).sort((x, y) => x - y);
    const avg = (a) => { let s = 0; for (let k = 0; k < this.n; k++) s += a[k]; return s / n; };
    const max = (a) => { let m = 0; for (let k = 0; k < this.n; k++) if (a[k] > m) m = a[k]; return m; };
    const g = this.game.gfx, c = g.renderer ? g.renderer.canvas || g.renderer.view : null;
    return {
      fps: +(1000 / (avg(this.every) || 16.7)).toFixed(1), ms: +avg(this.every).toFixed(1), p99: +(ev[Math.min(ev.length - 1, Math.floor(ev.length * 0.99))] || 0).toFixed(1), max: +max(this.every).toFixed(1),
      long: this.total ? +((this.long / this.total) * 100).toFixed(1) : 0,
      upd: +avg(this.upd).toFixed(1), updMax: +max(this.upd).toFixed(1), drw: +avg(this.drw).toFixed(1), drwMax: +max(this.drw).toFixed(1),
      res: c ? `${c.width}x${c.height}` : '', scale: +g.resolution.toFixed(2), pick: this.game.resScale || 0,
      sprites: g.stats.sprites, texts: g.stats.texts, rasters: g.stats.rasters,
      worst: this.worst, round: this.round,
    };
  }

  // The next resolution (a tap on the panel's numbers).
  nextRes() {
    const game = this.game, at = RES.indexOf(game.resScale || 0);
    game.resScale = RES[(at + 1) % RES.length];
    game.setupDpr();
    this.n = 0; this.i = 0; this.total = 0; this.long = 0; this.worst = []; this.skip = 5;      // other numbers from here on
  }
  // How the screen scales the picture up, smoothly or with hard pixels (a tap on the panel's graph).
  nextPixels() {
    this.game.hardPixels = !this.game.hardPixels;
    this.game.setupDpr();
  }

  // The panel, and its two halves to tap: the numbers (the next resolution) and the graph (smooth or hard pixels).
  get panel() { return { x: 8, y: SAFE.top + 290, w: 480, h: 322 }; }
  get zone() { const p = this.panel; return { id: 'perf', x: p.x, y: p.y, w: p.w, h: 198 }; }
  get zonePixels() { const p = this.panel; return { id: 'perfpx', x: p.x, y: p.y + 198, w: p.w, h: p.h - 198 }; }

  draw(g) {
    if (!this.on) return;
    const z = this.panel, x = z.x + 10;
    let y = z.y + 16;
    g.layer('overlay');
    g.rect(z.x, z.y, z.w, z.h, '#0b1418', 0.72);
    if (this.game.world.time - this.linesT > 0.5 || !this.lines.length || this.game.world.time < this.linesT) {
      this.linesT = this.game.world.time;
      const s = this.summary(), w = this.game.world, r = this.round;
      // (the pixel font is as wide as it is high: 38 letters fit the panel)
      this.lines = [
        `${s.fps} fps ${s.ms}ms p99 ${s.p99} max ${s.max}`,
        `upd ${s.upd}/${s.updMax} draw ${s.drw}/${s.drwMax}`,
        `res ${s.res} x${s.scale}${s.pick ? '' : ' screen'}${this.game.hardPixels ? ' hard' : ''}`,
        `spr ${s.sprites} txt ${s.texts} new ${s.rasters} p${w.platforms.length} e${w.enemies.length}`,
      ];
      if (r && r.frames) {
        // the round: all its frames, how many were late, and its longest (what of it was the game's own work)
        const pc = (k) => ((k / r.frames) * 100).toFixed(k / r.frames < 0.1 ? 1 : 0);
        this.lines.push(`round ${r.frames}f >20ms ${pc(r.over20)}% >25 ${pc(r.over25)}%`);
        this.lines.push(` >50ms ${r.over50}  max ${Math.round(r.max)}  spr ${r.sprites}`);
        this.lines.push(` upd ${(r.upd / r.frames).toFixed(1)}/${r.updMax.toFixed(0)} draw ${(r.drw / r.frames).toFixed(1)}/${r.drwMax.toFixed(0)}`);
        if (r.worst) this.lines.push(` worst ${r.worst.ms}ms @${r.worst.m}m ours ${r.worst.ours} txt ${r.worst.rasters}`);
      } else this.lines.push('round: play one, read it after', 'tap numbers: next resolution');
    }
    for (const line of this.lines) { g.text(line, x, y, 12, '#d8f0e8', 'left', false); y += 22; }
    g.text(`tap graph: pixels ${this.game.hardPixels ? 'hard' : 'smooth'}`, x + 170, z.y + z.h - 118, 12, '#8fb8ae', 'left', false);
    // the last frames: one bar each, as high as the frame was long; the line is where 60 a second is
    const base = z.y + z.h - 10, usual = this.median();
    for (let k = 0; k < this.n; k++) {
      const ms = this.every[(this.i - this.n + k + N * 2) % N], h = Math.min(110, ms * 2.2);
      g.rect(x + k * 3.3, base - h, 3, h, ms > usual * 2 ? '#ff5a5a' : ms > usual * 1.5 ? '#ffd04a' : '#5ad28a', 0.9);
    }
    g.rect(x, base - 16.7 * 2.2, N * 3.3, 1, '#ffffff', 0.5);
  }
}
