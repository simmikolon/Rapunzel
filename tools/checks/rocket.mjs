// Lord Springalot and his rocket, in the browser. The title's switch chooses who climbs (two boards, a head on each),
// the choice is kept, and each has his own best heights. With ?who=lord he stands on the title's lawn and climbs the tower
// with the prince's jump; the boost held down burns the rocket for as long as it is held, on the boost's charges
// (a charge in half a second, and a charge burnt from rest lifts him some 9 m);
// let go, it is out; a tap is a short burn; with nothing in the tank nothing burns; a landing brings half a charge
// back; while it burns he knocks away what he touches. And the prince's boost is the tap it was. Pictures.
import { launch, GAME, OUT } from './lib.mjs';
const browser = await launch();
const errors = [];
let failed = 0;
const check = (name, ok, info) => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${JSON.stringify(info)}`); };
const open = async (query) => {
  const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +(process.env.DSF || 1) });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${GAME}/?fx=off&story=0&${query}`);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
  await page.waitForTimeout(400);
  return page;
};
const start = async (page) => {
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 15000 });
  await page.evaluate(() => {
    const w = window.game.world;
    window.game.update = () => {};
    w.level.nextPowerY = 1e9; w.pickups = w.pickups.filter((k) => k.kind !== 'power'); w.enemies.length = 0; w.toasts.length = 0;
    // onto the next branch above him, and still: the world is stepped by hand from here
    window.__land = (tank) => {
      const pl = w.player, inp = w.input;
      const p = w.platforms.filter((q) => q.landable && !q.dry && (q.kind === 'branchL' || q.kind === 'branchR') && q.y > pl.y + 100).sort((a, b) => a.y - b.y)[0];
      pl.x = p.x; pl.y = p.y + 30; pl.prevY = pl.y + 4; pl.vx = 0; pl.vy = -100; pl.setState('falling');
      inp.boostHeld = false; inp.boostQueued = 0; inp.axis = 0;
      let n = 0; while (pl.state !== 'bouncing' && n++ < 200) { w.update(1 / 120); w.enemies.length = 0; }
      pl.boost = tank;
      return p;
    };
    // a lone hop from there with so much in the tank, the boost held from `from` seconds into the air for `hold`: what he does
    // and what it costs, up to the top of his flight (`down`: until he has landed again; the camera only climbs, so that is
    // for hops that do not go far)
    window.__hop = (tank, hold, from = 0, down = false) => {
      const pl = w.player, inp = w.input, p = window.__land(tank);
      let top = 0, burnt = 0, shielded = 0, pose = null, t = 0, vyMax = 0, low = tank;
      for (let k = 0; k < 900; k++) {
        const air = pl.state !== 'bouncing';
        if (air) t += 1 / 120;
        inp.boostHeld = air && t > from && t <= from + hold;
        inp.axis = 0; pl.x = p.x;
        for (const q of w.pickups) if (q.kind === 'lantern') q.alive = false;      // (a lantern on his way would fill the tank again)
        w.update(1 / 120); w.enemies.length = 0;
        if (pl.thrusting) { burnt++; pose = pl.pose(); if (pl.shielded) shielded++; vyMax = Math.max(vyMax, pl.vy); }
        top = Math.max(top, pl.y - p.y);
        if (k > 30 && (pl.state === 'bouncing' || (!down && pl.vy < 0 && t > from + hold))) break;
        low = Math.min(low, pl.boost);
      }
      inp.boostHeld = false;
      return { apex: Math.round(top), burnt: +(burnt / 120).toFixed(2), used: +(tank - low).toFixed(2), after: +pl.boost.toFixed(2), shielded: burnt > 0 && shielded === burnt, pose, vyMax: Math.round(vyMax) };
    };
    // a tap, 0.8 s into a hop
    window.__tap = (tank) => {
      const pl = w.player, inp = w.input, p = window.__land(tank);
      for (let k = 0; k < 96; k++) { pl.x = p.x; w.update(1 / 120); w.enemies.length = 0; }
      inp.boostQueued++;
      w.update(1 / 120);
      const first = { state: pl.state, left: +pl.boost.toFixed(2), vy: Math.round(pl.vy) };
      let burnt = pl.thrusting ? 1 : 0; for (let k = 0; k < 60; k++) { pl.x = p.x; w.update(1 / 120); w.enemies.length = 0; if (pl.thrusting) burnt++; }
      return { burnt: +(burnt / 120).toFixed(2), left: +pl.boost.toFixed(2), first };
    };
  });
};

