import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';
import { PX } from '../config.js';
import { RNG } from '../util.js';
import { TOWER_W, buildTower } from './tower.js';

// Environment tiles. The world is 768 logical px wide (192 art px).
// Vertical tiles are 192 logical px tall (48 art px), the original tile height.

export const TILE_H = 192;
export { TOWER_W };              // the tower's wall is art/tower.js
export const TRUNK_W = 100;   // trunks span |x| = 284 .. 384

// The prototype's distant forest, 192 x 48 art px: tall thin trunks and leaf
// streaks in the teal palette of bg.png. The game's forest behind the tower
// is art/backdrop.js now; this tile is still the texture of the landing
// page's lower end (site/landing.js).
function drawForest(t, variant) {
  const { p, line } = t;
  const W = 192, H = 48;
  p(0, 0, W, H, C.tealGrey);
  const cols = [C.tealDark, C.mortar, C.dusk, C.tealMid, C.leafDark, C.grassDark, '#2f4d3a', '#35464c'];
  // vertical bands: distant trunks of different widths
  const r = new RNG(99 + variant);
  let x = 0;
  while (x < W) {
    const w = r.int(2, 9);
    p(x, 0, w, H, r.pick(cols));
    if (r.chance(0.3)) p(x, 0, 1, H, C.barkShadow);
    x += w + r.int(0, 3);
  }
  // diagonal light shafts (like the prototype background)
  for (let i = 0; i < 6; i++) {
    const sx = r.int(0, W);
    for (let y = 0; y < H; y += 1) { const xx = sx + Math.floor(y * 0.6); if (xx < W && (y + i) % 2 === 0) p(xx, y, 2, 1, '#345b60'); }
  }
  // leaf streaks
  for (let i = 0; i < 40; i++) { const lx = r.int(0, W - 4), ly = r.int(0, H - 1); p(lx, ly, r.int(2, 5), 1, r.chance(0.5) ? C.mossDark : C.leafDark); }
  // a few dark birds
  if (variant === 1) { line(60, 10, 63, 8, C.nightDeep); line(63, 8, 66, 10, C.nightDeep); line(140, 30, 143, 28, C.nightDeep); line(143, 28, 146, 30, C.nightDeep); }
}

// Ground at the foot of the tower: 192 x 36 art px with grass, flowers and
// the end of Rapunzel's braid curled up on the lawn.
function drawGround(t) {
  const { p, disc, line } = t;
  const W = 192, H = 36;
  p(0, 6, W, H - 6, C.grassDark);
  p(0, 6, W, 6, C.grass);
  p(0, 4, W, 3, C.grassLight);
  const r = new RNG(7);
  for (let i = 0; i < 70; i++) { const x = r.int(0, W - 1); p(x, 2 + r.int(0, 2), 1, 2 + r.int(0, 2), r.chance(0.5) ? C.grassLight : C.grass); }
  for (let i = 0; i < 40; i++) { const x = r.int(0, W - 2), y = r.int(12, H - 2); p(x, y, r.int(1, 3), 1, C.grass); }
  for (let i = 0; i < 14; i++) { const x = r.int(3, W - 3); const col = r.pick([C.ribbonHi, C.gold, C.white, C.ribbon]); p(x, 3, 1, 1, col); p(x - 1, 4, 3, 1, col); p(x, 5, 1, 2, C.grass); }
  // dirt patches
  for (let i = 0; i < 10; i++) { const x = r.int(0, W - 6), y = r.int(14, H - 4); p(x, y, r.int(3, 8), 2, C.barkDeep); }
}

// The path to the witch's gate: stepping stones in the lawn, PATH.w x PATH.h
// art px, the anchor the middle of its upper edge (background.js lays it on
// the lawn under the gate's threshold). Flat stones seen from in front and a
// little from above, as the lawn is: each a rounded slab with its top lit,
// its near edge in shade, bigger and further apart toward the picture's foot,
// none in line with the next. Grass grows over their edges.
export const PATH = { w: 44, h: 26 };
function drawPath(t) {
  const { p } = t;
  const r = new RNG(61), mid = PATH.w / 2;
  // [x from the middle, y, width, height]
  for (const [dx, y, w, h] of [[-9, 1, 18, 3], [-13, 6, 11, 4], [1, 5, 12, 4], [-9, 12, 13, 5], [7, 11, 11, 5], [-17, 19, 14, 6], [0, 18, 15, 6]]) {
    const x = mid + dx, face = r.chance(0.5) ? C.stone : C.oldHi;
    p(x + 1, y, w - 2, 1, C.stoneLight); p(x, y + 1, w, h - 2, face); p(x + 1, y + h - 1, w - 2, 1, C.oldShade);
    p(x, y + 1, 1, h - 2, C.stoneLight); p(x + w - 1, y + 1, 1, h - 2, C.oldMid); p(x + 1, y + h - 2, w - 2, 1, C.oldMid);
    if (w > 12) { const cx = x + r.int(4, w - 5); p(cx, y + 1, 1, 2, C.oldDark); p(cx + 1, y + 3, 1, h - 5, C.oldDark); }      // a crack across it
    if (r.chance(0.6)) p(x + r.int(2, w - 4), y + r.int(1, h - 3), 2, 1, C.oldMid);                                            // worn
    for (let i = 0; i < 3; i++) { const gx = x + r.int(0, w - 1); p(gx, y + h - 2, 1, 2, r.chance(0.5) ? C.grass : C.grassDark); }   // grass over its near edge
    if (r.chance(0.5)) { p(x + w - 3, y, 2, 1, C.moss); p(x + w - 2, y + 1, 2, 1, C.mossDark); }
  }
}

