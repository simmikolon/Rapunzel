import { makeSprite } from './sprite.js';

// The weather's few sprites (src/weather.js draws the rest with lines and
// squares): a gust of wind the way the old games drew it, a white line that
// ends in a curl, in three lengths; and the big snowflake of the nearest
// layer. White, to be tinted and faded by the code.
const WHITE = '#ffffff';

// A line `len` art px long along the bottom, running into a curl 7 px across
// that turns up, over and in on itself and stops short of closing.
function drawCurl(len) {
  return (t) => {
    const { p } = t;
    const L = len;      // the curl's left edge
    p(0, 7, L + 5, 1, WHITE);                                   // the line, and the curl's foot
    p(L + 5, 6, 1, 1, WHITE); p(L + 6, 3, 1, 3, WHITE);         // up its right side
    p(L + 5, 2, 1, 1, WHITE); p(L + 2, 1, 3, 1, WHITE);         // over the top
    p(L + 1, 2, 1, 1, WHITE); p(L, 3, 1, 2, WHITE);             // down the left
    p(L + 1, 5, 2, 1, WHITE); p(L + 3, 4, 1, 1, WHITE);         // and in
    // the line thins out at its tail
    p(0, 7, 3, 1, null);
  };
}
function drawFlake(t) {
  const { p } = t;
  p(1, 0, 1, 3, WHITE); p(0, 1, 3, 1, WHITE);
}

export function buildWeather() {
  const curl = (len) => makeSprite(len + 7, 9, drawCurl(len), { ax: 0.5, ay: 0.5 });
  return {
    curls: [curl(14), curl(22), curl(32)],
    flake: makeSprite(3, 3, drawFlake, { ax: 0.5, ay: 0.5 }),
  };
}
