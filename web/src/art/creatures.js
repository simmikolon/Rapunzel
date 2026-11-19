import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// Crow: 18 x 14 art px, facing right. Anchor center.
function drawCrow(t, frame) {
  const { p, poly, ellipse, disc } = t;
  ellipse(9, 8, 6, 3, C.crow);             // body
  p(4, 8, 4, 2, C.crowHi);                  // chest sheen
  disc(14, 5, 3, C.crow);                   // head
  p(16, 5, 2, 1, C.beak); p(17, 6, 1, 1, C.beak);
  p(14, 4, 2, 1, C.eyeWhite); p(15, 4, 1, 1, C.black);
  poly([[1, 9], [3, 7], [4, 10]], C.crow);  // tail
  if (frame === 0) {                         // wings up
    poly([[6, 7], [4, 0], [12, 6]], C.crow); poly([[6, 7], [5, 2], [9, 5]], C.crowHi);
  } else if (frame === 1) {                  // wings down
    poly([[6, 8], [3, 13], [12, 9]], C.crow); poly([[6, 8], [4, 12], [8, 9]], C.crowHi);
  } else {                                   // knocked out: wings out, eyes x
    poly([[6, 7], [0, 5], [10, 8]], C.crow); poly([[8, 7], [14, 1], [12, 9]], C.crow);
    p(14, 4, 2, 1, C.eyeRed);
  }
  p(10, 11, 1, 2, C.beak); p(12, 11, 1, 2, C.beak);   // feet
}

// Spider: 16 x 12 art px. Anchor top-center (hangs from its thread).
function drawSpider(t, frame) {
  const { p, disc, line } = t;
  disc(8, 7, 4, C.spider);
  disc(8, 3, 2, C.spiderHi);
  p(7, 2, 1, 1, C.eyeRed); p(9, 2, 1, 1, C.eyeRed);
  p(6, 6, 2, 2, C.spiderHi); p(9, 7, 2, 1, C.spiderHi);
  const o = frame ? 1 : 0;
  // legs
  line(4, 5, 0, 2 + o, C.spider); line(4, 7, 0, 7 + o, C.spider); line(4, 9, 1, 11 - o, C.spider);
  line(12, 5, 15, 2 + o, C.spider); line(12, 7, 15, 7 + o, C.spider); line(12, 9, 14, 11 - o, C.spider);
  line(5, 4, 2, 0 + o, C.spider); line(11, 4, 13, 0 + o, C.spider);
}

// Squirrel: 18 x 15 art px, facing right, feet on the branch (anchor
// bottom-center). Frames: 0 sitting with an acorn, 1 / 2 running, 3 knocked.
function drawSquirrel(t, frame) {
  const { p, disc, ellipse, line, poly } = t;
  const run = frame === 1 || frame === 2;
  const knocked = frame === 3;
  const bob = frame === 2 ? 1 : 0;
  if (knocked) {
    // on its back, tail flat, eyes x
    ellipse(9, 11, 5, 3, C.fur); ellipse(9, 11, 3, 2, C.belly);
    ellipse(3, 12, 3, 2, C.furHi); p(1, 11, 2, 1, C.fur);
    disc(14, 11, 2, C.fur); p(13, 9, 1, 1, C.fur); p(16, 11, 1, 1, C.furDark);
    p(13, 10, 1, 1, C.black); p(15, 12, 1, 1, C.black); p(13, 12, 1, 1, C.black); p(15, 10, 1, 1, C.black);
    p(7, 8, 1, 1, C.furDark); p(10, 8, 1, 1, C.furDark);  // paws up
    return;
  }
  // bushy tail curling up behind the body
  ellipse(4, 8, 3, 4, C.fur); disc(5, 3, 3, C.fur); disc(4, 4, 2, C.furHi); p(2, 9, 1, 3, C.furDark);
  if (run) {
    // stretched body, tail streaming
    ellipse(10, 10 + bob, 5, 3, C.fur); ellipse(10, 11 + bob, 3, 1, C.belly);
    disc(15, 8 + bob, 2, C.fur); p(15, 5 + bob, 1, 2, C.fur);        // head, ear
    p(16, 8 + bob, 1, 1, C.black); p(17, 9 + bob, 1, 1, C.furDark);  // eye, nose
    if (frame === 1) { p(7, 13, 2, 2, C.furDark); p(13, 13, 2, 2, C.furDark); }
    else { p(9, 13, 2, 2, C.furDark); p(11, 13, 2, 2, C.furDark); p(6, 12, 2, 1, C.fur); p(14, 12, 2, 1, C.fur); }
  } else {
    // sitting upright, acorn in the paws
    ellipse(10, 10, 4, 4, C.fur); ellipse(10, 11, 2, 2, C.belly);
    disc(12, 5, 3, C.fur); p(11, 1, 1, 2, C.fur); p(13, 1, 1, 2, C.fur);  // head, ears
    p(13, 4, 1, 1, C.black); p(15, 6, 1, 1, C.furDark); p(12, 7, 1, 1, C.heartDark);
    p(13, 8, 2, 2, C.acorn); p(13, 8, 2, 1, C.acornCap);                 // acorn
    p(8, 13, 3, 2, C.furDark); p(11, 13, 3, 2, C.furDark);               // feet
  }
}