// --- the title's switch
const tapZone = async (page, id) => {
  const z = await page.evaluate((id) => { const g = window.game; g.hud.layout(g.mode); const z = g.input.buttonZones.find((q) => q.id === id); const r = g.canvas ? g.canvas.getBoundingClientRect() : document.getElementById('game').getBoundingClientRect(); return z ? [r.left + (z.x + z.w / 2) / 768 * r.width, r.top + (z.y + z.h / 2) / (768 * r.height / r.width) * r.height] : null; }, id);
  if (!z) return false;
  await page.mouse.click(z[0], z[1]);
  await page.waitForTimeout(350);
  return true;
};
const who = (page) => page.evaluate(() => { const g = window.game; return { who: g.who, onLawn: g.world.player.who, best: g.best, saved: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /bounce/i.test(k)) || '') || '{}').who || 'prince' }; });
let page = await open('');
await page.evaluate(() => { const g = window.game; g.allBests.prince.stages = 123; g.save(); });
const first = await who(page);
await tapZone(page, 'whoLord');
const picked = await who(page);
await page.screenshot({ path: `${OUT}/rocket_0switch.png` });
await page.reload();      // (the same page: a new one has a store of its own)
await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 30000 });
await page.waitForTimeout(400);
const kept = await who(page);
await tapZone(page, 'whoPrince');
const back = await who(page);
check('the title\'s switch: the prince first, a tap and the lord is on the lawn, with his own best; kept at the next start; a tap back', first.who === 'prince' && first.best === 123 && picked.who === 'lord' && picked.onLawn === 'lord' && picked.best === 0 && picked.saved === 'lord' && kept.who === 'lord' && kept.onLawn === 'lord' && kept.best === 0 && back.who === 'prince' && back.onLawn === 'prince' && back.best === 123 && back.saved === 'prince', { first, picked, kept, back });
await page.evaluate(() => localStorage.clear());
await page.close();

// --- the lord
page = await open('who=lord');
const title = await page.evaluate(() => { const w = window.game.world, p = w.player; return { who: p.who, h: p.h, rocket: !!p.fig.rocket, jump: p.fig.jump }; });
check('with ?who=lord it is the lord on the lawn: smaller, the same jump, a rocket', title.who === 'lord' && title.h === 184 && title.rocket && title.jump === 1, title);
await page.screenshot({ path: `${OUT}/rocket_0title.png` });
await page.close();

page = await open('who=lord&at=60');
await start(page);
const plain = await page.evaluate(() => window.__hop(3, 0, 0, true));
check('a hop without it is the prince\'s hop', plain.apex > 630 && plain.apex < 665 && plain.burnt === 0, plain);
const half = await page.evaluate(() => window.__hop(3, 0.5, 0.79));      // held for half a second from the top of the hop
check('held for half a second at the top of a hop it burns one charge, lifts him some 9 m, and he is shielded', Math.abs(half.burnt - 0.5) < 0.03 && Math.abs(half.used - 1) < 0.06 && half.apex > plain.apex + 800 && half.apex < plain.apex + 1000 && half.shielded && half.pose === 'boosting', half);
const empty = await page.evaluate(() => window.__hop(0, 0.5, 0.79, true));
check('with nothing in the tank nothing burns, and the landing brings half a charge', empty.burnt === 0 && Math.abs(empty.apex - plain.apex) < 12 && empty.after === 0.5, empty);
const tap = await page.evaluate(() => window.__tap(3));
check('a tap is a short burn', tap.burnt > 0.1 && tap.burnt < 0.2 && tap.left > 2.6, tap);
const full = await page.evaluate(() => window.__hop(3, 9, 0.79));
check('held on, it burns until the tank is empty (a second and a half) and no faster than its top speed', Math.abs(full.burnt - 1.5) < 0.05 && full.used === 3 && full.vyMax <= 1501, full);
// a picture of it burning
await page.evaluate(() => {
  const w = window.game.world, inp = w.input;
  window.__land(3);
  for (let k = 0; k < 70; k++) { inp.boostHeld = k > 12; inp.axis = 0.5; w.update(1 / 120); w.enemies.length = 0; }
  w.toasts.length = 0;
});
await page.waitForTimeout(260);
await page.screenshot({ path: `${OUT}/rocket_1burning.png` });
await page.close();

// --- the prince, as he was
page = await open('at=60');
await start(page);
const prince = await page.evaluate(() => ({ who: window.game.world.player.who, held: window.__hop(3, 0.5, 0.79, true), tap: window.__tap(3) }));
check('the prince\'s boost is the tap it was, and holding does nothing for him', prince.who === 'prince' && prince.held.burnt === 0 && prince.held.used === 0 && prince.tap.first.state === 'boosting' && prince.tap.first.left === 2 && prince.tap.first.vy > 1400, prince);
await page.close();

check('no errors', errors.length === 0, [...new Set(errors)]);
console.log(failed ? `${failed} failed` : 'all ok');
await browser.close();
process.exit(failed ? 1 : 0);