// Braid segment: 14 x 12 art px, tiled downward along the sway curve.
function drawBraidSegment(t) {
  const { p, disc, ellipse } = t;
  // two interlocking strands
  ellipse(5, 4, 4, 3, C.braid); ellipse(9, 9, 4, 3, C.braid);
  ellipse(9, 2, 3, 2, C.braidShade); ellipse(5, 10, 3, 2, C.braidShade);
  p(4, 2, 3, 1, C.braidHi); p(8, 8, 3, 1, C.braidHi);
  p(1, 5, 2, 1, C.braidDark); p(11, 11, 2, 1, C.braidDark); p(2, 11, 1, 1, C.braidDark); p(12, 3, 1, 1, C.braidDark);
}

// The frayed end of a cut braid: 14 x 10 art px hanging from the last
// whole bit (anchor top centre; drawn upside down for a falling piece's top).
function drawBraidCut(t) {
  const { p, line } = t;
  p(3, 0, 8, 2, C.braid); p(4, 0, 6, 1, C.braidHi);
  line(4, 2, 1, 8, C.braidShade); line(6, 2, 5, 9, C.braid); line(8, 2, 9, 9, C.braid); line(10, 2, 13, 8, C.braidShade);
  p(1, 8, 1, 1, C.braidDark); p(13, 8, 1, 1, C.braidDark); p(5, 9, 1, 1, C.braidDark); p(9, 9, 1, 1, C.braidDark);
}

function drawBraidEnd(t) {
  const { p, disc, ellipse } = t;
  // the loose end of the braid pooling on the grass
  ellipse(16, 8, 14, 5, C.braidShade);
  ellipse(14, 6, 12, 4, C.braid);
  ellipse(20, 5, 6, 2, C.braidHi);
  p(6, 7, 1, 1, C.braidDark); p(22, 10, 2, 1, C.braidDark);
  // a bow at the end
  disc(29, 4, 2, C.ribbon); disc(33, 4, 2, C.ribbon); p(30, 3, 3, 3, C.ribbonHi);
}

// Falling leaves: 5 x 4 art px, three colorways. Anchor center.
function drawLeaf(t, variant) {
  const { p } = t;
  const cols = [[C.leaf, C.grassLight], [C.moss, '#c8d848'], ['#c87a2a', '#e8a65e']][variant];
  p(1, 0, 3, 1, cols[0]); p(0, 1, 5, 2, cols[0]); p(1, 3, 3, 1, cols[0]);
  p(1, 1, 2, 1, cols[1]); p(2, 2, 1, 1, cols[0]); p(4, 0, 1, 1, cols[0]);
}

// Leafy bough growing from a trunk into the picture: 26 x 14 art px, grows
// to the right from its left edge (anchor left-middle). Mirrored for the
// right trunk.
function drawBough(t) {
  const { p, disc, line } = t;
  line(0, 7, 14, 6, C.barkDark); line(0, 8, 14, 7, C.barkDeep); line(8, 6, 16, 3, C.barkDark);
  disc(13, 6, 4, C.leafDark); disc(18, 5, 4, C.leaf); disc(22, 8, 3, C.leafDark);
  disc(15, 4, 3, C.leaf); disc(20, 3, 3, C.grass); disc(10, 9, 3, C.leafDark); disc(24, 5, 2, C.leaf);
  p(16, 2, 2, 1, C.grassLight); p(21, 1, 1, 1, C.grassLight); p(12, 3, 1, 1, C.grass); p(23, 9, 2, 1, C.leaf);
  p(18, 11, 1, 2, C.leafDark); p(13, 12, 1, 1, C.leafDark); p(17, 7, 2, 1, C.grass); p(11, 5, 1, 1, C.grassLight);
}

// Small bird perched / flying, 8 x 6 art px, facing right. Anchor bottom-center.
function drawBird(t, frame) {
  const { p } = t;
  const body = '#3b4a7a', wing = '#2a3560', belly = '#c9d2e8';
  p(2, 2, 4, 3, body); p(3, 4, 2, 1, belly);
  p(5, 1, 2, 2, body); p(7, 2, 1, 1, C.beak);            // head, beak
  p(6, 1, 1, 1, C.black);
  p(0, 3, 2, 1, body);                                     // tail
  if (frame) { p(2, 0, 3, 2, wing); } else { p(3, 3, 2, 1, wing); }
  p(3, 5, 1, 1, C.beak); p(5, 5, 1, 1, C.beak);            // feet
}

