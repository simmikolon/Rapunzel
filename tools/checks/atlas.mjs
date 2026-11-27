// The sprite atlas (web/src/gfx/atlas.js): its size, which has to stay under the smallest MAX_TEXTURE_SIZE we
// support (4096), and whether it holds what the sprites show. The atlas keeps a sprite at art size, one texel to an
// art pixel, so every sprite it keeps that way has to be on the art grid: each block of PX x PX pixels of its canvas
// one colour. A sprite that is not loses what is between the art pixels, silently; here it is named. (A sprite that
// is meant to be off the grid says `fine: true` and goes onto the second sheet at full size.)
// The game gives the sprites' own canvases back once the atlas is packed (release in atlas.js), so the check builds
// the art a second time for its pixels and looks each sprite up in the game's atlas by its place in the art; and it
// fails if a sprite of the game still holds a canvas. (The second time in a frame of its own, with modules of its
// own: art/tower.js draws from one random generator for as long as the page lives, so a second build beside the
// first has other bricks.)
// And a budget, so that the art does not outgrow a phone unnoticed again (it had grown to 4096 x 3970 before the
// atlas was put at art size). What grows now is the sprites' own canvases: each sprite is drawn four times its art
// size on one, 64 bytes to an art pixel, and all of them are there together while the game starts, until the atlas
// is packed. The check says where the size goes and fails past BUDGET: then the art is slimmed (docs/ART.md, What a
// sprite costs), or the budget is raised here on purpose, with the reason in docs/DESIGN.md's decision log.
//   node tools/checks/atlas.mjs
import { launch, GAME } from './lib.mjs';
const LIMIT = 4096;
const BUDGET = { drawnMB: 80, fine: 2 };      // the sprites' canvases in all while the game starts (55 MB on 2026-11-27), and sprites kept off the grid (1)
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
  // The art once more, with its canvases, and next to each sprite the game's own (`twin`), which has the place in the atlas.
  const frame = document.createElement('iframe');
  frame.srcdoc = '<script type="module">import { buildAllArt } from "/src/art/index.js"; try { window.art = buildAllArt(); } catch (e) { window.artError = String(e); }</' + 'script>';
  document.body.appendChild(frame);
  for (let i = 0; !frame.contentWindow.art; i++) { if (frame.contentWindow.artError || i > 600) throw new Error('the art could not be built a second time: ' + (frame.contentWindow.artError || 'nothing after a minute')); await new Promise((f) => setTimeout(f, 100)); }
  const items = [], seen = new Set(), kept = [], unpacked = [];
  const walk = (obj, twin, path) => { for (const k of Object.keys(obj)) { const v = obj[k], t = twin && twin[k]; if (!v || typeof v !== 'object') continue; if (v.canvas) { if (!seen.has(v)) { seen.add(v); items.push([path + k, v, t]); } } else walk(v, t, path + k + '.'); } };
  walk(frame.contentWindow.art, window.game.art, '');
  const sheet = a.canvas.getContext('2d').getImageData(0, 0, a.canvas.width, a.canvas.height).data, SW = a.canvas.width;
  const off = [], lost = [], fine = [], groups = {}, sizes = [];
  let area = 0;
  for (const [name, s, twin] of items) {
    const w = s.canvas.width, h = s.canvas.height;
    area += w * h;
    if (!twin || !twin.tex || twin.w !== w || twin.h !== h) { unpacked.push(`${name} ${w}x${h}`); continue; }
    if (twin.canvas) kept.push(`${name} ${twin.canvas.width}x${twin.canvas.height}`);
    const group = name.split('.').slice(0, name.startsWith('tiles.') || name.startsWith('trees.') || name.startsWith('interior.') ? 2 : 1).join('.');
    const e = (groups[group] = groups[group] || { n: 0, px: 0 }); e.n++; e.px += w * h;
    sizes.push([name, w / PX, h / PX]);
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
    const fx = twin.tex.frame.x / PX, fy = twin.tex.frame.y / PX;
    let wrong = 0;
    for (let ay = 0; ay < h / PX; ay++) for (let ax = 0; ax < w / PX; ax++) {
      const i = (ay * PX * w + ax * PX) * 4, j = ((fy + ay) * SW + fx + ax) * 4;
      if (Math.abs(d[i] - sheet[j]) > 2 || Math.abs(d[i + 1] - sheet[j + 1]) > 2 || Math.abs(d[i + 2] - sheet[j + 2]) > 2 || Math.abs(d[i + 3] - sheet[j + 3]) > 2) wrong++;
    }
    if (wrong) lost.push(`${name} ${w}x${h}: ${wrong} art pixels`);
  }
  return { atlas: [a.canvas.width, a.canvas.height], fineSheet: a.fine ? [a.fine.canvas.width, a.fine.canvas.height] : null, sprites: a.count, drawn: area,
    maxTexture: gl && gl.getParameter(gl.MAX_TEXTURE_SIZE), fine, off, lost, kept, unpacked,
    groups: Object.entries(groups).sort((p, q) => q[1].px - p[1].px).slice(0, 8).map(([k, e]) => `${k} ${Math.round((e.px / area) * 100)} % (${e.n})`),
    biggest: sizes.sort((p, q) => q[1] * q[2] - p[1] * p[2]).slice(0, 5).map(([k, w, h]) => `${k} ${w} x ${h}`) };
});
await browser.close();
const mb = (w, h) => ((w * h * 4) / 1048576).toFixed(1);
const drawnMB = (r.drawn * 4) / 1048576;
console.log(`atlas ${r.atlas[0]} x ${r.atlas[1]} texels at art size (${mb(...r.atlas)} MB), ${r.sprites} sprites; their own canvases, at full size while the game starts, are ${drawnMB.toFixed(0)} MB of a budget of ${BUDGET.drawnMB}, and ${r.kept.length} of them are left once the atlas is packed`);
console.log(`where it goes: ${r.groups.join(', ')}`);
console.log(`the biggest (art px): ${r.biggest.join(', ')}`);
if (r.fineSheet) console.log(`second sheet ${r.fineSheet[0]} x ${r.fineSheet[1]} at full size for what is not on the grid: ${r.fine.join(', ')}`);
console.log(`this machine's MAX_TEXTURE_SIZE ${r.maxTexture}; ours to stay under: ${LIMIT}`);
let bad = errors.length;
for (const e of errors) console.log('FAIL', e);
if (Math.max(...r.atlas, ...(r.fineSheet || [0])) > LIMIT) { bad++; console.log(`FAIL a sheet is larger than ${LIMIT}`); }
for (const o of r.off) { bad++; console.log('FAIL not on the art grid (draw it on the grid, or mark the sprite `fine: true`):', o); }
for (const o of r.lost) { bad++; console.log('FAIL the atlas does not hold the sprite as drawn:', o); }
for (const o of r.unpacked) { bad++; console.log('FAIL the game\'s atlas has no such sprite, or at another size (is the art the same in every page that builds it?):', o); }
for (const o of r.kept) { bad++; console.log('FAIL the sprite still holds its canvas after the atlas is packed:', o); }
if (drawnMB > BUDGET.drawnMB) { bad++; console.log(`FAIL the art has outgrown its budget (${drawnMB.toFixed(0)} MB of ${BUDGET.drawnMB}): slim it (docs/ART.md, What a sprite costs), or raise BUDGET here and say why in docs/DESIGN.md`); }
if (r.fine.length > BUDGET.fine) { bad++; console.log(`FAIL ${r.fine.length} sprites are kept off the grid (a budget of ${BUDGET.fine}): each costs sixteen times its art`); }
console.log(bad ? `${bad} problems` : 'ok   every sprite kept at art size is on the grid, the atlas holds it as drawn, and none keeps a canvas of its own');
process.exit(bad ? 1 : 0);