// Stork: 42 x 22 art px, flying right, two flap frames (0 wings up, 1 wings
// down). The anchor is the top of its back (x = 21, y = 8), the landing
// surface; the back is flat from x = 10 to 26, the head and the long beak
// fill the rest. A plump bird with a big head, small wings, short trailing
// legs and the storybook stork's bundle hanging from its beak. Drawn from
// row spans [y, x0, x1] so every edge stays on the grid.
function drawStork(t, frame) {
  const { p, disc } = t;
  const rows = (spans, color) => { for (const [y, x0, x1] of spans) p(x0, y, x1 - x0 + 1, 1, color); };
  const up = frame === 0, b = up ? 0 : 1;          // the bundle lags one pixel on the downstroke
  // legs trailing behind, the far one darker
  rows([[19, 4, 10], [20, 1, 4]], C.storkBeakDark);
  rows([[17, 9, 10], [18, 2, 8], [19, 0, 1]], C.storkBeak);
  // tail: a short white fan, shaded below
  rows([[10, 2, 6], [11, 1, 6], [12, 0, 6], [13, 1, 6], [14, 3, 6]], C.stork);
  rows([[10, 2, 5], [11, 1, 2]], C.storkHi);
  rows([[13, 1, 5], [14, 3, 6]], C.storkShade);
  p(0, 12, 1, 1, C.storkShade); p(2, 12, 1, 1, C.storkShade);        // feather notches
  // body: plump, lit along the back, lilac shade and a deep underside
  rows([[8, 10, 26], [9, 8, 28], [10, 6, 29], [11, 5, 30], [12, 4, 30], [13, 4, 30], [14, 4, 30],
    [15, 5, 29], [16, 6, 28], [17, 8, 26], [18, 11, 23]], C.stork);
  rows([[8, 10, 26], [9, 9, 27], [10, 11, 22]], C.storkHi);
  rows([[15, 7, 23], [16, 6, 27], [17, 8, 26]], C.storkShade);
  rows([[17, 11, 23], [18, 11, 23]], C.storkDeep);
  p(25, 13, 1, 1, C.storkShade); p(22, 14, 1, 1, C.storkShade); p(27, 15, 1, 1, C.storkShade);   // breast feathers
  // neck and the big round head
  p(25, 7, 6, 5, C.stork);
  disc(31, 5, 5, C.stork);
  rows([[0, 30, 32], [1, 28, 33]], C.storkHi);
  rows([[10, 26, 29], [11, 26, 28]], C.storkShade);
  // face: a big eye, a blush, the long red beak
  p(31, 2, 3, 3, C.eyeWhite); p(32, 3, 2, 2, C.black);
  p(30, 6, 2, 1, C.cheek);
  rows([[4, 36, 40]], C.storkBeakHi); rows([[5, 36, 41]], C.storkBeak); rows([[6, 36, 39]], C.storkBeakDark);
  // the bundle, knotted, hanging from the beak tip
  p(40, 6, 1, 2 + b, C.bowDark);
  rows([[8 + b, 38, 41], [9 + b, 37, 41], [10 + b, 36, 41], [11 + b, 36, 41], [12 + b, 37, 40]], C.bow);
  p(39, 8 + b, 1, 1, C.bowHi); p(38, 9 + b, 1, 1, C.bowHi); p(37, 10 + b, 1, 1, C.bowHi);
  p(41, 10 + b, 1, 2, C.bowDark); p(37, 12 + b, 4, 1, C.bowDark);
  // the near wing: white coverts along the leading edge, black flight
  // feathers behind them, splitting into fingers at the tip. Raised, it
  // sweeps up and back from the back; lowered, the same wing hangs from the
  // shoulder, mirrored. Rows from the root: [black spans, white span].
  const WING = [
    [[], [13, 24]],
    [[[12, 14]], [15, 23]],
    [[[11, 15]], [16, 22]],
    [[[10, 15]], [16, 21]],
    [[[9, 14]], [15, 19]],
    [[[8, 13]], [14, 17]],
    [[[8, 10], [12, 14]], [15, 15]],
    [[[8, 9], [12, 14]], null],
  ];
  const wy = (i) => (up ? 7 - i : 14 + i);
  WING.forEach(([blacks, white], i) => {
    const y = wy(i);
    // lowered, the coverts lie on the shaded flank: lighter than it, with a dark front edge
    if (white) p(white[0], y, white[1] - white[0] + 1, 1, up ? C.stork : C.storkHi);
    for (const [x0, x1] of blacks) p(x0, y, x1 - x0 + 1, 1, C.crow);
    if (i >= 2 && i <= 5) p(blacks[blacks.length - 1][1], y, 1, 1, C.crowHi);   // the feathers' edge under the coverts
    if (white && i >= 1) {
      if (up) p(white[1] - (i <= 4 ? 1 : 0), y, i <= 4 ? 2 : 1, 1, C.storkHi);   // the lit leading edge
      else p(white[1], y, 1, 1, C.storkDeep);
    }
  });
  if (up) rows([[7, 13, 15]], C.storkShade);                           // where it grows from the back
  else rows([[14, 13, 24]], C.storkShade);                              // the crease along the body
}

