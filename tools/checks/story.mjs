// The opening story (web/src/story.js): it is told on a first visit and ends on the title; a tap skips the rest;
// a second visit gets the plain ride; a tap on Rapunzel on the title sign tells it again. Pictures of its moments
// go to check-out/ (the story's clock is stepped by hand for them, so they do not depend on this machine's speed).
//   node tools/checks/story.mjs      (needs tools/serve.py)
import { launch, GAME, OUT } from './lib.mjs';
const browser = await launch();
let bad = 0;
const report = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${extra}`); };
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
    told.push(await page.evaluate((t) => {
      const g = window.game, s = g.story;
      if (!s) return { t, over: true };
      if (!g.heldUpdate) { g.heldUpdate = g.update; g.update = () => {}; }      // the game's own clock waits
      while (s.t < t && !s.done) { g.world.update(1 / 60); s.update(1 / 60); }
      g.draw();
      const cut = g.world.braidCut;
      return { t: +s.t.toFixed(2), m: Math.round(s.show.cam.y / 100), loose: !!cut.loose, done: s.done };
    }, t));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/story_${String(t).replace('.', '_')}.png` });
  }
  const heights = told.map((q) => q.m);
  const falls = heights.every((m, i) => i === 0 || m <= heights[i - 1]);
  report('the story is told from the top to the lawn', told.every((q) => !q.over) && heights[0] > 600 && heights[heights.length - 1] <= 0 && falls && told[3].loose && !told[told.length - 1].loose && !page.errors.length, JSON.stringify({ told, errors: page.errors }));
  // let it run out: the title follows, on the lawn, the braid whole
  await page.evaluate(() => { const g = window.game; g.update = g.heldUpdate; });
  await page.waitForFunction(() => window.game.mode === 'title', null, { timeout: 30000 });
  const end = await page.evaluate(() => ({ mode: window.game.mode, story: !!window.game.story, braid: window.game.world.braidCut.ly, seen: window.game.seenStory }));
  report('and the title follows', end.mode === 'title' && !end.story && end.braid === -Infinity && end.seen && !page.errors.length, JSON.stringify({ end, errors: page.errors }));
  // a tap on Rapunzel tells it again; a tap then skips the rest
  await page.waitForTimeout(500);
  await page.evaluate(() => { const g = window.game; g.input.buttonHits.push('story'); });
  await page.waitForFunction(() => window.game.mode === 'intro' && window.game.story, null, { timeout: 5000 }).catch(() => {});
  const again = await page.evaluate(() => ({ mode: window.game.mode, story: !!window.game.story }));
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
console.log(bad ? `${bad} FAILED` : 'all ok');
await browser.close();
process.exit(bad ? 1 : 0);
