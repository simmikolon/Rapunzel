import { W, H, PX, PARALLAX_FAR, PARALLAX_TOWER, CAMERA_START_Y } from './config.js';
import { BACKDROP } from './art/backdrop.js';
import { TILE_H, TOWER_W } from './art/tiles.js';
import { WINDOW_FIRST, WINDOW_STOREY, WINDOW_W, WINDOW_H, WINDOW_X, windowAt, blockedBy } from './windows.js';
import { LANTERN, BANNER, GARGOYLE } from './art/hung.js';
import { TOWER_AREAS, ROSES, COURSE, FOOT } from './art/tower.js';
import { TowerPlan, stageWall, stageRecipe, forcedWall } from './towerwall.js';
import { RNG, invLerp, smoothstep, lerp, mixHex, TAU, approach } from './util.js';
import { PAL as C } from './palette.js';
import { forestAlpha, cloudAlpha, nightAlpha, deepForestAmount, hash, treeStyleAt, TREELINE_Y, cloudAmount, lanternAmount } from './altitude.js';
import { TRUNK_W } from './art/tiles.js';
import { TREE_FOOT } from './art/trees.js';
import { Atmosphere } from './atmosphere.js';
import { Weather, WEATHER, RAIN_COLOR, SNOW_COLOR } from './weather.js';
import { StringLights } from './lights.js';
import { Interior } from './interior.js';
import { windowsBetween } from './windows.js';
import { fallDist, fallSwing } from './platforms.js';

// Parallax environment. Layers from back to front:
//   sky gradient (altitude graded) -> stars / moon / clouds (PARALLAX_FAR)
//   -> the forest behind the tower, in two layers at two speeds (FOREST), up to its roof
//   -> tower bricks with Rapunzel's braid and its ribbons (PARALLAX_TOWER)
//   -> tree trunks with the deep forest's string lights between them,
//      branches, swings, prince (1.0, the gameplay plane)
//   -> fireflies (drawn after the actors) -> lighting, the string lights'
//      glow over it, and the vignette.
// Stars, the moon and the fireflies also go into the bloom layer (`glow`).
// Inside the tower (places.js) the room's own painter draws instead
// (interior.js); the sky, the far layer, the forest and the braid here are
// then what its windows show.

// Keyed to the zone bands (100 px = 1 m): forest floor, deep forest from
// 120 m, dawn light at the windows from 250 m, open sky above the trees
// from 400 m, then sunset and night.
const SKY = [
  { y: 0,     top: '#173f50', bot: '#1e3c3f' },   // forest floor
  { y: 12000, top: '#0d2a2f', bot: '#143835' },   // deep forest: darker, greener
  { y: 25000, top: '#3b5f86', bot: '#a7c6d8' },   // windows: dawn through the canopy
  { y: 40000, top: '#3d8ec2', bot: '#a9ddf0' },   // above the trees: open sky
  { y: 55000, top: '#55397f', bot: '#f7a862' },   // sunset
  { y: 70000, top: '#060a22', bot: '#232a5a' },   // night
];
const TRANSITION = 3000;

export function skyAt(y) {
  let i = 0;
  while (i < SKY.length - 1 && y >= SKY[i + 1].y) i++;
  if (i === SKY.length - 1) return { top: SKY[i].top, bot: SKY[i].bot };
  const next = SKY[i + 1];
  const t = smoothstep(invLerp(next.y - TRANSITION, next.y, y));
  return { top: mixHex(SKY[i].top, next.top, t), bot: mixHex(SKY[i].bot, next.bot, t) };
}

// Global lighting: multiplied over the whole scene so the tower, trees and
// the prince pick up the time of day too (cool forest, warm sunset, blue night).
const LIGHT = [
  { y: 0,     color: '#b8e6d8', alpha: 0.16 },
  { y: 12000, color: '#7fc98f', alpha: 0.30 },   // deep forest: green shade
  { y: 25000, color: '#ffe6c8', alpha: 0.08 },   // windows: warm dawn
  { y: 40000, color: '#ffffff', alpha: 0.0 },
  { y: 55000, color: '#ffb070', alpha: 0.26 },
  { y: 70000, color: '#5468b8', alpha: 0.42 },
];
export function lightAt(y) {
  let i = 0;
  while (i < LIGHT.length - 1 && y >= LIGHT[i + 1].y) i++;
  if (i === LIGHT.length - 1) return { color: LIGHT[i].color, alpha: LIGHT[i].alpha };
  const next = LIGHT[i + 1];
  const t = smoothstep(invLerp(next.y - TRANSITION, next.y, y));
  return { color: mixHex(LIGHT[i].color, next.color, t), alpha: lerp(LIGHT[i].alpha, next.alpha, t) };
}

// The forest behind the tower: its two layers, far to near. `f` is how fast
// a layer goes by (the tower's is 0.9), `topAt` the height the prince is at
// when the layer's roof is in the middle of the picture (the trees in front
// end at 460 m: as their tops sink, the forest's roof comes into view at
// either side and sinks more slowly, the far one last). `tint`: what the
// dark forest's grey tiles are coloured with on the forest floor and in the
// deep forest.
const FOREST = [
  { f: 0.42, topAt: 47500, strips: 'far', birch: 'farBirch', top: 'farTop', body: 'farBody', tint: ['#33686a', '#1f4c42'] },
  { f: 0.62, topAt: 46500, strips: 'near', birch: 'nearBirch', top: 'nearTop', body: 'nearBody', tint: ['#1c423e', '#143630'] },
];
const CANOPY_TILES = 4;            // the roof and the leaves under it: enough tiles to fill the picture below its outline
// The air between the two layers, by zone (forest floor, deep forest, none from the dawn zone up): a colour and how much of it.
const FOREST_HAZE = [['#4a8082', 0.34], ['#2f6a58', 0.25], ['#a7c6d8', 0]];
const FOREST_EYE = 400;            // the prince is about this far above the picture's bottom edge
// The layer height that is in the middle of the picture when the prince is at world height y, and the other way round
// (for the picture's design height, so that the forest is the same on every screen).
const forestLy = (y, f) => CAMERA_START_Y + (y - FOREST_EYE - CAMERA_START_Y) * f + 682;
const forestY = (ly, f) => (ly - 682 - CAMERA_START_Y) / f + CAMERA_START_Y + FOREST_EYE;

// How far back the tower stands. Its wall is drawn in the brick ramp's own
// colours (light, so that its roundness shows in the tiles), and then a
// veil of this colour is laid over it, this strong: that darkens it and
// draws its lights and darks together, so that the wall is one quiet plane
// behind the play and the prince, the platforms and what one collects are
// the brightest and most coloured things in the picture. Windows and the
// string course lie under the veil; balconies, gates, the braid and its
// ribbons are drawn after it. (`?veil=0.5` tries another strength.)
const TOWER_VEIL = { color: '#14242b', alpha: 0.3 };

