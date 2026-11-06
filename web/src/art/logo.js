import { PX } from '../config.js';
import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';

// The game's lettering: chunky pixel glyphs drawn on the art grid like every
// other sprite, so headings and button labels keep the game's look instead
// of a font. Each glyph is 5 x 7 cells; a cell becomes k x k art pixels and
// every stroke is thickened by one art pixel (bold), so the counters stay
// open while the letters read as chunky. Letters get a top highlight, a
// bottom and right shade (a bevel), a dark outline and a drop shadow. The
// wordmark SIR BOUNCEALOT is one sprite per letter so the title can bounce
// them one after the other; drawWord() sets any other string from the
// per-character sets (gold at two sizes, pink at one).

const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
};
const GW = 5, GH = 7;
const OUTLINE = 1, SHADOW = 2;

export const WORD = 'BOUNCEALOT';
export const WORD_SCALE = 3;
const BOLD = 1;                 // extra art pixels on every stroke's right and bottom
// Advance between letters in logical px: the bold glyph plus one art pixel
// of air; the outlines touch, which keeps a word compact.
const advance = (k) => (GW * k + BOLD + 1) * PX;
export const WORD_ADVANCE = advance(WORD_SCALE);

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

// A small crown: three points, a jewel, an outline.
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

// One sprite per character at scale k: { k, adv, space, body, map }.
// `body` is the glyph's height in logical px (baseline to the top of a
// capital), so a word can be centred vertically.
function charSet(k, pal) {
  const map = {};
  for (const ch of Object.keys(GLYPHS)) map[ch] = wordSprite(ch, k, pal);
  return { k, adv: advance(k), space: (Math.floor((GW * k) / 2) + 1) * PX, body: (GH * k + BOLD) * PX, map };
}

export function buildLogo() {
  return {
    sir: wordSprite('SIR', 2, PINK, { gap: 1, crown: true }),
    letters: WORD.split('').map((ch) => wordSprite(ch, WORD_SCALE, GOLD)),
    crown: makeSprite(9, 5, ({ p }) => drawCrown(p, 4, 0), { ax: 0.5, ay: 0.5 }),
    gold2: charSet(2, GOLD),
    gold3: charSet(3, GOLD),
    pink2: charSet(2, PINK),
  };
}

export function wordWidth(set, str) {
  let w = 0;
  for (const ch of str) w += ch === ' ' ? set.space : set.adv;
  return w - PX;   // no air after the last letter
}

// Draw `str` from a character set with its baseline at y. o: align
// ('center' | 'left' | 'right'), alpha, glow, scale (about the baseline),
// dy(i) for a per-letter offset (a wave).
export function drawWord(g, set, str, x, y, o = {}) {
  const align = o.align || 'center';
  const w = wordWidth(set, str);
  let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const opts = (o.alpha != null || o.glow || o.scale) ? { alpha: o.alpha, glow: o.glow, sx: o.scale, sy: o.scale } : undefined;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === ' ') { cx += set.space; continue; }
    const s = set.map[ch] || set.map[ch.toUpperCase()];
    if (s) g.blit(s, cx + s.ax - OUTLINE * PX, y + (o.dy ? o.dy(i) : 0), opts);
    cx += set.adv;
  }
}
