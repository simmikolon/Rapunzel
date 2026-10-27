import { CanvasSource, Texture, Rectangle } from '../../vendor/pixi.min.mjs';
import { makeCanvas } from '../art/sprite.js';

// Packs every procedural sprite canvas into one texture atlas so the whole
// scene batches into a single draw call per layer. Each sprite object
// ({ canvas, w, h, ax, ay }) gets a `tex` property: a PixiJS Texture whose
// frame is the sprite's rectangle in the atlas. The atlas samples with
// nearest-neighbour filtering so the chunky art stays crisp when scaled.

const ATLAS_W = 2048;
const GUTTER = 2;      // transparent pixels between sprites against bleeding

function collect(obj, out, seen) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (!v || typeof v !== 'object') continue;
    if (v.canvas) { if (!seen.has(v)) { seen.add(v); out.push(v); } }
    else collect(v, out, seen);
  }
}

export function buildAtlas(art) {
  const items = [];
  collect(art, items, new Set());

  // A solid white block for rectangles and particles (the frame is the inner
  // 2 x 2 so nearest sampling never reaches the transparent gutter).
  const whiteCanvas = makeCanvas(4, 4);
  const wctx = whiteCanvas.getContext('2d');
  wctx.fillStyle = '#fff'; wctx.fillRect(0, 0, 4, 4);
  const white = { canvas: whiteCanvas, w: 4, h: 4, ax: 0, ay: 0 };
  items.push(white);

  // Shelf packing, tallest first.
  const order = items.slice().sort((a, b) => b.h - a.h || b.w - a.w);
  let x = GUTTER, y = GUTTER, rowH = 0;
  for (const s of order) {
    if (x + s.w + GUTTER > ATLAS_W) { x = GUTTER; y += rowH + GUTTER; rowH = 0; }
    s._atlasX = x; s._atlasY = y;
    x += s.w + GUTTER;
    rowH = Math.max(rowH, s.h);
  }
  const height = y + rowH + GUTTER;
  const canvas = makeCanvas(ATLAS_W, height);
  const ctx = canvas.getContext('2d');
  for (const s of order) ctx.drawImage(s.canvas, s._atlasX, s._atlasY);

  const source = new CanvasSource({ resource: canvas, scaleMode: 'nearest', label: 'rapunzel-atlas' });
  for (const s of order) {
    s.tex = new Texture({ source, frame: new Rectangle(s._atlasX, s._atlasY, s.w, s.h) });
    delete s._atlasX; delete s._atlasY;
  }
  // The white texture uses the inner 2 x 2 of its block.
  white.tex = new Texture({ source, frame: new Rectangle(white.tex.frame.x + 1, white.tex.frame.y + 1, 2, 2) });
  return { canvas, source, white: white.tex, count: order.length };
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
