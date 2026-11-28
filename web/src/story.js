import { W, H, SAFE, CAMERA_START_Y, PARALLAX_TOWER, PLAYER_H } from './config.js';
import { TILE_H, TOWER_W } from './art/tiles.js';
import { World } from './world.js';
import { stageWall } from './towerwall.js';
import { audio } from './audio.js';
import { clamp, easeOutBack } from './util.js';

// The opening story, told in the game's own world before the title: the top
// of the tower at night, Rapunzel at her window, the witch circling it on
// her broom; "Rescue me!"; she lets her braid down, and the picture follows
// its end down the whole tower, slowing three times for a look at what
// waits there, to the lawn where Sir Bouncealot stands. Then the title.
// Nothing here is a film: the tower, its creatures and the braid are the
// game's, drawn by the world as ever. The ride goes down a world of its own
// that nobody plays in (`show`: the endless tower outside, built to the
// top), with the round's first rows shown in it as its guests, and for the
// last stretch it is the round's world itself that is seen, so the picture
// the title opens on is the one the story ended on.
export const STORY = {
  topTile: 342,          // the wall ends at the upper edge of this tile of the tower's layer: about 730 m up, in the night
  sillBelow: 432,        // Rapunzel's sill this far below the wall's upper edge (layer px)
  sillAt: 0.6,           // where her sill is in the picture at the start, as a share of its height from the top
  follow: 0.62,          // where the braid's end is kept in the picture on its way down
  fadeIn: 0.7,           // the picture comes up out of black
  witch: [0.4, 3.7],     // she circles the tower from .. to (s)
  bubble: [1.5, 3.9],    // "Rescue me!"
  throwAt: 4.1,          // the braid is let down
  // The braid's end on its way down: seconds after the throw, and the height
  // it has reached (m of climb; the first is the sill). Where two heights
  // lie close together it goes slowly: a look at the roses in the evening
  // sky, at the ivy between the windows, at the white roses in the deep
  // forest; the last stretch passes the masons' site and the red roses.
  fall: [[0, null], [0.8, 700], [1.9, 564], [2.7, 551], [3.8, 314], [4.6, 302], [5.5, 214], [6.3, 202], [7.7, 13], [8.6, -3]],
  answer: 0.2,           // after the braid has come down the prince answers ...
  settle: 1.5,           // ... and this long after it has, the title follows
  handover: 1000,        // the last stretch (the view's lower edge this far above the lawn, px) is the round's own world
  skipFade: 0.25,
  // When a start tells it again after the first time: so many hours after it was last told. In the app at every
  // start (0): a start there is a launch, the app stays in memory between rounds and through the background, so
  // that is about once a day, and a tap skips it. In a browser never (Infinity): every page opened is a start, and
  // who comes back wants to play. (24 would be: at most once a day.)
  again: { app: 0, web: Infinity },
};
const QUIET = new Proxy({}, { get: () => () => {} });      // the ride's world makes no sound
const INK = '#3b2a1e', PAPER = '#fffdf6';