// Guard: 34 x 48 art px, facing right, the body centred at x = 14 and the
// halberd on his right (the prince is 26 x 58, so he stands shoulder high).
// Frames: stand, walk 1, walk 2, thrust (halberd level), dazed. Anchor at
// the feet below the body's centre.
function drawGuard(t, frame) {
  const { p, line, poly } = t;
  const dazed = frame === 4, thrust = frame === 3;
  const step = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  const lean = thrust ? 1 : 0;                       // leans into the thrust
  const trousers = '#3a3a5a', trousersHi = '#4e4e74';
  // legs and boots
  p(8 + Math.max(0, step), 34, 5, 10, trousers); p(15 + Math.min(0, step), 34, 5, 10, trousers);
  p(9 + Math.max(0, step), 34, 1, 9, trousersHi); p(16 + Math.min(0, step), 34, 1, 9, trousersHi);
  p(7 + Math.max(0, step), 44, 6, 4, C.boots); p(15 + Math.min(0, step), 44, 6, 4, C.boots);
  p(7 + Math.max(0, step), 44, 6, 1, C.hairHi); p(15 + Math.min(0, step), 44, 6, 1, C.hairHi);
  // tunic with gold trim, belt and an emblem
  p(7 + lean, 21, 14, 13, C.cape); p(7 + lean, 21, 14, 1, C.capeHi); p(7 + lean, 21, 1, 13, C.capeHi);
  p(7 + lean, 30, 14, 2, C.gold); p(13 + lean, 30, 2, 2, C.goldDark); p(13 + lean, 24, 2, 3, C.gold); p(12 + lean, 25, 4, 1, C.gold);
  // head: face with a moustache under a helmet with a plume
  const hy = dazed ? 3 : 0;
  p(9 + lean, 12, 10, 8, C.skin);
  if (!dazed) { p(11 + lean, 14, 1, 1, C.black); p(16 + lean, 14, 1, 1, C.black); }
  else { line(10 + lean, 15, 12 + lean, 17, C.black); line(12 + lean, 15, 10 + lean, 17, C.black); line(15 + lean, 15, 17 + lean, 17, C.black); line(17 + lean, 15, 15 + lean, 17, C.black); }
  p(10 + lean, 16, 1, 1, C.cheek); p(17 + lean, 16, 1, 1, C.cheek);
  p(11 + lean, 17, 6, 1, C.hair); p(10 + lean, 18, 2, 1, C.hair); p(16 + lean, 18, 2, 1, C.hair);
  p(11 + lean, 20, 6, 1, C.gold);                      // collar
  p(9 + lean, 4 + hy, 10, 1, C.pole); p(8 + lean, 5 + hy, 12, 5, C.pole); p(6 + lean, 10 + hy, 16, 2, C.pole);
  p(9 + lean, 5 + hy, 3, 1, C.poleHi); p(8 + lean, 6 + hy, 1, 3, C.poleHi); p(13 + lean, 10 + hy, 2, 4, C.pole);
  p(13 + lean, 0 + hy, 2, 4, C.capeHi); p(12 + lean, 1 + hy, 1, 3, C.cape); p(15 + lean, 1 + hy, 1, 2, C.cape);
  // arms and the halberd
  if (thrust) {
    p(19, 24, 9, 3, C.cape); p(26, 25, 3, 2, C.skin); p(21, 26, 3, 2, C.skin);
    line(12, 27, 33, 27, C.plankDark); line(12, 28, 33, 28, C.plankDark);
    poly([[29, 22], [34, 27], [29, 32]], C.poleHi); poly([[29, 24], [32, 27], [29, 30]], C.pole); p(33, 27, 1, 1, C.white);
  } else if (dazed) {
    p(5, 22, 2, 8, C.cape); p(5, 30, 2, 2, C.skin); p(21, 22, 3, 7, C.cape); p(22, 29, 2, 2, C.skin);
    line(4, 46, 30, 46, C.plankDark); poly([[30, 43], [34, 46], [30, 48]], C.poleHi);     // dropped
  } else {
    p(5, 22, 2, 8, C.cape); p(5, 30, 2, 2, C.skin);
    p(21, 22, 3, 7, C.cape); p(23, 29, 3, 2, C.skin);
    line(26, 2, 26, 46, C.plankDark); line(27, 2, 27, 46, C.plankDark);
    poly([[26, 2], [33, 6], [26, 11]], C.poleHi); poly([[26, 4], [30, 6], [26, 9]], C.pole); p(26, 0, 2, 2, C.poleHi);
  }
}

