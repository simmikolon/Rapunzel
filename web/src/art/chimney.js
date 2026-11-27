import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';
import { STONEWORK as K } from './interior.js';

// The chimney (chimney.js): Lord Springalot's room. A fireplace in the
// tower leads into it and a soot door out of it again; between them a
// brick shaft, narrow and black with soot, with ledges of brick, kettles
// on the pot chain and iron dampers one bumps one's head on.
//
// Brick is a ramp of its own, warm and dull: the walls are what stands
// closest, the back of the shaft is the same brick under soot. Nothing in
// here is as bright as the suns and the lord's red shirt.
const BRICK = { hi: '#86594c', base: '#6c4540', shade: '#553536', dark: '#3e262b', mortar: '#2b1a20' };
const SOOT = { hi: '#514552', base: '#3e343f', shade: '#2f2731', dark: '#231c25', mortar: '#18131a' };
const IRON = { hi: '#c9c6d6', base: '#8f8ca1', shade: '#5f5c75', dark: '#3a374c' };
const TOWER = ['#3a2f52', '#5a4470', '#7a5a6a'];                      // the tower's dusk, seen through the soot door

// What the painter and the world colour with at runtime.
export const CHIMNEY_LOOK = {
  dark: '#120e14', throat: '#1c161e', lip: '#4a3038', lipHi: '#74403c',
  ambient: '#a99aa8', dim: 0.34, emberLight: '#ff9a4a', dayLight: '#cfe0ff', soot: '#0c0a0e', ash: '#3a2f36',
};

// Courses of brick, w x h art px: a brick is 8 x 4 with its joint, every
// other course set off by half a brick. `R` colours them; a seeded RNG
// makes some lighter, some darker, and runs soot down from a few.
function bricks(t, w, h, R, seed, lit) {
  const { p } = t, rng = new RNG(seed);
  p(0, 0, w, h, R.mortar);
  for (let row = 0; row * 4 < h; row++) {
    const y = row * 4, off = row % 2 ? -4 : 0;
    for (let x = off; x < w; x += 8) {
      const k = rng.next();
      const body = k < 0.16 ? R.shade : k > 0.86 ? R.hi : R.base;
      p(Math.max(0, x), y, Math.min(7, x + 7 - Math.max(0, x)), 3, body);
      if (lit && k > 0.3) p(Math.max(0, x), y, Math.min(7, x + 7 - Math.max(0, x)), 1, body === R.hi ? R.hi : k > 0.6 ? R.hi : body);   // the top edge catches the light
      if (k > 0.55 && k < 0.63) p(Math.max(0, x) + 2, y + 1, 2, 1, R.dark);                                                             // a chip
    }
  }
  // soot that has run down
  for (let i = 0; i < Math.round(w / 16); i++) {
    const x = rng.int(1, w - 3), y0 = rng.int(0, h - 8), len = rng.int(5, 12);
    for (let y = y0; y < Math.min(h, y0 + len); y++) if ((y + x) % 4 !== 3) p(x, y, 1, 1, R.dark);
  }
}

// A side wall of the shaft, 48 x 32 art px, as it stands on the left: its
// right edge is the corner he bounces along, a dark joint with a lit arris.
function drawWall(t, seed) {
  const { p } = t;
  bricks(t, 48, 32, BRICK, seed, true);
  p(47, 0, 1, 32, BRICK.dark);
  for (let y = 0; y < 32; y += 4) p(46, y, 1, 3, BRICK.hi);
  for (let y = 0; y < 32; y++) if ((y * 7 + seed) % 5 < 2) p(0, y, 3 + ((y * 3 + seed) % 3), 1, BRICK.shade);      // toward the picture's edge it falls into shade
}

// The back of the shaft, 96 x 32 art px: the same courses under soot.
function drawBack(t, seed) { bricks(t, 96, 32, SOOT, seed, false); }

