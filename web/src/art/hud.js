import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// What the heads-up display is made of: the boost's flames (a charge beside
// the hearts' kin, bottom left, and the big one in the touch button), the
// button's wooden hoop, and the symbols on the small boards (sound, pause).
// Art pixels. The flame is the boost's sign everywhere: it is what comes out
// of the pogo stick (art/prince.js).

// A flame is lit from within: pale core, yellow, orange, a red foot. Two
// frames with the tip leaning one way and the other; a lick off one side so
// it is not a mirrored drop.
const FLAME_COL = { o: C.flame3, y: C.flame2, w: C.flame1, r: C.flame4 };
const SMALL = [[
  '.....o...',
  '....oo...',
  '...ooo...',
  '...oyoo..',
  '..ooyyoo.',
  '.ooyyyyo.',
  '.oyywwyoo',
  '.oywwwwyo',
  '.rywwwwyr',
  '..rywwyr.',
  '...rrrr..',
], [
  '.........',
  '...o.....',
  '...oo....',
  '...ooo...',
  '..ooyoo..',
  '.ooyyyyo.',
  '.oyywwyoo',
  '.oywwwwyo',
  '.rywwwwyr',
  '..rywwyr.',
  '...rrrr..',
]];
// half a charge: a small flame at the foot of the unlit one
const SMALL_EMBER = [
  '....o....',
  '...ooo...',
  '..oyyyo..',
  '..rywwyr.',
  '...rrrr..',
];
const BIG = [[
  '.........o......',
  '........oo......',
  '........oo......',
  '.......ooo......',
  '.......oooo.....',
  '......ooooo.....',
  '......ooyoo.....',
  '.....oooyooo....',
  '....oooyyyoo..o.',
  '....ooyyyyoo.oo.',
  '...oooyyyyyooo..',
  '..oooyyyyyyyoo..',
  '..ooyyywwyyyoo..',
  '.oooyywwwwyyooo.',
  '.ooyyywwwwyyyoo.',
  '.ooyywwwwwwyyoo.',
  '.royywwwwwwyyor.',
  '.rooyywwwwyyoor.',
  '..rooyywwyyoor..',
  '..rrooyyyyoorr..',
  '...rrrooooorr...',
  '.....rrrrrr.....',
], [
  '................',
  '......o.........',
  '......oo........',
  '......ooo.......',
  '......oooo......',
  '......ooooo.....',
  '......ooyoo.....',
  '.....oooyooo....',
  '.o..oooyyyoo....',
  '.oo.ooyyyyoo....',
  '..oooyyyyyyooo..',
  '..oooyyyyyyyoo..',
  '..ooyyyywwyyoo..',
  '.oooyywwwwyyooo.',
  '.ooyyywwwwyyyoo.',
  '.ooyywwwwwwyyoo.',
  '.royywwwwwwyyor.',
  '.rooyywwwwyyoor.',
  '..rooyywwyyoor..',
  '..rrooyyyyoorr..',
  '...rrrooooorr...',
  '.....rrrrrr.....',
]];

const paintMap = (p, rows, x0 = 0, y0 = 0) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) p(x0 + x, y0 + y, 1, 1, FLAME_COL[row[x]]); });
// The flame that is out: its shape in the HUD's dark, edged so it reads on
// any background, the edge brighter where the light falls (upper left).
function unlit(p, rows) {
  const out = (x, y) => y < 0 || y >= rows.length || x < 0 || x >= rows[y].length || rows[y][x] === '.';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      const lit = out(x - 1, y) || out(x, y - 1), edge = lit || out(x + 1, y) || out(x, y + 1);
      p(x, y, 1, 1, lit ? C.uiLine : edge ? C.uiMid : C.uiDark);
    }
  });
}
function flame(rows, mode, ember) {
  const w = rows[0].length, h = rows.length;
  return makeSprite(w, h, ({ p }) => {
    if (mode === 'lit') return paintMap(p, rows);
    unlit(p, rows);
    if (mode === 'ember') paintMap(p, ember, Math.floor((w - ember[0].length) / 2), h - ember.length);
  }, { ax: 0.5, ay: 1 });
}

