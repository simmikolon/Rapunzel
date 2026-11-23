// The tower in stages, in the browser: the title offers it, a stage ends at a floor with a door and nothing above,
// the camera rests on that floor, the door leads into the next stage in the other place, and a prince who falls
// goes on from that door with the height he had. Pictures of each step go to check-out/.
//   node tools/checks/stages.mjs      (needs tools/serve.py)
import { launch, GAME, OUT } from './lib.mjs';
const browser = await launch();
let bad = 0;
const report = (name, ok, extra = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${extra}`); };
const open = async (url) => {
  const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: +process.env.DSF || 1 });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.game && window.game.mode === 'title', null, { timeout: 40000 });
  await page.waitForTimeout(400);
  return page;
};
const state = (page) => page.evaluate(() => {
  const w = window.game.world, st = w.level.stage, pl = w.player;
  return { mode: window.game.mode, place: w.place.name, stage: st ? st.n + 1 : 0, end: !!(st && st.end), cap: w.cam.cap, camY: Math.round(w.cam.y), y: Math.round(pl.y), alive: pl.alive, hearts: pl.hearts, h: w.heightM, retries: w.retries, over: w.over, toast: w.toasts.map((t) => t.text).join('|') };
});
{
  // the title: a fresh save plays the tower in stages; T, O and I pick the climb
  const page = await open(GAME + '/');
  const first = await page.evaluate(() => ({ climb: window.game.climb, route: !!window.game.world.route, place: window.game.world.place.name }));
  await page.keyboard.press('KeyI'); await page.waitForTimeout(200);
  const inside = await page.evaluate(() => ({ climb: window.game.climb, route: !!window.game.world.route, place: window.game.world.place.name }));
  await page.keyboard.press('KeyT'); await page.waitForTimeout(200);
  const back = await page.evaluate(() => ({ climb: window.game.climb, route: !!window.game.world.route, place: window.game.world.place.name }));
  await page.screenshot({ path: `${OUT}/stages_title.png` });
  report('the title offers the stages', first.climb === 'stages' && first.route && first.place === 'outside' && inside.climb === 'inside' && !inside.route && inside.place === 'inside' && back.climb === 'stages' && back.route && back.place === 'outside' && !page.errors.length, JSON.stringify({ first, inside, back, errors: page.errors }));
  await page.close();
}
{
  // a stage's end: start at stage 2 (the hall), shorten it, stand the prince on its last floor
  const page = await open(GAME + '/?stage=2&dev=1');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 20000 });
  const begun = await state(page);
  await page.evaluate(() => {
    const w = window.game.world, pl = w.player, door = w.checkpoint.door;
    w.level.vaults = false;                              // (no golden door in the way of this check)
    w.level.stage.to = door.y + 900;
    w.platforms = w.platforms.filter((p) => p.kind === 'ground' || p === door);
    w.enemies.length = 0; w.pickups.length = 0;
    w.level.retryStage(door.y, 300);
    w.level.generateUpTo(w.cam.top + 1500);
    const st = w.level.stage;
    pl.x = 0; pl.y = st.end.floorY + 4; pl.vy = 0; pl.maxY = pl.y;
  });
  await page.waitForTimeout(1800);
  const atEnd = await state(page);
  const picture = await page.evaluate(() => { const w = window.game.world, st = w.level.stage; return { floorOnScreen: Math.round(w.cam.sy(st.end.floorY)), doorOnScreen: Math.round(w.cam.sy(st.end.door.y)), above: w.platforms.filter((p) => p.y > st.end.door.y + 40).length, H: window.innerHeight }; });
  await page.screenshot({ path: `${OUT}/stages_end.png` });
  report('a stage ends at a floor and a door', begun.stage === 2 && begun.place === 'inside' && atEnd.end && atEnd.cap != null && atEnd.alive && picture.above === 0 && !page.errors.length, JSON.stringify({ begun, atEnd, picture, errors: page.errors }));
  // bouncing on the floor for a while: the camera must not leave it, and nobody falls
  await page.waitForTimeout(2500);
  const stays = await state(page);
  report('the camera rests on the last floor', stays.alive && stays.camY <= Math.round(stays.cap) + 1 && stays.stage === 2 && !page.errors.length, JSON.stringify(stays));
  // onto the door's landing: through it, into stage 3 outside
  await page.evaluate(() => { const w = window.game.world, pl = w.player, d = w.level.stage.end.door; pl.x = d.x; pl.y = d.y + 60; pl.vy = -200; pl.vx = 0; });
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/stages_door.png` });
  await page.waitForFunction(() => !window.game.world.passage, null, { timeout: 10000 });
  await page.waitForTimeout(250);
  const next = await state(page);
  await page.screenshot({ path: `${OUT}/stages_next.png` });
  report('the door leads to the next stage', next.stage === 3 && next.place === 'outside' && next.cap == null && next.alive && /Stage 3/.test(next.toast) && !page.errors.length, JSON.stringify({ next, errors: page.errors }));
  // a fall: he goes on from that door, with all his hearts and the height he had
  await page.evaluate(() => { const w = window.game.world; w.player.maxY = w.player.y + 2000; w.player.hearts = 1; w.player.die('fell'); });
  const fell = await state(page);
  await page.waitForFunction(() => window.game.world.retries === 1 && window.game.world.player.alive && !window.game.world.passage, null, { timeout: 10000 });
  await page.waitForTimeout(200);
  const again = await state(page);
  await page.screenshot({ path: `${OUT}/stages_again.png` });
  report('after a fall he goes on from the door', again.alive && again.hearts === 3 && again.stage === 3 && again.place === 'outside' && again.h === fell.h && again.mode === 'playing' && !again.over && !page.errors.length, JSON.stringify({ fell, again, errors: page.errors }));
  await page.close();
}
{
  // with ?retries=0 a fall ends the round, as in the endless game
  const page = await open(GAME + '/?stage=2&retries=0');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.game.mode === 'playing', null, { timeout: 20000 });
  await page.evaluate(() => window.game.world.player.die('fell'));
  await page.waitForFunction(() => window.game.mode === 'gameover', null, { timeout: 10000 }).catch(() => {});
  const over = await state(page);
  report('without retries a fall is the end', over.mode === 'gameover' && over.retries === 0 && !page.errors.length, JSON.stringify({ over, errors: page.errors }));
  await page.close();
}
console.log(bad ? `${bad} FAILED` : 'all ok');
await browser.close();
process.exit(bad ? 1 : 0);
