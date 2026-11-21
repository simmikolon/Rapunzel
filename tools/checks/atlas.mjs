import { launch, GAME, SITE, OUT } from './lib.mjs';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 432, height: 768 } });
await page.goto(GAME + '/?at=150');
await page.waitForFunction(() => window.game && window.game.gfx, null, { timeout: 30000 });
console.log(await page.evaluate(() => { const a = window.game.gfx.atlas, gl = document.createElement('canvas').getContext('webgl'); return { atlas: [a.canvas.width, a.canvas.height], sprites: a.count, maxTexture: gl && gl.getParameter(gl.MAX_TEXTURE_SIZE) }; }));
await browser.close();