// The tower's string course: its top edge this far above the foot of a storey's window (layer px), which is right under the sill.
const STRING_COURSE = 4;
// What hangs on the wall keeps this far from a window's frame at its sides and above it (layer px), and this far below its
// sill, which clears the string course under it too.
const HUNG_CLEAR = 8, HUNG_BELOW = 32;
// Petals falling from the briar's roses: how many to a tile, how far each falls (layer px), how long that takes (s, from .. to).
const PETALS = { each: 2, fall: 300, time: [6, 10] };
// A liana's lower end keeps this far above the lawn (px): clear of the trees' feet.
const LIANA_CLEAR = 150;
// What hangs on the wall storey by storey (towerwall.js `hung`, art/hung.js), on the side that has no window: how far
// above the storey's sill a lantern's plate is fixed and a banner's rod hangs (layer px); a lantern's light (its halo,
// and the pool it throws on the wall once the time of day has darkened the picture); how hard the wind must blow for
// a banner's four frames, and how fast it flaps (per second, calm .. storm).
const HUNG = { lanternUp: 96, bannerUp: 150, halo: [76, 0.24], pool: [150, 0.2, '#ffb65c'], flap: [1.1, 7] };
// What stands out at the wall's edges (`edge`): a pair of gargoyles at every second storey's string course. When it
// rains the course's water runs out of them: so many drops in the air, falling this far (px) in this long (s).
const SPOUT = { drops: 7, fall: 300, time: 0.62 };
const SIDES = [-1, 1], FLIP = { flip: true }, FLIP_SHADE = { flip: true, tint: '#a6b0b6' }, SOFT_ADD = { soft: true, blend: 'add' }, HALO_GLOW = { glow: 0.5 };      // (the right gargoyle is round the tower from the light)

export class Background {
  constructor(art) {
    this.art = art;
    this.towerVeil = { ...TOWER_VEIL };
    this.plan = new TowerPlan();   // the endless tower's wall, section by section (towerwall.js): rolled anew for every round (rollWall)
    this.wall = null;            // in stages: the wall of the stage he is in (setWall); null: the tower's own plan
    this.forceWall = null;       // dev (?wall=): one recipe all the way up instead of either (forceRecipe)
    this.lamps = [];             // the wall's lanterns that are lit in this frame, five numbers each: where its sprite is, mirrored or not, how far it is on, how bright it is now
    this.litOpt = { flip: false, alpha: 1, glow: 0.7 };
    this.top = null;             // the opening story (story.js): where the tower ends, { ly: the wall's upper edge, sill: Rapunzel's window, look: { dy, blink } } (layer px); null: it has no end
    const r = new RNG(42);
    this.stars = Array.from({ length: 90 }, () => ({ x: r.range(0, W), y: r.range(0, H), s: r.chance(0.2) ? 6 : 4, ph: r.range(0, TAU) }));
    this.clouds = Array.from({ length: 9 }, (_, i) => ({ x: r.range(-60, W + 60), y: r.range(0, 2 * H), v: i % 3, drift: r.range(4, 12) }));
    this.fireflies = Array.from({ length: 22 }, () => ({ x: r.range(-W / 2, W / 2), y: r.range(-100, H + 100), ph: r.range(0, TAU), sp: r.range(0.4, 1.1) }));
    // sky lanterns rising behind the tower (far) and a few in front of it (near)
    this.skyLanterns = Array.from({ length: 18 }, (_, i) => ({ f: i < 12 ? 0.5 : 0.8, x: r.range(-W / 2, W / 2), y: r.range(-200, H + 200), vy: r.range(18, 42), ph: r.range(0, TAU), s: i < 12 ? r.range(0.5, 0.8) : r.range(0.9, 1.3) }));
    this.swayAmp = 12;
    for (const f of this.fireflies) { f.vx = 0; f.vy = 0; }
    this.atmo = new Atmosphere(art, r);
    this.weather = new Weather(art);      // rain, storm, snow, the golden hour (weather.js): which it is, the world says
    this.lights = new StringLights(art);
    this.interior = new Interior(art, this);
    this.place = null;
  }

  // Where the round is climbed (places.js): the world says so before every reset.
  setPlace(place) { this.place = place; }
  // The endless tower's wall for a round: another tower from every seed (towerwall.js TowerPlan).
  rollWall(seed) { this.plan = new TowerPlan(seed); this.wallSeed = seed; }
  // In stages: the tower's wall for the stage `st` that begins with the camera where it is (towerwall.js stageWall:
  // its theme's recipe, and when the theme comes round again what that leaves open is rolled from the round's seed).
  // setWall(null) gives the tower its own plan back.
  setWall(st, cam) {
    if (!st) { this.wall = null; return; }
    const R = stageRecipe(st, this.wallSeed || 0);
    this.wall = stageWall(R, Math.floor(cam.layerY(PARALLAX_TOWER) / TILE_H), st.n, R.roses);
  }
  // dev (?wall=stone+ivy+lanterns+gargoyles, ?wall=ivy, ?wall=plain): that recipe all the way up.
  forceRecipe(name) { this.forceWall = name ? forcedWall(name) : null; }
  // dev (?dev=1): the wall's recipe `up` px above the picture's lower edge, in words ('stone+ivy+lanterns', 'plain').
  wallName(cam, up) {
    const wall = this.forceWall || this.wall || this.plan, ly = cam.layerY(PARALLAX_TOWER) + up, k = Math.floor(ly / TILE_H), i = Math.round((ly - WINDOW_FIRST) / WINDOW_STOREY);
    return [wall.skinAt(k), wall.growthAt(k), wall.hungAt(i), wall.edgeAt(i)].filter(Boolean).map((c) => c.kind).join('+') || 'plain';
  }
  get inside() { return !!this.place && this.place.inside; }
  skyColors(cam) { return skyAt(cam.y); }

  // A new round reseeds what can touch gameplay (the gusts that swing the braid).
  reset(rng) { this.atmo.reset(rng); this.lights.reset(); }

  // Horizontal offset of the braid at world height y (a slow travelling wave).
  braidX(y, time) {
    const amp = this.swayAmp + this.atmo.gustEnv() * 40;   // gusts swing the braid a little wider
    return Math.sin(y / 260 + time * 0.9) * amp + Math.sin(y / 90 - time * 1.7) * amp * 0.25;
  }

  drawSky(g, cam) {
    const { top, bot } = this.weather.sky(skyAt(cam.y), cam.y);
    g.sky(top, bot);
  }

