import { CanvasSource, Texture, Rectangle } from '../../vendor/pixi.min.mjs';
import { makeCanvas } from '../art/sprite.js';
import { PX } from '../config.js';

// Packs every procedural sprite into one texture atlas so the whole scene
// batches into a single draw call per layer. Each sprite object
// ({ canvas, w, h, ax, ay }) gets a `tex` property: a PixiJS Texture whose
// frame is the sprite's rectangle in the atlas. The atlas samples with
// nearest-neighbour filtering so the chunky art stays crisp when scaled.
//
// The sprites are drawn PX logical pixels to an art pixel (art/sprite.js);
// the atlas keeps them at art size, one texel to an art pixel, which is a
// sixteenth of the texels (1024 x 1009 where it was 4096 x 3970, and
// 126 px under the limit). The texture is told that it is PX times coarser
// (its resolution is 1 / PX), so a sprite's frame, size and anchor are in
// logical pixels as before and nothing that draws has to know.
// That holds for a sprite on the art grid: every block of PX x PX pixels of
// its canvas one colour. A sprite that is not (its size is not whole art
// pixels, or it says `fine: true`) goes onto a second sheet at full size.
// tools/checks/atlas.mjs looks at every sprite: one that is off the grid
// without saying so would lose what is between the art pixels.

const SIDES = [1024, 2048, 4096];   // the sheet's width in texels: the first at which it is no higher than MAX
const MAX = 4096;                   // the texture limit of older phones
const GUTTER = 1;                   // transparent texels between sprites against bleeding (a whole art pixel)
const FINE_W = 1024;                // the second sheet's width, in logical pixels as the sprites are drawn
const FINE_GUTTER = 2;

// Is a sprite kept at art size? (What the check verifies: then it has to be on the grid.)
export const onGrid = (s) => !s.fine && s.w % PX === 0 && s.h % PX === 0;

function collect(obj, out, seen) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (!v || typeof v !== 'object') continue;
    if (v.canvas) { if (!seen.has(v)) { seen.add(v); out.push(v); } }
    else collect(v, out, seen);
  }
}

// Shelf packing, tallest first: every sprite gets its place (_x, _y) on a sheet `width` wide, in units of
// `unit` logical pixels. Returns the sheet's height.
function shelves(list, width, gutter, unit) {
  let x = gutter, y = gutter, rowH = 0;
  for (const s of list) {
    const w = s.w / unit, h = s.h / unit;
    if (x + w + gutter > width) { x = gutter; y += rowH + gutter; rowH = 0; }
    s._x = x; s._y = y;
    x += w + gutter;
    rowH = Math.max(rowH, h);
  }
  return y + rowH + gutter;
}

export function buildAtlas(art) {
  const items = [];
  collect(art, items, new Set());

  // A solid white block for rectangles, lines and particles: three art pixels square, of which the frame is the
  // middle of the middle one, so that no sampling ever reaches the transparent gutter.
  const whiteCanvas = makeCanvas(3 * PX, 3 * PX);
  const wctx = whiteCanvas.getContext('2d');
  wctx.fillStyle = '#fff'; wctx.fillRect(0, 0, 3 * PX, 3 * PX);
  const white = { canvas: whiteCanvas, w: 3 * PX, h: 3 * PX, ax: 0, ay: 0 };
  items.push(white);

  const tallest = (a, b) => b.h - a.h || b.w - a.w;
  const small = items.filter(onGrid).sort(tallest), fine = items.filter((s) => !onGrid(s)).sort(tallest);

  // The sheet at art size.
  let width = SIDES[0], height = 0;
  for (width of SIDES) { height = shelves(small, width, GUTTER, PX); if (height <= MAX) break; }
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;      // (one texel out of each block, which is all one colour)
  for (const s of small) ctx.drawImage(s.canvas, 0, 0, s.w, s.h, s._x, s._y, s.w / PX, s.h / PX);
  const source = new CanvasSource({ resource: canvas, resolution: 1 / PX, scaleMode: 'nearest', label: 'bouncealot-atlas' });
  for (const s of small) s.tex = new Texture({ source, frame: new Rectangle(s._x * PX, s._y * PX, s.w, s.h) });
  // The white texture: 2 x 2 logical pixels in the middle of the block's middle texel.
  white.tex = new Texture({ source, frame: new Rectangle((white._x + 1) * PX + 1, (white._y + 1) * PX + 1, 2, 2) });

  // The sheet at full size, for what is not on the grid.
  let fineSheet = null;
  if (fine.length) {
    const fw = Math.min(FINE_W, fine.reduce((a, q) => a + q.w + FINE_GUTTER, FINE_GUTTER));      // (no wider than what is on it)
    const fh = shelves(fine, fw, FINE_GUTTER, 1);
    const fc = makeCanvas(fw, fh);
    const fctx = fc.getContext('2d');
    for (const s of fine) fctx.drawImage(s.canvas, s._x, s._y);
    const fs = new CanvasSource({ resource: fc, scaleMode: 'nearest', label: 'bouncealot-atlas-fine' });
    for (const s of fine) s.tex = new Texture({ source: fs, frame: new Rectangle(s._x, s._y, s.w, s.h) });
    fineSheet = { canvas: fc, source: fs, count: fine.length };
  }
  for (const s of items) { delete s._x; delete s._y; }
  return { canvas, source, white: white.tex, count: items.length, fine: fineSheet };
}

// Soft radial disc (white, alpha falls off linearly to the edge) for glows
// and halos; sampled linearly because it is a gradient, not pixel art.
export function makeGlowTexture(size = 128) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return new Texture({ source: new CanvasSource({ resource: canvas, scaleMode: 'linear', label: 'glow-disc' }) });
}

// Any canvas as a linearly filtered texture (vignette, sky strip).
export function canvasTexture(canvas, label) {
  return new Texture({ source: new CanvasSource({ resource: canvas, scaleMode: 'linear', label }) });
}

// A 1 x 64 soft strip (alpha rises and falls across its height) for light
// shafts: stretched along its axis and rotated, it reads as a volumetric
// beam with soft edges.
export function makeBeamTexture(size = 64) {
  const canvas = makeCanvas(1, size);
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < size; y++) {
    const t = (y + 0.5) / size;
    const a = Math.sin(Math.PI * t) ** 1.5;
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.fillRect(0, y, 1, 1);
  }
  return new Texture({ source: new CanvasSource({ resource: canvas, scaleMode: 'linear', label: 'beam' }) });
}

// Fog puff: a wide plateau that only softens toward the rim, so a wisp
// actually covers what it sits on (the glow disc fades too early for fog).
export function makeFogTexture(size = 128) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x + 0.5) / size - 0.5, dy = (y + 0.5) / size - 0.5;
    const r = Math.sqrt(dx * dx + dy * dy) * 2;
    const t = Math.min(1, Math.max(0, (r - 0.35) / 0.65));
    const a = 1 - t * t * (3 - 2 * t);
    const i = (y * size + x) * 4;
    img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = Math.round(a * 255);
  }
  ctx.putImageData(img, 0, 0);
  return new Texture({ source: new CanvasSource({ resource: canvas, scaleMode: 'linear', label: 'fog' }) });
}