// Flowerpots: 12 x 13 art px, three flowers. Anchor at the bottom (they sit
// on a railing, then fall).
function drawPot(t, flower) {
  const { p, disc } = t;
  const col = [C.heart, C.ribbonHi, C.sun2][flower], hi = [C.heartHi, C.bowHi, C.sun1][flower];
  disc(6, 2, 2, col); disc(3, 4, 1, col); disc(9, 4, 1, col); p(5, 1, 1, 1, hi); p(2, 3, 1, 1, hi);
  p(6, 4, 1, 3, C.leaf); p(3, 6, 3, 1, C.leaf); p(7, 6, 3, 1, C.grass); p(2, 7, 2, 1, C.leaf); p(9, 7, 2, 1, C.leaf);
  p(1, 8, 10, 1, '#d8784a'); p(2, 9, 8, 4, '#c8683a'); p(2, 9, 1, 4, '#e08a5a'); p(8, 10, 1, 3, '#8a4a28'); p(3, 12, 6, 1, '#8a4a28');
}

// The window guard as a bust, 12 x 19 art px, facing right: helmet with a
// plume, a face with a moustache, a gold collar, red tunic with shoulders
// (the arm leaves at row 13). Frame 1 scowls. Anchor at the bottom centre
// so it can rise behind a window sill.
function drawGuardHead(t, frame) {
  const { p, line } = t;
  p(5, 0, 2, 2, C.capeHi); p(4, 1, 1, 1, C.cape);                 // plume
  p(2, 2, 8, 1, C.pole); p(1, 3, 10, 4, C.pole); p(0, 5, 12, 2, C.pole);
  p(2, 3, 3, 1, C.poleHi); p(1, 4, 1, 2, C.poleHi);
  p(2, 7, 8, 3, C.skin);                                           // face
  if (frame) { line(3, 7, 5, 8, C.hair); line(8, 8, 6, 7, C.hair); p(4, 8, 1, 1, C.black); p(8, 8, 1, 1, C.black); }
  else { p(4, 7, 1, 1, C.black); p(8, 7, 1, 1, C.black); p(3, 8, 1, 1, C.cheek); p(9, 8, 1, 1, C.cheek); }
  p(4, 9, 5, 1, C.hair); p(3, 10, 1, 1, C.hair); p(9, 10, 1, 1, C.hair); // moustache
  p(3, 11, 6, 1, C.gold);                                          // collar
  p(0, 12, 12, 7, C.cape); p(0, 12, 12, 1, C.capeHi); p(0, 12, 1, 7, C.capeHi);   // tunic and shoulders
  p(5, 13, 2, 3, C.gold); p(4, 14, 4, 1, C.gold); p(0, 17, 12, 1, C.gold);        // emblem and belt
}

