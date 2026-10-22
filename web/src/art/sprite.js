import { PX } from '../config.js';

// Procedural pixel-art sprite factory. Every sprite is drawn once into an
// offscreen canvas at PX logical pixels per art pixel. A sprite carries its
// anchor (ax, ay) in logical pixels from the top-left so the renderer can
// place it by foot / surface / center.
//
// To replace any sprite with hand-drawn art later, call
// `replaceSprite(name, image, ax, ay)` from assets.js.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function makeSprite(wA, hA, draw, anchor = { ax: 0.5, ay: 1 }, opts = {}) {
  const canvas = makeCanvas(wA * PX, hA * PX);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const p = (x, y, w = 1, h = 1, color) => {
    if (color == null) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x) * PX, Math.round(y) * PX, Math.round(w) * PX, Math.round(h) * PX);
  };
  if (opts.shift) ctx.translate(opts.shift[0] * PX, opts.shift[1] * PX);
  const tools = {
    p,
    ctx,
    w: wA,
    h: hA,
    line: (x0, y0, x1, y1, color, thick = 1) => pixelLine(p, x0, y0, x1, y1, color, thick),
    disc: (cx, cy, r, color) => disc(p, cx, cy, r, color),
    ring: (cx, cy, r, color) => ring(p, cx, cy, r, color),
    ellipse: (cx, cy, rx, ry, color) => ellipse(p, cx, cy, rx, ry, color),
    poly: (pts, color) => poly(ctx, pts, color),
    rect: (x, y, w, h, color) => p(x, y, w, h, color),
    hatch: (x, y, w, h, color, every = 2, phase = 0) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((xx + yy + phase) % every === 0) p(xx, yy, 1, 1, color); },
  };
  draw(tools);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ax = (opts.axPx != null) ? opts.axPx : anchor.ax * canvas.width;
  const ay = (opts.ayPx != null) ? opts.ayPx : anchor.ay * canvas.height;
  return { canvas, w: canvas.width, h: canvas.height, ax, ay };
}

export function pixelLine(p, x0, y0, x1, y1, color, thick = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    p(x0, y0, thick, thick, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

export function disc(p, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) p(cx + x, cy + y, 1, 1, color);
}
export function ring(p, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y;
    if (d <= r * r + r * 0.5 && d > (r - 1) * (r - 1) + (r - 1) * 0.5) p(cx + x, cy + y, 1, 1, color);
  }
}
export function ellipse(p, cx, cy, rx, ry, color) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) p(cx + x, cy + y, 1, 1, color);
}
export function poly(ctx, pts, color) {
  // Filled polygon snapped to the art grid (coordinates in art pixels).
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * PX, y * PX) : ctx.moveTo(x * PX, y * PX)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function flipH(sprite) {
  const canvas = makeCanvas(sprite.w, sprite.h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(sprite.w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(sprite.canvas, 0, 0);
  return { canvas, w: sprite.w, h: sprite.h, ax: sprite.w - sprite.ax, ay: sprite.ay };
}

// Copy of a sprite tinted with a color (keeps alpha).
export function tint(sprite, color, alpha = 0.6) {
  const canvas = makeCanvas(sprite.w, sprite.h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sprite.canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, sprite.w, sprite.h);
  return { canvas, w: sprite.w, h: sprite.h, ax: sprite.ax, ay: sprite.ay };
}

// Draw a sprite with its anchor at (x, y) on a 2d context (screen coords).
export function blit(ctx, s, x, y, opts) {
  if (!opts) { ctx.drawImage(s.canvas, Math.round(x - s.ax), Math.round(y - s.ay)); return; }
  const { sx = 1, sy = 1, rot = 0, alpha = 1, flip = false } = opts;
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (rot) ctx.rotate(rot);
  ctx.scale(flip ? -sx : sx, sy);
  ctx.drawImage(s.canvas, -s.ax, -s.ay);
  ctx.restore();
}