// A ledge out of the left wall, 26 x 8 art px, the anchor its top middle: a
// slab of the pale stone everything he stands on in the tower is made of,
// on two courses of brick corbelled out under it, soot lying on it.
function drawLedge(t) {
  const { p } = t;
  p(0, 0, 26, 3, K.ledge); p(0, 0, 26, 1, K.ledgeHi); p(0, 2, 26, 1, K.ledgeShade); p(25, 0, 1, 3, K.ledgeShade);
  for (const x of [9, 18]) p(x, 1, 1, 1, K.ledgeShade);
  p(0, 3, 20, 2, BRICK.base); p(0, 3, 20, 1, BRICK.shade); p(9, 3, 1, 2, BRICK.mortar);
  p(0, 5, 12, 3, BRICK.shade); p(0, 7, 12, 1, BRICK.dark);
  p(3, 0, 4, 1, SOOT.hi); p(13, 0, 3, 1, SOOT.hi);                                 // soot on it
}

// A kettle on the pot chain, 22 x 20 art px, the anchor the middle of its
// lid: black iron, round, a bail over it up to the chain, lit from above.
function drawKettle(t) {
  const { p } = t;
  const top = 6;
  // the bail, up to the hook
  p(10, 0, 2, 2, K.chain); p(4, 2, 14, 1, IRON.base); p(3, 3, 2, 3, IRON.base); p(17, 3, 2, 3, IRON.base); p(4, 2, 5, 1, IRON.hi);
  // the lid and its knob
  p(3, top, 16, 2, IRON.base); p(3, top, 16, 1, IRON.hi); p(10, top - 1, 2, 1, IRON.hi);
  // the belly
  const rows = [[2, 20], [1, 21], [0, 22], [0, 22], [0, 22], [0, 22], [1, 21], [2, 20], [4, 18], [6, 16]];
  rows.forEach(([a, b], i) => { p(a, top + 2 + i, b - a, 1, IRON.shade); p(b - 3, top + 2 + i, Math.min(3, b - a), 1, IRON.dark); });
  p(3, top + 3, 3, 4, IRON.base); p(3, top + 3, 2, 2, IRON.hi);                    // the light on its shoulder
  p(2, top + 2, 18, 1, IRON.base);                                                 // the rim
  p(7, top + 12, 2, 2, IRON.dark); p(13, top + 12, 2, 2, IRON.dark);               // feet
}

// An iron damper out of the left wall, 42 x 8 art px, the anchor its top
// middle: a plate across more than half the shaft, riveted, on a rod.
function drawDamper(t) {
  const { p } = t;
  p(0, 0, 42, 5, IRON.base); p(0, 0, 42, 1, IRON.hi); p(0, 4, 42, 1, IRON.dark); p(41, 0, 1, 5, IRON.shade);
  for (const x of [4, 14, 24, 34]) { p(x, 2, 2, 1, IRON.hi); p(x, 3, 2, 1, IRON.dark); }
  p(0, 5, 30, 1, IRON.shade); p(0, 6, 8, 2, IRON.dark);                            // the rod it turns on, into the wall
  p(9, 0, 6, 1, SOOT.hi); p(27, 0, 4, 1, SOOT.hi);
}

// The bed of the fire the shaft stands on, 96 x 10 art px, the anchor its
// top middle: ash and a few coals still glowing.
function drawHearth(t) {
  const { p } = t, rng = new RNG(77);
  p(0, 2, 96, 8, SOOT.dark); p(0, 1, 96, 1, SOOT.base);
  for (let i = 0; i < 26; i++) { const x = rng.int(1, 92), w = rng.int(2, 5); p(x, rng.int(0, 2), w, 2, i % 3 ? SOOT.shade : SOOT.hi); }
  for (let i = 0; i < 9; i++) { const x = 8 + i * 9 + rng.int(0, 4); p(x, 1, 3, 2, C.flame4); p(x + 1, 1, 1, 1, i % 2 ? C.flame3 : C.flame2); }
}

