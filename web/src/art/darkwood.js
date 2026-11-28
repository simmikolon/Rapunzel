import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// The dark wood (background.js `wood`, world.js drawDarkness): a stretch of
// the forest where no light comes through the leaves. What is seen there is
// what has a light of its own, and two things are drawn for it: the lantern
// the prince carries, and the mushrooms that glow, standing on the branches
// (so one sees where the next branch is) and growing in shelves from the
// trunks (so the trees have a shape in the dark).

const IRON = { hi: '#b4bec2', base: '#737e86', dark: '#444d55' };
// What glows in the dark wood: the mushrooms' cold light, pale green.
export const GLOW = { hi: '#e2fff6', cap: '#86f5da', shade: '#45c9b2', gill: '#1f8f86', stem: '#c8f5ea', stemShade: '#7fc9bd', light: '#8ff5dc' };

function stamp(t, rows, key) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (key[row[i]]) t.p(i, j, 1, 1, key[row[i]]); });
}
const KEY = { h: GLOW.hi, c: GLOW.cap, s: GLOW.shade, d: GLOW.gill, t: GLOW.stem, u: GLOW.stemShade };

// The lantern in his hand, 7 x 10 art px, lit: a ring to hold it by, a little
// roof, the glass with the flame in it, a foot. The anchor is the ring's
// top, which it swings from.
const HAND = [
  '..rrr..',
  '..r.r..',
  '.iIIId.',
  'iIIIIId',
  '.dywyd.',
  '.dywwd.',
  '.dywyd.',
  '.dyyyd.',
  '.IIIId.',
  '..ddd..',
];
// Mushrooms that stand on a branch, the anchor the middle of their foot: one tall, a pair, three.
const STAND = [
  ['.hhc.', 'hhccs', 'ccccs', '.dtd.', '..t..', '..t..', '..u..'],
  ['..hhc...', '.hhccs..', '.ccccs..', '..dtd.hc', '...t.hcs', '...t..t.', '...u..u.'],
  ['....hc...', '...hccs..', '.hc..t...', 'hccs.t.hc', '.t...t.cs', '.u...u.t.'],
];
// Shelves on the left tree's inner side (mirrored for the right one), the anchor where they meet the bark, half way up.
const SHELF = [
  ['hhhc......', 'hcccs.....', 'dddd......', '..........', 'hhhhhc....', 'hccccccs..', 'ddddddd...', '..........', 'hhhc......', 'hccccs....', 'ddddd.....'],
  ['hhhhc.....', 'hccccs....', 'ddddd.....', '..........', '..........', 'hhc.......', 'hccs......', 'ddd.......'],
];

export function buildDarkwood() {
  const of = (rows, key, anchor) => makeSprite(rows[0].length, rows.length, (t) => stamp(t, rows, key), undefined, anchor(rows[0].length, rows.length));
  const shelfL = SHELF.map((rows) => of(rows, KEY, (w, h) => ({ axPx: 0, ayPx: (h / 2) * 4 })));
  return {
    lantern: of(HAND, { r: IRON.hi, i: IRON.hi, I: IRON.base, d: IRON.dark, y: C.lanternGlow, w: C.sun1 }, (w) => ({ axPx: (w / 2) * 4, ayPx: 0 })),
    shrooms: STAND.map((rows) => of(rows, KEY, (w, h) => ({ axPx: (w / 2) * 4, ayPx: h * 4 }))),
    shelfL, shelfR: shelfL.map(flipH),
  };
}
