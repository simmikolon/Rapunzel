// A whole treasury from floor to ceiling in one picture: node iroom.mjs <first section 1..6> [out name]
import { launch, GAME, SITE, OUT } from './lib.mjs';
const [,, first = '1', out = `room${first}`] = process.argv;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${GAME}/?place=inside&dev=1&fx=off&at=50&spawn=vault${first}`);
await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
const info = await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  window.game.update = () => {};
  w.level.nextPowerY = 1e9; w.pickups = w.pickups.filter((k) => k.kind !== 'power'); w.enemies.length = 0;
  const gate = w.platforms.find((p) => p.kind === 'gate' && p.gold);
  pl.x = gate.x; pl.y = gate.y + 160; pl.prevY = pl.y + 4; pl.vy = -300; pl.setState('falling'); pl.invuln = 0;
  let n = 0; while (!w.vault && n++ < 900) w.update(1 / 120);
  while (w.passage && n++ < 1200) w.update(1 / 120);
  const v = w.vault; w.toasts.length = 0;
  const c = {}; for (const p of w.platforms) c[p.kind] = (c[p.kind] || 0) + 1;
  const k = {}; for (const q of w.pickups) { const n2 = q.kind === 'treasure' ? q.what : q.kind; k[n2] = (k[n2] || 0) + 1; }
  return { lo: v.camLo - v.floor, hi: v.camHi - v.floor, exit: v.exitY - v.floor, top: v.top - v.floor, worth: v.suns, sections: v.sections, plats: c, picks: k };
});
console.log(JSON.stringify(info));
const shots = [];
for (let c = info.lo; ; c += 960) {
  const at = Math.min(c, info.hi);
  await page.evaluate((at) => { const w = window.game.world, v = w.vault; w.cam.y = w.cam.target = v.floor + at; w.player.y = v.floor + at - 3000; w.player.prevY = w.player.y; for (const p of w.platforms) p.update(0, w.time, (y) => w.bg.interior.chainX(y, w.time), w.cam); }, at);
  await page.waitForTimeout(260);
  const path = `${OUT}/${out}_${shots.length}.png`;
  await page.screenshot({ path });
  shots.push({ path, at });
  if (at >= info.hi) break;
}
console.log(JSON.stringify(shots.map((s) => s.at)), errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no errors');
await browser.close();