// Butterfly, 7 x 5 art px, two frames (wings open / closed), three colours.
function drawButterfly(t, color, frame) {
  const { p } = t;
  const cols = [['#f4c542', '#e08a2a'], ['#6fb7ff', '#2c6fd1'], ['#ff8ab8', '#d14a7a']][color];
  p(3, 1, 1, 3, '#2a1a10');                                 // body
  if (frame === 0) {
    p(0, 0, 3, 2, cols[0]); p(4, 0, 3, 2, cols[0]); p(1, 2, 2, 2, cols[1]); p(4, 2, 2, 2, cols[1]);
    p(1, 0, 1, 1, cols[1]); p(5, 0, 1, 1, cols[1]);
  } else {
    p(2, 0, 1, 2, cols[0]); p(4, 0, 1, 2, cols[0]); p(2, 2, 1, 2, cols[1]); p(4, 2, 1, 2, cols[1]);
  }
}

// Acorn, 4 x 5 art px. Anchor center.
function drawAcorn(t) {
  const { p } = t;
  p(0, 0, 4, 2, C.acornCap); p(1, 2, 2, 3, C.acorn); p(0, 2, 1, 2, C.acorn); p(3, 2, 1, 2, C.acorn); p(1, 2, 1, 1, '#b48a52');
}

function drawCloud(t, w, h) {
  const { ellipse, p } = t;
  const r = new RNG(w * 31 + h);
  ellipse(w / 2, h * 0.65, w / 2 - 1, h * 0.3, C.white);
  for (let i = 0; i < 4; i++) { const cx = r.int(h * 0.5, w - h * 0.5), cy = r.int(h * 0.35, h * 0.6), rr = r.int(h * 0.25, h * 0.45); ellipse(cx, cy, rr, rr, C.white); }
  ellipse(w / 2, h * 0.8, w / 2 - 2, h * 0.18, '#dfe9ee');
}

function drawMoon(t) {
  const { disc, p, ctx } = t;
  disc(12, 12, 10, '#f6f1c8');
  ctx.globalCompositeOperation = 'destination-out';
  disc(16, 10, 9, '#000'); // crescent cut (transparent)
  ctx.globalCompositeOperation = 'source-over';
  p(5, 10, 1, 1, '#e4dca8'); p(7, 15, 2, 1, '#e4dca8'); p(4, 13, 1, 1, '#e4dca8');
}

export function buildTiles() {
  // the tower's wall (art/tower.js): its plain tiles and string course under their old names, its areas beside them
  const wall = buildTower(), tower = wall.plain, towerBand = wall.band;
  const forest = [0, 1].map((v) => makeSprite(192, 48, (t) => drawForest(t, v), { ax: 0.5, ay: 1 }));
  const ground = makeSprite(192, 36, (t) => drawGround(t), { ax: 0.5, ay: 0 }, { ayPx: 4 * PX });
  const path = makeSprite(PATH.w, PATH.h, (t) => drawPath(t), { ax: 0.5, ay: 0 });
  const braid = makeSprite(14, 12, (t) => drawBraidSegment(t), { ax: 0.5, ay: 0 });
  const braidEnd = makeSprite(36, 14, (t) => drawBraidEnd(t), { ax: 0.4, ay: 1 });
  const braidCut = makeSprite(14, 10, (t) => drawBraidCut(t), { ax: 0.5, ay: 0 });
  const clouds = [[28, 10], [40, 13], [54, 16]].map(([w, h]) => makeSprite(w, h, (t) => drawCloud(t, w, h), { ax: 0.5, ay: 0.5 }));
  const moon = makeSprite(24, 24, (t) => drawMoon(t), { ax: 0.5, ay: 0.5 });
  const leaves = [0, 1, 2].map((v) => makeSprite(5, 4, (t) => drawLeaf(t, v), { ax: 0.5, ay: 0.5 }));
  const boughL = makeSprite(26, 14, (t) => drawBough(t), { ax: 0, ay: 0.5 });
  const boughR = flipH(boughL);
  const birdR = [0, 1].map((f) => makeSprite(8, 6, (t) => drawBird(t, f), { ax: 0.5, ay: 1 }));
  const birdL = birdR.map(flipH);
  const butterflies = [0, 1, 2].map((c) => [0, 1].map((f) => makeSprite(7, 5, (t) => drawButterfly(t, c, f), { ax: 0.5, ay: 0.5 })));
  const acorn = makeSprite(4, 5, (t) => drawAcorn(t), { ax: 0.5, ay: 0.5 });
  return { tower, towerBand, towerBands: wall.bands, towerAreas: wall.areas, towerFoot: wall.foot, forest, ground, path, braid, braidEnd, braidCut, clouds, moon, leaves, boughL, boughR, birdR, birdL, butterflies, acorn };
}
