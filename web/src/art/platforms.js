import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Hair ribbon tied around the braid. 34 x 20 art px. Surface at y = 2.
function drawRibbon(t, big = false, squash = 0) {
  const { p, poly, disc, ellipse } = t;
  const col = big ? C.bow : C.ribbon;
  const hi = big ? C.bowHi : C.ribbonHi;
  const dk = big ? C.bowDark : C.ribbonDark;
  const cx = t.w / 2;
  const top = 2 + squash;
  const loopRy = (big ? 6 : 5) - squash;
  const loopRx = big ? 9 : 7;
  // loops
  ellipse(cx - loopRx - 1, top + loopRy, loopRx, loopRy, col);
  ellipse(cx + loopRx + 1, top + loopRy, loopRx, loopRy, col);
  ellipse(cx - loopRx - 1, top + loopRy, loopRx - 3, loopRy - 2, dk);
  ellipse(cx + loopRx + 1, top + loopRy, loopRx - 3, loopRy - 2, dk);
  p(cx - loopRx - 4, top + 1, 4, 1, hi); p(cx + loopRx - 1, top + 1, 4, 1, hi);
  // knot
  p(cx - 2, top + loopRy - 2, 5, 5, col); p(cx - 2, top + loopRy - 2, 5, 1, hi); p(cx - 2, top + loopRy + 2, 5, 1, dk);
  // tails
  poly([[cx - 2, top + loopRy + 2], [cx - 7, t.h - 1], [cx - 3, t.h - 1], [cx, top + loopRy + 3]], col);
  poly([[cx + 1, top + loopRy + 3], [cx + 3, t.h - 1], [cx + 7, t.h - 1], [cx + 3, top + loopRy + 2]], col);
  p(cx - 5, t.h - 3, 1, 2, dk); p(cx + 4, t.h - 3, 1, 2, dk);
  if (big) {
    // sparkle on a bow spring
    p(cx - loopRx - 2, top - 1, 1, 1, C.white); p(cx + loopRx + 4, top + 1, 1, 1, C.white); p(cx, top - 2, 1, 1, C.white);
  }
}

// Plank swing hung on ropes between the trees. 56 x 11 art px. Solid from
// below (bonk). The ropes are drawn at runtime up to the top of the screen.
function drawPlank(t) {
  const { p, line } = t;
  p(0, 3, 56, 8, C.plank);
  p(0, 3, 56, 1, C.plankHi);
  p(0, 9, 56, 2, C.plankDark);
  line(8, 6, 22, 6, C.plankDark); line(30, 5, 46, 5, C.plankDark);
  line(12, 8, 26, 8, C.plankHi); line(36, 7, 50, 7, C.plankHi);
  p(17, 4, 1, 1, C.plankDark); p(38, 9, 1, 1, C.plankDark);
  // rope ends knotted through the plank
  p(3, 0, 3, 11, C.rope); p(50, 0, 3, 11, C.rope);
  p(2, 2, 5, 2, C.ropeDark); p(49, 2, 5, 2, C.ropeDark);
  p(3, 6, 3, 1, C.ropeDark); p(50, 6, 3, 1, C.ropeDark);
}

export function buildPlatforms() {
  const ribbon = makeSprite(34, 20, (t) => drawRibbon(t, false, 0), undefined, { axPx: 17 * 4, ayPx: 2 * 4 });
  const ribbonSquash = makeSprite(34, 20, (t) => drawRibbon(t, false, 2), undefined, { axPx: 17 * 4, ayPx: 2 * 4 });
  const bow = makeSprite(42, 24, (t) => drawRibbon(t, true, 0), undefined, { axPx: 21 * 4, ayPx: 2 * 4 });
  const bowSquash = makeSprite(42, 24, (t) => drawRibbon(t, true, 3), undefined, { axPx: 21 * 4, ayPx: 2 * 4 });
  const plank = makeSprite(56, 11, (t) => drawPlank(t), undefined, { axPx: 28 * 4, ayPx: 3 * 4 });
  return { ribbon, ribbonSquash, bow, bowSquash, plank };
}
