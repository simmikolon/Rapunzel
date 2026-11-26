import { W, H, SAFE } from './config.js';

// The performance readout (?perf=1): what a frame costs on the device in
// one's hand, and a switch for the drawing resolution, so that a stutter can
// be told apart: too many pixels (a lower resolution cures it), too much
// work in the game's own step or in handing the picture to the GPU (the
// times say which), or single long frames (the graph shows them, and
// `worst` keeps what was going on).
// The panel is drawn with the game's own renderer, so it costs a little
// itself: its numbers are refreshed only twice a second.
// A tap on the panel takes the next resolution (RES): the game's backing
// store in pixels per logical pixel. Whole art pixels (an art pixel is four
// logical ones) come out even at 1, 1.25, 1.5 and 1.75; the screen then
// scales the picture up to its own pixels.
const N = 120;                             // frames kept for the numbers and the graph
export const RES = [0, 1.5, 1.25, 1];      // 0: the screen's own resolution

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
    this.worst = [];                       // the longest frames of this visit, longest first: { ms, upd, drw, m, mode, plats, enemies, pickups, sprites, texts, rasters }
    this.total = 0; this.long = 0;         // frames counted, and those that took more than one and a half of the usual
  }

  // One frame is over: `every` ms since the one before, `upd` and `drw` ms spent in the game's step and its drawing.
  frame(every, upd, drw) {
    if (!this.on || !(every > 0) || every > 1000) return;
    this.every[this.i] = every; this.upd[this.i] = upd; this.drw[this.i] = drw;
    this.i = (this.i + 1) % N; if (this.n < N) this.n++;
    const usual = this.median();
    this.total++;
    if (this.n > 30 && every > usual * 1.5) {
      this.long++;
      const w = this.game.world, s = this.game.gfx.stats;
      this.worst.push({ ms: Math.round(every), upd: +upd.toFixed(1), drw: +drw.toFixed(1), m: w.heightM, mode: this.game.mode, plats: w.platforms.length, enemies: w.enemies.length, pickups: w.pickups.length, sprites: s.sprites, texts: s.texts, rasters: s.rasters });
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
      worst: this.worst,
    };
  }

  // The next resolution (a tap on the panel).
  nextRes() {
    const game = this.game, at = RES.indexOf(game.resScale || 0);
    game.resScale = RES[(at + 1) % RES.length];
    game.setupDpr();
    this.n = 0; this.i = 0; this.total = 0; this.long = 0; this.worst = [];      // other numbers from here on
  }

  get zone() { return { id: 'perf', x: 8, y: SAFE.top + 290, w: 480, h: 250 }; }

  draw(g) {
    if (!this.on) return;
    const z = this.zone, x = z.x + 10;
    let y = z.y + 16;
    g.layer('overlay');
    g.rect(z.x, z.y, z.w, z.h, '#0b1418', 0.72);
    if (this.game.world.time - this.linesT > 0.5 || !this.lines.length || this.game.world.time < this.linesT) {
      this.linesT = this.game.world.time;
      const s = this.summary(), w = this.game.world, top = s.worst[0];
      this.lines = [
        `${s.fps} fps  ${s.ms} ms  p99 ${s.p99}  max ${s.max}`,
        `long ${s.long}%  upd ${s.upd}/${s.updMax}  draw ${s.drw}/${s.drwMax}`,
        `res ${s.res} x${s.scale}${s.pick ? '' : ' (screen)'}  tap: next`,
        `spr ${s.sprites}  txt ${s.texts} new ${s.rasters}  p${w.platforms.length} e${w.enemies.length} k${w.pickups.length}`,
        top ? `worst ${top.ms} ms at ${top.m} m: upd ${top.upd} draw ${top.drw} new txt ${top.rasters}` : 'worst: none yet',
      ];
    }
    for (const line of this.lines) { g.text(line, x, y, 12, '#d8f0e8', 'left', false); y += 22; }
    // the last frames: one bar each, as high as the frame was long; the line is where 60 a second is
    const base = z.y + z.h - 10, usual = this.median();
    for (let k = 0; k < this.n; k++) {
      const ms = this.every[(this.i - this.n + k + N * 2) % N], h = Math.min(110, ms * 2.2);
      g.rect(x + k * 3.3, base - h, 3, h, ms > usual * 2 ? '#ff5a5a' : ms > usual * 1.5 ? '#ffd04a' : '#5ad28a', 0.9);
    }
    g.rect(x, base - 16.7 * 2.2, N * 3.3, 1, '#ffffff', 0.5);
  }
}
