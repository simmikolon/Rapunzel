// Screenshots of the game frozen at a height:
//   node tools/checks/shots.mjs <outside|inside> <at,at,...> [fx=off|bloom|full] [wait ms] [extra query]
// e.g. `shots.mjs outside 20,180,420` or `shots.mjs inside 150 off 900 spawn=cat`. DSF=2 doubles the resolution.
import { launch, GAME, OUT } from './lib.mjs';
const [,, place = 'outside', ats = '0', fx = 'off', waitArg = '900', extra = ''] = process.argv;
const browser = await launch();
for (const at of ats.split(',')) {
  const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +(process.env.DSF || 1) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${GAME}/?place=${place}&fx=${fx}${+at ? '&at=' + at : ''}${extra ? '&' + extra : ''}`);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
  await page.waitForTimeout(500);
  if (at === 'title') { await page.screenshot({ path: `${OUT}/${place}_title.png` }); console.log('title', errors.join(' | ')); await page.close(); continue; }
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
  await page.evaluate(() => { const w = window.game.world; w.level.nextPowerY = 1e9; w.pickups = w.pickups.filter((k) => k.kind !== 'power'); });
  await page.waitForTimeout(+waitArg);
  await page.evaluate(() => { window.game.update = () => {}; window.game.world.toasts.length = 0; });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${place}_${at}.png` });
  const info = await page.evaluate(() => { const w = window.game.world; const c = {}; for (const p of w.platforms) c[p.kind] = (c[p.kind] || 0) + 1; const e = {}; for (const q of w.enemies) e[q.kind] = (e[q.kind] || 0) + 1; return { h: w.heightM, place: w.place.name, plats: c, enemies: e, glows: w.bg.interior.glows.length }; });
  console.log(at, JSON.stringify(info), errors.length ? 'ERRORS: ' + errors.join(' | ') : '');
  await page.close();
}
await browser.close();
