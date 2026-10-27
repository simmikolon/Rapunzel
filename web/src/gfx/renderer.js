import { Application, Container, Sprite, Graphics, Text, TextStyle, Rectangle, Color } from '../../vendor/pixi.min.mjs';
import { W, H, PX } from '../config.js';
import { makeCanvas } from '../art/sprite.js';
import { buildAtlas, makeGlowTexture, canvasTexture } from './atlas.js';
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
//   glow    emissive copies of glowing things -> BloomFilter, added over
//   hud     score, hearts, boost meter, buttons, toasts, title
//   overlay pause / game over / notices
// all inside `root`, which carries the CRTFilter.

export const FONT = ['Press Start 2P', 'Courier New', 'monospace'];
export const PRESETS = ['full', 'bloom', 'off'];
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
    this.time = 0;
    this.colors = new Map();

    // Textures
    this.atlas = buildAtlas(art);
    this.white = this.atlas.white;
    this.glowTex = makeGlowTexture(128);
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
    this.layers.glow.c.filterArea = SCREEN();
    this.bloom = new BloomFilter(fx.bloom);
    this.crt = new CRTFilter(fx.crt);
    this.cur = this.layers.bg;
    this.setPreset('full');
  }

  // 'full' = bloom + CRT, 'bloom' = bloom only, 'off' = plain WebGL.
  setPreset(p) {
    if (!PRESETS.includes(p)) p = 'full';
    this.preset = p;
    const bloom = p !== 'off', crt = p === 'full';
    this.layers.glow.c.visible = bloom;
    this.layers.glow.c.filters = bloom ? [this.bloom] : null;
    this.root.filters = crt ? [this.crt] : null;
    return p;
  }
  nextPreset() { return this.setPreset(PRESETS[(PRESETS.indexOf(this.preset) + 1) % PRESETS.length]); }

  // Backing store = logical size x scale (device pixels per logical pixel).
  resize(scale) {
    this.resolution = scale;
    this.renderer.resize(W, H, scale);
  }

  // ------------------------------------------------------------- frame
  begin() {
    for (const L of this.all) {
      L.ns = 0; L.ng = 0; L.z = 0; L.cur = null;
      for (const p of L.texts.values()) p.n = 0;
    }
    this.cur = this.layers.bg;
  }

  end(dt) {
    this.time += dt;
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
    sp.blendMode = 'normal';
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
    sp.blendMode = 'normal';
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
    sp.scale.set(1, 1);
    sp.alpha = 1;
    sp.tint = 0xffffff;
  }

  // ------------------------------------------------------------- vectors
  line(x0, y0, x1, y1, color, width = 2, alpha = 1) {
    const g = this._graphics(this.cur);
    const c = this._col(color);
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width, color: c.rgb, alpha: c.a * alpha });
  }

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
  // o: alpha, family, weight, wrap (width), scale, glow
  text(str, x, y, size, color = '#fff', align = 'left', outline = true, o = {}) {
    this._textAt(this.cur, str, x, y, size, color, align, outline, o, 1);
    if (o.glow) this._textAt(this.layers.glow, str, x, y, size, color, align, outline, o, o.glow);
  }
  _textAt(L, str, x, y, size, color, align, outline, o, mul) {
    size = Math.max(1, Math.round(size));
    const family = o.family || FONT;
    const wrap = o.wrap || 0;
    const key = `${size}|${outline ? 1 : 0}|${align}|${wrap}|${typeof family === 'string' ? family : family[0]}|${o.weight || ''}`;
    const t = this._text(L, key, () => {
      const width = Math.max(4, size * 0.28);
      const style = new TextStyle({
        fontFamily: family,
        fontSize: size,
        fontWeight: o.weight || 'normal',
        fill: 0xffffff,
        align,
        stroke: outline ? { color: 'rgba(10,20,24,0.85)', width, join: 'round' } : undefined,
        padding: Math.ceil(width) + 2,
        wordWrap: wrap > 0,
        wordWrapWidth: wrap || 100,
      });
      return new Text({ text: str, style });
    });
    t.text = str;
    const c = this._col(color);
    t.tint = c.rgb;
    t.alpha = c.a * (o.alpha == null ? 1 : o.alpha) * mul;
    t.anchor.set(align === 'center' ? 0.5 : align === 'right' ? 1 : 0, 0.5);
    const sc = o.scale == null ? 1 : o.scale;
    t.scale.set(sc, sc);
    t.position.set(Math.round(x), Math.round(y));
  }
}
