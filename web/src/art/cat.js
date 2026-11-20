import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// The witch's cat (enemies.js Cat): the one from her portraits, at home on
// the ledges inside the tower. 24 x 20 art px, facing RIGHT, standing on the
// bottom middle. A black cat on a dark wall, so its lit planes (the top of
// the head, the back, the tail's upper side) are a clear violet, and its
// eyes are the brightest thing on it: they are what one sees first, and
// in the dark the only thing. Its feature: white socks, a white bib and a
// white tip to its tail, which is also what makes a black cat a shape on
// a dark wall.
// Frames: 0 and 1 sitting (the tail curled up, then laid along the ledge:
// it swishes), 2 crouched to pounce (the rear up; the game wiggles it),
// 3 the pounce (stretched, claws out), 4 puffed up and off (it was pogoed;
// a cat is not knocked out, it is offended).
const CAT = { hi: '#7d7ab8', base: '#2f2c4a', shade: '#1b1a2c', fluff: '#8683b8', sock: '#ece9f8', eye: C.sun2, nose: C.cheek, claw: C.white };

function drawCat(t, frame) {
  const { p, disc, ellipse } = t;
  const eyes = (x, y, wide) => {
    // two eyes looking right; wide when it is about to go
    for (const ex of [x, x + 3]) { p(ex, y, 2, 2, CAT.eye); p(ex + 1, y, 1, 2, C.black); if (wide) { p(ex, y - 1, 2, 1, CAT.eye); p(ex + 1, y - 1, 1, 1, C.black); } }
  };
  const head = (cx, cy, wide) => {
    disc(cx, cy, 4, CAT.base);
    p(cx - 4, cy - 6, 2, 3, CAT.base); p(cx + 2, cy - 6, 2, 3, CAT.base); p(cx - 3, cy - 5, 1, 1, CAT.nose); p(cx + 3, cy - 5, 1, 1, CAT.nose);   // ears
    p(cx - 2, cy - 4, 5, 1, CAT.hi); p(cx - 4, cy - 2, 1, 2, CAT.hi);                                                                       // lit crown
    eyes(cx - 2, cy - 1, wide);
    p(cx + 1, cy + 2, 1, 1, CAT.nose); p(cx + 4, cy + 1, 2, 1, CAT.fluff); p(cx + 4, cy + 3, 2, 1, CAT.fluff); p(cx - 5, cy + 2, 1, 1, CAT.fluff);   // nose, whiskers
  };
  if (frame === 0 || frame === 1) {
    // sitting upright: a pear of a body, the paws together in front
    ellipse(10, 14, 5, 5, CAT.base); p(6, 18, 9, 2, CAT.base); p(5, 11, 1, 5, CAT.hi); p(6, 10, 2, 1, CAT.hi); p(14, 13, 1, 5, CAT.shade);
    p(12, 17, 2, 3, CAT.sock); p(15, 17, 2, 3, CAT.sock); p(12, 12, 4, 3, CAT.sock); p(13, 15, 2, 1, CAT.sock);      // socks and bib
    if (frame === 0) { p(3, 12, 2, 7, CAT.base); p(3, 12, 1, 6, CAT.hi); p(2, 10, 2, 2, CAT.sock); p(3, 9, 2, 1, CAT.sock); p(4, 18, 2, 1, CAT.base); }   // tail curled up behind
    else { p(0, 18, 7, 2, CAT.base); p(0, 18, 6, 1, CAT.hi); p(0, 17, 2, 3, CAT.sock); }                                                           // tail laid along the ledge
    head(14, 7, false);
  } else if (frame === 2) {
    // crouched: chest on the ledge, the rear and the tail up
    ellipse(10, 15, 7, 3, CAT.base); p(3, 10, 6, 5, CAT.base); p(3, 10, 5, 1, CAT.hi); p(4, 18, 3, 2, CAT.sock); p(13, 18, 3, 2, CAT.sock);
    p(2, 2, 2, 9, CAT.base); p(2, 2, 1, 8, CAT.hi); p(2, 0, 3, 3, CAT.sock);                                                                       // tail straight up
    head(17, 12, true);
  } else if (frame === 3) {
    // the pounce: stretched out, front paws and claws ahead, the tail streaming
    ellipse(11, 11, 8, 3, CAT.base); p(4, 8, 12, 1, CAT.hi); p(1, 12, 4, 2, CAT.base); p(0, 14, 2, 1, CAT.base);
    p(0, 6, 4, 2, CAT.base); p(0, 6, 3, 1, CAT.hi); p(0, 5, 2, 3, CAT.sock); p(0, 13, 2, 2, CAT.sock);
    p(18, 12, 5, 2, CAT.base); p(18, 12, 4, 1, CAT.hi); p(20, 12, 3, 2, CAT.sock); p(23, 12, 1, 1, CAT.claw); p(23, 14, 1, 1, CAT.claw); p(22, 14, 1, 1, CAT.claw);
    head(18, 7, true);
  } else {
    // puffed up: an arched back, fur on end, eyes round
    ellipse(11, 12, 6, 4, CAT.base); p(6, 7, 10, 2, CAT.base); p(6, 7, 9, 1, CAT.hi);
    for (const x of [5, 7, 9, 11, 13, 15]) p(x, 5 + (x % 4 === 1 ? 0 : 1), 1, 2, CAT.fluff);                                                        // fur on end
    p(5, 15, 2, 4, CAT.base); p(14, 15, 2, 4, CAT.base); p(5, 17, 2, 2, CAT.sock); p(14, 17, 2, 2, CAT.sock); p(1, 3, 3, 2, CAT.sock); p(1, 4, 3, 9, CAT.base); p(0, 5, 1, 6, CAT.fluff); p(4, 5, 1, 6, CAT.fluff); p(1, 4, 3, 1, CAT.hi);
    disc(18, 9, 4, CAT.base); p(14, 3, 2, 3, CAT.base); p(20, 3, 2, 3, CAT.base); p(16, 5, 5, 1, CAT.hi);
    for (const ex of [16, 19]) { p(ex, 7, 2, 3, CAT.eye); p(ex + 1, 8, 1, 1, C.black); }
    p(18, 11, 2, 2, CAT.nose); p(18, 12, 2, 1, CAT.shade);                                                                                          // a mouth open to yowl
  }
}

export function buildCat() {
  const R = [0, 1, 2, 3, 4].map((f) => makeSprite(24, 20, (t) => drawCat(t, f), { ax: 0.5, ay: 1 }));
  return { R, L: R.map(flipH) };
}