// A curve through points [x, y] that never overshoots (monotone cubic): the braid's fall through its keyframes.
function monotone(points) {
  const n = points.length, xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
const toLayer = (y) => CAMERA_START_Y + (y - CAMERA_START_Y) * PARALLAX_TOWER;      // a height in the prince's plane, on the tower's layer
const toWorld = (ly) => CAMERA_START_Y + (ly - CAMERA_START_Y) / PARALLAX_TOWER;

export class Story {
  constructor(game) {
    this.game = game;
    this.real = game.world;
    this.t = 0;
    this.done = false;
    this.skipT = null;                 // seconds since a tap asked to skip the rest
    this.first = !game.seenStory;      // told for the first time on this device: the picture stays free of "tap to skip"
    this.said = {};                    // the sounds that have been made
    this.topLy = STORY.topTile * TILE_H;
    this.sillLy = this.topLy - STORY.sillBelow;
    const last = STORY.fall[STORY.fall.length - 1];
    this.endLy = monotone(STORY.fall.map(([t, m]) => [t, m == null ? this.sillLy - 24 : toLayer(m * 100)]));
    this.fallT = last[0];
    this.total = STORY.throwAt + this.fallT + STORY.settle;
    this.look = { dy: 0 };
    this.build();
  }

  // The world the ride goes down: the endless tower outside from above the
  // round's own rows to under Rapunzel's window, and those rows as guests.
  build() {
    const real = this.real, game = this.game;
    const show = this.show = new World({ art: game.art, input: game.input, round: { place: 'outside' } });
    show.audio = QUIET;
    show.forceWeather = this.real.weatherKind();      // the weather of the lawn it ends on, all the way down (around Christmas it snows on her tower too)
    show.reset((Math.random() * 0x7fffffff) | 0, 'outside');
    show.platforms = show.platforms.filter((p) => p.kind === 'ground');
    show.enemies.length = 0; show.pickups.length = 0; show.fields.length = 0;
    const from = Math.max(isFinite(real.level.nextY) ? real.level.nextY : 0, ...real.platforms.map((p) => p.y + 420));
    show.level.restartFrom(from - 300, 300);
    show.level.generateUpTo(toWorld(this.sillLy) - 1300);
    this.guests = new Set([...real.platforms, ...real.enemies, ...real.pickups]);
    show.platforms.push(...real.platforms.filter((p) => p.kind !== 'ground'));
    show.enemies.push(...real.enemies);
    show.pickups.push(...real.pickups);
    show.player.y = -1e6; show.player.prevY = -1e6;      // nobody is in it
    show.bg.top = { ly: this.topLy, sill: this.sillLy, look: this.look };
    // Roses have climbed to her window: the tower's own wall up to the last plain stretch below it, briar with red roses from there.
    let k0 = STORY.topTile - 12;
    const plan = show.bg.plan, plain = (k) => !plan.skinAt(k) && !plan.growthAt(k);
    while (k0 > 0 && !(plain(k0) && plain(k0 - 1))) k0--;
    const roses = stageWall({ growth: 'briar' }, k0, 3, 0);
    show.bg.wall = { skinAt: (k) => (k >= k0 ? null : plan.skinAt(k)), growthAt: (k) => (k >= k0 ? roses.growthAt(k) : plan.growthAt(k)), hungAt: (i) => plan.hungAt(i), edgeAt: (i) => plan.edgeAt(i), markAt: (i) => plan.markAt(i) };
  }

  // Where the view's lower edge is (the prince's plane, px) with the braid's end at layer height `end`.
  camY(end) {
    const start = this.sillLy - H * (1 - STORY.sillAt);                  // the tower layer's view bottom at the start
    const want = end - H * (1 - STORY.follow);
    return clamp(toWorld(Math.min(start, want)), CAMERA_START_Y, toWorld(start));
  }

  skip() { if (this.skipT == null && this.t < this.total - 0.6) this.skipT = 0; }

  update(dt) {
    if (this.done) return;
    if (this.skipT != null) {
      // the picture closes, the story jumps to where the braid has come down, the picture opens
      const before = this.skipT;
      this.skipT += dt;
      if (before < STORY.skipFade && this.skipT >= STORY.skipFade) this.t = Math.max(this.t, STORY.throwAt + this.fallT + STORY.settle - 0.5);
    }
    this.t += dt;
    const t = this.t, fall = t - STORY.throwAt;
    const once = (name, at, f) => { if (!this.said[name] && t >= at) { this.said[name] = true; if (this.skipT == null) f(); } };
    once('witch', STORY.witch[0] + 0.2, () => audio.witchWarn());
    once('throw', STORY.throwAt, () => audio.whoosh());
    once('land', STORY.throwAt + this.fallT - 0.15, () => audio.poof(true));
    once('answer', STORY.throwAt + this.fallT + STORY.answer, () => audio.chime(2));
    // the braid: not let down yet, on its way, or down (then it is the tower's braid as ever)
    const end = fall < 0 ? this.topLy : this.endLy(fall), down = fall >= this.fallT;
    const braid = down ? { ly: -Infinity, pieces: [] } : { ly: end, pieces: [], top: this.sillLy, loose: true };
    this.show.braidCut = braid; this.real.braidCut = braid;
    // Rapunzel: she ducks while the witch passes her window, and stretches to throw
    const W0 = STORY.witch, wu = (t - W0[0]) / (W0[1] - W0[0]);
    const near = wu > 0 && wu < 1 ? this.witchAt(wu) : null;
    const duck = near && near.front && Math.abs(near.x) < 200 ? 16 : 0;
    const reach = fall > -0.35 && fall < 0.5 ? (fall < 0 ? 20 * (1 + fall / 0.35) : -10 * (1 - fall / 0.5)) : 0;
    this.look.dy += ((duck || reach) - this.look.dy) * Math.min(1, dt * 14);
    // the ride's world
    this.show.cam.jumpTo(this.camY(end));
    this.show.tick(dt, this.guests);
    if (t >= this.total) { this.real.braidCut = { ly: -Infinity, pieces: [] }; this.done = true; }
  }

  // The witch on her way round the tower at u (0 to 1): where she is, seen from the window's middle (px), which way
  // she flies, and whether she is on this side of the tower.
  witchAt(u) {
    const far = 560, ease = (k) => k * k * (3 - 2 * k);
    const R = 330 + far * (u < 0.16 ? ease(1 - u / 0.16) : 0) + far * (u > 0.84 ? ease((u - 0.84) / 0.16) : 0);
    const a = u * Math.PI * 2.9;
    return { x: Math.cos(a) * R, y: Math.sin(a) * 84 - 110 - (u > 0.84 ? (u - 0.84) * 900 : 0) + Math.sin(u * 40) * 6, left: Math.sin(a) > 0, front: Math.sin(a) > 0 };
  }

  draw(g) {
    const real = this.real, show = this.show, t = this.t;
    const camY = show.cam.y, lift = camY - CAMERA_START_Y;
    if (lift > STORY.handover) show.draw(g);
    else {
      // the last stretch: the round's own world, its camera lifted for the drawing only
      const at = real.cam.y;
      real.cam.y = at + lift;
      real.draw(g);
      real.cam.y = at;
    }
    const camF = toLayer(camY), wy = H - (this.sillLy - camF), cx = W / 2;
    // the witch, on this side of the tower or beside it
    const W0 = STORY.witch, wu = (t - W0[0]) / (W0[1] - W0[0]);
    if (wu > 0 && wu < 1 && wy > -400 && wy < H + 400) {
      const w = this.witchAt(wu);
      if (w.front || Math.abs(w.x) > TOWER_W / 2 + 40) {
        g.layer('world');
        const frames = w.left ? this.game.art.creatures.witchL : this.game.art.creatures.witchR;
        g.blit(frames[Math.floor(t * 7) % 2], cx + w.x, wy + w.y, w.front ? undefined : { tint: '#8f93b8' });
      }
    }
    g.layer('hud');
    // what is said
    const B = STORY.bubble;
    if (t > B[0] && t < B[1] && wy > 0 && wy < H) this.bubble(g, 'Rescue me!', cx + 150, wy - 236, cx + 40, wy - 130, clamp((t - B[0]) / 0.22, 0, 1), clamp((B[1] - t) / 0.2, 0, 1));
    const ans = t - (STORY.throwAt + this.fallT + STORY.answer);
    if (ans > 0 && lift <= STORY.handover) {
      const pl = real.player, px = real.cam.sx(pl.x), py = real.cam.sy(pl.y + PLAYER_H);
      this.bubble(g, 'On my way!', clamp(px + 150, 150, W - 150), py - 96, px + 30, py - 10, clamp(ans / 0.22, 0, 1), clamp((this.total - t) / 0.2, 0, 1));
    }
    // "tap to skip", once the story is under way, until the braid is down: for whoever has seen it before (a tap
    // skips the first telling too, it just is not offered)
    if (!this.first && t > 1.6 && t < STORY.throwAt + this.fallT - 0.5 && this.skipT == null) g.text('tap to skip', W / 2, H - 44 - SAFE.bottom, 14, '#ffffff', 'center', true, { alpha: 0.75 });      // (with its dark edge: it has to read over the roses and over the sky)
    // out of black at the start, and through black when the rest is skipped
    let black = 1 - clamp(t / STORY.fadeIn, 0, 1);
    if (this.skipT != null) black = Math.max(black, this.skipT < STORY.skipFade ? this.skipT / STORY.skipFade : 1 - clamp((this.skipT - STORY.skipFade) / STORY.skipFade, 0, 1));
    if (black > 0) g.rect(0, 0, W, H, '#0b0a12', black);
  }

  // A speech bubble with its middle at (x, y) and its tail toward (tx, ty); `k` pops it up, `out` fades it.
  bubble(g, text, x, y, tx, ty, k, out) {
    const a = Math.min(1, k * 1.5) * out, pop = easeOutBack(k), w = 26 * text.length + 44, h = 64;
    const l = Math.round(x - (w / 2) * pop), top = Math.round(y - (h / 2) * pop), ww = Math.round(w * pop), hh = Math.round(h * pop);
    // the tail: three steps toward whoever speaks
    for (let i = 1; i <= 3; i++) { const f = i / 4, s = 16 - i * 4; g.rect(Math.round(x + (tx - x) * f * 0.9 - s / 2 - 4), Math.round(y + (ty - y) * f - s / 2 - 4), s + 8, s + 8, INK, a); }
    for (let i = 1; i <= 3; i++) { const f = i / 4, s = 16 - i * 4; g.rect(Math.round(x + (tx - x) * f * 0.9 - s / 2), Math.round(y + (ty - y) * f - s / 2), s, s, PAPER, a); }
    g.rect(l + 8, top - 4, ww - 16, hh + 8, INK, a); g.rect(l - 4, top + 8, ww + 8, hh - 16, INK, a); g.rect(l, top, ww, hh, INK, a);
    g.rect(l + 8, top, ww - 16, hh, PAPER, a); g.rect(l, top + 8, ww, hh - 16, PAPER, a); g.rect(l + 4, top + 4, ww - 8, hh - 8, PAPER, a);
    if (k > 0.6) g.text(text, x, y + 2, 22, INK, 'center', false, { alpha: a });
  }
}
