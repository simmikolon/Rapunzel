import { makeSprite } from './sprite.js';

// The updraft's look: a small cloud with puffed cheeks blowing upward from
// the base of the column, and wind curls that rise through it. Same cloud
// palette as the platforms; curls in white with a pale blue shade.
const WHITE = '#f6f4ee', SHADE = '#cfd9df', DEEP = '#a9b9c3', BLUE = '#bfe0ff', INK = '#2d2b42', CHEEK = '#ffb0c8';

function drawCurl(t, v) {
  const { p, line, ring } = t;
  // a tail that ends in a hook, three sizes
  if (v === 0) { line(0, 6, 4, 6, BLUE); line(1, 5, 4, 5, WHITE); ring(7, 3, 3, WHITE); p(4, 3, 1, 1, SHADE); p(7, 6, 1, 1, SHADE); p(9, 4, 1, 1, BLUE); }
  else if (v === 1) { line(0, 5, 3, 5, BLUE); line(1, 4, 3, 4, WHITE); ring(6, 3, 2, WHITE); p(4, 3, 1, 1, SHADE); p(8, 4, 1, 1, BLUE); }
  else { line(0, 4, 2, 4, WHITE); ring(4, 2, 2, WHITE); p(2, 2, 1, 1, SHADE); p(6, 3, 1, 1, BLUE); }
}

function drawBlower(t, frame) {
  const { p, disc, ellipse } = t;
  // body: a small fluffy cloud, 22 x 14
  ellipse(11, 9, 10, 4, SHADE);
  ellipse(11, 8, 9, 4, WHITE);
  for (const [cx, cy, r] of [[5, 7, 3], [11, 5, 4], [17, 7, 3]]) { disc(cx, cy + 1, r, SHADE); disc(cx, cy, r, WHITE); }
  p(3, 12, 16, 1, DEEP);
  // face looking up: eyes, cheeks puffed when blowing, a round mouth on top
  p(8, 6, 1, 1, INK); p(14, 6, 1, 1, INK);
  if (frame) { ellipse(6, 8, 2, 1.5, CHEEK); ellipse(16, 8, 2, 1.5, CHEEK); p(10, 2, 2, 2, INK); p(10, 2, 1, 1, '#5a5674'); }
  else { p(6, 8, 2, 1, CHEEK); p(15, 8, 2, 1, CHEEK); p(10, 3, 2, 1, INK); }
}

export function buildWind() {
  return {
    curls: [0, 1, 2].map((v) => makeSprite(10, 8, (t) => drawCurl(t, v), { ax: 0.5, ay: 0.5 })),
    blower: [0, 1].map((f) => makeSprite(22, 14, (t) => drawBlower(t, f), { ax: 0.5, ay: 0.5 })),
  };
}
