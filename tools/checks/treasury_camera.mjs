// The treasury's camera and its bubble: a bot plays the room for real (the game's own loop is frozen,
// the world is stepped by hand), the camera is checked never to go down, then he is dropped out of the picture.
import { launch, GAME, SITE, OUT } from './lib.mjs';
const [,, plan = '1'] = process.argv;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +(process.env.DSF || 1) });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${GAME}/?place=inside&dev=1&fx=off&at=50&spawn=vault${plan}`);
await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
const shot = async (name) => { await page.waitForTimeout(260); await page.screenshot({ path: `${OUT}/rescue_${name}.png` }); };
console.log('enter:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  window.game.update = () => {};
  w.level.nextPowerY = 1e9; w.pickups = w.pickups.filter((k) => k.kind !== 'power'); w.enemies.length = 0;
  const gate = w.platforms.find((p) => p.kind === 'gate' && p.gold);
  pl.x = gate.x; pl.y = gate.y + 160; pl.prevY = pl.y + 4; pl.vy = -300; pl.setState('falling'); pl.invuln = 9;
  let n = 0; while (!w.vault && n++ < 900) w.update(1 / 120);
  while (w.passage && n++ < 1200) w.update(1 / 120);
  const v = w.vault;
  return v ? `floor ${Math.round(v.floor)}, cam ${Math.round(w.cam.y - v.floor)} (lo ${Math.round(v.camLo - v.floor)}, hi ${Math.round(v.camHi - v.floor)})` : 'not in';
}));
await shot('0floor');
// climb: steer to the lowest platform above, as the simulator's bot does, and watch the camera
console.log('climb:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player, v = w.vault, inp = w.input;
  let last = w.cam.y, down = 0, maxStep = 0, n = 0, rescues = 0;
  w.onRescue = () => { rescues++; };
  const axisOf = () => {
    const plats = w.platforms.filter((q) => q.landable && q.kind !== 'chest');
    let above = null, below = null;
    for (const q of plats) { if (q.y > pl.y + 10 && (!above || q.y < above.y)) above = q; if (q.y <= pl.y + 10 && (!below || q.y > below.y)) below = q; }
    const apex = pl.vy > 0 ? pl.vy * pl.vy / 4200 : 0;
    const t = pl.vy > 0 ? (above && above.y - pl.y < apex + 60 ? above : below || above) : below || above;
    if (!t) return 0;
    const dx = t.x - pl.x; return Math.abs(dx) > 16 ? Math.sign(dx) : 0;
  };
  const real = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), 'axis') || Object.getOwnPropertyDescriptor(inp, 'axis');
  Object.defineProperty(inp, 'axis', { get: () => window.__axis || 0, set: () => {}, configurable: true });
  // stop on the platform under the door out
  while (w.vault && pl.y < v.floor + 1500 && n++ < 6000) { window.__axis = axisOf(); w.update(1 / 120); if (w.cam.y < last - 0.01) down++; maxStep = Math.max(maxStep, Math.abs(w.cam.y - last)); last = w.cam.y; }
  window.__axis = 0;
  return `steps ${n}, at ${Math.round(pl.y - v.floor)}, cam ${Math.round(w.cam.y - v.floor)}, frames the camera went down ${down}, biggest step ${maxStep.toFixed(1)} px, rescues ${rescues}, in vault ${!!w.vault}`;
}));
await shot('1climb');
// drop him out of the picture
console.log('fall:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player, v = w.vault;
  const cam0 = w.cam.y;
  pl.x = 150; pl.y = w.cam.y + 40; pl.prevY = pl.y + 5; pl.vy = -900; pl.setState('falling');
  window.__axis = 0;
  let n = 0; while (!pl.carried && n++ < 600) { pl.x = 150; w.update(1 / 120); }
  const caughtAt = Math.round(pl.y - w.cam.y);
  const to = pl.carried ? pl.carried.platform : null;
  for (let k = 0; k < 55; k++) w.update(1 / 120);
  window.__cam0 = cam0; window.__to = to;
  return pl.carried ? `caught after ${n} steps at ${caughtAt} px under the edge, carried toward ${to.kind} at ${Math.round(to.x)},${Math.round(to.y - w.cam.y)} px above the edge, alive ${pl.alive}` : 'not carried: alive ' + pl.alive;
}));
await shot('2carried');
console.log('down:', await page.evaluate(() => {
  const w = window.game.world, pl = w.player, to = window.__to;
  let n = 0; while (pl.carried && n++ < 900) w.update(1 / 120);
  const freeAt = Math.round(pl.y - to.y);
  let m = 0; while (pl.landedOn !== to && pl.state !== 'bouncing' && m++ < 400) w.update(1 / 120);
  return `let go after ${n} more steps ${freeAt} px above it, on it after ${m}: state ${pl.state} at ${Math.round(pl.y - to.y)} px, camera moved ${(w.cam.y - window.__cam0).toFixed(1)} px, hearts ${pl.hearts}, alive ${pl.alive}`;
}));
await shot('3down');
console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no errors');
await browser.close();
