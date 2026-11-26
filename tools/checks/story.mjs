// The opening story (web/src/story.js): it is told on a first visit and ends on the title; a tap skips the rest;
// a second visit gets the plain ride in a browser and the story again in the app (the iOS shell, stood in for
// here); a tap on Rapunzel on the title sign tells it again; "tap to skip" is offered from the second telling on.
// Pictures of its moments go to check-out/ (the story's clock is stepped by hand for them, so they do not depend
// on this machine's speed).
//   node tools/checks/story.mjs      (needs tools/serve.py)
import { launch, GAME, OUT } from './lib.mjs';
const browser = await launch();
let bad = 0;
const report = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${extra}`); };
// Is "tap to skip" in the picture just drawn?
const HINT = `(() => { const g = window.game.gfx; for (const L of g.all) for (const pool of L.texts.values()) for (const t of pool.list) if (t.visible && t.text === 'tap to skip') return true; return false; })()`;
// The story's clock stepped to `t` by hand (the game's own waits), one picture drawn: where it is, and the hint.
const stepTo = (page, t) => page.evaluate(([t, hint]) => {
  const g = window.game, s = g.story;
  if (!s) return { t, over: true };
  if (!g.heldUpdate) { g.heldUpdate = g.update; g.update = () => {}; }
  while (s.t < t && !s.done) { g.world.update(1 / 60); s.update(1 / 60); }
  g.draw();
  const cut = g.world.braidCut;
  return { t: +s.t.toFixed(2), m: Math.round(s.show.cam.y / 100), loose: !!cut.loose, done: s.done, first: s.first, hint: eval(hint) };
}, [t, HINT]);
const release = (page) => page.evaluate(() => { const g = window.game; if (g.heldUpdate) { g.update = g.heldUpdate; g.heldUpdate = null; } });
const open = async (url, context) => {
  const page = await (context || browser).newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +process.env.DSF || 1 });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.game, null, { timeout: 40000 });
  return page;
};
{
  // the moments, one picture each: the tower's top, the witch, "Rescue me!", the braid let down, three looks on
  // the way, the lawn, "On my way!"
  const page = await open(GAME + '/?story=1&fx=' + (process.env.FX || 'off'));
  await page.waitForFunction(() => window.game.story, null, { timeout: 20000 });
  const told = [];
  for (const t of [0.9, 2.2, 3.2, 4.4, 6.5, 8.4, 10.1, 11.8, 13.4]) {
    told.push(await stepTo(page, t));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/story_${String(t).replace('.', '_')}.png` });
  }
  const heights = told.map((q) => q.m);
  const falls = heights.every((m, i) => i === 0 || m <= heights[i - 1]);
  report('the first telling does not offer to skip', told.every((q) => q.first && !q.hint), JSON.stringify(told.map((q) => [q.t, q.first, q.hint])));
  report('the story is told from the top to the lawn', told.every((q) => !q.over) && heights[0] > 600 && heights[heights.length - 1] <= 0 && falls && told[3].loose && !told[told.length - 1].loose && !page.errors.length, JSON.stringify({ told, errors: page.errors }));
  // let it run out: the title follows, on the lawn, the braid whole
  await release(page);
  await page.waitForFunction(() => window.game.mode === 'title', null, { timeout: 30000 });
  const end = await page.evaluate(() => ({ mode: window.game.mode, story: !!window.game.story, braid: window.game.world.braidCut.ly, seen: window.game.seenStory }));
  report('and the title follows', end.mode === 'title' && !end.story && end.braid === -Infinity && end.seen && !page.errors.length, JSON.stringify({ end, errors: page.errors }));
  // a tap on Rapunzel tells it again; a tap then skips the rest
  await page.waitForTimeout(500);
  await page.evaluate(() => { const g = window.game; g.input.buttonHits.push('story'); });
  await page.waitForFunction(() => window.game.mode === 'intro' && window.game.story, null, { timeout: 5000 }).catch(() => {});
  const again = await page.evaluate(() => ({ mode: window.game.mode, story: !!window.game.story }));
  const offered = await stepTo(page, 2.2);      // told before: now a tap is offered
  await release(page);
  report('told again, it offers to skip', !offered.first && offered.hint, JSON.stringify(offered));
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  const t0 = Date.now();
  await page.waitForFunction(() => window.game.mode === 'title', null, { timeout: 20000 });
  const skipped = (Date.now() - t0) / 1000;
  report('Rapunzel tells it again, and a tap skips it', again.mode === 'intro' && again.story && skipped < 8 && !page.errors.length, JSON.stringify({ again, skipped, errors: page.errors }));
  await page.close();
}
{
  // a visit after it has been told: the plain ride, no story (the save says so); ?story=0 the same on a first visit
  const context = await browser.newContext();
  const first = await open(GAME + '/?story=0', context);
  await first.waitForFunction(() => window.game.mode === 'title', null, { timeout: 40000 });
  const plain = await first.evaluate(() => ({ story: !!window.game.story, seen: window.game.seenStory }));
  await first.close();
  const second = await open(GAME + '/', context);
  await second.waitForFunction(() => window.game.story || window.game.mode === 'title', null, { timeout: 40000 });
  const fresh = await second.evaluate(() => ({ story: !!window.game.story }));       // not seen yet on this device: it is told
  await second.waitForFunction(() => window.game.seenStory, null, { timeout: 5000 }).catch(() => {});
  await second.close();
  const third = await open(GAME + '/', context);
  await third.waitForFunction(() => window.game.mode === 'title', null, { timeout: 40000 });
  const later = await third.evaluate(() => ({ story: !!window.game.story, seen: window.game.seenStory }));
  report('once per device', !plain.story && !plain.seen && fresh.story && !later.story && later.seen && !third.errors.length, JSON.stringify({ plain, fresh, later, errors: third.errors }));
  await context.close();
}
{
  // in the app (the iOS shell: its bridge and its storage stood in for, kept from one start to the next) the
  // story is told at every start: the first time without the offer to skip, the next time with it
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const saved = JSON.parse(localStorage.getItem('__shell') || '{}');
    window.__native = { storage: saved };
    window.webkit = { messageHandlers: { native: { postMessage(m) { if (m && m.type === 'storage.set') { saved[m.key] = m.value; localStorage.setItem('__shell', JSON.stringify(saved)); } } } } };
  });
  const starts = [];
  for (let k = 0; k < 3; k++) {
    const page = await open(GAME + '/', context);
    await page.waitForFunction(() => window.game.story || window.game.mode === 'title', null, { timeout: 40000 });
    const native = await page.evaluate(async () => (await import('/src/platform.js')).platform.isNative);
    const at = await stepTo(page, 2.2);
    await release(page);
    await page.keyboard.press('Space');      // a tap skips it, the first time too
    const t0 = Date.now();
    await page.waitForFunction(() => window.game.mode === 'title', null, { timeout: 20000 });
    starts.push({ native, story: !at.over, first: at.first, hint: at.hint, skipped: +((Date.now() - t0) / 1000).toFixed(1), errors: page.errors });
    await page.close();
  }
  report('in the app it is told at every start, and from the second on a tap is offered', starts.every((q) => q.native && q.story && q.skipped < 8 && !q.errors.length) && starts[0].first && !starts[0].hint && !starts[1].first && starts[1].hint && starts[2].hint, JSON.stringify(starts));
  // ... but not where the title's world is the inside of the tower
  const inside = await open(GAME + '/?place=inside', context);
  await inside.waitForFunction(() => window.game.mode === 'title', null, { timeout: 40000 });
  const none = await inside.evaluate(() => ({ story: !!window.game.story, place: window.game.world.placeName }));
  report('and not inside the tower', !none.story && none.place === 'inside' && !inside.errors.length, JSON.stringify({ none, errors: inside.errors }));
  await context.close();
}
console.log(bad ? `${bad} FAILED` : 'all ok');
await browser.close();
process.exit(bad ? 1 : 0);
