// The game's flow in the browser: the title's selector switches the world, a round is played inside, a
// death, TRY AGAIN stays inside, back outside; every inside ?spawn helper; the landing page draws.
//   node tools/checks/flow.mjs      (needs both servers: tools/serve.py, and tools/serve.py --site 8002)
import { launch, GAME, SITE, OUT } from './lib.mjs';
const browser = await launch();
let bad = 0;
const report = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${extra}`); };
const open = async (url) => {
  const page = await browser.newPage({ viewport: { width: 432, height: 768 } });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 40000 });
  await page.waitForTimeout(400);
  return page;
};
{
  const page = await open(GAME + '/?at=1');
  const before = await page.evaluate(() => window.game.world.place.name);
  await page.keyboard.press('KeyI');
  await page.waitForTimeout(500);
  const mid = await page.evaluate(() => ({ place: window.game.world.place.name, zones: window.game.world.level.zones[0].name, kinds: [...new Set(window.game.world.platforms.map((p) => p.kind))] }));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  const play = await page.evaluate(() => ({ place: window.game.world.place.name, h: window.game.world.heightM }));
  await page.evaluate(() => { const w = window.game.world; w.player.hearts = 1; w.player.invuln = 0; w.player.hit({ x: 0, kind: 'bat' }); });
  const over = await page.waitForFunction(() => window.game.mode === 'gameover', null, { timeout: 30000 }).then(() => true, () => false);
  await page.waitForTimeout(1200);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing' || window.game.mode === 'title', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  const again = await page.evaluate(() => ({ mode: window.game.mode, place: window.game.world.place.name }));
  report('selector, round, death, again', before === 'outside' && mid.place === 'inside' && play.place === 'inside' && over && again.place === 'inside' && !page.errors.length, JSON.stringify({ before, mid, play, over, again, errors: page.errors }));
  // back outside on the title
  await page.reload();
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 40000 });
  await page.waitForTimeout(400);
  const saved = await page.evaluate(() => window.game.world.place.name);
  await page.keyboard.press('KeyO');
  await page.waitForTimeout(400);
  const out = await page.evaluate(() => ({ place: window.game.world.place.name, kinds: [...new Set(window.game.world.platforms.map((p) => p.kind))] }));
  report('choice saved, back outside', saved === 'inside' && out.place === 'outside' && !out.kinds.includes('chandelier') && !page.errors.length, JSON.stringify({ saved, out, errors: page.errors }));
  await page.close();
}
for (const el of ['bat', 'guard', 'grabber', 'web', 'ghost', 'star']) {
  const page = await open(`${GAME}/?place=inside&at=320&spawn=${el}`);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const st = await page.evaluate((el) => { const w = window.game.world; return { enemies: w.enemies.filter((e) => e.kind === el).length, power: w.player.power, pickup: w.pickups.some((k) => k.power === el), on: (w.enemies.find((e) => e.kind === el) || {}).platform ? w.enemies.find((e) => e.kind === el).platform.kind : (w.enemies.find((e) => e.kind === el) || {}).win ? 'hatch f=' + w.enemies.find((e) => e.kind === el).win.f : '' }; }, el);
  report(`inside spawn=${el}`, (st.enemies > 0 || st.power === el || st.pickup) && !page.errors.length, JSON.stringify({ st, errors: page.errors }));
  await page.close();
}
{
  // the landing page still draws with the game's modules
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(SITE + '/');
  await page.waitForTimeout(2500);
  const n = await page.evaluate(() => document.querySelectorAll('canvas').length);
  report('landing page', n > 0 && !errors.length, JSON.stringify({ canvases: n, errors }));
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} FAILED` : 'all ok');
