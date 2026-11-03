import { PX } from '../config.js';
import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// The wordmark: SIR BOUNCEALOT in chunky pixel letters drawn on the art grid
// like every other sprite, so the title screen keeps the game's look.
// Each glyph is 5 x 7 cells; a cell becomes k x k art pixels and every stroke
// is thickened by one art pixel (bold), so the counters stay open while the
// letters read as chunky. Letters get a top highlight, a bottom and right
// shade (a bevel), a dark outline and a drop shadow. The big word is one
// sprite per letter so the title can bounce them one after the other.

const GLYPHS = {
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
};
const GW = 5, GH = 7;
const OUTLINE = 1, SHADOW = 2;

export const WORD = 'BOUNCEALOT';
export const WORD_SCALE = 3;
const BOLD = 1;                 // extra art pixels on every stroke's right and bottom
// Advance between the big letters in logical px: the bold glyph plus one art
// pixel of air; the outlines touch, which keeps the word inside the screen.
export const WORD_ADVANCE = (GW * WORD_SCALE + BOLD + 1) * PX;

const GOLD = { hi: C.braidHi, mid: C.braid, lo: C.braidShade, edge: C.braidDark, outline: C.uiDark, shadow: 'rgba(8,16,20,0.55)' };
const PINK = { hi: C.bowHi, mid: C.ribbonHi, lo: C.ribbon, edge: C.ribbonDark, outline: C.uiDark, shadow: 'rgba(8,16,20,0.55)' };

// Draws `text` (letters spaced `gap` cells apart) at cell scale k into one
// sprite anchored at the baseline's centre. Returns the sprite.
function wordSprite(text, k, pal, { gap = 1, crown = false } = {}) {
  const cols = text.length * (GW * k + BOLD) + (text.length - 1) * gap * k;
  const rows = GH * k + BOLD;
  // filled[y][x] over the glyph area in art pixels
  const filled = Array.from({ length: rows }, () => new Array(cols).fill(false));
  text.split('').forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    const x0 = i * (GW * k + BOLD + gap * k);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      if (g[gy][gx] !== '#') continue;
      for (let dy = 0; dy < k + BOLD; dy++) for (let dx = 0; dx < k + BOLD; dx++) filled[gy * k + dy][x0 + gx * k + dx] = true;
    }
  });
  const at = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && filled[y][x];
  const crownH = crown ? 5 : 0;
  const w = cols + 2 * OUTLINE + SHADOW, h = rows + 2 * OUTLINE + SHADOW + crownH;
  return makeSprite(w, h, ({ p }) => {
    const ox = OUTLINE, oy = OUTLINE + crownH;
    if (crown) drawCrown(p, ox + Math.floor(cols / 2), 0);
    // shadow: the outlined shape shifted down-right
    for (let y = -1; y <= rows; y++) for (let x = -1; x <= cols; x++) {
      if (at(x, y) || nearFilled(at, x, y)) p(x + ox + SHADOW, y + oy + SHADOW, 1, 1, pal.shadow);
    }
    // outline
    for (let y = -1; y <= rows; y++) for (let x = -1; x <= cols; x++) {
      if (!at(x, y) && nearFilled(at, x, y)) p(x + ox, y + oy, 1, 1, pal.outline);
    }
    // bevelled fill: top row of a stroke lit, bottom row and right column shaded
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!at(x, y)) continue;
      let col = pal.mid;
      if (!at(x, y - 1)) col = pal.hi;
      else if (!at(x, y + 1)) col = pal.lo;
      else if (!at(x + 1, y)) col = pal.lo;
      if (!at(x, y + 1) && !at(x + 1, y)) col = pal.edge;
      p(x + ox, y + oy, 1, 1, col);
    }
  }, { ax: 0.5, ay: 1 }, { axPx: (OUTLINE + cols / 2) * PX, ayPx: (OUTLINE + crownH + rows) * PX });
}

// A small crown above the middle letter: three points, a jewel, an outline.
function drawCrown(p, cx, top) {
  const o = C.uiDark;
  p(cx - 4, top, 9, 5, o);                        // outline block, then the crown on top of it
  p(cx - 3, top + 2, 7, 2, C.gold);
  p(cx - 3, top + 1, 1, 1, C.gold); p(cx, top + 1, 1, 1, C.gold); p(cx + 3, top + 1, 1, 1, C.gold);
  p(cx - 3, top + 3, 7, 1, C.goldDark);
  p(cx, top + 2, 1, 1, C.gem);
}

function nearFilled(at, x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy)) return true;
  return false;
}

export function buildLogo() {
  return {
    sir: wordSprite('SIR', 2, PINK, { gap: 1, crown: true }),
    letters: WORD.split('').map((ch) => wordSprite(ch, WORD_SCALE, GOLD)),
  };
}
