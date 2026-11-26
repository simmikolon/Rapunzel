import { Application, Container, Sprite, Graphics, Text, TextStyle, Rectangle, Color, RenderTexture, BitmapText, DynamicBitmapFont, Cache } from '../../vendor/pixi.min.mjs';
import { W, H, PX } from '../config.js';
import { makeCanvas } from '../art/sprite.js';
import { buildAtlas, makeGlowTexture, makeBeamTexture, makeFogTexture, canvasTexture } from './atlas.js';
import { BloomFilter, CRTFilter } from './filters.js';

// WebGL renderer (PixiJS) behind an immediate-mode facade. The game keeps
// drawing everything every frame with calls like `g.blit(sprite, x, y)`; the
// facade hands out pooled PixiJS sprites, graphics and text objects in call
// order and hides whatever a frame did not use. Every object acquired from a
// pool gets an increasing zIndex, so draw-call order is z-order even when
// sprites, vector shapes and text interleave.
//
// Stage, bottom to top:
//   bg      sky, far layer, forest, tower, braid, ground, trunks
//   world   platforms, pickups, enemies, prince, particles, fireflies
//   light   altitude lighting (multiply) and the vignette
//   (dark)  only where the lights are out: a light map multiplied over
//           everything below it (see dark() and lamp())
//   glow    emissive copies of glowing things -> BloomFilter, added over
//   hud     score, hearts, boost meter, buttons, toasts, title
//   overlay pause / game over / notices
// all inside `root`, which carries the CRTFilter.

export const FONT = ['Press Start 2P', 'Courier New', 'monospace'];
// The letter sheets (_sheet): the sizes there are sheets for, the letters painted on a sheet ahead (the biggest one
// is the height's in the HUD and gets only what a height is written with), and the sheets with an outline that are
// made before the first round because the game is known to use them.
const SHEETS = [10, 12, 14, 16, 18, 22, 30, 40];
const ALL = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const SHEET_CHARS = { 40: '0123456789 m' };
const SHEETS_AHEAD = [12, 14, 16, 18, 22, 30, 40];
const SHEET_FIT = { mid: 0.4, right: 0.8, up: 1.34 };      // what brings a sheet's text to where a painted one is (_lettersAt)
const SHEET_WAIT = 20;      // frames the resolution has to stand still before the sheets are made again for it
export const PRESETS = ['off', 'bloom', 'lines', 'full'];      // nothing, the glow, the scan lines, both (?fx=, the F key)
// The game starts without screen effects (the plain picture looked better);
// bloom and CRT are there for whoever picks them (F, the title's button).
export const DEFAULT_PRESET = 'off';
const LAYERS = ['bg', 'world', 'light', 'glow', 'hud', 'overlay'];
const SCREEN = () => new Rectangle(0, 0, W, H);

export async function createRenderer(canvas, art, fx) {
  const app = new Application();
  await app.init({
    canvas,
    width: W, height: H, resolution: 1, autoDensity: false,
    antialias: false, preference: 'webgl', powerPreference: 'high-performance',
    backgroundColor: 0x1e3c3f, clearBeforeRender: true,
    autoStart: false, sharedTicker: false, hello: false,
    eventFeatures: { move: false, globalMove: false, click: false, wheel: false },
  });
  return new Renderer(app, art, fx);
}

export class Renderer {
  constructor(app, art, fx) {
    this.app = app;
    this.renderer = app.renderer;
    this.fx = fx;
    this.resolution = 1;
    this.letters = true;         // texts in the game's own font come from letter sheets (false: every text is painted by the browser, as it was)
    this.sheets = new Map();     // the letter sheets made so far: name → { font, chars } (_sheet)
    this.sheetRes = 0;           // the resolution they are painted at (0: none yet), and the frames to wait before they follow a new one
    this.sheetWait = 0;
    this.sized = false;          // resize() has said what the resolution is
    this.warm = []; this.warmFrames = 0;      // the sheets made ahead, and the frames in which each is still drawn once unseen (_keepSheets)
    this.stats = { sprites: 0, texts: 0, rasters: 0 };      // the last frame's counts (begin())
    this.count = { sprites: 0, texts: 0, rasters: 0 };
    this.time = 0;
    this.colors = new Map();

    // Textures
    this.atlas = buildAtlas(art);
    this.white = this.atlas.white;
    this.glowTex = makeGlowTexture(128);
    this.beamTex = makeBeamTexture(64);
    this.fogTex = makeFogTexture(128);
    // Sky: a 1 x 2 strip, linearly filtered; stretched to twice the screen
    // height and offset by half of it so the two texel centres sit exactly on
    // the top and bottom edges and the GPU interpolates the gradient.
    this.skyCanvas = makeCanvas(1, 2);
    this.skyCtx = this.skyCanvas.getContext('2d');
    this.skyTex = canvasTexture(this.skyCanvas, 'sky');
    this.skyTop = ''; this.skyBot = '';
    const v = makeCanvas(W, H);
    const vctx = v.getContext('2d');
    const grad = vctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.78);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    vctx.fillStyle = grad; vctx.fillRect(0, 0, W, H);
    this.vignetteTex = canvasTexture(v, 'vignette');