// The doors, 46 x 58 art px like the tower's gates, the anchor the
// landing's top middle (art/interior.js drawGate).
//
// The fireplace is the way in: a low, wide mouth under a mantel, black
// inside, coals glowing at the bottom. Shut, a fire guard of iron bars
// stands in it; open, the guard is swung aside.
function drawFireplace(t, open) {
  const { p, disc } = t;
  const cx = 23, SURF = 46, hw = 14, spring = 32;
  // the breast: brick, with a stone mantel over it
  p(cx - hw - 4, spring - 10, hw * 2 + 8, SURF - spring + 10, BRICK.base);
  for (let y = spring - 10; y < SURF; y += 4) { p(cx - hw - 4, y + 3, hw * 2 + 8, 1, BRICK.mortar); for (let x = cx - hw - 4 + (y % 8 ? 4 : 0); x < cx + hw + 4; x += 8) p(x, y, 1, 3, BRICK.mortar); }
  p(cx - hw - 4, spring - 10, 1, SURF - spring + 10, BRICK.hi); p(cx + hw + 3, spring - 10, 1, SURF - spring + 10, BRICK.dark);
  p(cx - hw - 6, spring - 14, hw * 2 + 12, 4, K.frame); p(cx - hw - 6, spring - 14, hw * 2 + 12, 1, K.frameHi); p(cx - hw - 6, spring - 11, hw * 2 + 12, 1, K.frameDark);
  // the flue above it, narrowing into the wall
  p(cx - 8, spring - 26, 16, 12, BRICK.shade); p(cx - 8, spring - 26, 1, 12, BRICK.base); p(cx - 6, spring - 30, 12, 4, BRICK.dark);
  for (let y = spring - 26; y < spring - 14; y += 4) p(cx - 8, y + 3, 16, 1, BRICK.mortar);
  // the mouth: a low arch, black, the coals at the bottom
  for (let yy = spring - 8; yy < SURF; yy++) for (let xx = cx - hw; xx < cx + hw; xx++) {
    if (yy < spring && ((xx - cx + 0.5) / hw) ** 2 + ((yy - spring) / 8) ** 2 > 1) continue;
    p(xx, yy, 1, 1, yy > SURF - 5 ? SOOT.shade : SOOT.mortar);
  }
  for (const [x, w] of [[cx - 10, 4], [cx - 4, 5], [cx + 3, 4], [cx + 8, 3]]) { p(x, SURF - 3, w, 2, C.flame4); p(x + 1, SURF - 3, w - 2, 1, C.flame3); }
  p(cx - 3, SURF - 4, 2, 1, C.flame2); p(cx + 4, SURF - 4, 1, 1, C.flame2);
  disc(cx, spring - 2, 2, SOOT.shade);                                             // the way up, a shade lighter
  if (!open) {
    for (let x = cx - hw + 1; x < cx + hw; x += 4) p(x, spring - 2, 1, SURF - spring + 2, IRON.base);
    p(cx - hw, spring + 2, hw * 2, 1, IRON.hi); p(cx - hw, SURF - 2, hw * 2, 1, IRON.base);
  } else {
    p(cx + hw - 2, spring - 4, 3, SURF - spring + 4, IRON.base); p(cx + hw - 2, spring - 4, 1, SURF - spring + 4, IRON.hi);
  }
  landing(t, SURF);
}