// A gauntlet at the end of the arm, 10 x 9 art px reaching right: cuff
// with gold trim, then an open hand (frame 0) or a fist (frame 1). Anchor
// at the cuff's middle so it sits on the arm's tip.
function drawGauntlet(t, frame) {
  const { p } = t;
  p(0, 1, 3, 7, C.cape); p(2, 1, 1, 7, C.gold);
  if (frame === 0) {
    p(3, 2, 4, 5, C.pole); p(4, 3, 2, 3, C.poleHi);
    p(7, 1, 3, 1, C.poleHi); p(7, 3, 3, 1, C.poleHi); p(7, 5, 3, 1, C.poleHi); p(7, 7, 2, 1, C.poleHi);
    p(4, 0, 3, 1, C.pole); p(6, 0, 1, 1, C.poleHi);
  } else {
    p(3, 2, 5, 5, C.pole); p(4, 3, 2, 2, C.poleHi);
    p(8, 2, 1, 5, C.poleHi); p(7, 2, 1, 1, C.white); p(7, 4, 1, 1, C.white); p(7, 6, 1, 1, C.white);
    p(4, 1, 3, 1, C.pole);
  }
}

// The witch's scissors, 16 x 16 art px pointing right: two rings, a pivot,
// two blades, open (frame 0) or closed (frame 1). Anchor centre.
function drawScissors(t, frame) {
  const { p, line, ring } = t;
  const spread = frame ? 1 : 3;
  ring(3, 4, 3, C.pole); ring(3, 12, 3, C.pole);
  line(5, 6, 8, 7, C.pole, 2); line(5, 10, 8, 9, C.pole, 2);          // handles
  line(8, 7, 15, 8 - spread, C.poleHi, 2); line(8, 8, 15, 8 + spread, C.poleHi, 2);   // blades
  line(9, 8, 14, 8 - spread + 1, C.pole); line(9, 9, 14, 8 + spread, C.pole);         // their shadow edge
  p(7, 7, 2, 2, C.goldDark); p(7, 7, 1, 1, C.gold);                   // pivot
  p(15, 8 - spread, 1, 1, C.white); p(15, 8 + spread, 1, 1, C.white);  // the points
}

// Witch on a broom: 34 x 30 art px, flying right. Anchor center.
function drawWitch(t, frame) {
  const { p, poly, disc, line, ellipse } = t;
  const bob = frame ? 1 : 0;
  // broom
  p(2, 22, 24, 2, C.broom); poly([[0, 20], [6, 21], [6, 25], [0, 26]], C.broomStraw); p(1, 22, 4, 2, C.broom);
  line(2, 20, 0, 19, C.broomStraw); line(2, 26, 0, 27, C.broomStraw);
  // cape streaming back
  poly([[14, 8 + bob], [2, 12 - bob * 2], [4, 18], [13, 19]], C.witchDress);
  poly([[14, 9 + bob], [5, 13 - bob], [7, 17], [13, 17]], C.witchDressHi);
  // dress / body sitting on broom
  poly([[13, 9], [19, 8], [22, 21], [10, 21]], C.witchDress);
  p(15, 12, 3, 6, C.witchDressHi);
  // legs and boots
  p(20, 18, 3, 4, C.witchDress); p(21, 21, 4, 2, C.witchHat);
  // arms gripping the broom handle
  p(19, 11, 4, 2, C.witchDress); p(22, 12, 3, 2, C.witchSkin);
  // head
  disc(17, 6, 3, C.witchSkin);
  p(19, 6, 3, 1, C.witchSkin); // nose
  p(16, 5, 1, 1, C.eyeRed); p(18, 5, 1, 1, C.eyeRed);
  p(16, 8, 3, 1, C.heartDark);
  // wild hair
  poly([[13, 5], [8, 2], [11, 8], [10, 12], [14, 9]], C.witchHair);
  // hat
  poly([[12, 3], [22, 3], [19, -1], [15, -8]], C.witchHat);
  p(11, 3, 12, 2, C.witchHat); p(12, 2, 10, 1, C.witchDressHi); p(15, 1, 4, 1, C.gold);
}

