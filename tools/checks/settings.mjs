// The settings' sign and the ways to steer (web/src/settings.js, web/src/input.js): the title's SETTINGS board
// opens the sign and DONE closes it; a choice takes effect, is kept and is there at the next start; the effects are
// off unless chosen (an old save's preset is not read); a finger slides to steer and taps to boost; the lean is the
// same angle however the phone is pitched; and in the app (the iOS shell, stood in for) there are the app's rows.
//   node tools/checks/settings.mjs      (needs tools/serve.py)
import { launch, GAME, OUT } from './lib.mjs';
const browser = await launch();
let bad = 0;
const report = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${extra}`); };
const PHONE = { viewport: { width: 420, height: 912 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true };
// The shell: its bridge and its storage, kept from one start to the next, and what the page sent it.
const shell = () => {
  const saved = JSON.parse(localStorage.getItem('__shell') || '{}');
  window.__native = { storage: saved, tilt: { available: true } };
  window.__posted = [];
  window.webkit = { messageHandlers: { native: { postMessage(m) { window.__posted.push(m.type + (m.kind ? ':' + m.kind : '')); if (m && m.type === 'storage.set') { saved[m.key] = m.value; localStorage.setItem('__shell', JSON.stringify(saved)); } } } } };
};
const open = async (context, query = '') => {
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text().slice(0, 200)); });
  await page.goto(GAME + '/?story=0' + query);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 60000 });
  await page.waitForTimeout(900);
  return page;
};
// A logical point of the picture as the browser's client coordinates.
const client = (page, x, y) => page.evaluate(async ([x, y]) => { const r = window.game.canvas.getBoundingClientRect(), { H } = await import('/src/config.js'); return { x: r.left + (x / 768) * r.width, y: r.top + (y / H) * r.height }; }, [x, y]);
const tap = async (page, id) => {
  const z = await page.evaluate((id) => { const g = window.game; g.hud.layout(g.mode); const z = g.input.buttonZones.find((q) => q.id === id); return z ? [z.x + z.w / 2, z.y + z.h / 2] : null; }, id);
  if (!z) return false;
  const p = await client(page, z[0], z[1]);
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForTimeout(450);
  return true;
};
const state = (page) => page.evaluate(() => { const g = window.game, i = g.input; return { mode: g.mode, open: g.settings.open, v: { ...g.settings.v }, steer: i.steer, tilt: i.tiltEnabled, full: i.tiltFull, fx: g.gfx.preset, muted: g.muted, rows: g.settings.rows().map((r) => r.label).join(' ') }; });

{
  // a phone's browser: the sign opens and closes, choices take effect and are there at the next start
  const context = await browser.newContext(PHONE);
  await context.addInitScript(() => { if (!localStorage.getItem('bouncealot.web.v1')) localStorage.setItem('bouncealot.web.v1', JSON.stringify({ best: 12, fxPick: 'full', fx: 'bloom' })); });      // a save from before the settings
  let page = await open(context);
  const first = await state(page);
  report('the effects are off, whatever an old save chose', first.fx === 'off' && !first.v.glow && !first.v.lines && first.steer === 'tap', JSON.stringify(first));
  const opened = await tap(page, 'settings');
  const on = await state(page);
  await page.screenshot({ path: `${OUT}/settings_web.png` });
  report('SETTINGS opens the sign, with the rows a browser has', opened && on.open && on.mode === 'title' && on.rows === 'STEERING EFFECTS SOUND STORY', JSON.stringify(on));
  await tap(page, 'set.steer.swipe'); await tap(page, 'set.glow'); await tap(page, 'set.lines'); await tap(page, 'set.sound');
  const chosen = await state(page);
  report('a choice takes effect at once', chosen.steer === 'swipe' && chosen.fx === 'full' && chosen.muted && chosen.open, JSON.stringify(chosen));
  await tap(page, 'set.lines'); await tap(page, 'set.sound');
  // a tap beside the boards does not start a round while the sign is open
  const beside = await client(page, 120, 1250);
  await page.touchscreen.tap(beside.x, beside.y);
  await page.waitForTimeout(400);
  const still = await state(page);
  await tap(page, 'set.done');
  const closed = await state(page);
  report('DONE closes it, and nothing else does', still.open && still.mode === 'title' && !closed.open && closed.mode === 'title' && closed.fx === 'bloom' && !page.errors.length, JSON.stringify({ still: still.open, closed, errors: page.errors }));
  await page.close();
  page = await open(context);
  const later = await state(page);
  report('the choices are there at the next start', later.steer === 'swipe' && later.v.glow && !later.v.lines && later.fx === 'bloom' && !later.muted, JSON.stringify(later));
  // ?fx= is for a visit and leaves the settings alone
  await page.close();
  page = await open(context, '&fx=off');
  const forced = await state(page);
  report('?fx= sets the effects for a visit', forced.fx === 'off' && forced.v.glow, JSON.stringify({ fx: forced.fx, v: forced.v }));
  await page.close();

  // steering: a round, a finger set down and slid
  page = await open(context, '&at=150');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 20000 });
  const cdp = await context.newCDPSession(page);
  const touch = async (type, pts) => { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([id, x, y]) => ({ id, x, y })) }); await page.waitForTimeout(260); };
  const axis = () => page.evaluate(() => { const i = window.game.input; return { axis: +i.axis.toFixed(2), analog: i.usingTilt, boosts: i.boostQueued, charges: window.game.world.player.boost }; });
  const at = async (x, y) => { const p = await client(page, x, y); return [p.x, p.y]; };
  await page.evaluate(() => { const g = window.game; g.heldStep = g.stepWorld; g.stepWorld = () => {}; });      // the world waits: only the input is looked at
  const a0 = await at(300, 800);
  await touch('touchStart', [[1, ...a0]]);
  const down = await axis();
  await touch('touchMove', [[1, ...(await at(359, 800))]]);
  const half = await axis();
  await touch('touchMove', [[1, ...(await at(520, 800))]]);
  const full = await axis();
  await touch('touchMove', [[1, ...(await at(480, 800))]]);       // back by 40 after 220 to the right: the middle came along
  const back = await axis();
  await touch('touchMove', [[1, ...(await at(250, 800))]]);
  const left = await axis();
  // a second finger while the first slides: a boost
  await touch('touchStart', [[1, ...(await at(250, 800))], [2, ...(await at(600, 1000))]]);
  const second = await axis();
  await touch('touchEnd', []);
  const up = await axis();
  report('a sliding finger steers by how far it has gone', down.axis === 0 && half.axis > 0.4 && half.axis < 0.6 && half.analog && full.axis === 1 && back.axis > 0.5 && back.axis < 0.75 && left.axis === -1 && up.axis === 0, JSON.stringify({ down, half, full, back, left, up }));
  report('a second finger is a boost', second.boosts > left.boosts, JSON.stringify({ before: left.boosts, after: second.boosts }));
  // a finger that only taps: a boost too
  const b0 = (await axis()).boosts;
  const p = await client(page, 300, 800);
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForTimeout(200);
  const tapped = await axis();
  report('a tap is a boost', tapped.boosts > b0 && tapped.axis === 0, JSON.stringify({ before: b0, tapped }));
  // 'tap' steering as it was: a held side
  await page.evaluate(() => { const g = window.game; g.settings.v.steer = 'tap'; g.settings.apply(); });
  await touch('touchStart', [[1, ...(await at(100, 800))]]);
  const heldLeft = await axis();
  await touch('touchEnd', []);
  await touch('touchStart', [[1, ...(await at(600, 800))]]);
  const heldRight = await axis();
  await touch('touchEnd', []);
  report('holding a side steers as before', heldLeft.axis === -1 && heldRight.axis === 1 && !heldLeft.analog && !page.errors.length, JSON.stringify({ heldLeft, heldRight, errors: page.errors }));

  // the lean: the same however the phone is pitched (a browser's angles in, degrees of dip out)
  const lean = await page.evaluate(async () => {
    const { leanDegrees } = await import('/src/input.js');
    const r = (v) => +v.toFixed(1);
    return { flat: r(leanDegrees(0, 10)), upright: r(leanDegrees(80, 90)), uprightLeft: r(leanDegrees(80, -90)), pastUpright: r(leanDegrees(100, -90)), still: r(leanDegrees(89, 0)), side: r(leanDegrees(15, 0, 90)), otherSide: r(leanDegrees(15, 0, 270)) };
  });
  report('the lean is the dip of the right edge, flat, upright and past upright', lean.flat === 10 && lean.upright === 10 && lean.uprightLeft === -10 && lean.pastUpright === 10 && lean.still === 0 && lean.side === 15 && lean.otherSide === -15, JSON.stringify(lean));
  await context.close();
}
{
  // the app: its rows, tilt from the shell at once, and all of it kept in the shell's storage
  const context = await browser.newContext(PHONE);
  await context.addInitScript(shell);
  let page = await open(context);
  await tap(page, 'settings');
  const rows = await state(page);
  await page.screenshot({ path: `${OUT}/settings_app.png` });
  await tap(page, 'set.steer.tilt');
  const tilt = await state(page);
  await tap(page, 'set.tilt.quick'); await tap(page, 'set.silent'); await tap(page, 'set.haptics');
  const set = await state(page);
  // the shell's lean: 10 degrees is 8 of the 13 between the dead zone and full at 'quick'
  const raw = await page.evaluate(() => { window.__nativeTilt(10); const a = window.game.input.tiltRaw; window.__nativeTilt(-40); return { ten: +a.toFixed(2), far: window.game.input.tiltRaw }; });
  const posted = await page.evaluate(() => window.__posted.filter((q) => !q.startsWith('storage')).join(' '));
  report('the app has its rows, and tilt starts without asking', rows.rows === 'STEERING EFFECTS SOUND HAPTICS STORY' && tilt.steer === 'tilt' && tilt.tilt && tilt.rows.includes('TILT') && posted.includes('tilt.start'), JSON.stringify({ rows: rows.rows, tilt, posted }));
  report('its choices take effect', set.full === 15 && set.v.silent === false && set.v.haptics === false && raw.ten > 0.6 && raw.ten < 0.63 && raw.far === -1, JSON.stringify({ set, raw }));
  await tap(page, 'set.done');
  await page.close();
  page = await open(context);
  const later = await state(page);
  const again = await page.evaluate(() => window.__posted.filter((q) => !q.startsWith('storage')).join(' '));
  report('and are there at the next start', later.steer === 'tilt' && later.tilt && later.full === 15 && later.v.silent === false && later.v.haptics === false && again.includes('tilt.start') && !page.errors.length, JSON.stringify({ later, again, errors: page.errors }));
  await context.close();
}
console.log(bad ? `${bad} FAILED` : 'all ok');
await browser.close();
process.exit(bad ? 1 : 0);