  // Seen from inside the tower nothing out here goes into the bloom layer
  // (it would shine through the wall), and the moon stands where a window
  // can pass over it.
  drawFar(g, cam, time) {
    const camF = cam.layerY(PARALLAX_FAR);
    const night = nightAlpha(cam.y);
    const bloom = this.inside ? 0 : 1;
    if (night > 0) {
      for (const s of this.stars) {
        const sy = ((H - (s.y - camF)) % H + H) % H;        // world y up, screen y down
        const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.ph);
        g.rect(Math.round(s.x), Math.round(sy), s.s, s.s, '#ffffff', night * (0.4 + 0.6 * tw), { glow: 0.7 * bloom });
      }
      g.blit(this.art.tiles.moon, this.inside ? W / 2 + 16 : W - 150, (this.inside ? 330 : 170) + Math.sin(time * 0.2) * 4, { alpha: night, glow: 0.6 * bloom });
    }
    const ca = cloudAlpha(cam.y);
    if (ca > 0) {
      // once cloud platforms are around, the far clouds sit back: thinner and bluer
      const back = cloudAmount(cam.y);
      for (const c of this.clouds) {
        const sy = ((H - (c.y - camF)) % (2 * H) + 2 * H) % (2 * H) - H / 2;
        const sx = ((c.x + time * c.drift) % (W + 240) + (W + 240)) % (W + 240) - 120;
        g.blit(this.art.tiles.clouds[c.v], sx, sy, { alpha: ca * (1 - 0.3 * back), tint: back > 0 ? '#dce9f6' : undefined });
      }
    }
  }

  // The forest behind the tower (art/backdrop.js): a far layer, the air
  // between, a nearer layer. Each is a column of tiles down either side,
  // counted from its top: the forest's roof and the leaves under it, then
  // strips of trunks in the look of the zone they pass at (the forest
  // floor's and the deep forest's tinted with their air, the dawn zone's
  // birches as they are), one look fading into the next as the trees in
  // front do. Seen from inside the tower (`middle`), where the windows are
  // in the middle of the wall, the two columns stand side by side there.
  drawForest(g, cam, middle = false) {
    const A = this.art.backdrop, TH = BACKDROP.tileH * 4;
    const st = treeStyleAt(cam.y + FOREST_EYE);
    const haze = (k) => FOREST_HAZE[Math.min(k, FOREST_HAZE.length - 1)];
    const hazeColor = mixHex(haze(st.a)[0], haze(st.b)[0], st.t), hazeAlpha = lerp(haze(st.a)[1], haze(st.b)[1], st.t);
    FOREST.forEach((L, li) => {
      const camF = cam.layerY(L.f), top = forestLy(L.topAt, L.f);
      const n0 = Math.max(0, Math.floor((top - (camF + H)) / TH)), n1 = Math.floor((top - camF) / TH);
      for (let n = n0; n <= n1; n++) {
        const lyBottom = top - (n + 1) * TH, sy = H - (lyBottom - camF) + cam.oy;
        for (const side of [0, 1]) {
          const flip = side === 1;
          if (n < CANOPY_TILES) { const cw = BACKDROP.canopyW * 4, cx = middle ? W / 2 + (flip ? cw : -cw) : flip ? W : 0; g.blit(A[n === 0 ? L.top : L.body], cx + cam.ox, sy, flip ? { flip } : undefined); continue; }
          const sw = BACKDROP.stripW * 4;
          const x = (middle ? W / 2 + (flip ? sw : -sw) : flip ? W - BACKDROP.stripX : BACKDROP.stripX) + cam.ox;
          const z = treeStyleAt(forestY(lyBottom + TH / 2, L.f)), h = hash(n * 7 + side * 3 + li * 11);
          const one = (k, alpha) => {
            const birch = k >= 2, set = A[birch ? L.birch : L.strips];
            const o = { flip }; if (!birch) o.tint = L.tint[k]; if (alpha < 1) o.alpha = alpha;
            g.blit(set[h % set.length], x, sy, o);
          };
          one(z.a, 1);
          if (z.t > 0 && Math.min(z.a, 2) !== Math.min(z.b, 2)) one(z.b, z.t);
        }
      }
      // the air between the layers: it takes the far one back
      if (li === 0 && hazeAlpha > 0.005) g.rect(0, 0, W, H, hazeColor, hazeAlpha);
    });
  }

  // The tower scrolls slower than the prince: it stands behind the trees.
  drawTower(g, cam, time, world) {
    const camF = cam.layerY(PARALLAX_TOWER);
    const first = Math.max(0, Math.floor(camF / TILE_H)), last = Math.ceil((camF + H) / TILE_H);
    const t = this.art.tiles;
    // the wall, tile by tile (towerwall.js): what it is built of there (the plain bricks, or its section's skin) and what
    // grows on it, which is laid over that below
    const wall = this.forceWall || this.wall || this.plan;
    const of = (A, a) => (typeof a.tile === 'number' ? A.loop[a.tile] : A[a.tile]);
    const spriteOf = (a) => of(t.towerAreas[a.kind], a);
    const grown = [], hung = [];
    const topTile = this.top ? Math.floor(this.top.ly / TILE_H) - 1 : Infinity;      // (the story's tower has a top: no wall above it)
    for (let k = Math.max(0, first - 1); k <= Math.min(last + 1, topTile); k++) {      // (a tile more at each end: a thing that hangs on it may reach into the picture)
      const h = hash(k + 7), skin = wall.skinAt(k), growth = wall.growthAt(k), sy = H - (k * TILE_H - camF) + cam.oy;
      let v = 0;
      if (k > 0) { const r = h % 100; v = r < 56 ? 0 : r < 70 ? 1 : r < 82 ? 2 : r < 92 ? 3 : 4; }
      g.blit(skin ? spriteOf(skin) : t.tower[v], W / 2 + cam.ox, sy);
      if (growth) grown.push([spriteOf(growth), sy]);
      if (skin) for (const f of of(t.towerAreas[skin.kind].fix, skin)) hung.push([f, k, sy, skin]);
      if (growth) for (const f of of(t.towerAreas[growth.kind].fix, growth)) hung.push([f, k, sy, growth]);
    }
    // a string course runs round the tower under every row of windows (broken where the wall is crumbling or being mended)
    for (let i = Math.max(0, Math.floor((camF - STRING_COURSE - WINDOW_FIRST) / WINDOW_STOREY)); ; i++) {
      const ly = WINDOW_FIRST + i * WINDOW_STOREY + STRING_COURSE;
      if (ly > camF + H + 30 || (this.top && ly > this.top.ly - 60)) break;
      const a = wall.skinAt(Math.floor((ly - 12) / TILE_H));
      g.blit((a && t.towerBands[TOWER_AREAS[a.kind].band]) || t.towerBand, W / 2 + cam.ox, H - (ly - camF) + cam.oy);
    }
    // what grows on the wall, over its bricks and its string courses; the windows are cut into it
    for (const [sprite, sy] of grown) g.blit(sprite, W / 2 + cam.ox, sy);
    // what hangs on the wall (art/tower.js): each thing whole, so one that would meet a window (or the string course under
    // its sill) gets out of its way, up or down the wall, whichever is nearer, by whole courses (a rose is left out instead)
    for (const [f, k, sy, a] of hung) {
      const round = Math.max(0, Math.floor((a.i - 1) / TOWER_AREAS[a.kind].loop));                 // which round of the area's loop this tile is in
      const s = f.s || (f.roses ? f.roses[a.n % f.roses.length][f.form]                             // (a stretch of briar has roses of one colour)
        : f.signs[f.sign == null ? (1 + f.slot + f.slots * round) % f.signs.length : f.sign]);     // (the signs in turn up the wall, so no two alike follow each other)
      const left = f.dx - s.ax, top = k * TILE_H + f.dy + s.ay;
      const w = windowsBetween(top - s.h - WINDOW_H - HUNG_CLEAR, top + HUNG_BELOW).find((q) => left < q.x + WINDOW_W / 2 + HUNG_CLEAR && left + s.w > q.x - WINDOW_W / 2 - HUNG_CLEAR);
      let up = 0;
      if (w) {
        if (!f.slide) continue;
        const above = Math.ceil((w.ly + WINDOW_H + HUNG_CLEAR - (top - s.h)) / COURSE) * COURSE, below = Math.ceil((top - (w.ly - HUNG_BELOW)) / COURSE) * COURSE;
        up = above <= below ? above : -below;
      }
      const o = f.tint ? { tint: f.tint } : {};
      if (f.swing) o.rot = 0.05 * Math.sin(time * 1.3 + k) + 0.02 * Math.sin(time * 2.9 + k * 2);
      g.blit(s, W / 2 + f.dx + cam.ox, sy - f.dy - up, o);
    }
    this.drawWindows(g, cam, camF, time, world);
    const blockers = world ? world.platforms.filter((p) => p.kind === 'balcony' || p.kind === 'gate') : [];
    this.drawHung(g, cam, camF, time, wall, blockers);
    // the tower's foot (art/tower.js): its plinth, the witch's gate and her arms, over the lowest tiles and the first string course
    if (camF < FOOT.up * PX + 20) g.blit(t.towerFoot, W / 2 + cam.ox, H + camF + cam.oy);
    // petals the roses let go of: two to a tile of briar, each falling a few metres down the wall, turning, and beginning again
    for (let k = first; k <= last + 2; k++) {
      const a = wall.growthAt(k);
      if (!a || a.kind !== 'briar' || typeof a.tile !== 'number') continue;
      const R = ROSES[a.n % ROSES.length], top = H - ((k + 1) * TILE_H - camF) + cam.oy;
      for (let i = 0; i < PETALS.each; i++) {
        const h = hash(k * 7 + i * 3 + 1), period = PETALS.time[0] + (h % 1000) / 1000 * (PETALS.time[1] - PETALS.time[0]);
        const f = ((time + ((h >>> 10) % 1000) / 1000 * period) % period) / period;                           // 0 as it lets go .. 1 where it is gone
        const x = W / 2 - TOWER_W / 2 + 36 + ((h >>> 4) % (TOWER_W - 72)) + Math.sin(time * 1.1 + h) * 12 + f * 26 + cam.ox, flat = Math.sin(time * 3.1 + h) > 0;
        g.rect(x, top + (h % TILE_H) + f * PETALS.fall, flat ? 8 : 4, flat ? 4 : 8, i % 2 ? R.hi : R.base, Math.min(1, f * 8, (1 - f) * 4));
      }
    }
    // set the wall back (TOWER_VEIL): what is played on is drawn after this and keeps its colours
    const wallTop = this.top ? Math.max(0, H - (this.top.ly - camF) + cam.oy) : 0;
    if (this.towerVeil.alpha > 0 && wallTop < H) g.rect(W / 2 - TOWER_W / 2 + cam.ox, wallTop, TOWER_W, H - wallTop, this.towerVeil.color, this.towerVeil.alpha);
    this.drawHungLights(g);
    this.drawEdge(g, cam, camF, time, wall, blockers);
    this.drawTowerTop(g, cam, time);
  }

  // What hangs on the wall storey by storey (towerwall.js `hung`, art/hung.js): a lantern on its arm or a banner on
  // its rod, on the side of a storey that has no window; none where a balcony or a gate sits, where the masons are at
  // work, or beside Rapunzel's own window. Under the wall's veil, as the windows are. A lantern is lit when it gets
  // dark (toward sunset and at night, in the deep forest's shade, under a storm), each at its own moment, and its
  // light is drawn after the veil (drawHungLights). A banner blows in whatever wind there is: the rain's breeze, the
  // forest's gusts, a storm's blow. Where it snows, snow lies on a lantern's roof and on a banner's rod.
  drawHung(g, cam, camF, time, wall, blockers) {
    const A = this.art.hung, lamps = this.lamps, weather = this.weather;
    lamps.length = 0;
    const dark = Math.max(lanternAmount(cam.y), deepForestAmount(cam.y), Math.min(1, weather.num('grey') * 2));
    const slant = weather.slant, wind = Math.min(1, Math.abs(slant) * 1.5 + this.atmo.gustEnv() * 0.55 + 0.1), caps = weather.has('caps');
    for (let i = Math.max(0, Math.floor((camF - 180 - WINDOW_FIRST) / WINDOW_STOREY)); ; i++) {
      const ly = WINDOW_FIRST + i * WINDOW_STOREY;
      if (ly > camF + H + 40) break;
      const c = wall.hungAt(i);
      if (!c || (this.top && ly > this.top.sill - 420)) continue;
      const w = windowAt(i), side = w.side === 'L' ? 'R' : 'L', flip = side === 'R';
      if (blockedBy({ side, ly }, blockers)) continue;
      const skin = wall.skinAt(Math.floor((ly + 60) / TILE_H));
      if (skin && skin.kind === 'mended') continue;
      const x = W / 2 - w.x + cam.ox, base = H - (ly - camF) + cam.oy;
      if (c.kind === 'lanterns') {
        const sx = x + (flip ? 1 : -1) * LANTERN.w * PX / 2, sy = base - HUNG.lanternUp, left = flip ? sx - LANTERN.w * PX : sx, top = sy - 5 * PX;
        g.blit(A.lantern, sx, sy, flip ? FLIP : undefined);
        if (caps > 0.01) { g.rect(flip ? left : left + 6 * PX, top + 4 * PX, 6 * PX, PX, SNOW_COLOR, caps); g.rect(flip ? left + PX : left + 7 * PX, top + 3 * PX, 4 * PX, PX, SNOW_COLOR, caps); }
        const at = 0.15 + 0.5 * ((hash(i * 13 + 5) % 100) / 100), on = smoothstep(invLerp(at, at + 0.12, dark));
        if (on > 0.01) lamps.push(sx, sy, flip ? 1 : 0, on, on * (0.85 + 0.15 * Math.sin(time * 9 + i * 1.7) * Math.sin(time * 2.3 + i)));
      } else if (c.kind === 'banners') {
        const sy = base - HUNG.bannerUp, flutter = 0.5 + 0.5 * Math.sin(time * lerp(HUNG.flap[0], HUNG.flap[1], Math.min(1, wind * 1.2)) + i * 2.1) * Math.sin(time * 1.7 + i);
        const frame = Math.max(0, Math.min(3, Math.floor(wind * 3 - 0.3 + flutter * 1.1)));
        g.blit(A.banners[c.n % A.banners.length][frame], x, sy, slant < -0.02 ? FLIP : undefined);
        if (caps > 0.01) g.rect(x - BANNER.rod * PX / 2, sy - PX, BANNER.rod * PX, PX, SNOW_COLOR, caps);
      }
    }
  }
  // The light of the lanterns that are lit, over the wall's veil: the lit lantern faded in over the dark one, and a halo.
  drawHungLights(g) {
    const A = this.art.hung, L = this.lamps, o = this.litOpt;
    for (let n = 0; n < L.length; n += 5) {
      const flip = L[n + 2] > 0, px = L[n] + (flip ? -1 : 1) * LANTERN.pane[0] * PX, py = L[n + 1] + (LANTERN.pane[1] - 5) * PX;
      o.flip = flip; o.alpha = L[n + 3];
      g.blit(A.lanternLit, L[n], L[n + 1], o);
      g.halo(px, py, HUNG.halo[0], '#ffb347', HUNG.halo[1] * L[n + 4], HALO_GLOW);
    }
  }
  // ... and the pool each throws on the wall, the braid and whoever passes, in the light layer (after the time of day
  // has darkened the picture, as the string lights' is).
  drawHungGlow(g) {
    const L = this.lamps, [r, a, color] = HUNG.pool;
    for (let n = 0; n < L.length; n += 5) g.puff(L[n] + (L[n + 2] > 0 ? -1 : 1) * LANTERN.pane[0] * PX, L[n + 1] + (LANTERN.pane[1] - 5) * PX, r, r, color, a * L[n + 4], SOFT_ADD);
  }

  // What stands out at the wall's edges (towerwall.js `edge`): a pair of gargoyles at the ends of every second
  // storey's string course, none on a side where a balcony or a gate sits. After the wall's veil: they stand out past
  // the wall's edge, and have the veil in their tones. When it rains, the course's water runs out of their mouths;
  // where it snows, snow lies on their heads and backs.
  drawEdge(g, cam, camF, time, wall, blockers) {
    const A = this.art.hung.gargoyle, G = GARGOYLE, rain = Math.min(1, this.weather.num('rain')), caps = this.weather.has('caps');
    for (let i = Math.max(0, Math.floor((camF - 80 - WINDOW_FIRST) / WINDOW_STOREY)); ; i++) {
      const sill = WINDOW_FIRST + i * WINDOW_STOREY, ly = sill + STRING_COURSE;
      if (ly > camF + H + 60 || (this.top && ly > this.top.ly - 60)) break;
      const c = wall.edgeAt(i);
      if (!c || c.j % 2) continue;
      const sy = H - (ly - camF) + cam.oy;
      for (const dir of SIDES) {
        if (blockedBy({ side: dir < 0 ? 'L' : 'R', ly: sill }, blockers)) continue;
        const sx = W / 2 + dir * TOWER_W / 2 + cam.ox;
        g.blit(A, sx, sy, dir < 0 ? undefined : FLIP_SHADE);
        if (caps > 0.01) for (const [x, y, w] of G.snow) g.rect(dir < 0 ? sx - (G.edge - x) * PX : sx + (G.edge - x - w) * PX, sy + (y - G.top - 1) * PX, w * PX, PX, SNOW_COLOR, caps);
        if (rain > 0.05) {
          const mx = sx + dir * ((G.edge - G.mouth[0]) * PX - 2), my = sy + (G.mouth[1] - G.top) * PX;
          g.rect(mx - 2, my, 4, 12, RAIN_COLOR, 0.75 * rain);
          for (let n = 0; n < SPOUT.drops; n++) {
            const f = (time / SPOUT.time + n / SPOUT.drops + i * 0.37) % 1;
            g.rect(Math.round(mx + dir * (4 + 14 * f)) - 2, my + 10 + f * f * SPOUT.fall, 4, 10 + 16 * f, RAIN_COLOR, 0.7 * rain * (1 - f));
          }
        }
      }
    }
  }

  // The tower's top (the opening story sets `top`): the cornice and the roof
  // over the wall's upper edge, and under them Rapunzel at her window, in the
  // light of her room. She is the title sign's portrait; `top.look` is how
  // she holds herself (`dy`: ducked or stretched, px; `blink`). Drawn after
  // the veil: this is what the picture is about.
  drawTowerTop(g, cam, time) {
    const T = this.top;
    if (!T) return;
    const camF = cam.layerY(PARALLAX_TOWER), sy = (ly) => H - (ly - camF) + cam.oy, x = W / 2 + cam.ox;
    if (sy(T.ly) > H + 420 || sy(T.sill) < -260) return;
    const A = this.art.story, S = this.art.sign, look = T.look || {};
    g.blit(A.cornice, x, sy(T.ly) - 12);
    g.blit(A.roof, x, sy(T.ly) - 8);
    const wy = sy(T.sill), dy = look.dy || 0;
    g.halo(x, wy - 80, 260, '#ffb347', 0.2 + 0.04 * Math.sin(time * 2.3), { glow: 0.5 });
    g.blit(A.windowBack, x, wy);
    const blink = look.blink != null ? look.blink : (time % 4.3) < 0.13;
    g.blit(blink ? S.rapunzelBlink : S.rapunzel, x - 10, wy + 14 + dy + Math.sin(time * 1.7) * 2);
    g.blit(A.windowFront, x, wy);
    if (dy < 18) g.blit(S.hands, x - 10, wy + 2);
  }

  // Windows left and right of the braid in their storey rhythm (windows.js
  // decides where); a lit one flickers and glows a little. None where a
  // balcony sits on the wall.
  drawWindows(g, cam, camF, time, world) {
    const blockers = world ? world.platforms.filter((p) => p.kind === 'balcony' || p.kind === 'gate') : [];   // a gate's door takes a window's place too
    const spr = this.art.windows;
    for (const w of windowsBetween(camF - 130, camF + H + 10, blockers)) {
      if (this.top && w.ly > this.top.sill - 420) continue;      // (none beside Rapunzel's own)
      const sx = W / 2 + w.x + cam.ox, sy = H - (w.ly - camF) + cam.oy;
      g.blit(spr[w.side][w.variant], sx, sy);
      if (w.lit) {
        const fl = 0.8 + 0.2 * Math.sin(time * 9 + w.i * 1.7) * Math.sin(time * 2.3 + w.i);
        g.rect(sx - 4, sy - 60, 8, 12, C.lanternGlow, fl, { glow: 0.8 });
        g.halo(sx, sy - 52, 64, '#ffb347', 0.16 * fl, { glow: 0.5 });
      }
    }
  }

  trunkVariant(k, side) {
    const h = (side === 'L' ? hash(k * 3 + 1) : hash(k * 5 + 2)) % 100;
    return h < 55 ? 0 : h < 75 ? 1 : h < 88 ? 2 : 3;
  }

  // Trunks are the front layer: they share the prince's plane because the
  // branches and swings he bounces on hang from them. Each tile takes the
  // tree style of its height (crossfading near a zone boundary), then gets
  // hashed overlays, climbing vines and swaying lianas.
  drawTrees(g, cam, time) {
    const crownTile = Math.floor(TREELINE_Y / TILE_H);     // the trunks end here with a crown
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.min(crownTile, Math.ceil(cam.top / TILE_H));
    if (first > last) return;
    const T = this.art.trees;
    const gust = this.atmo.gustEnv();
    for (let k = first; k <= last; k++) {
      const sy = cam.sy(k * TILE_H);
      if (k === crownTile) { g.blit(T.crownL, cam.ox, sy); g.blit(T.crownL, W + cam.ox, sy, { flip: true }); continue; }      // (the right tree is the left one, mirrored)
      const st = treeStyleAt(k * TILE_H);
      const vL = this.trunkVariant(k, 'L'), vR = this.trunkVariant(k, 'R');
      g.blit(T.styles[st.a].trunkL[vL], cam.ox, sy);
      g.blit(T.styles[st.a].trunkL[vR], W + cam.ox, sy, { flip: true });
      if (st.t > 0) { g.blit(T.styles[st.b].trunkL[vL], cam.ox, sy, { alpha: st.t }); g.blit(T.styles[st.b].trunkL[vR], W + cam.ox, sy, { alpha: st.t, flip: true }); }
      this.drawTrunkOverlays(g, cam, k, st.t < 0.5 ? st.a : st.b, sy);
    }
    this.drawVines(g, cam, time, gust, first, last);
    this.drawLianas(g, cam, time, gust, first, last);
    // where they stand on the lawn (art/trees.js): each tree's own foot, over what climbs and hangs on it, and in one of
    // them a light is on; in front of it grass, or the snow's edge where the lawn is snowed in
    if (first === 0) {
      const y = cam.sy(0), [wx, wy] = TREE_FOOT.window, fl = 0.75 + 0.25 * Math.sin(time * 7) * Math.sin(time * 2.1), wide = TREE_FOOT.w * PX;
      g.blit(T.feet[0], cam.ox, y); g.blit(T.feet[1], W + cam.ox, y, { flip: true });
      g.rect(wx * PX + cam.ox, y - (wy + 3) * PX, 2 * PX, 3 * PX, C.lanternHi, 0.5 * fl, { glow: 0.8 });
      const snow = Math.max(this.weather.drawDrift(g, cam, 0, wide), this.weather.drawDrift(g, cam, W - wide, W));
      if (snow < 1) { g.blit(T.feetGrass[0], cam.ox, y, { alpha: 1 - snow }); g.blit(T.feetGrass[1], W + cam.ox, y, { alpha: 1 - snow, flip: true }); }
    }
  }

  // Hashed overlays per tile and side: moss, cracks, holes, fungus shelves,
  // lichen, burls on the inner edge; the mix and count come from the style.
  drawTrunkOverlays(g, cam, k, styleIndex, sy) {
    const style = this.art.trees.styles[styleIndex], O = this.art.trees.overlays;
    const total = style.overlays.reduce((a, o) => a + o[1], 0);
    for (const side of ['L', 'R']) {
      const seed = hash(k * 29 + (side === 'L' ? 3 : 4));
      const n = style.perTile[0] + (seed % (style.perTile[1] - style.perTile[0] + 1));
      for (let i = 0; i < n; i++) {
        const h = hash(seed + i * 101);
        let pick = h % total, kind = style.overlays[0][0];
        for (const [name, wgt] of style.overlays) { if (pick < wgt) { kind = name; break; } pick -= wgt; }
        const inset = 14 + (hash(h + 7) % 64);                      // px from the screen edge, inside the trunk
        const y = sy - TILE_H + 12 + (hash(h + 13) % (TILE_H - 24));   // sy already carries the shake
        const x = (side === 'L' ? inset : W - inset) + cam.ox;
        if (kind === 'moss') g.blit(O.moss[hash(h + 3) % 3], x, y);
        else if (kind === 'crack') g.blit(O.crack, x, y);
        else if (kind === 'hole') g.blit(O.hole, x, y);
        else if (kind === 'fungus') g.blit(O.fungus[hash(h + 5) % 2], (side === 'L' ? TRUNK_W - 14 : W - TRUNK_W + 14) + cam.ox, y);
        else if (kind === 'lichen') g.blit(O.lichen, x, y);
        else if (kind === 'burl') g.blit(side === 'L' ? O.burlL : O.burlR, (side === 'L' ? TRUNK_W - 6 : W - TRUNK_W + 6) + cam.ox, y);
      }
    }
  }

  // Climbing vines: winding polylines along the inner part of each trunk that
  // cross tile boundaries (ivy with leaves, thorny tendrils with red barbs,
  // flowering creepers). Defined per 5-tile slot by hash so they are stable.
  drawVines(g, cam, time, gust, first, last) {
    const leaves = this.art.tiles.leaves;
    const slotTiles = 5;
    for (const side of ['L', 'R']) {
      for (let j = Math.floor(first / slotTiles) - 2; j <= Math.floor(last / slotTiles); j++) {
        const seed = hash(j * 37 + (side === 'L' ? 11 : 12));
        const startY = j * slotTiles * TILE_H + (seed % 300);
        const style = this.art.trees.styles[treeStyleAt(startY).a];
        if (!style.vines.length || (seed % 100) >= style.vineChance * 100) continue;
        const len = TILE_H * (3 + (hash(seed + 1) % 5));
        const endY = Math.min(startY + len, TREELINE_Y - TILE_H);
        if (endY <= startY) continue;
        if (endY < cam.y - 40 || startY > cam.top + 40) continue;
        const total = style.vines.reduce((a, v) => a + v[1], 0);
        let pick = hash(seed + 2) % total, kind = style.vines[0][0];
        for (const [name, wgt] of style.vines) { if (pick < wgt) { kind = name; break; } pick -= wgt; }
        const phase = (seed % 628) / 100, amp = 14 + (hash(seed + 3) % 12);
        const baseX = side === 'L' ? TRUNK_W - 36 : W - TRUNK_W + 36;
        const col = kind === 'thorn' ? '#4a2a28' : kind === 'flower' ? '#3f6b3a' : C.leafDark;
        const step = 14;
        let prev = null;
        const y0 = Math.max(startY, 0, cam.y - 40), y1 = Math.min(endY, cam.top + 40);      // (none below the lawn's line)
        for (let y = Math.floor(y0 / step) * step; y <= y1; y += step) {
          const taper = Math.min(1, (endY - y) / 120);                  // thins out at the top
          const x = baseX + Math.sin(y / 110 + phase) * amp + gust * Math.sin(y / 90 + time * 6) * 6 + cam.ox;
          const sy = cam.sy(y);
          if (prev) g.line(prev.x, prev.y, x, sy, col, 2 + 2 * taper);
          if (y % 42 === 0 && taper > 0.2) {
            const k2 = Math.floor(y / 42);
            const dir = k2 % 2 ? 1 : -1;
            if (kind === 'thorn') { g.rect(x + dir * 5 - 2, sy - 2, 4, 4, '#8e2727'); g.rect(x + dir * 7 - 1, sy - 3, 2, 2, '#c23a3a'); }
            else g.blit(leaves[kind === 'flower' ? 0 : (k2 % 2)], x + dir * 9, sy - 4, { rot: dir * 0.6 + Math.sin(time + k2) * 0.1, sx: 0.75, sy: 0.75 });
            if (kind === 'flower' && k2 % 3 === 0) { g.rect(x - dir * 6 - 3, sy - 3, 6, 6, k2 % 2 ? C.ribbonHi : '#fff3e0'); g.rect(x - dir * 6 - 1, sy - 1, 2, 2, C.gold); }
          }
          prev = { x, y: sy };
        }
      }
    }
  }

  // Lianas and hanging moss: strands from the inner edge of the trunks that
  // sway, much more in a gust.
  drawLianas(g, cam, time, gust, first, last) {
    const leaves = this.art.tiles.leaves;
    for (let k = first - 2; k <= last; k++) {
      if ((k + 1) * TILE_H > TREELINE_Y - TILE_H) break;
      const style = this.art.trees.styles[treeStyleAt(k * TILE_H).a];
      if (style.lianas <= 0) continue;
      for (const side of ['L', 'R']) {
        const seed = hash(k * 41 + (side === 'L' ? 5 : 6));
        if ((seed % 100) >= style.lianas * 100) continue;
        const moss = style.name === 'giant' && (hash(seed + 9) % 2 === 0);
        const x0 = (side === 'L' ? TRUNK_W - 4 - (seed % 10) : W - TRUNK_W + 4 + (seed % 10)) + cam.ox;
        const y0 = k * TILE_H + (hash(seed + 2) % TILE_H);
        const len = Math.min(moss ? 50 + (hash(seed + 1) % 60) : 130 + (hash(seed + 1) % 140), y0 - LIANA_CLEAR);      // (one near the lawn ends above the roots)
        if (len < 40) continue;
        if (y0 < cam.y - 20 || y0 - len > cam.top + 20) continue;
        const n = 7, col = moss ? '#7a9a6a' : C.leafDark;
        let px = x0, py = cam.sy(y0);
        for (let i = 1; i <= n; i++) {
          const f = i / n;
          const sway = Math.sin(time * 1.1 + k * 0.7 + side.charCodeAt(0)) * (5 + gust * 30) * f * f;
          const x = x0 + sway, y = cam.sy(y0 - len * f);
          g.line(px, py, x, y, col, moss ? 2 : 3);
          if (!moss && (i === 3 || i === n)) g.blit(leaves[1], x + (side === 'L' ? 6 : -6), y, { rot: 0.4 * (side === 'L' ? 1 : -1), sx: 0.7, sy: 0.7 });
          if (moss && i === n) g.rect(x - 2, y - 1, 4, 3, '#9fbf8a');
          px = x; py = y;
        }
      }
    }
  }

  // Owls blink in the knot holes (trunk variant 2) in the deep forest and at night.
  drawOwls(g, cam, time) {
    const amount = Math.max(deepForestAmount(cam.y), nightAlpha(cam.y));
    if (amount <= 0) return;
    const first = Math.max(0, Math.floor(cam.y / TILE_H)), last = Math.ceil(cam.top / TILE_H);
    for (let k = first; k <= last; k++) {
      if (k * TILE_H >= TREELINE_Y - TILE_H) break;
      for (const side of ['L', 'R']) {
        if (this.trunkVariant(k, side) !== 2) continue;
        const cx = (side === 'L' ? 48 : W - 48) + cam.ox;
        const cy = cam.sy(k * TILE_H) - TILE_H + 88 + cam.oy;
        const seed = hash(k * 23 + (side === 'L' ? 1 : 2));
        const blink = ((time * 0.6 + (seed % 700) / 100) % 6) < 0.22;     // a short blink every ~6 s
        if (blink) continue;
        const look = Math.round(Math.sin(time * 0.4 + seed % 10) * 2);
        for (const dx of [-9, 9]) {
          g.rect(cx + dx - 4 + look, cy - 4, 8, 8, '#ffd34a', amount, { glow: 0.9 });
          g.rect(cx + dx - 1 + look, cy - 1, 3, 3, '#2a1a10', amount);
        }
      }
    }
  }

  // The braid hangs down the tower, so it scrolls with the tower layer.
  // After a cut (`cut.ly`, layer height) only the part above it hangs, with
  // a frayed end; the pieces below (`cut.pieces`: { top, bottom, t }) fall
  // away, shifted down by fallDist(t) like the ribbons riding them.
  // In the opening story (story.js) the braid has an upper end too
  // (`cut.top`: Rapunzel's sill) and its lower end is not cut but let down
  // (`cut.loose`): it comes down the tower with a bow on it.
  drawBraid(g, cam, time, cut) {
    const t = this.art.tiles;
    const step = 40;
    const camF = cam.layerY(PARALLAX_TOWER);
    const top = cut && cut.top != null ? cut.top : Infinity;
    const start = Math.min(Math.floor((camF + H + 60) / step) * step, Math.floor((top - step) / step) * step);
    const cutLy = cut ? cut.ly : -Infinity;
    const bottom = Math.max(-240, camF - 60, cutLy);
    for (let ly = start; ly >= bottom; ly -= step) {
      g.blit(t.braid, W / 2 + this.braidX(ly, time) + cam.ox, H - (ly + step - camF) + cam.oy);
    }
    if (cut && cut.loose) {
      // the end that is let down: the braid runs on to it, and it carries a bow that swings
      if (cutLy <= top - step && cutLy > camF - 120 && cutLy < camF + H + 80) {
        const bx = W / 2 + this.braidX(cutLy, time) + cam.ox, by = H - (cutLy - camF) + cam.oy;
        g.blit(t.braid, bx, by - step);
        g.blit(this.art.sign.bow, bx + Math.sin(time * 9) * 4, by + 4);
      }
    } else if (cutLy > camF - 80 && cutLy < camF + H + 80) g.blit(t.braidCut, W / 2 + this.braidX(cutLy, time) + cam.ox, H - (cutLy - camF) + cam.oy);
    if (cut) {
      for (const pc of cut.pieces) {
        const d = fallDist(pc.t), sw = fallSwing(pc.t);
        const lo = Math.max(pc.bottom, camF - 60 + d), hi = Math.min(pc.top, camF + H + 60 + d);
        for (let ly = Math.floor((hi - step) / step) * step; ly >= lo; ly -= step) {
          g.blit(t.braid, W / 2 + this.braidX(ly, time) + sw + cam.ox, H - (ly + step - d - camF) + cam.oy);
        }
        if (pc.top - d > camF - 80 && pc.top - d < camF + H + 80) g.blit(t.braidCut, W / 2 + this.braidX(pc.top, time) + sw + cam.ox, H - (pc.top - d - camF) + cam.oy, { sy: -1 });
      }
    }
    // the loose end curls up on the lawn (which is in the prince's plane)
    if (cam.y < 60 && !(cutLy > -240)) g.blit(t.braidEnd, cam.sx(this.braidX(0, time) + 30), cam.sy(-4));
  }

  drawGround(g, cam) {
    if (cam.y > 40) return;
    g.blit(this.art.tiles.ground, W / 2 + cam.ox, cam.sy(0));
    g.blit(this.art.tiles.path, W / 2 + cam.ox, cam.sy(0) + PX);      // the stepping stones to the gate
    const top = cam.sy(0) + this.art.tiles.ground.h - this.art.tiles.ground.ay;
    if (top < H) g.rect(0, top, W, H - top, C.grassDark);
  }

  drawBack(g, cam, time, world) {
    if (this.inside) return this.interior.drawBack(g, cam, time, world);
    this.drawSky(g, cam);
    this.drawFar(g, cam, time);
    this.drawForest(g, cam);
    this.weather.drawFar(g, cam, time);
    this.drawSkyLanterns(g, cam, time, false);
    this.atmo.drawBackFog(g, cam, time);
    this.drawTower(g, cam, time, world);
    this.atmo.drawDapple(g, cam, time);
    this.drawBraid(g, cam, time, world && world.braidCut);
    this.drawSkyLanterns(g, cam, time, true);
    this.atmo.drawBackLeaves(g, cam);
    this.atmo.drawMidFog(g, cam, time);
    this.weather.drawMid(g, cam, time);
    this.drawGround(g, cam);
    this.weather.drawGround(g, cam);
    this.atmo.drawLawnMist(g, cam, time);
    this.drawTrees(g, cam, time);
    this.drawOwls(g, cam, time);
    this.lights.draw(g, cam, time, this.atmo.gustEnv());
    this.atmo.drawLife(g, cam, time);
    this.atmo.drawShafts(g, cam, time);
  }

  // Closest layer: big leaves and mist drifting in front of everything.
  drawFrontAtmosphere(g, cam, time, world) { if (!this.inside) { this.atmo.drawFront(g, cam, time, world); this.weather.drawFront(g, cam, time); } }

  // No weather indoors: no gusts, fog, leaves or string lights.
  updateAtmosphere(dt, cam, time, world) {
    if (this.inside) { if (world && world.audio && world.audio.weather) world.audio.weather(0, 0); return; }      // (its rain and wind are not heard in here)
    this.atmo.update(dt, cam, time, world);
    const kind = world && world.weatherKind ? world.weatherKind() : 'clear';
    // a storm draws up: it is said, and a first thunder rolls, well before its first gust
    if (world && world.toast && WEATHER[kind] && WEATHER[kind].gusts && !this.weather.b.gusts) { world.toast('A storm is coming!', '#cfe0ff', 2.6); if (world.audio && world.audio.thunder) world.audio.thunder(); }
    // ... and that it has passed
    else if (world && world.toast && WEATHER[kind] && !WEATHER[kind].gusts && this.weather.b.gusts) world.toast('The storm has passed', '#ffe9a8', 2.2);
    this.weather.want(kind);
    this.weather.update(dt, time, world && world.audio);
    this.lights.update(dt, cam, time, world, this.atmo.gustEnv());
  }

  // Fireflies wander, gather in a loose orbit around lanterns and scatter
  // when the prince comes close.
  updateSkyLanterns(dt, cam) {
    if (lanternAmount(cam.y) <= 0) return;
    for (const l of this.skyLanterns) {
      l.y += l.vy * dt;
      const camL = cam.layerY(l.f);
      if (Math.abs(l.y - camL - H / 2) > 2 * H) l.y = camL + Math.random() * (H + 240) - 120;   // first sight: spread over the view
      else if (l.y > camL + H + 120) { l.y = camL - 120; l.x = -W / 2 + Math.random() * W; }
      else if (l.y < camL - 160) l.y = camL + H + 100;
    }
  }

  drawSkyLanterns(g, cam, time, near) {
    const amount = lanternAmount(cam.y);
    if (amount <= 0) return;
    const night = nightAlpha(cam.y);
    const alpha = amount * (0.55 + 0.45 * night);
    const spr = this.art.lanterns.far, bloom = this.inside ? 0 : 1;
    for (const l of this.skyLanterns) {
      if ((l.f > 0.7) !== near) continue;
      const camL = cam.layerY(l.f);
      const sx = W / 2 + l.x + Math.sin(time * 0.5 + l.ph) * 14 + cam.ox, sy = H - (l.y - camL) + cam.oy;
      if (sy < -40 || sy > H + 40) continue;
      g.halo(sx, sy, 26 * l.s, '#ffbe50', alpha * 0.5, { glow: bloom });
      g.blit(spr, sx, sy, { sx: l.s, sy: l.s, alpha, glow: 0.8 * bloom });
    }
  }

  updateFireflies(dt, cam, time, world) {
    this.updateSkyLanterns(dt, cam);
    if (this.inside) return;
    const lanterns = world ? world.pickups.filter((k) => k.alive && k.kind === 'lantern') : [];
    const p = world && world.player;
    for (const f of this.fireflies) {
      let wx = Math.sin(time * 0.7 * f.sp + f.ph) * 40, wy = Math.cos(time * 0.5 * f.sp + f.ph) * 26 + 8;
      let best = null, bd = 320;
      for (const l of lanterns) { const d = Math.hypot(l.x - f.x, l.y - f.y); if (d < bd) { bd = d; best = l; } }
      if (best) {
        const a = time * 1.4 * f.sp + f.ph;
        const tx = best.x + Math.cos(a) * 70, ty = best.y + Math.sin(a) * 50;
        wx = (tx - f.x) * 1.6; wy = (ty - f.y) * 1.6;
      }
      if (p && p.alive) {
        const dx = f.x - p.x, dy = f.y - (p.y + 110), d = Math.hypot(dx, dy);
        if (d < 130) { const k = (130 - d) / 130; wx += (dx / (d || 1)) * 320 * k; wy += (dy / (d || 1)) * 320 * k; }
      }
      f.vx = approach(f.vx, wx, 3, dt); f.vy = approach(f.vy, wy, 3, dt);
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -W / 2 - 20) f.x = W / 2 + 20; else if (f.x > W / 2 + 20) f.x = -W / 2 - 20;
      const span = H + 240;
      if (f.y < cam.y - 120) f.y += span;
      else if (f.y > cam.top + 120) f.y -= span;
    }
  }

  drawFront(g, cam, time) {
    if (this.inside) return;
    const a = forestAlpha(cam.y);
    const night = nightAlpha(cam.y);
    const alpha = Math.max(a, night * 0.7);
    if (alpha <= 0) return;
    const col = night > 0.5 ? '#bfe4ff' : '#c8ff7a';
    for (const f of this.fireflies) {
      const blink = 0.25 + 0.75 * Math.abs(Math.sin(time * 1.6 * f.sp + f.ph));
      const sx = cam.sx(f.x), sy = cam.sy(f.y);
      g.rect(sx - 10, sy - 10, 20, 20, col, alpha * blink * 0.35, { glow: 0.6 });
      g.rect(sx - 3, sy - 3, 6, 6, col, alpha * blink, { glow: 1 });
    }
  }

  drawLighting(g, cam) {
    if (this.inside) return this.interior.drawLighting(g, cam);
    const l = lightAt(cam.y);
    if (l.alpha > 0.001) g.lighting(l.color, l.alpha);
    this.weather.drawLight(g);
    this.lights.drawGlow(g);      // lamps shine through the time of day
    this.drawHungGlow(g);
  }

  drawVignette(g) { g.vignette(); }
}
