import { PX } from '../config.js';
import { makeCanvas } from './sprite.js';

// Hand-made pictures that come as files instead of code: the title image
// (web/img/title.png, made from docs/art/title-source.png with
// tools/pixelate.py). A file holds one art pixel per image pixel; here it
// is scaled up to PX logical pixels per art pixel without smoothing and
// becomes a sprite like the procedural ones, so the atlas packs it too.
// A picture that failed to load leaves `null` and the title falls back to text.

export function buildUi(titleImage) {
  return { title: titleImage ? imageSprite(titleImage, { ax: 0.5, ay: 0.5 }) : null };
}

function imageSprite(img, anchor) {
  const w = img.naturalWidth * PX, h = img.naturalHeight * PX;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, w, h, ax: anchor.ax * w, ay: anchor.ay * h };
}

// Resolves to the image, or to null after an error or `ms` without one, so
// a missing picture never holds up the game.
export function loadImage(src, ms = 2500) {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), ms);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}
