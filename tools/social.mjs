// Pictures for social media, made from the game's own sprites: saves every canvas of site/dev/social.html
// (the Instagram profile pictures, 1080 x 1080, and an overview of how each looks in the circle).
//   python3 tools/serve.py --site 8002      (in another terminal)
//   node tools/social.mjs [out dir]         (default: docs/social/instagram)
import { mkdirSync, writeFileSync } from 'fs';
import { launch, SITE } from './checks/lib.mjs';
const out = process.argv[2] || 'docs/social/instagram';
mkdirSync(out, { recursive: true });
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(SITE + '/dev/social.html');
await page.waitForFunction(() => window.__social, null, { timeout: 30000 });
const pictures = await page.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => ({ name: c.dataset.name, w: c.width, h: c.height, png: c.toDataURL('image/png').split(',')[1] })));
for (const p of pictures) {
  writeFileSync(`${out}/${p.name}.png`, Buffer.from(p.png, 'base64'));
  console.log(`${out}/${p.name}.png  ${p.w} x ${p.h}`);
}
if (errors.length) console.log('ERRORS:', errors.join(' | '));
await browser.close();
process.exit(errors.length ? 1 : 0);