// The boost button's hoop: a ring of the signs' light wood, 40 art px
// across, lit from the upper left, with the staves' joints and a nail left
// and right as the small boards have them. What it holds is drawn by the
// HUD: a dark glass (`lens`, white, tinted on the draw call) the game shows
// through, a gold rim inside the wood while a boost is ready (`rim`, as a
// chosen board has one) and the flame.
const HOOP = 40, R = HOOP / 2;
const JOINTS = [0.35, 1.5, 2.45, 3.6, 4.4, 5.55];          // where two staves meet, by angle
function drawHoop({ p }) {
  for (let y = 0; y < HOOP; y++) for (let x = 0; x < HOOP; x++) {
    const dx = x + 0.5 - R, dy = y + 0.5 - R, d = Math.hypot(dx, dy);
    if (d > R || d <= R - 5) continue;
    const lit = (dx + dy) / (d * Math.SQRT2);                 // -1 facing the light, 1 away from it
    let c = C.plank;
    if (d > R - 1 || d <= R - 4) c = C.barkShadow;            // the outline, and the edge of the glass
    else if (d > R - 2) c = lit < -0.3 ? C.plankHi : lit > 0.3 ? C.plankDark : C.plank;
    else if (d <= R - 3) c = lit < -0.3 ? C.plankDark : lit > 0.5 ? C.plankHi : C.plank;
    else {
      const a = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      if (JOINTS.some((j) => Math.abs(a - j) < 0.04)) c = C.plankDark;
    }
    p(x, y, 1, 1, c);
  }
  for (const nx of [1, HOOP - 3]) { p(nx, R - 1, 2, 2, C.pole); p(nx, R - 1, 1, 1, C.poleHi); }
}
function drawRim({ p }) {
  for (let y = 0; y < HOOP; y++) for (let x = 0; x < HOOP; x++) {
    const dx = x + 0.5 - R, dy = y + 0.5 - R, d = Math.hypot(dx, dy);
    if (d <= R - 4 && d > R - 5) p(x, y, 1, 1, dx + dy < -6 ? C.gold : C.goldDark);
  }
}
function drawLens({ p }) {
  for (let y = 0; y < HOOP; y++) for (let x = 0; x < HOOP; x++) if (Math.hypot(x + 0.5 - R, y + 0.5 - R) <= R - 4) p(x, y, 1, 1, C.white);
}

// The symbols on the small boards, in the ink the signs are painted with:
// a loudspeaker with its waves, the same crossed out, the pause's two bars.
const INK = '#3b2a1e';
const SPEAKER = [
  '....i...i..',
  '...ii....i.',
  'iiiii.i...i',
  'iiiii..i..i',
  'iiiii..i..i',
  'iiiii..i..i',
  'iiiii.i...i',
  '...ii....i.',
  '....i...i..',
];
const MUTED = [
  '....i......',
  '...ii......',
  'iiiii.x...x',
  'iiiii..x.x.',
  'iiiii...x..',
  'iiiii..x.x.',
  'iiiii.x...x',
  '...ii......',
  '....i......',
];
const GLYPH_COL = { i: INK, x: C.gem };
const glyph = (rows) => makeSprite(rows[0].length, rows.length, ({ p }) => rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) p(x, y, 1, 1, GLYPH_COL[row[x]]); }), { ax: 0.5, ay: 0.5 });

export function buildHud() {
  return {
    flame: SMALL.map((rows) => flame(rows, 'lit')),
    flameHalf: flame(SMALL[0], 'ember', SMALL_EMBER),
    flameOff: flame(SMALL[0], 'off'),
    bigFlame: BIG.map((rows) => flame(rows, 'lit')),
    bigFlameHalf: flame(BIG[0], 'ember', SMALL[1].slice(1)),
    bigFlameOff: flame(BIG[0], 'off'),
    hoop: makeSprite(HOOP, HOOP, drawHoop, { ax: 0.5, ay: 0.5 }),
    rim: makeSprite(HOOP, HOOP, drawRim, { ax: 0.5, ay: 0.5 }),
    lens: makeSprite(HOOP, HOOP, drawLens, { ax: 0.5, ay: 0.5 }),
    speaker: glyph(SPEAKER),
    speakerOff: glyph(MUTED),
    pause: makeSprite(6, 7, ({ p }) => { p(0, 0, 2, 7, INK); p(4, 0, 2, 7, INK); }, { ax: 0.5, ay: 0.5 }),
  };
}
