// Lord Springalot's chimney, in the browser: a fireplace stands above the start (?spawn=chimney), the prince lands
// on it and it is the lord who stands on the hearth; his hops are his own, the walls stop him, a damper is a
// ceiling, one who drops out of the picture is carried back up; he climbs the shaft (a small bot steers him) and
// goes out by the soot door, and it is the prince who goes on in the tower. Pictures of each step.
import { launch, GAME, OUT } from './lib.mjs';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +(process.env.DSF || 1) });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let failed = 0;
const check = (name, ok, info) => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${JSON.stringify(info)}`); };
const shot = async (name) => { await page.waitForTimeout(260); await page.screenshot({ path: `${OUT}/chimney_${name}.png` }); };

await page.goto(`${GAME}/?place=inside&fx=off&story=0&at=50&spawn=chimney`);
await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });

const door = await page.evaluate(() => {
  const w = window.game.world;
  window.game.update = () => {};
  w.level.nextPowerY = 1e9; w.pickups = w.pickups.filter((k) => k.kind !== 'power'); w.enemies.length = 0;
  for (let k = 0; k < 30; k++) w.update(1 / 120);
  w.toasts.length = 0;
  const gt = w.platforms.find((p) => p.kind === 'gate' && p.chimney);
  return gt ? { gold: gt.gold, over: Math.round(gt.y - w.player.y), who: w.player.who } : null;
});
check('a fireplace stands above the start, and the prince is played', !!door && door.gold === 'in' && door.who === 'prince', door);
await shot('0fireplace');

const into = await page.evaluate(() => {
  const w = window.game.world, pl = w.player, gt = w.platforms.find((p) => p.kind === 'gate' && p.chimney);
  pl.x = gt.x; pl.y = gt.y + 120; pl.prevY = pl.y + 4; pl.vx = 0; pl.vy = -100; pl.setState('falling');
  let n = 0; while (!w.passage && n++ < 300) w.update(1 / 120);
  const suns = w.suns;      // (what he has when the fireplace takes him: a sun may hang right over its landing)
  while (!w.vault && n++ < 900) w.update(1 / 120);
  while (w.passage && n++ < 1200) w.update(1 / 120);
  w.toasts.length = 0;
  const v = w.vault;
  return { place: w.place.name, who: pl.who, h: pl.h, walls: w.walls, room: v && { up: Math.round(v.exitY - v.floor), worth: v.suns }, things: w.platforms.filter((p) => ['flue', 'kettle', 'damper'].includes(p.kind)).length, sunsKept: w.suns === suns };
});
check('through it somebody small stands on the hearth of the chimney', into.place === 'chimney' && into.who === 'kid' && into.walls > 0 && into.things > 10 && into.sunsKept, into);
await shot('1hearth');

const hop = await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  let top = 0, base = null, t0 = null, per = null;
  for (let k = 0; k < 600; k++) {
    w.input.axis = 0; w.update(1 / 120);
    if (pl.state === 'bouncing' && pl.landedOn) { if (t0 != null && per == null && w.time - t0 > 0.3) per = w.time - t0; base = pl.landedOn.y; if (t0 == null || w.time - t0 > 0.3) t0 = w.time; }
    if (base != null) top = Math.max(top, pl.y - base);
  }
  for (let k = 0; k < 150; k++) { w.input.axis = 1; w.update(1 / 120); }
  return { apex: Math.round(top), period: per && +per.toFixed(2), atWall: Math.round(pl.x), wall: w.walls - pl.bodyW / 2 };
});
check('his hops are short and quick, and a wall stops him', hop.apex > 250 && hop.apex < 340 && hop.period < 1.3 && hop.atWall === hop.wall, hop);

const bump = await page.evaluate(() => {
  const w = window.game.world, pl = w.player, d = w.platforms.find((p) => p.kind === 'damper');
  pl.x = d.x; pl.y = d.bottom - pl.h - 60; pl.prevY = pl.y; pl.vx = 0; pl.vy = 900; pl.setState('jumping');
  let bonked = false; for (let k = 0; k < 40; k++) { w.input.axis = 0; w.update(1 / 120); if (pl.state === 'bonk') bonked = true; }
  return { bonked, below: pl.headY <= d.bottom + 1, hearts: pl.hearts };
});
check('a damper is a ceiling from below, and costs nothing', bump.bonked && bump.below && bump.hearts === 3, bump);

const climb = await page.evaluate(() => {
  // the bot: toward the lowest thing to stand on above the one he last stood on
  const w = window.game.world, pl = w.player, v = w.vault;
  pl.x = 0; pl.y = v.floor + 40; pl.prevY = pl.y + 4; pl.vx = 0; pl.vy = -100; pl.setState('falling');
  let last = v.floor, n = 0, rescues = 0, was = false;
  const t0 = w.time;
  while (w.vault && n++ < 120 * 90) {
    if (pl.state === 'bouncing' && pl.landedOn) last = pl.landedOn.y;
    if (pl.carried && !was) rescues++; was = !!pl.carried;
    let best = null; for (const q of w.platforms) { if (!q.landable || q.y <= last + 20) continue; if (!best || q.y < best.y) best = q; }
    const tx = best ? best.x : pl.x; w.input.axis = Math.abs(tx - pl.x) < 14 ? 0 : tx > pl.x ? 1 : -1;
    w.update(1 / 120);
    if (n === 600) window.__mid = true;
  }
  return { out: !w.vault, seconds: +(w.time - t0).toFixed(1), rescues, got: w.suns, of: v.suns };
});
check('he climbs the shaft to the soot door', climb.out && climb.seconds < 60, climb);

const after = await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  let n = 0; while (w.passage && n++ < 400) w.update(1 / 120);
  for (let k = 0; k < 20; k++) { w.input.axis = 0; w.update(1 / 120); }
  const hatch = w.platforms.find((p) => p.kind === 'gate' && p.chimney);
  return { place: w.place.name, who: pl.who, h: pl.h, walls: w.walls, alive: pl.alive, hatch: !!hatch && hatch.gold, height: w.heightM };
});
check('and out of it the prince goes on in the tower', after.place === 'inside' && after.who === 'prince' && after.walls === 0 && after.alive && after.hatch === 'out' && after.height > 65, after);
await shot('2out');

// once more, for the pictures in the shaft and the bubble
await page.goto(`${GAME}/?place=inside&fx=off&story=0&at=50&spawn=chimney`);
await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
const drop = await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  window.game.update = () => {};
  for (let k = 0; k < 30; k++) w.update(1 / 120);
  const gt = w.platforms.find((p) => p.kind === 'gate' && p.chimney);
  pl.x = gt.x; pl.y = gt.y + 120; pl.prevY = pl.y + 4; pl.vx = 0; pl.vy = -100; pl.setState('falling');
  let n = 0; while (!w.vault && n++ < 900) w.update(1 / 120);
  while (w.passage && n++ < 1200) w.update(1 / 120);
  const v = w.vault, ledge = w.platforms.filter((p) => p.kind === 'flue').sort((a, b) => a.y - b.y)[3];
  pl.x = ledge.x; pl.y = ledge.y + 40; pl.prevY = pl.y + 4; pl.vx = 0; pl.vy = -100; pl.setState('falling');
  for (let k = 0; k < 300; k++) { w.input.axis = 0; w.update(1 / 120); }
  w.toasts.length = 0;
  return { camOver: Math.round(w.cam.y - v.floor) };
});
await shot('3shaft');
const carried = await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  pl.x = 60; pl.y = w.cam.y - 300; pl.prevY = pl.y; pl.vx = 0; pl.vy = -400; pl.setState('falling');
  let carried = false; for (let k = 0; k < 40; k++) { w.input.axis = 0; w.update(1 / 120); if (pl.carried) carried = true; }
  return { carried, alive: pl.alive };
});
await shot('4bubble');
const down = await page.evaluate(() => {
  const w = window.game.world, pl = w.player;
  for (let k = 0; k < 400; k++) { w.input.axis = 0; w.update(1 / 120); }
  return { carried: !!pl.carried, alive: pl.alive, inPicture: pl.y > w.cam.y, who: pl.who };
});
check('one who drops out of the picture is carried back up and set down', carried.carried && carried.alive && !down.carried && down.alive && down.inPicture && down.who === 'kid', { ...drop, ...carried, down });

check('no errors', errors.length === 0, [...new Set(errors)]);
console.log(failed ? `${failed} failed` : 'all ok');
await browser.close();
process.exit(failed ? 1 : 0);