    // Scene graph
    this.stage = app.stage;
    this.root = new Container({ label: 'root' });
    this.root.filterArea = SCREEN();
    this.stage.addChild(this.root);
    this.layers = {};
    this.all = [];
    for (const name of LAYERS) {
      const c = new Container({ label: name });
      c.sortableChildren = true;
      this.root.addChild(c);
      const L = { name, c, sprites: [], ns: 0, gfx: [], ng: 0, texts: new Map(), z: 0, cur: null };
      this.layers[name] = L;
      this.all.push(L);
    }
    // Darkness: a light map, drawn each frame into a texture of its own (at
    // half resolution: it is all soft gradients) and multiplied over the
    // picture between the light layer and the glow. Its ground is the dark's
    // colour; every lamp() adds light to it. Not part of the stage: `lamps`
    // is rendered apart, only in frames that called dark().
    this.lamps = { name: 'lamps', c: new Container({ label: 'lamps' }), sprites: [], ns: 0, gfx: [], ng: 0, texts: new Map(), z: 0, cur: null };
    this.lamps.c.sortableChildren = true;
    this.lampGround = new Sprite(this.white);
    this.lampGround.zIndex = -1;
    this.lamps.c.addChild(this.lampGround);
    this.lightMap = RenderTexture.create({ width: W, height: H, resolution: 0.5 });
    this.darkSprite = new Sprite(this.lightMap);
    this.darkSprite.blendMode = 'multiply';
    this.darkSprite.visible = false;
    this.root.addChildAt(this.darkSprite, this.root.getChildIndex(this.layers.glow.c));
    this.darkAmount = 0;
    this.darkColor = 0x000000;
    this.layers.glow.c.filterArea = SCREEN();
    this.bloom = new BloomFilter(fx.bloom);
    this.crt = new CRTFilter(fx.crt);
    this.cur = this.layers.bg;
    this.setPreset(DEFAULT_PRESET);
  }

  // 'full' = bloom + CRT, 'bloom' = bloom only, 'off' = plain WebGL.
  setPreset(p) {
    if (!PRESETS.includes(p)) p = DEFAULT_PRESET;
    return this.setFx(p === 'bloom' || p === 'full', p === 'lines' || p === 'full');
  }
  // The two effects, each on its own: the glow (what glows is drawn again into the glow layer and bloomed over the
  // picture) and the scan lines (a pass over the whole frame). Returns the preset's name for the pair.
  setFx(glow, lines) {
    this.layers.glow.c.visible = !!glow;
    this.layers.glow.c.filters = glow ? [this.bloom] : null;
    this.root.filters = lines ? [this.crt] : null;
    this.preset = glow ? (lines ? 'full' : 'bloom') : lines ? 'lines' : 'off';
    return this.preset;
  }
  nextPreset() { return this.setPreset(PRESETS[(PRESETS.indexOf(this.preset) + 1) % PRESETS.length]); }

  // Backing store = logical size x scale (device pixels per logical pixel).
  // H can change with the window's shape (config.js), so the filter areas
  // follow it; the vignette texture is stretched in vignette().
  resize(scale) {
    if (scale !== this.resolution || !this.sized) this.sheetWait = this.sheetRes ? SHEET_WAIT : 0;
    this.sized = true;
    this.resolution = scale;
    this.renderer.resize(W, H, scale);
    this.root.filterArea = SCREEN();
    this.layers.glow.c.filterArea = SCREEN();
    this.lightMap.resize(W, H);
  }

  // ------------------------------------------------------------- frame
  begin() {
    // what the last frame took (perf.js reads it): sprites and texts placed, and texts whose words were new, each of
    // which the browser has to paint and hand to the GPU again
    this.stats.sprites = this.count.sprites; this.stats.texts = this.count.texts; this.stats.rasters = this.count.rasters;
    this.count.sprites = 0; this.count.texts = 0; this.count.rasters = 0;
    this._keepSheets();
    for (const L of this.all) {
      L.ns = 0; L.ng = 0; L.z = 0; L.cur = null;
      for (const p of L.texts.values()) p.n = 0;
    }
    this.cur = this.layers.bg;
    this.lamps.ns = 0; this.lamps.z = 0;
    this.darkAmount = 0;
  }

  end(dt) {
    this.time += dt;
    if (this.warmFrames > 0) { this.warmFrames--; for (const size of this.warm) this._lettersAt(this.layers.overlay, SHEET_CHARS[size] || ALL, -9000, -9000, size, '#fff', 'left', true, { alpha: 0.02 }, 1); }
    this._renderLightMap();
    for (const L of this.all) {
      for (let i = L.ns; i < L.sprites.length; i++) L.sprites[i].visible = false;
      for (let i = L.ng; i < L.gfx.length; i++) L.gfx[i].visible = false;
      for (const p of L.texts.values()) for (let i = p.n; i < p.list.length; i++) p.list[i].visible = false;
    }
    if (this.preset === 'full') {
      // One scanline per art pixel row, but never finer than 4 device pixels
      // (a sub-3-px period only moires with the art); the phosphor mask is a
      // sub-pixel effect that only reads well at retina densities.
      const u = this.crt.uniforms;
      u.uTime = this.time;
      u.uScanPeriod = Math.max(4, PX * this.resolution);
      u.uMask = this.fx.crt.mask * Math.min(1, this.resolution / 1.5);
    }
    this.renderer.render(this.stage);
  }

  layer(name) { this.cur = this.layers[name]; }

  // ------------------------------------------------------------- darkness
  // This frame is dark: everything under the HUD is multiplied by `color`
  // at `amount` (0 nothing, 1 all the way to the colour), except where a
  // lamp shines. Call it before the frame's lamp() calls.
  dark(amount, color = '#060510') {
    this.darkAmount = Math.max(0, Math.min(1, amount));
    this.darkColor = this._col(color).rgb;
  }
  // A light in the dark: a soft disc of radius r that brings the picture
  // back, in its colour. Does nothing in a frame that is not dark.
  lamp(cx, cy, r, color = '#ffffff', alpha = 1) {
    if (this.darkAmount <= 0.01) return;
    const sp = this._sprite(this.lamps);
    const c = this._col(color);
    sp.texture = this.glowTex;
    sp.blendMode = 'add';
    sp.pivot.set(64, 64);
    sp.position.set(cx, cy);
    sp.rotation = 0;
    sp.scale.set(r / 64, r / 64);
    sp.alpha = c.a * Math.min(1, alpha);
    sp.tint = c.rgb;
  }
  _renderLightMap() {
    const L = this.lamps;
    for (let i = L.ns; i < L.sprites.length; i++) L.sprites[i].visible = false;
    if (this.darkAmount <= 0.01) { this.darkSprite.visible = false; return; }
    // the map's ground: white turned toward the dark's colour by the amount
    const a = this.darkAmount, d = this.darkColor, mix = (sh) => Math.round(255 + (((d >> sh) & 255) - 255) * a);
    this.lampGround.tint = (mix(16) << 16) | (mix(8) << 8) | mix(0);
    this.lampGround.scale.set(W / this.white.width, H / this.white.height);
    this.renderer.render({ container: L.c, target: this.lightMap, clear: true });
    this.darkSprite.visible = true;
  }

  // ------------------------------------------------------------- pools
  _col(css) {
    if (typeof css === 'number') return { rgb: css, a: 1 };
    let c = this.colors.get(css);
    if (!c) {
      const col = Color.shared.setValue(css);
      c = { rgb: col.toNumber(), a: col.alpha };
      this.colors.set(css, c);
    }
    return c;
  }

  _sprite(L) {
    let s = L.sprites[L.ns];
    if (!s) { s = new Sprite(); L.sprites.push(s); L.c.addChild(s); }
    L.ns++;
    this.count.sprites++;
    L.cur = null;
    s.visible = true;
    s.zIndex = L.z++;
    return s;
  }

  // Consecutive vector calls share one Graphics object; a sprite or text in
  // between starts a new one so the z-order stays exact.
  _graphics(L) {
    if (L.cur) return L.cur;
    let g = L.gfx[L.ng];
    if (!g) { g = new Graphics(); L.gfx.push(g); L.c.addChild(g); }
    L.ng++;
    g.visible = true;
    g.zIndex = L.z++;
    g.clear();
    L.cur = g;
    return g;
  }

  _text(L, key, make) {
    let pool = L.texts.get(key);
    if (!pool) { pool = { list: [], n: 0 }; L.texts.set(key, pool); }
    let t = pool.list[pool.n];
    if (!t) { t = make(); pool.list.push(t); L.c.addChild(t); }
    pool.n++;
    L.cur = null;
    t.visible = true;
    t.zIndex = L.z++;
    return t;
  }

  // ------------------------------------------------------------- sprites
  // Draw a sprite with its anchor at (x, y). opts: sx, sy, rot, alpha, flip,
  // tint, glow (0..1: also drawn into the bloom layer at that alpha).
  blit(s, x, y, o) {
    this._blit(this.cur, s, x, y, o, 1);
    if (o && o.glow) this._blit(this.layers.glow, s, x, y, o, o.glow);
  }
  _blit(L, s, x, y, o, mul) {
    const sp = this._sprite(L);
    sp.texture = s.tex;
    sp.blendMode = (o && o.blend) || 'normal';
    if (!o) {
      sp.pivot.set(0, 0);
      sp.position.set(Math.round(x - s.ax), Math.round(y - s.ay));
      sp.rotation = 0;
      sp.scale.set(1, 1);
      sp.alpha = mul;
      sp.tint = 0xffffff;
      return;
    }
    const sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy;
    sp.pivot.set(s.ax, s.ay);
    sp.position.set(Math.round(x), Math.round(y));
    sp.rotation = o.rot || 0;
    sp.scale.set(o.flip ? -sx : sx, sy);
    sp.alpha = (o.alpha == null ? 1 : o.alpha) * mul;
    sp.tint = o.tint == null ? 0xffffff : this._col(o.tint).rgb;
  }

  // Axis-aligned filled rectangle (top-left corner, logical pixels).
  rect(x, y, w, h, color, alpha = 1, o) {
    this._rect(this.cur, x, y, w, h, color, alpha, 1);
    if (o && o.glow) this._rect(this.layers.glow, x, y, w, h, color, alpha, o.glow);
  }
  _rect(L, x, y, w, h, color, alpha, mul) {
    const sp = this._sprite(L);
    const c = this._col(color);
    sp.texture = this.white;
    sp.blendMode = 'normal';
    sp.pivot.set(0, 0);
    sp.position.set(Math.round(x), Math.round(y));
    sp.rotation = 0;
    sp.scale.set(Math.round(w) / 2, Math.round(h) / 2);
    sp.alpha = c.a * alpha * mul;
    sp.tint = c.rgb;
  }

  // Filled rectangle centred on (cx, cy), optionally rotated.
  box(cx, cy, w, h, color, alpha = 1, o) {
    this._box(this.cur, cx, cy, w, h, color, alpha, o, 1);
    if (o && o.glow) this._box(this.layers.glow, cx, cy, w, h, color, alpha, o, o.glow);
  }
  _box(L, cx, cy, w, h, color, alpha, o, mul) {
    const sp = this._sprite(L);
    const c = this._col(color);
    sp.texture = this.white;
    sp.blendMode = (o && o.blend) || 'normal';
    sp.pivot.set(1, 1);
    sp.position.set(cx, cy);
    sp.rotation = (o && o.rot) || 0;
    sp.scale.set(w / 2, h / 2);
    sp.alpha = c.a * alpha * mul;
    sp.tint = c.rgb;
  }

  // Soft radial halo of radius r (used for lantern light and glows).
  halo(cx, cy, r, color, alpha = 1, o) {
    this._halo(this.cur, cx, cy, r, color, alpha, 1);
    if (o && o.glow) this._halo(this.layers.glow, cx, cy, r, color, alpha, o.glow);
  }
  _halo(L, cx, cy, r, color, alpha, mul) {
    const sp = this._sprite(L);
    const c = this._col(color);
    sp.texture = this.glowTex;
    sp.blendMode = 'normal';
    sp.pivot.set(64, 64);
    sp.position.set(cx, cy);
    sp.rotation = 0;
    sp.scale.set(r / 64, r / 64);
    sp.alpha = c.a * alpha * mul;
    sp.tint = c.rgb;
  }

  // Soft elliptical cloud of color (fog wisps): the fog disc (wide plateau,
  // soft rim) stretched to rx x ry, optionally rotated; o.soft uses the
  // glow disc instead for a gentler, gradient look.
  puff(cx, cy, rx, ry, color, alpha = 1, o) {
    this._puff(this.cur, cx, cy, rx, ry, color, alpha, o, 1);
    if (o && o.glow) this._puff(this.layers.glow, cx, cy, rx, ry, color, alpha, o, o.glow);
  }
  _puff(L, cx, cy, rx, ry, color, alpha, o, mul) {
    const sp = this._sprite(L);
    const c = this._col(color);
    sp.texture = (o && o.soft) ? this.glowTex : this.fogTex;
    sp.blendMode = (o && o.blend) || 'normal';
    sp.pivot.set(64, 64);
    sp.position.set(cx, cy);
    sp.rotation = (o && o.rot) || 0;
    sp.scale.set(rx / 64, ry / 64);
    sp.alpha = c.a * alpha * mul;
    sp.tint = c.rgb;
  }

  // Light shaft: a soft-edged beam of `length` along its axis and `width`
  // across, centred on (cx, cy), rotated by rot, additively blended.
  beam(cx, cy, length, width, rot, color, alpha = 1, o) {
    this._beam(this.cur, cx, cy, length, width, rot, color, alpha, 1);
    if (o && o.glow) this._beam(this.layers.glow, cx, cy, length, width, rot, color, alpha, o.glow);
  }
  _beam(L, cx, cy, length, width, rot, color, alpha, mul) {
    const sp = this._sprite(L);
    const c = this._col(color);
    sp.texture = this.beamTex;
    sp.blendMode = 'add';
    sp.pivot.set(0.5, 32);
    sp.position.set(cx, cy);
    sp.rotation = rot;
    sp.scale.set(length, width / 64);
    sp.alpha = c.a * alpha * mul;
    sp.tint = c.rgb;
  }

  // Full-screen vertical gradient (bg layer).
  sky(top, bot) {
    if (top !== this.skyTop || bot !== this.skyBot) {
      this.skyTop = top; this.skyBot = bot;
      this.skyCtx.fillStyle = top; this.skyCtx.fillRect(0, 0, 1, 1);
      this.skyCtx.fillStyle = bot; this.skyCtx.fillRect(0, 1, 1, 1);
      this.skyTex.source.update();
    }
    const sp = this._sprite(this.cur);
    sp.texture = this.skyTex;
    sp.blendMode = 'normal';
    sp.pivot.set(0, 0);
    sp.position.set(0, -H / 2);
    sp.rotation = 0;
    sp.scale.set(W, H);
    sp.alpha = 1;
    sp.tint = 0xffffff;
  }

  // Multiply the whole frame with a colour (time-of-day lighting).
  lighting(color, alpha) {
    const sp = this._sprite(this.cur);
    const c = this._col(color);
    sp.texture = this.white;
    sp.blendMode = 'multiply';
    sp.pivot.set(0, 0);
    sp.position.set(0, 0);
    sp.rotation = 0;
    sp.scale.set(W / 2, H / 2);
    sp.alpha = c.a * alpha;
    sp.tint = c.rgb;
  }

  vignette() {
    const sp = this._sprite(this.cur);
    sp.texture = this.vignetteTex;
    sp.blendMode = 'normal';
    sp.pivot.set(0, 0);
    sp.position.set(0, 0);
    sp.rotation = 0;
    sp.scale.set(W / this.vignetteTex.width, H / this.vignetteTex.height);
    sp.alpha = 1;
    sp.tint = 0xffffff;
  }

  // A straight line: a rectangle as long as the line and as wide, turned
  // its way. A sprite, like every rectangle, and not a vector shape: those
  // the engine builds again every frame, and the vines on the trunks alone
  // were a hundred of them in the forest, half of a frame's drawing.
  line(x0, y0, x1, y1, color, width = 2, alpha = 1) {
    const dx = x1 - x0, dy = y1 - y0;
    const sp = this._sprite(this.cur);
    const c = this._col(color);
    sp.texture = this.white;
    sp.blendMode = 'normal';
    sp.pivot.set(1, 1);
    sp.position.set((x0 + x1) / 2, (y0 + y1) / 2);
    sp.rotation = Math.atan2(dy, dx);
    sp.scale.set(Math.hypot(dx, dy) / 2, width / 2);
    sp.alpha = c.a * alpha;
    sp.tint = c.rgb;
  }

  // ------------------------------------------------------------- vectors

  // o: fill, stroke, width, alpha, join, cap, glow
  roundRect(x, y, w, h, r, o = {}) { this.path((g) => g.roundRect(x, y, w, h, r), o); }
  circle(cx, cy, r, o = {}) { this.path((g) => g.circle(cx, cy, r), o); }

  // Free-form shape: fn(g) builds a path with the PixiJS Graphics API
  // (moveTo, lineTo, quadraticCurveTo, arc, closePath), painted per o.
  path(fn, o = {}) {
    const g = this._graphics(this.cur);
    fn(g);
    this._paint(g, o, 1);
    if (o.glow) {
      const gg = this._graphics(this.layers.glow);
      fn(gg);
      this._paint(gg, o, o.glow);
    }
  }
  _paint(g, o, mul) {
    const alpha = (o.alpha == null ? 1 : o.alpha) * mul;
    if (o.fill != null) { const c = this._col(o.fill); g.fill({ color: c.rgb, alpha: c.a * alpha }); }
    if (o.stroke != null) {
      const c = this._col(o.stroke);
      g.stroke({ width: o.width || 2, color: c.rgb, alpha: c.a * alpha, join: o.join || 'miter', cap: o.cap || 'butt' });
    }
  }

  // ------------------------------------------------------------- text
  // Pixel font text with an optional dark outline. Text objects are pooled
  // per style so a string is only rasterized again when it changes.
  // o: alpha, family, weight, wrap (width), scale, glow, paint { fill,
  // stroke, width } (colours baked into the text instead of the tint, for
  // dark text with a light edge; `color` is ignored then)
  text(str, x, y, size, color = '#fff', align = 'left', outline = true, o = {}) {
    this._textAt(this.cur, str, x, y, size, color, align, outline, o, 1);
    if (o.glow) this._textAt(this.layers.glow, str, x, y, size, color, align, outline, o, o.glow);
  }
  // The game's own letters from a prepared sheet: one sheet per size of the
  // pixel font, with or without its outline, painted once (at the backing
  // store's resolution) and kept. A text made of them costs nothing when its
  // words change; a text the browser paints (the old way, kept below for
  // what is painted in its own colours, wraps, is in another font or bigger
  // than the biggest sheet: the countdown) is painted and handed to the GPU
  // again with every new word, and the height in the HUD has a new word with
  // every metre climbed.
  // There are sheets for the sizes in SHEETS; a size between two of them
  // takes the next bigger one, made smaller (a toast is as big as its
  // length allows). A sheet is one square picture, as small as holds its
  // letters (a letter that was not painted ahead is added when a text first
  // asks for it). Null while there are no sheets yet (_keepSheets): then the
  // browser paints, as it would have.
  _sheet(size, outline) {
    const res = this.sheetRes;
    if (!res) return null;
    const name = `sb${size}${outline ? 'o' : 'p'}r${Math.round(res * 100)}`;
    if (!this.sheets.has(name)) {
      const chars = (outline && SHEET_CHARS[size]) || ALL;
      const width = outline ? Math.max(4, size * 0.28) : 0;
      const style = new TextStyle({ fontFamily: [...FONT], fontSize: size, fill: 0xffffff, stroke: outline ? { color: 'rgba(10,20,24,0.85)', width, join: 'round' } : undefined });      // (a copy of FONT: the list is changed by whoever takes it)
      // the smallest picture (its side a power of two, as the GPU likes it) that takes the letters on one page
      let font, side = 128;
      while (side * side < chars.length * size * size * res * res) side *= 2;
      for (; ; side *= 2) {
        font = new DynamicBitmapFont({ style, overrideFill: false, overrideSize: false, skipKerning: true, padding: outline ? 1 : 2, resolution: res, textureSize: Math.floor(side / res), mipmap: false });
        font.ensureCharacters(chars);
        if (font.pages.length <= 1 || side >= 2048) break;
        font.destroy();
      }
      Cache.set(`${name}-bitmap`, font);
      font.once('destroy', () => Cache.remove(`${name}-bitmap`));
      this.sheets.set(name, { font, chars, side });
    }
    return name;
  }
  // The sheets follow the backing store's resolution: made when it is first known and the font is there, and made
  // again when it has changed and stood still for a moment (a window being dragged changes it with every frame; the
  // texts are drawn from the old sheets meanwhile). The sheets the game is known to need are made here, before the
  // first round, so that none is made in the middle of one; and since a sheet only goes to the GPU when something is
  // first drawn with it, each of them is drawn once where nobody sees it, in the frames that follow.
  _keepSheets() {
    if (!this.letters || !this.sized || this.sheetRes === this.resolution) return;
    if (this.sheetWait > 0) { this.sheetWait--; return; }
    if (typeof document !== 'undefined' && document.fonts && document.fonts.check && !document.fonts.check('16px "Press Start 2P"')) return;
    for (const L of this.all) for (const [key, pool] of L.texts) if (key.startsWith('b|')) { for (const t of pool.list) t.destroy(); L.texts.delete(key); }
    for (const sheet of this.sheets.values()) sheet.font.destroy();
    this.sheets.clear();
    this.sheetRes = this.resolution;
    this.warm = SHEETS_AHEAD.filter((size) => this._sheet(size, true));
    this.warmFrames = 2;
  }
  _lettersAt(L, str, x, y, size, color, align, outline, o, mul) {
    const base = SHEETS.find((q) => q >= size);
    const name = base ? this._sheet(base, outline) : null;
    if (!name) return false;
    const t = this._text(L, `b|${name}|${align}`, () => new BitmapText({ text: '', style: { fontFamily: name, fontSize: base, fill: 0xffffff, align } }));
    this.count.texts++;
    if (t.text !== str) t.text = str;
    const c = this._col(color);
    t.tint = c.rgb;
    t.alpha = c.a * (o.alpha == null ? 1 : o.alpha) * mul;
    t.anchor.set(align === 'center' ? 0.5 : align === 'right' ? 1 : 0, 0.5);
    const sc = (o.scale == null ? 1 : o.scale) * (size / base);
    t.scale.set(sc, sc);
    // A sheet's letters with an outline sit a little off where the browser paints the same words (the sheet counts
    // the outline's width differently): put back, so that a text is where it was (measured: within half a pixel).
    let dx = 0, dy = 0;
    if (outline) {
      const w = Math.max(4, base * 0.28), q = w * base / 200;
      dx = (align === 'center' ? -(q + SHEET_FIT.mid) : align === 'right' ? -(q + w / 2 + SHEET_FIT.right) : w / 2 - q) * sc;
      dy = -q * SHEET_FIT.up * sc;
    }
    t.position.set(Math.round(x) + dx, Math.round(y) + dy);
    return true;
  }

  _textAt(L, str, x, y, size, color, align, outline, o, mul) {
    size = Math.max(1, Math.round(size));
    const family = o.family || FONT;
    const wrap = o.wrap || 0;
    const paint = o.paint;
    if (this.letters && family === FONT && !wrap && !paint && !o.weight && this._lettersAt(L, str, x, y, size, color, align, outline, o, mul)) return;
    const key = `${size}|${outline ? 1 : 0}|${align}|${wrap}|${typeof family === 'string' ? family : family[0]}|${o.weight || ''}|${paint ? `${paint.fill}/${paint.stroke}/${paint.width}` : ''}`;
    const t = this._text(L, key, () => {
      const width = paint ? paint.width : Math.max(4, size * 0.28);
      const style = new TextStyle({
        fontFamily: family,
        fontSize: size,
        fontWeight: o.weight || 'normal',
        fill: paint ? paint.fill : 0xffffff,
        align,
        stroke: paint ? { color: paint.stroke, width, join: 'round' } : outline ? { color: 'rgba(10,20,24,0.85)', width, join: 'round' } : undefined,
        padding: Math.ceil(width) + 2,
        wordWrap: wrap > 0,
        wordWrapWidth: wrap || 100,
      });
      return new Text({ text: '', style });
    });
    this.count.texts++;
    if (t.text !== str) this.count.rasters++;
    t.text = str;
    const c = this._col(paint ? '#fff' : color);
    t.tint = c.rgb;
    t.alpha = c.a * (o.alpha == null ? 1 : o.alpha) * mul;
    t.anchor.set(align === 'center' ? 0.5 : align === 'right' ? 1 : 0, 0.5);
    const sc = o.scale == null ? 1 : o.scale;
    t.scale.set(sc, sc);
    t.position.set(Math.round(x), Math.round(y));
  }
}
