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
  const spider = [0, 1].map((f) => makeSprite(16, 12, (t) => drawSpider(t, f), { ax: 0.5, ay: 0 }));
  const squirrelR = [0, 1, 2, 3].map((f) => makeSprite(18, 15, (t) => drawSquirrel(t, f), { ax: 0.5, ay: 1 }));
  const witchR = [0, 1].map((f) => makeSprite(34, 38, (t) => drawWitch(t, f), { ax: 0.5, ay: 0.62 }, { shift: [0, 8] }));
  return {
    crowR, crowL: crowR.map(flipH),
    spider,
    squirrelR, squirrelL: squirrelR.map(flipH),
    witchR, witchL: witchR.map(flipH),
    sun: [0, 1].map((f) => makeSprite(11, 11, (t) => drawSun(t, f), { ax: 0.5, ay: 0.5 })),
    lantern: [0, 1].map((f) => makeSprite(12, 16, (t) => drawLantern(t, f), { ax: 0.5, ay: 0.5 })),
    heart: makeSprite(10, 10, (t) => drawHeart(t, false), { ax: 0.5, ay: 0.5 }),
    heartEmpty: makeSprite(10, 10, (t) => drawHeart(t, true), { ax: 0.5, ay: 0.5 }),
  };
}
