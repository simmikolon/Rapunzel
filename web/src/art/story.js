import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';

// The top of the tower, for the opening story (src/story.js): its roof, the
// cornice the roof sits on, and Rapunzel's window, which is bigger than the
// tower's other windows and lit. Her portrait is the title sign's
// (art/sign.js); here are only the things around her.
// The roof is a material of its own: slate, violet in the night it is seen
// in, lit from the upper left like everything on the tower.
export const SLATE = { hi: '#9a8fca', base: '#7166a6', shade: '#4f457e', dark: '#342c58', eave: '#221c3c' };

// The roof: a cone 124 x 80 art px, anchor the middle of its foot. Courses of
// slates, each course's joints off the one above it; three planes of light.
function drawRoof(t) {
  const { p } = t;
  const cx = 62, top = 12, foot = 76, r = new RNG(5100);
  const half = (y) => 2 + ((y - top) / (foot - top)) * 58;
  for (let y = top; y < foot; y++) {
    const hw = Math.round(half(y));
    for (let x = cx - hw; x < cx + hw; x++) {
      const f = (x + 0.5 - cx) / hw;
      p(x, y, 1, 1, f < -0.5 ? SLATE.base : f < 0.08 ? SLATE.hi : f < 0.56 ? SLATE.base : SLATE.shade);
    }
  }
  // the courses: a line of shadow under each, and the slates' joints
  for (let y = top + 5, n = 0; y < foot; y += 5, n++) {
    const hw = Math.round(half(y));
    for (let x = cx - hw; x < cx + hw; x++) { const f = (x + 0.5 - cx) / hw; p(x, y, 1, 1, f < 0.08 ? SLATE.shade : SLATE.dark); }
    for (let x = cx - hw + 2 + ((n % 2) * 3) + r.int(0, 2); x < cx + hw - 1; x += r.int(5, 8)) { const f = (x + 0.5 - cx) / hw; p(x, y - 4, 1, 4, f < 0.08 ? SLATE.base : SLATE.shade); }
  }
  // a slate or two missing, one slipped
  for (const [x, y] of [[40, 52], [78, 62], [57, 37]]) { p(x, y, 4, 4, SLATE.dark); p(x, y, 4, 1, SLATE.eave); }
  // the eaves: they stand out over the wall, dark underneath
  p(cx - 62, foot, 124, 2, SLATE.base); p(cx - 62, foot, 60, 1, SLATE.hi); p(cx + 30, foot, 32, 2, SLATE.shade);
  p(cx - 60, foot + 2, 120, 2, SLATE.eave);
  // the finial: a golden ball on a spike, and a pennant in the ribbons' pink
  p(cx - 1, 3, 2, 10, C.braidShade); p(cx - 2, 6, 4, 4, C.braid); p(cx - 2, 6, 2, 2, C.braidHi); p(cx - 1, 1, 2, 2, C.braidHi);
  p(cx + 1, 1, 9, 2, C.ribbon); p(cx + 1, 3, 7, 1, C.ribbon); p(cx + 1, 4, 4, 1, C.ribbonDark); p(cx + 1, 1, 9, 1, C.ribbonHi); p(cx + 9, 2, 1, 1, C.ribbonDark);
}

// The cornice under the roof: a band of dressed stone 118 x 9 art px wider
// than the wall, on corbels. Anchor the middle of its top.
function drawCornice(t) {
  const { p } = t;
  p(0, 0, 118, 1, C.stoneHi); p(0, 1, 118, 4, C.stoneLight); p(74, 1, 44, 4, C.stone); p(0, 5, 118, 1, C.stoneDark);
  for (let x = 2; x < 116; x += 9) { p(x, 6, 5, 2, x > 72 ? C.stoneDark : C.stone); p(x, 6, 5, 1, x > 72 ? C.stone : C.stoneLight); p(x + 1, 8, 3, 1, C.stoneShade); }
  for (let x = 13; x < 118; x += 15) p(x, 1, 1, 4, C.stoneDark);
}

// Rapunzel's window, 40 x 52 art px, anchor the middle of the sill's top
// (row 44). `back` is the frame and the room behind her: an arch of dressed
// stone, a warm room, a curtain drawn to one side. `front` is the sill she
// leans on, which hides where her portrait ends.
const ROOM = { dark: '#3a2b4a', mid: '#5b3f55', warm: '#8a5a4e', glow: '#d99a58' };
function drawWindowBack(t) {
  const { p, disc } = t;
  // the surround: stone, lit on its left and its top
  disc(19.5, 17, 17, C.stone); p(3, 17, 34, 28, C.stone);
  p(3, 17, 2, 27, C.stoneLight); p(35, 17, 2, 27, C.stoneDark);
  for (const [x, y] of [[8, 5], [13, 2], [24, 1], [30, 4]]) p(x, y, 3, 1, C.stoneLight);
  p(18, 0, 4, 3, C.stoneHi); p(18, 3, 4, 1, C.stoneDark);                              // the keystone
  for (const y of [22, 30, 38]) { p(3, y, 3, 1, C.stoneDark); p(34, y, 3, 1, C.stoneShade); }
  // the opening and the room: dark up in the arch, warm where the candle stands
  disc(19.5, 18, 13, ROOM.dark); p(7, 18, 26, 26, ROOM.dark);
  p(7, 26, 26, 18, ROOM.mid); p(9, 32, 22, 12, ROOM.warm); p(13, 37, 14, 7, ROOM.glow);
  // the curtain, drawn to the right and tied
  p(27, 9, 6, 35, C.ribbonDark); p(28, 9, 3, 30, C.ribbon); p(28, 9, 1, 26, C.ribbonHi); p(26, 30, 7, 2, C.braidShade); p(25, 32, 4, 12, C.ribbonDark);
  p(24, 7, 9, 2, C.ribbonDark); p(7, 7, 6, 2, C.ribbonDark); p(7, 9, 2, 9, C.ribbon);
}
function drawWindowFront(t) {
  const { p } = t;
  p(0, 44, 40, 2, C.stoneHi); p(0, 46, 40, 3, C.stoneLight); p(26, 46, 14, 3, C.stone); p(1, 49, 38, 2, C.stoneDark); p(3, 51, 34, 1, C.stoneShade);
}

export function buildStory() {
  const sill = { axPx: 20 * 4, ayPx: 44 * 4 };
  return {
    roof: makeSprite(124, 80, drawRoof, { ax: 0.5, ay: 1 }),
    cornice: makeSprite(118, 9, drawCornice, { ax: 0.5, ay: 0 }),
    windowBack: makeSprite(40, 52, drawWindowBack, undefined, sill),
    windowFront: makeSprite(40, 52, drawWindowFront, undefined, sill),
  };
}