// The soot door is the way out, high in the shaft: a small iron door in
// the brick. Open, it shows the tower. From the tower's side, gone
// through, it is the same door shut, with a sooty hand on the wall by it.
function drawHatch(t, open, spent) {
  const { p, disc } = t;
  const cx = 23, SURF = 46, hw = 9, spring = 24;
  // its frame of dressed stone in the wall
  p(cx - hw - 3, spring, hw * 2 + 6, SURF - spring, K.frame); disc(cx, spring, hw + 3, K.frame);
  p(cx - hw - 3, spring, 1, SURF - spring, K.frameHi); p(cx + hw + 2, spring, 1, SURF - spring, K.frameDark);
  for (let yy = spring - hw; yy < SURF; yy++) for (let xx = cx - hw; xx < cx + hw; xx++) {
    if (yy < spring && (xx - cx + 0.5) ** 2 + (yy - spring) ** 2 > hw * hw) continue;
    p(xx, yy, 1, 1, !open ? IRON.base : yy < 24 ? TOWER[0] : yy < 36 ? TOWER[1] : TOWER[2]);
  }
  if (!open) {
    p(cx - hw, spring - 2, 1, SURF - spring + 2, IRON.hi); p(cx + hw - 1, spring - 2, 1, SURF - spring + 2, IRON.dark);
    for (const y of [spring + 2, SURF - 6]) { p(cx - hw, y, hw * 2, 2, IRON.shade); p(cx - hw, y, hw * 2, 1, IRON.hi); }
    for (const [x, y] of [[cx - 6, spring + 3], [cx + 5, spring + 3], [cx - 6, SURF - 5], [cx + 5, SURF - 5]]) p(x, y, 1, 1, IRON.dark);
    p(cx + 4, 34, 2, 3, K.bell); p(cx + 4, 34, 1, 1, K.bellHi);                    // the latch
    p(cx - 3, spring - 4, 6, 1, IRON.shade);
  } else {
    p(cx - 1, 27, 2, 4, C.flame2); p(cx - 1, 28, 1, 2, C.flame1); p(cx - 2, 31, 4, 1, K.iron);      // a torch out there
    p(cx - hw, spring - 4, 3, SURF - spring + 4, IRON.base); p(cx - hw, spring - 4, 1, SURF - spring + 4, IRON.hi);   // the door, stood back
  }
  if (spent) {
    // soot around it, and the print of a small hand
    for (const [x, y, w] of [[cx - hw - 6, 30, 3], [cx + hw + 3, 26, 3], [cx - 4, spring - hw - 5, 8], [cx + hw + 4, 38, 2]]) p(x, y, w, 2, SOOT.shade);
    p(cx + hw + 5, 31, 3, 3, SOOT.dark); for (const dx of [0, 1, 2, 3]) p(cx + hw + 4 + dx, 29 + (dx % 2), 1, 2, SOOT.dark);
  }
  landing(t, SURF);
}

// The gates' landing: a pale slab on two brackets (art/interior.js drawGate).
function landing(t, SURF) {
  const { p } = t;
  p(0, SURF, 46, 6, K.ledge); p(0, SURF, 46, 1, K.ledgeHi); p(0, SURF + 4, 46, 2, K.ledgeShade); p(0, SURF + 1, 1, 3, K.ledgeHi);
  for (const x of [11, 23, 34]) p(x, SURF + 1, 1, 3, K.ledgeShade);
  for (const x of [5, 35]) { p(x, SURF + 6, 6, 3, K.ledgeShade); p(x + 1, SURF + 9, 4, 3, K.ledgeDark); }
}

export function buildChimney() {
  const door = (draw) => makeSprite(46, 58, draw, undefined, { axPx: 23 * 4, ayPx: 46 * 4 });
  const top = { ax: 0.5, ay: 0 };
  return {
    wall: [3, 11].map((seed) => makeSprite(48, 32, (t) => drawWall(t, seed), { ax: 1, ay: 1 })),      // the left wall, anchored at the corner's foot; the right one is drawn with `flip`
    back: [5, 23].map((seed) => makeSprite(96, 32, (t) => drawBack(t, seed))),
    ledge: makeSprite(26, 8, drawLedge, top),            // out of the left wall
    kettle: makeSprite(22, 20, drawKettle, undefined, { axPx: 11 * 4, ayPx: 6 * 4 }),
    damper: makeSprite(42, 8, drawDamper, top),
    hearth: makeSprite(96, 10, drawHearth, { ax: 0.5, ay: 0.1 }),
    fireplace: [door((t) => drawFireplace(t, false)), door((t) => drawFireplace(t, true))],
    hatch: [door((t) => drawHatch(t, false, false)), door((t) => drawHatch(t, true, false))],
    hatchSpent: door((t) => drawHatch(t, false, true)),
  };
}
