import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Branch growing out of the RIGHT tree trunk, reaching left. 50 x 18 art px
// (200 x 72 logical). Anchor: center x, surface y (the top of the log).
function drawBranch(t, dry) {
  const { p, poly, line, disc } = t;
  const bark = dry ? C.dry : C.barkMid;
  const barkDark = dry ? C.dryDark : C.barkDark;
  const barkLight = dry ? C.dryLight : C.barkLight;
  // log: thick at the trunk (right), tapering to the tip (left)
  poly([[3, 8], [49, 5], [49, 16], [3, 12]], bark);
  poly([[3, 8], [49, 5], [49, 7], [3, 9]], barkLight);
  poly([[3, 11], [49, 13], [49, 16], [3, 12]], barkDark);
  // bark grain
  line(10, 10, 30, 9, barkDark); line(26, 11, 46, 11, barkDark); line(14, 9, 20, 9, barkLight);
  line(34, 8, 44, 7, barkLight);
  if (!dry) {
    // moss on top
    p(12, 8, 6, 1, C.moss); p(22, 7, 9, 1, C.moss); p(36, 6, 7, 1, C.moss); p(28, 8, 3, 1, C.mossDark);
    // leaf clusters at the tip and halfway
    disc(5, 7, 4, C.leaf); disc(3, 5, 3, C.grass); disc(7, 4, 2, C.grassLight);
    p(1, 9, 3, 2, C.leafDark); p(0, 7, 2, 2, C.leaf);
    disc(21, 4, 3, C.leaf); disc(23, 3, 2, C.grass); p(19, 6, 2, 1, C.leafDark); p(24, 2, 1, 1, C.grassLight);
    disc(40, 3, 2, C.leaf); p(41, 2, 1, 1, C.grassLight);
  } else {
    // dead: cracks and bare twigs
    line(18, 8, 20, 12, C.barkShadow); line(33, 6, 31, 11, C.barkShadow);
    line(24, 9, 26, 9, C.barkShadow);
    line(6, 7, 3, 3, barkDark); line(4, 4, 1, 4, barkDark);
    line(28, 6, 30, 2, barkDark); line(30, 3, 33, 1, barkDark);
    p(12, 12, 1, 2, barkDark); p(40, 15, 1, 2, barkDark);
  }
}

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

// Stone window sill of the tower. 56 x 11 art px. Solid from below (bonk).
function drawSill(t, flowers) {
  const { p, line, disc } = t;
  p(0, 3, 56, 8, C.stone);
  p(0, 3, 56, 1, C.stoneLight);
  p(0, 9, 56, 2, C.stoneDark);
  p(0, 10, 56, 1, C.stoneShade);
  // block seams
  for (let x = 9; x < 56; x += 12) { line(x, 4, x, 10, C.stoneDark); }
  for (let x = 3; x < 56; x += 12) { p(x, 6, 4, 1, C.stoneLight); }
  if (flowers) {
    p(20, 0, 16, 3, C.barkDeep); p(20, 0, 16, 1, C.barkMid);
    disc(23, 0, 1, C.ribbon); disc(28, -1, 1, C.gold); disc(33, 0, 1, C.ribbonHi);
    p(22, 1, 1, 1, C.grass); p(27, 1, 1, 1, C.grass); p(32, 1, 1, 1, C.grass);
  }
}

export function buildPlatforms() {
  const branchR = makeSprite(50, 18, (t) => drawBranch(t, false), undefined, { axPx: 25 * 4, ayPx: 7 * 4 });
  const branchRDry = makeSprite(50, 18, (t) => drawBranch(t, true), undefined, { axPx: 25 * 4, ayPx: 7 * 4 });
  const ribbon = makeSprite(34, 20, (t) => drawRibbon(t, false, 0), undefined, { axPx: 17 * 4, ayPx: 2 * 4 });
  const ribbonSquash = makeSprite(34, 20, (t) => drawRibbon(t, false, 2), undefined, { axPx: 17 * 4, ayPx: 2 * 4 });
  const bow = makeSprite(42, 24, (t) => drawRibbon(t, true, 0), undefined, { axPx: 21 * 4, ayPx: 2 * 4 });
  const bowSquash = makeSprite(42, 24, (t) => drawRibbon(t, true, 3), undefined, { axPx: 21 * 4, ayPx: 2 * 4 });
  const sill = makeSprite(56, 11, (t) => drawSill(t, false), undefined, { axPx: 28 * 4, ayPx: 3 * 4 });
  const sillFlowers = makeSprite(56, 13, (t) => drawSill(t, true), undefined, { axPx: 28 * 4, ayPx: 5 * 4, shift: [0, 2] });
  return {
    branchR, branchL: flipH(branchR),
    branchRDry, branchLDry: flipH(branchRDry),
    ribbon, ribbonSquash, bow, bowSquash, sill, sillFlowers,
  };
}