// Bat: violet fur, big ears with pink insides, yellow-white eyes, two small
// fangs. It is the deep forest's sleeper, so it is drawn twice over: hanging
// from a branch by its feet (9 x 15 art px, anchor at the feet on top:
// frame 0 asleep and wrapped in its wings, frame 1 awake, eyes open, the
// wings coming apart) and flying (19 x 13, anchor centre: wings up, wings
// down, knocked out). A dark creature, so the wings carry a lighter top edge.
const BAT = { hi: '#a595cc', fur: '#7a68a6', dark: '#4b3d70', wing: '#5a4a86', wingHi: '#8b7ab8', wingDark: '#3a2f5a' };
// one wing as row spans [y, x0, x1], the body's side at x = 5; the other is its mirror
const BAT_WING = [
  [[2, 0, 2], [3, 0, 4], [4, 0, 5], [5, 1, 5], [6, 1, 2], [6, 4, 5], [7, 1, 1], [7, 5, 5]],              // raised
  [[6, 3, 5], [7, 1, 5], [8, 0, 5], [9, 0, 4], [10, 0, 1], [10, 3, 4], [11, 0, 0], [11, 4, 4]],          // lowered
];
function drawBatFly(t, frame) {
  const { p } = t;
  const spans = BAT_WING[frame === 1 ? 1 : 0];
  const has = new Set(spans.map(([y, x0, x1]) => { const a = []; for (let x = x0; x <= x1; x++) a.push(x + ',' + y); return a; }).flat());
  for (const [y, x0, x1] of spans) for (let x = x0; x <= x1; x++) {
    const c = !has.has(x + ',' + (y - 1)) ? BAT.wingHi : !has.has(x + ',' + (y + 1)) ? BAT.wingDark : BAT.wing;
    p(x, y, 1, 1, c); p(18 - x, y, 1, 1, c);
  }
  // ears, head and the small body under it
  p(6, 0, 1, 1, BAT.fur); p(6, 1, 2, 3, BAT.fur); p(7, 2, 1, 1, C.cheek);
  p(12, 0, 1, 1, BAT.fur); p(11, 1, 2, 3, BAT.fur); p(11, 2, 1, 1, C.cheek);
  p(6, 3, 7, 5, BAT.fur); p(6, 3, 7, 1, BAT.hi); p(6, 4, 1, 3, BAT.hi); p(12, 5, 1, 3, BAT.dark);
  p(7, 8, 5, 3, BAT.fur); p(7, 10, 5, 1, BAT.dark); p(8, 11, 1, 1, BAT.dark); p(10, 11, 1, 1, BAT.dark);
  if (frame === 2) { p(7, 5, 2, 1, C.black); p(10, 5, 2, 1, C.black); }           // knocked out: eyes shut tight
  else {
    p(7, 4, 2, 2, C.sun1); p(8, 5, 1, 1, C.black); p(10, 4, 2, 2, C.sun1); p(10, 5, 1, 1, C.black);
  }
  p(9, 6, 1, 1, BAT.dark); p(8, 7, 1, 1, C.white); p(10, 7, 1, 1, C.white);     // nose, fangs
}
function drawBatHang(t, frame) {
  const { p } = t;
  p(3, 0, 1, 2, BAT.dark); p(5, 0, 1, 2, BAT.dark);                               // feet on the branch
  // wrapped in its wings: a drop that widens downward
  for (const [y, x0, x1] of [[2, 3, 5], [3, 2, 6], [4, 1, 7], [5, 1, 7], [6, 1, 7], [7, 1, 7], [8, 2, 6]]) p(x0, y, x1 - x0 + 1, 1, BAT.wing);
  p(3, 2, 2, 1, BAT.wingHi); p(2, 3, 1, 1, BAT.wingHi); p(1, 4, 1, 4, BAT.wingHi);
  p(4, 3, 1, 5, BAT.wingDark); p(7, 5, 1, 3, BAT.wingDark);                       // the fold, the far side
  if (frame) { p(0, 4, 1, 4, BAT.wing); p(8, 4, 1, 4, BAT.wing); p(0, 4, 1, 1, BAT.wingHi); }   // the wings come apart
  // the head hangs lowest, ears pointing down
  p(2, 9, 5, 4, BAT.fur); p(2, 9, 1, 4, BAT.hi); p(6, 10, 1, 3, BAT.dark);
  p(2, 13, 1, 2, BAT.fur); p(6, 13, 1, 2, BAT.fur); p(2, 13, 1, 1, C.cheek); p(6, 13, 1, 1, C.cheek);
  if (frame) { p(3, 10, 1, 2, C.sun1); p(5, 10, 1, 2, C.sun1); p(3, 10, 1, 1, C.black); p(5, 10, 1, 1, C.black); }
  else { p(3, 11, 1, 1, BAT.dark); p(5, 11, 1, 1, BAT.dark); }                    // asleep
  p(4, 9, 1, 1, C.white);                                                         // a fang
}

