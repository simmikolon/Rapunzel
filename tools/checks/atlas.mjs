// The sprite atlas (web/src/gfx/atlas.js): its size, which has to stay under the smallest MAX_TEXTURE_SIZE we
// support (4096), and whether it holds what the sprites show. The atlas keeps a sprite at art size, one texel to an
// art pixel, so every sprite it keeps that way has to be on the art grid: each block of PX x PX pixels of its canvas
// one colour. A sprite that is not loses what is between the art pixels, silently; here it is named. (A sprite that
// is meant to be off the grid says `fine: true` and goes onto the second sheet at full size.)
//   node tools/checks/atlas.mjs
import { launch, GAME } from './lib.mjs';
const LIMIT = 4096;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 432, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(GAME + '/?at=150&story=0');
await page.waitForFunction(() => window.game && window.game.gfx && window.game.gfx.atlas, null, { timeout: 60000 });
const r = await page.evaluate(async () => {
  const { onGrid } = await import('/src/gfx/atlas.js');
  const { PX } = await import('/src/config.js');
  const a = window.game.gfx.atlas, gl = document.createElement('canvas').getContext('webgl');
  const items = [], seen = new Set();
  const walk = (obj, path) => { for (const k of Object.keys(obj)) { const v = obj[k]; if (!v || typeof v !== 'object') continue; if (v.canvas) { if (!seen.has(v)) { seen.add(v); items.push([path + k, v]); } } else walk(v, path + k + '.'); } };
  walk(window.game.art, '');
  const sheet = a.canvas.getContext('2d').getImageData(0, 0, a.canvas.width, a.canvas.height).data, SW = a.canvas.width;
  const off = [], lost = [], fine = [];
  let area = 0;
  for (const [name, s] of items) {
    const w = s.canvas.width, h = s.canvas.height;
    area += w * h;
    if (!onGrid(s)) { fine.push(`${name} ${w}x${h}`); continue; }
    const d = s.canvas.getContext('2d').getImageData(0, 0, w, h).data;
    // on the grid: every block one colour
    let blocks = 0;
    for (let by = 0; by < h; by += PX) for (let bx = 0; bx < w; bx += PX) {
      const i0 = (by * w + bx) * 4;
      scan: for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
        const i = ((by + y) * w + bx + x) * 4;
        if (d[i] !== d[i0] || d[i + 1] !== d[i0 + 1] || d[i + 2] !== d[i0 + 2] || d[i + 3] !== d[i0 + 3]) { blocks++; break scan; }
      }
    }
    if (blocks) { off.push(`${name} ${w}x${h}: ${blocks} blocks`); continue; }
    // and the sheet holds it: each of its art pixels is the texel at its place (within a step of rounding, where a colour is see-through)
    const fx = s.tex.frame.x / PX, fy = s.tex.frame.y / PX;
    let wrong = 0;
    for (let ay = 0; ay < h / PX; ay++) for (let ax = 0; ax < w / PX; ax++) {
      const i = (ay * PX * w + ax * PX) * 4, j = ((fy + ay) * SW + fx + ax) * 4;
      if (Math.abs(d[i] - sheet[j]) > 2 || Math.abs(d[i + 1] - sheet[j + 1]) > 2 || Math.abs(d[i + 2] - sheet[j + 2]) > 2 || Math.abs(d[i + 3] - sheet[j + 3]) > 2) wrong++;
    }
    if (wrong) lost.push(`${name} ${w}x${h}: ${wrong} art pixels`);
  }
  return { atlas: [a.canvas.width, a.canvas.height], fineSheet: a.fine ? [a.fine.canvas.width, a.fine.canvas.height] : null, sprites: a.count, drawn: area,
    maxTexture: gl && gl.getParameter(gl.MAX_TEXTURE_SIZE), fine, off, lost };
});
await browser.close();
const mb = (w, h) => ((w * h * 4) / 1048576).toFixed(1);
console.log(`atlas ${r.atlas[0]} x ${r.atlas[1]} texels at art size (${mb(...r.atlas)} MB), ${r.sprites} sprites; at full size they are ${(r.drawn * 4 / 1048576).toFixed(0)} MB`);
if (r.fineSheet) console.log(`second sheet ${r.fineSheet[0]} x ${r.fineSheet[1]} at full size for what is not on the grid: ${r.fine.join(', ')}`);
console.log(`this machine's MAX_TEXTURE_SIZE ${r.maxTexture}; ours to stay under: ${LIMIT}`);
let bad = errors.length;
for (const e of errors) console.log('FAIL', e);
if (Math.max(...r.atlas, ...(r.fineSheet || [0])) > LIMIT) { bad++; console.log(`FAIL a sheet is larger than ${LIMIT}`); }
for (const o of r.off) { bad++; console.log('FAIL not on the art grid (draw it on the grid, or mark the sprite `fine: true`):', o); }
for (const o of r.lost) { bad++; console.log('FAIL the atlas does not hold the sprite as drawn:', o); }
console.log(bad ? `${bad} problems` : 'ok   every sprite kept at art size is on the grid, and the atlas holds it as drawn');
process.exit(bad ? 1 : 0);
