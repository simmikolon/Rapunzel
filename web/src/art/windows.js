import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Tower windows: 22 x 30 art px, anchored at the sill (bottom centre), drawn
// for the LEFT side of the wall and mirrored for the right. A stone frame
// with an arched top and a sill in the tower's stone palette, the opening
// cut like the tiles' old window. Variants: 0 lit (a candle), 1 dark,
// 2 shuttered, 3 flower box (lit), 4 curtains (lit). Where a window is on
// the tower is decided in src/windows.js, not here.
export const WINDOW_VARIANTS = 5;
export const WINDOW_LIT = [true, false, false, true, true];

function opening(t, color) {
  const { p, disc } = t;
  p(4, 9, 14, 17, color);
  disc(10.5, 9, 7, color);
}

function drawWindow(t, variant) {
  const { p, disc, line } = t;
  const lit = WINDOW_LIT[variant];
  // frame: a stone surround, lit on top, shaded at the bottom
  disc(10.5, 9, 8, C.stone);
  p(3, 9, 16, 18, C.stone);
  p(3, 9, 1, 17, C.stoneLight); p(18, 9, 1, 17, C.stoneDark);
  p(10, 0, 2, 2, C.stoneLight);                       // keystone
  p(5, 1, 2, 1, C.stoneLight); p(15, 1, 2, 1, C.stoneDark);
  // the opening
  opening(t, C.nightDeep);
  if (lit) {
    // warm light low in the room, candle on the inner sill
    p(5, 15, 12, 11, C.dusk); disc(10.5, 15, 5, C.dusk);
    p(7, 19, 8, 7, '#3b3148');
    p(10, 19, 2, 5, C.lanternPaper); p(10, 16, 2, 3, C.lanternGlow); p(10, 15, 2, 1, C.sun1);
  } else if (variant === 1) {
    // dark: a hint of moonlight on the inner wall
    p(5, 10, 3, 2, '#2a2650'); p(6, 12, 1, 1, '#2a2650');
  }
  if (variant === 2) {
    // closed wooden shutters with slats and hinges; the arch above stays open
    p(4, 11, 7, 15, C.plank); p(11, 11, 7, 15, C.plank);
    p(4, 11, 14, 1, C.plankHi); p(10, 11, 1, 15, C.plankDark); p(11, 11, 1, 15, C.plankHi);
    for (let y = 14; y < 26; y += 3) { line(5, y, 9, y, C.plankDark); line(12, y, 16, y, C.plankDark); }
    p(4, 13, 1, 2, C.pole); p(4, 22, 1, 2, C.pole); p(17, 13, 1, 2, C.pole); p(17, 22, 1, 2, C.pole);
  } else if (variant === 3) {
    // a wooden box on the sill with geraniums and greens spilling over
    p(2, 24, 18, 3, C.plankDark); p(2, 24, 18, 1, C.plankHi); p(2, 26, 18, 1, '#5a3a24');
    for (let i = 0; i < 6; i++) {
      const x = 3 + i * 3;
      p(x, 22, 2, 2, [C.heart, C.ribbonHi, C.sun2][i % 3]); p(x, 21, 1, 1, i % 3 === 0 ? C.heartHi : C.white);
      p(x + 1, 24, 1, 1, C.leaf);
    }
    for (let i = 0; i < 5; i++) { const x = 2 + i * 4; p(x, 27, 1, 2 + (i % 2), C.leaf); p(x + 1, 27, 1, 1, C.grass); }
  } else if (variant === 4) {
    // red curtains drawn to the sides with gold tiebacks
    p(4, 9, 4, 17, C.cape); p(14, 9, 4, 17, C.cape);
    p(5, 10, 1, 16, C.capeHi); p(16, 10, 1, 16, C.capeHi);
    p(4, 18, 4, 1, C.gold); p(14, 18, 4, 1, C.gold);
    p(6, 19, 2, 7, C.cape); p(14, 19, 2, 7, C.cape);
    p(4, 9, 14, 1, C.goldDark);                        // the rod
  }
  // sill: a light stone course, a shadow beneath
  p(1, 26, 20, 2, C.stoneLight); p(1, 28, 20, 1, C.stoneDark); p(2, 29, 18, 1, C.brickShade);
  p(1, 26, 1, 2, C.white); p(20, 26, 1, 2, C.stone);
}

export function buildWindows() {
  const L = Array.from({ length: WINDOW_VARIANTS }, (_, v) => makeSprite(22, 30, (t) => drawWindow(t, v), undefined, { axPx: 11 * 4, ayPx: 30 * 4 }));
  return { L, R: L.map(flipH) };
}
