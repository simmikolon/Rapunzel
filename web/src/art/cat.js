import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// The witch's cat (enemies.js Cat): the one from her portraits, at home on
// the ledges inside the tower. 24 x 20 art px (on a canvas one pixel larger
// all round, for its contour), facing RIGHT, standing on the bottom middle.
// A witch's cat is black, and black it is: nearly black fur, a dark violet
// only where the light from above catches the crown, the back and the
// tail. On a dark wall that would be a hole, so this is one of the sprites
// that get a contour (docs/ART.md: only where something would otherwise
// vanish): a thin pale line along its top and its sides, none underneath,
// as a rim of light from above would lie. Its eyes are yellow and the
// brightest thing on it: what one sees first, and in the dark the only thing.
// Frames: 0 and 1 sitting (the tail curled up, then laid along the ledge:
// it swishes), 2 crouched to pounce (the rear up; the game wiggles it),
// 3 the pounce (stretched, claws out), 4 puffed up and off (it was pogoed;
// a cat is not knocked out, it is offended).
const CAT = { fur: '#15141d', lit: '#2d2a45', rim: '#7b78a6', whisker: '#a9a6c8', eye: C.sun2, eyeHi: C.sun1, nose: C.cheek, claw: C.white };

function drawCat(t, frame) {
  const { p, disc, ellipse } = t;
  const eyes = (x, y, wide) => {
    // two eyes looking right; wide when it is about to go
    for (const ex of [x, x + 3]) { p(ex, y, 2, 2, CAT.eye); p(ex, y, 1, 1, CAT.eyeHi); p(ex + 1, y, 1, 2, C.black); if (wide) { p(ex, y - 1, 2, 1, CAT.eye); p(ex + 1, y - 1, 1, 1, C.black); } }
  };
  const head = (cx, cy, wide) => {
    disc(cx, cy, 4, CAT.fur);
    p(cx - 4, cy - 6, 2, 3, CAT.fur); p(cx + 2, cy - 6, 2, 3, CAT.fur); p(cx - 3, cy - 5, 1, 1, CAT.nose); p(cx + 3, cy - 5, 1, 1, CAT.nose);   // ears
    p(cx - 2, cy - 4, 5, 1, CAT.lit);                                                                                                       // lit crown
    eyes(cx - 2, cy - 1, wide);
    p(cx + 1, cy + 2, 1, 1, CAT.nose); p(cx + 5, cy + 1, 2, 1, CAT.whisker); p(cx + 5, cy + 3, 2, 1, CAT.whisker);                           // nose, whiskers
  };
  if (frame === 0 || frame === 1) {
    // sitting upright: a pear of a body, the paws together in front
    ellipse(10, 14, 5, 5, CAT.fur); p(6, 18, 11, 2, CAT.fur); p(5, 11, 1, 5, CAT.lit); p(6, 10, 2, 1, CAT.lit); p(14, 17, 1, 3, CAT.lit);
    if (frame === 0) { p(3, 12, 2, 7, CAT.fur); p(3, 12, 1, 6, CAT.lit); p(2, 10, 2, 2, CAT.fur); p(4, 18, 2, 1, CAT.fur); }                        // tail curled up behind
    else { p(0, 18, 7, 2, CAT.fur); p(0, 18, 6, 1, CAT.lit); }                                                                                    // tail laid along the ledge
    head(14, 7, false);
  } else if (frame === 2) {
    // crouched: chest on the ledge, the rear and the tail up
    ellipse(10, 15, 7, 3, CAT.fur); p(3, 10, 6, 5, CAT.fur); p(3, 10, 5, 1, CAT.lit); p(4, 18, 3, 2, CAT.fur); p(13, 18, 3, 2, CAT.fur);
    p(2, 1, 2, 10, CAT.fur); p(2, 1, 1, 9, CAT.lit);                                                                                               // tail straight up
    head(17, 12, true);
  } else if (frame === 3) {
    // the pounce: stretched out, front paws and claws ahead, the tail streaming
    ellipse(11, 11, 8, 3, CAT.fur); p(4, 8, 12, 1, CAT.lit); p(1, 12, 4, 2, CAT.fur); p(0, 14, 2, 1, CAT.fur);
    p(0, 6, 4, 2, CAT.fur); p(0, 6, 3, 1, CAT.lit);
    p(18, 12, 5, 2, CAT.fur); p(23, 12, 1, 1, CAT.claw); p(23, 14, 1, 1, CAT.claw); p(22, 14, 1, 1, CAT.claw);
    head(18, 7, true);
  } else {
    // puffed up: an arched back, fur on end, eyes round
    ellipse(11, 12, 6, 4, CAT.fur); p(6, 7, 10, 2, CAT.fur); p(6, 7, 9, 1, CAT.lit);
    for (const x of [5, 7, 9, 11, 13, 15]) p(x, 5 + (x % 4 === 1 ? 0 : 1), 1, 2, CAT.fur);                                                          // fur on end
    p(5, 15, 2, 4, CAT.fur); p(14, 15, 2, 4, CAT.fur); p(1, 4, 3, 9, CAT.fur); p(0, 5, 1, 6, CAT.fur); p(4, 5, 1, 6, CAT.fur); p(1, 4, 3, 1, CAT.lit);
    disc(18, 9, 4, CAT.fur); p(14, 3, 2, 3, CAT.fur); p(20, 3, 2, 3, CAT.fur); p(16, 5, 5, 1, CAT.lit);
    for (const ex of [16, 19]) { p(ex, 7, 2, 3, CAT.eye); p(ex + 1, 8, 1, 1, C.black); }
    p(18, 11, 2, 2, CAT.nose); p(18, 12, 2, 1, C.black);                                                                                            // a mouth open to yowl
  }
  contour(t);
}

// The pale line that keeps a black cat from being a hole in the wall: every
// empty art pixel that has fur to its right, to its left or under it (so:
// along the top and both sides, not underneath) takes the rim colour.
function contour(t) {
  const { ctx } = t, cw = ctx.canvas.width, ch = ctx.canvas.height, px = 4, W = cw / px, H = ch / px;
  const a = ctx.getImageData(0, 0, cw, ch).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[((y * px + 1) * cw + x * px + 1) * 4 + 3] > 0;
  const rim = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!solid(x, y) && (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1))) rim.push([x, y]);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = CAT.rim;
  for (const [x, y] of rim) ctx.fillRect(x * px, y * px, px, px);
  ctx.restore();
}

export function buildCat() {
  // one art pixel of room all round for the contour; it still stands on its feet
  const R = [0, 1, 2, 3, 4].map((f) => makeSprite(26, 22, (t) => drawCat(t, f), undefined, { shift: [1, 1], axPx: 13 * 4, ayPx: 21 * 4 }));
  return { R, L: R.map(flipH) };
}