// A bird of the flock: a starling, 12 x 9 art px, flying right, wings up or
// down. Dark with a blue sheen and pale speckles so the flock reads as a
// band of small bright-edged shapes against the forest and the night.
const STARLING = { hi: '#6f7fc4', body: '#39407a', dark: '#232848', speck: '#d6dcf2' };
function drawStarling(t, frame) {
  const { p } = t;
  p(0, 4, 2, 1, STARLING.dark); p(1, 5, 2, 1, STARLING.dark);                     // tail
  p(2, 3, 7, 3, STARLING.body); p(3, 6, 5, 1, STARLING.dark); p(3, 3, 5, 1, STARLING.hi);
  p(8, 2, 3, 3, STARLING.body); p(8, 2, 2, 1, STARLING.hi);                       // head
  p(11, 3, 1, 1, C.beak); p(9, 3, 1, 1, C.eyeWhite); p(10, 3, 1, 1, C.black);
  p(4, 5, 1, 1, STARLING.speck); p(6, 4, 1, 1, STARLING.speck);
  if (frame === 0) { p(4, 0, 2, 1, STARLING.hi); p(3, 1, 4, 1, STARLING.body); p(3, 2, 5, 1, STARLING.dark); }
  else { p(3, 6, 5, 1, STARLING.body); p(3, 7, 4, 1, STARLING.dark); p(4, 8, 2, 1, STARLING.dark); }
}

// Pickups ---------------------------------------------------------------
function drawSun(t, frame) {
  const { p, disc } = t;
  disc(5, 5, 3, C.sun2); disc(5, 5, 2, C.sun1); p(4, 4, 1, 1, C.white);
  const r = frame ? C.sun3 : C.sun2;
  p(5, 0, 1, 2, r); p(5, 9, 1, 2, r); p(0, 5, 2, 1, r); p(9, 5, 2, 1, r);
  if (frame) { p(1, 1, 1, 1, r); p(9, 1, 1, 1, r); p(1, 9, 1, 1, r); p(9, 9, 1, 1, r); }
  else { p(2, 2, 1, 1, r); p(8, 2, 1, 1, r); p(2, 8, 1, 1, r); p(8, 8, 1, 1, r); }
}

function drawLantern(t, frame) {
  const { p, ellipse } = t;
  p(5, 0, 2, 2, C.lanternFrame);            // top loop
  p(3, 2, 6, 1, C.lanternFrame);
  ellipse(6, 8, 5, 5, C.lanternPaper);
  ellipse(6, 8, 3, 4, frame ? C.lanternHi : C.lanternPaper);
  p(2, 6, 1, 5, C.lanternGlow); p(9, 6, 1, 5, C.lanternGlow);
  p(5, 7, 2, 2, frame ? C.sun3 : C.lanternGlow);  // flame
  p(3, 13, 6, 1, C.lanternFrame); p(5, 14, 2, 2, C.lanternFrame);
}

