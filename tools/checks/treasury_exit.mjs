// Out of the treasury by the door at the top, in the browser: the prince is put above the door out and lands on it.
import { launch, GAME, SITE, OUT } from './lib.mjs';
const [,, first = '1'] = process.argv;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +(process.env.DSF || 1) });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${GAME}/?place=inside&dev=1&fx=off&at=50&spawn=vault${first}`);
await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
const shot = async (name) => { await page.waitForTimeout(260); await page.screenshot({ path: `${OUT}/exit_${name}.png` }); };
console.log('enter:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  window.game.update = () => {};
  w.level.nextPowerY = 1e9; w.pickups = w.pickups.filter((k) => k.kind !== 'power'); w.enemies.length = 0;
  const gate = w.platforms.find((p) => p.kind === 'gate' && p.gold);
  pl.x = gate.x; pl.y = gate.y + 160; pl.prevY = pl.y + 4; pl.vy = -300; pl.setState('falling');
  let n = 0; while (!w.vault && n++ < 900) w.update(1 / 120);
  while (w.passage && n++ < 1200) w.update(1 / 120);
  const v = w.vault;
  return v ? `sections ${v.sections.join(', ')}; exit ${Math.round(v.exitY - v.floor)}, worth ${v.suns}` : 'not in';
}));
console.log('top:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player, v = w.vault;
  // onto one of the two ledges under the door out, and a few bounces there (the camera climbs to its stop)
  // the one on the side away from the door out, so that he does not hop onto its landing by himself
  const ledge = w.platforms.filter((p) => (p.kind === 'branchL' || p.kind === 'branchR') && p.y < v.exitY && p.x * v.exit.x < 0).sort((a, b) => b.y - a.y)[0];
  pl.x = ledge.x; pl.y = ledge.y + 60; pl.prevY = pl.y + 4; pl.vy = -200; pl.setState('falling');
  let n = 0, down = 0, last = w.cam.y;
  while (n++ < 420) { pl.x = ledge.x; w.update(1 / 120); if (w.cam.y < last - 0.01) down++; last = w.cam.y; if (n > 300 && pl.state === 'bouncing') break; }
  return `in vault ${!!w.vault}, on ${ledge.kind} ${Math.round(ledge.y - v.floor)}, cam ${Math.round(w.cam.y - v.floor)} (hi ${Math.round(v.camHi - v.floor)}), went down ${down}, suns ${w.suns}, pickups left ${w.pickups.filter((k) => k.alive).length}, door out at ${Math.round(v.exit.y - v.floor)} (planned ${Math.round(v.exitY - v.floor)})`;
}));
await shot('0top');
console.log('leave:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player, v = w.vault, exit = v.exit, h0 = w.heightM;
  pl.x = exit.x; pl.y = exit.y + 150; pl.prevY = pl.y + 4; pl.vy = -300; pl.setState('falling');
  let n = 0; while (!w.passage && n++ < 300) w.update(1 / 120);
  const began = n;
  while (w.passage && n++ < 900) w.update(1 / 120);
  for (let k = 0; k < 20; k++) w.update(1 / 120);
  const c = {}; for (const p of w.platforms) c[p.kind] = (c[p.kind] || 0) + 1;
  return `passage after ${began}, through after ${n}: place ${w.place.name}, vault ${!!w.vault}, room ${w.cam.room}, ${h0} -> ${w.heightM} m, plats ${JSON.stringify(c)}, toast ${w.toasts.map((t) => t.text).join(' / ')}`;
}));
await shot('1out');
console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no errors');
await browser.close();