function drawHeart(t, empty) {
  const { p, disc, poly } = t;
  const col = empty ? C.uiDark : C.heart;
  const hi = empty ? C.uiLine : C.heartHi;
  disc(3, 3, 2, col); disc(7, 3, 2, col);
  poly([[0, 4], [10, 4], [5, 9]], col);
  p(0, 3, 10, 2, col);
  p(2, 2, 1, 1, hi); p(3, 1, 1, 1, hi);
  if (empty) { for (let y = 1; y < 9; y++) for (let x = 0; x < 10; x++) if ((x + y) % 3 === 0) p(x, y, 1, 1, C.uiLine); }
}

export function buildCreatures() {
  const crowR = [0, 1, 2].map((f) => makeSprite(18, 14, (t) => drawCrow(t, f), { ax: 0.5, ay: 0.5 }));
  const storkR = [0, 1].map((f) => makeSprite(42, 22, (t) => drawStork(t, f), undefined, { axPx: 21 * 4, ayPx: 8 * 4 }));
  const guardR = [0, 1, 2, 3, 4].map((f) => makeSprite(34, 48, (t) => drawGuard(t, f), undefined, { axPx: 14 * 4, ayPx: 48 * 4 }));
  const pots = [0, 1, 2].map((f) => makeSprite(12, 13, (t) => drawPot(t, f), { ax: 0.5, ay: 1 }));
  const guardHeadR = [0, 1].map((f) => makeSprite(12, 19, (t) => drawGuardHead(t, f), { ax: 0.5, ay: 1 }));
  const gauntletR = [0, 1].map((f) => makeSprite(10, 9, (t) => drawGauntlet(t, f), { ax: 0, ay: 0.5 }));
  const spider = [0, 1].map((f) => makeSprite(16, 12, (t) => drawSpider(t, f), { ax: 0.5, ay: 0 }));
  const squirrelR = [0, 1, 2, 3].map((f) => makeSprite(18, 15, (t) => drawSquirrel(t, f), { ax: 0.5, ay: 1 }));
  const witchR = [0, 1].map((f) => makeSprite(34, 38, (t) => drawWitch(t, f), { ax: 0.5, ay: 0.62 }, { shift: [0, 8] }));
  const scissors = [0, 1].map((f) => makeSprite(16, 16, (t) => drawScissors(t, f), { ax: 0.5, ay: 0.5 }));
  const bat = [0, 1, 2].map((f) => makeSprite(19, 13, (t) => drawBatFly(t, f), { ax: 0.5, ay: 0.5 }));
  const starlingR = [0, 1].map((f) => makeSprite(12, 9, (t) => drawStarling(t, f), { ax: 0.5, ay: 0.5 }));
  return {
    bat, batHang: [0, 1].map((f) => makeSprite(9, 15, (t) => drawBatHang(t, f), { ax: 0.5, ay: 0 })),
    starlingR, starlingL: starlingR.map(flipH),
    crowR, crowL: crowR.map(flipH),
    storkR, storkL: storkR.map(flipH),
    guardR, guardL: guardR.map(flipH), pots,
    guardHeadR, guardHeadL: guardHeadR.map(flipH), gauntletR, gauntletL: gauntletR.map(flipH),
    spider,
    squirrelR, squirrelL: squirrelR.map(flipH),
    witchR, witchL: witchR.map(flipH), scissors,
    sun: [0, 1].map((f) => makeSprite(11, 11, (t) => drawSun(t, f), { ax: 0.5, ay: 0.5 })),
    lantern: [0, 1].map((f) => makeSprite(12, 16, (t) => drawLantern(t, f), { ax: 0.5, ay: 0.5 })),
    heart: makeSprite(10, 10, (t) => drawHeart(t, false), { ax: 0.5, ay: 0.5 }),
    heartEmpty: makeSprite(10, 10, (t) => drawHeart(t, true), { ax: 0.5, ay: 0.5 }),
  };
}
