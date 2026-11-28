import { makeSprite } from './sprite.js';
import { PAL as C } from '../palette.js';
import { mixHex } from '../util.js';

// What hangs on the tower's wall storey by storey, and what stands out at
// its edges (towerwall.js says where, background.js draws it): a lantern
// on an iron arm, a torch in a ring, a banner on a rod, a gargoyle at the
// end of a string course. All for the eye; each answers to the hour or the
// weather (the lantern is lit when it gets dark, the torch burns all day and
// lights the wall once it is dark, the banner blows in the wind, the
// gargoyle spouts when it rains: background.js).

const IRON = { hi: '#b4bec2', base: '#737e86', dark: '#444d55', deep: '#2b3138' };
const GLASS = { dark: '#223040', mid: '#34485a', shine: '#6d879c' };      // a lantern's panes with no light behind them
const CAST = 'rgba(16, 26, 31, 0.5)';        // the shadow a thing throws on the wall (as art/tower.js has it)

// A little picture from rows of letters, each letter a colour of `key` ('.' is nothing).
function stamp(t, x, y, rows, key) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (key[row[i]]) t.p(x + i, y + j, 1, 1, key[row[i]]); });
}

// --- the lantern ----------------------------------------------------------------------
// LANTERN.w x LANTERN.h art px, for the left half of the wall (mirrored on
// the right): a plate on the wall, an arm with a brace under it, and the
// lantern hanging from the arm's end, four panes in an iron frame under a
// little roof. `lit`: the same with the candle burning (background.js
// fades it in over the dark one, after the wall's veil, and adds the
// light). The anchor is the plate's middle, where it is fixed to the wall.
export const LANTERN = { w: 12, h: 17, pane: [8.5, 9.5] };      // (`pane`: the middle of its glass, from the sprite's upper left corner, for the light)
function drawLantern(t, lit) {
  const { p } = t, I = IRON;
  // the plate and its two bolts, the arm, the brace
  p(0, 1, 2, 8, I.dark); p(0, 1, 1, 8, I.base); p(0, 2, 1, 1, I.hi); p(0, 7, 1, 1, I.hi); p(0, 9, 2, 1, CAST);
  p(2, 2, 8, 1, I.base); p(2, 2, 3, 1, I.hi); p(9, 2, 1, 2, I.dark); p(2, 3, 7, 1, CAST);
  p(2, 6, 1, 1, I.dark); p(3, 5, 1, 1, I.dark); p(4, 4, 1, 1, I.dark); p(5, 3, 1, 1, I.dark);
  // the ring it hangs by, its roof
  p(8, 3, 1, 1, I.base); p(8, 4, 2, 1, I.dark);
  p(7, 5, 4, 1, I.base); p(7, 5, 1, 1, I.hi); p(6, 6, 6, 1, I.dark); p(6, 6, 2, 1, I.base);
  // the frame and its panes
  p(6, 7, 1, 6, I.dark); p(11, 7, 1, 6, I.deep); p(9, 7, 1, 6, I.dark);
  if (lit) {
    p(7, 7, 2, 6, C.lanternPaper); p(10, 7, 1, 6, C.lanternShade);
    p(7, 9, 2, 3, C.lanternHi); p(8, 8, 1, 2, C.sun1); p(7, 12, 2, 1, C.lanternGlow); p(10, 11, 1, 2, C.lanternGlow);
  } else {
    p(7, 7, 2, 6, GLASS.dark); p(10, 7, 1, 6, GLASS.dark);
    p(7, 7, 1, 2, GLASS.shine); p(7, 9, 1, 1, GLASS.mid); p(8, 7, 1, 1, GLASS.mid); p(8, 11, 1, 2, C.lanternPaper);      // a pane catching the sky, and the candle's stump
  }
  // its foot and the drop under it
  p(6, 13, 6, 1, I.base); p(6, 13, 1, 1, I.hi); p(7, 14, 4, 1, I.dark); p(8, 15, 2, 1, I.deep);
}

// --- the torch --------------------------------------------------------------------------
// TORCH.w x TORCH.h art px, for the left half of the wall (mirrored on the
// right): a plate on the wall, two iron arms from it, and in their rings a
// wooden torch with an iron cup at its top, the cloth in it charred. It burns: the flame is a sprite of its own in three frames (7 x 10
// art px, the anchor the middle of its foot), drawn after the wall's veil
// where the torch's head is (`fire`, from the sprite's upper left corner),
// and it goes into the glow. The anchor is the plate's middle (`at`: its row).
export const TORCH = { w: 11, h: 13, at: 8, fire: [7, 1] };
const WOOD = { hi: C.plankHi, base: C.plank, dark: C.plankDark };
const CHAR = '#2a2226';
const FIRE = { o: '#e2532a', m: '#ffa23a', y: '#ffe07a', w: '#fff6d2' };
function drawTorch(t) {
  stamp(t, 0, 0, [
    '.....kkkk..',
    '....kkkkkk.',
    '....dIiIId.',
    '.....dIId..',
    '.....wWd...',
    '.....wWd...',
    'IiIIIwWd...',
    'Id..dwWd...',
    'Id...wWd...',
    'IiIIIwWd...',
    'Ic...wWd...',
    '.c...wd....',
    '.....w.....',
  ], { I: IRON.base, i: IRON.hi, d: IRON.dark, w: WOOD.base, W: WOOD.hi, k: CHAR, c: CAST });
}
const FLAMES = [
  ['...o...', '..oo...', '..omo..', '.oomo..', '.omyo..', 'oomymo.', 'omyymo.', 'omywmo.', '.omymo.', '..ooo..'],
  ['....o..', '...oo..', '...mo..', '..omoo.', '.oomyo.', '.omymo.', 'oomyymo', 'omywymo', '.omymo.', '..ooo..'],
  ['..o....', '.......', '...o...', '..omo..', '.omymo.', '.omyyo.', 'omywymo', 'omywymo', '.omymo.', '..ooo..'],
];

// --- the niche --------------------------------------------------------------------------
// NICHE.w x NICHE.h art px: an arched recess in the wall with a frame and a
// sill of dressed stone, and in it a little figure of stone: a knight with
// his shield and his sword, the frog king under his crown, an owl. Lit from
// the upper left like the windows; the anchor is the middle of its sill's
// foot.
export const NICHE = { w: 14, h: 22 };
const NICHE_GLINT = '#1f2f36';      // a breath of light in the recess's upper left corner
const NICHE_ROWS = [
  '....SSSSSS....', '..SSssssssSx..', '.Ssddddddddsx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.',
  '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.',
  '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', '.sddddddddddx.', 'HSSSSSSSSSSSSs', 'ssssssssssssxx', '.cccccccccccc.',
];
const FIGURES = [
  ['...a....', '..hhh...', '.hhhhh..', '.hkkkh..', '.hhhhh..', '..bbb.i.', '.hhhhbi.', 'hhsssbi.', 'hbsasbi.', 'hbsssbii', '.bbsbb..', '.hb.hb..', '.hb.hb..', '.hb.hb..', 'hhb.hhb.'],
  ['........', '........', '........', '........', '........', '........', '.a.a.a..', '.aaaaa..', '.hhhhhh.', 'hkhhhkhb', 'hhhhhhhb', 'hbbbbbbb', '.hhhhbb.', 'hh.hh.bb', 'hhh..hbb'],
  ['........', '........', '........', '........', 'h......h', 'hh....hb', 'hhhhhhhb', 'hkkhhkkb', 'hkkhhkkb', 'hhhaahbb', 'hbhbhbhb', 'hhbhbhbb', 'hbhbhbhb', '.hhhhbb.', '.aa..aa.'],
];
function drawNiche(t, figure) {
  stamp(t, 0, 0, NICHE_ROWS, { S: C.stoneLight, s: C.stone, x: C.stoneDark, H: C.stoneHi, d: C.wallDeep, c: CAST });
  stamp(t, 3, 4, FIGURES[figure], { h: C.stoneLight, b: C.stone, a: C.stoneHi, i: C.stoneHi, s: C.stoneLight, k: C.wallDeep });
  t.p(3, 3, 3, 2, NICHE_GLINT); t.p(3, 5, 1, 3, NICHE_GLINT);
}

// --- the clock --------------------------------------------------------------------------
// The tower's clock, CLOCK.d art px across: a ring of dressed stone, a face
// of cream plaster with twelve marks, a golden boss. Its hands are sprites
// of their own (17 x 17 art px, the anchor their middle): the long one and
// the short one, each drawn for twelve, one and two o'clock and turned by
// quarters for the other nine places, so that a hand stays on the grid.
// background.js sets them by the time it really is. The anchor is the
// dial's middle.
export const CLOCK = { d: 25 };
const FACE = { hi: '#f1e6cc', shade: '#cdbfa4', ink: '#2a2230', hand: '#3a2c36', gold: C.braid, goldDark: C.braidShade };
function drawClock(t) {
  const { p, disc } = t, c = 12.5;
  disc(c, c, 12.5, C.stoneDark); disc(c - 0.5, c - 0.5, 12, C.stoneLight); disc(c - 1, c - 1, 11, C.stoneHi); disc(c - 0.5, c - 0.5, 11.5, C.stoneLight);
  disc(c, c, 10, FACE.shade); disc(c + 0.5, c + 0.5, 9.5, FACE.hi);
  for (let n = 0; n < 12; n++) {
    const a = n * Math.PI / 6, x = Math.round(12 + 8 * Math.sin(a)), y = Math.round(12 - 8 * Math.cos(a));
    p(x, y, 1, 1, FACE.ink);
    if (n % 3 === 0) p(Math.round(12 + 7 * Math.sin(a)), Math.round(12 - 7 * Math.cos(a)), 1, 1, FACE.ink);
  }
}
function drawHand(t, long, n) {
  const { p, line } = t, a = n * Math.PI / 6, L = long ? 7 : 4, x = 8 + Math.round(L * Math.sin(a)), y = 8 - Math.round(L * Math.cos(a));
  line(8, 8, x, y, long ? FACE.hand : FACE.ink);
  if (!long) { if (n === 0) line(9, 8, x + 1, y, FACE.ink); else line(8, 9, x, y + 1, FACE.ink); }      // the short one is the thicker
  p(8, 8, 1, 1, long ? FACE.gold : FACE.goldDark);
}

// --- the doves --------------------------------------------------------------------------
// White doves that sit on a string course and fly up when somebody climbs
// past (background.js): one sitting (8 x 7 art px, looking right, the anchor
// the middle of its feet) and two frames of one flying (10 x 7, the anchor
// its middle), wings up and wings down.
const DOVE = { w: '#f4f1e6', s: '#c3c8cc', k: '#111120', e: C.sun3, o: '#d98a5a' };
const DOVE_SIT = ['...ww...', '..wwke..', '.wwwww..', 'wwwwsw..', 'wwwsss..', '.wsss...', '..o.o...'];
const DOVE_FLY = [
  ['..w.......', '..ww......', '..www.....', '.wwwwwke..', 'wwwwwww...', '.sswws....', '..........'],
  ['..........', '...wwwke..', 'wwwwwww...', '.swwws....', '..sws.....', '..ss......', '..s.......'],
];

// --- the banner -------------------------------------------------------------------------
// Cloth on a rod, BANNER.cloth art px wide and BANNER.rows long, in four
// frames: hanging, stirring, blown, and blown far (a storm's gust). One
// flat picture of it (rows of letters) is hung row by row: the further
// down a row is, the further the wind carries it sideways and lifts it,
// and the folds that run down it are a lighter and a darker column that
// stand elsewhere in every frame. It blows to the right; background.js
// mirrors it for a wind from the right. The anchor is the middle of the
// rod's top.
// Two looks. The witch's: her hat before the full moon on violet (her arms
// at the gate), out in the weather for a hundred years, so faded, holed and
// its tails in rags. The guards': red with a gold chevron and a gold hem,
// newer and whole.
export const BANNER = { cloth: 15, rows: 30, w: 30, h: 34, rod: 17 };
const BANNERS = [
  { key: { V: '#a57fc4', v: C.tights, w: C.tightsDark, m: C.gold, M: C.braid, o: C.goldDark, k: C.witchHat, y: C.sun2 },
    fold: { v: ['V', 'w'], V: ['V', 'v'], w: ['v', 'w'] },
    rows: [
      'VVVVVVVVVVVVVVV',
      'vvvvvvvvvvvvvvv',
      'vvvvvvvvvvvvvvv',
      'vvvvvvvvkvvvvvv',
      'vvvvvvvkkvvvvvv',
      'vvvvmmmkkkmvvvv',
      'vvvmmmkkkkmMvvv',
      'vvmmmmkkkkMMMvv',
      'vvmmmkkkkkkMMvv',
      'vvmmmkkykkkMMvv',
      'vkkkkkkkkkkkkkv',
      'vvmmMMMMMMMMovv',
      'vvvmMMMMMMMoovv',
      'vvvvMMMMMMoovvv',
      'vvvvvvooooovvvv',
      'vvvvvvvvvvvvvvv',
      'vvvvvvvvvvvvvvv',
      'wvvvvvvvvvvvvvw',
      'vvvvvvvvvvvvvvv',
      'vvvvvvvvvvvvvvv',
      'vvvv.vvvvvvvvvv',
      'vvvv..vvvvvvvvw',
      'vvvvvvvvvvvvvvv',
      'vvvvvvvvvvv.vvv',
      'wvvvvvv.vvvvvvv',
      'vvvvvv...vvvvv.',
      'vvvvv.....vvvv.',
      '.vvv.......vvv.',
      '.vv.........vv.',
      '..v.........v..',
    ] },
  { key: { R: C.capeHi, r: C.cape, d: '#6a1c1c', g: C.gold, G: C.goldDark, y: C.braid },
    fold: { r: ['R', 'd'], R: ['R', 'r'], d: ['r', 'd'], g: ['g', 'G'], y: ['g', 'G'] },
    rows: [
      'RRRRRRRRRRRRRRR',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'grrrrrrrrrrrrrg',
      'yygrrrrrrrrrgyy',
      'ryyygrrrrrgyyyr',
      'rrryyygrgyyyrrr',
      'rrrrryyyyyrrrrr',
      'rrrrrrryrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'grrrrrrrrrrrrrg',
      'yygrrrrrrrrrgyy',
      'ryyygrrrrrgyyyr',
      'rrryyygrgyyyrrr',
      'rrrrryyyyyrrrrr',
      'rrrrrrryrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'rrrrrrrrrrrrrrr',
      'ggggggggggggggg',
      'GyGyGyGyGyGyGyG',
      'y.y.y.y.y.y.y.y',
      '...............',
      '...............',
      '...............',
      '...............',
    ] },
];
// How far the wind carries the cloth's foot sideways in a frame, how far it lifts it, and how much it ripples (art px).
const BLOWN = [{ out: 0, up: 0, wave: 0 }, { out: 2, up: 0, wave: 0.8 }, { out: 7, up: 3, wave: 1.3 }, { out: 11, up: 8, wave: 1.8 }];
function drawBanner(t, look, frame) {
  const { p } = t, B = BANNERS[look], F = BLOWN[frame], N = BANNER.rows;
  // the rod on its two hooks, a knob at either end
  p(1, 0, BANNER.rod - 2, 1, IRON.base); p(1, 1, BANNER.rod - 2, 1, IRON.dark); p(0, 0, 1, 2, IRON.hi); p(BANNER.rod - 1, 0, 1, 2, IRON.base);
  p(3, 0, 1, 1, IRON.hi); p(BANNER.rod - 4, 0, 1, 1, IRON.hi);
  for (let j = 0; j < N; j++) {
    const f = j / (N - 1), row = B.rows[j];
    const dx = Math.round(F.out * Math.pow(f, 1.5) + F.wave * Math.sin(f * 5 + frame * 1.9) * f), y = 2 + j - Math.round(F.up * f * f);
    for (let i = 0; i < row.length; i++) {
      let c = row[i];
      if (c === '.') continue;
      // the folds: two columns that wander with the frame and down the cloth
      const ph = Math.sin((i + frame * 2.3) * 0.9 + f * (1.5 + frame));
      if (B.fold[c] && j > 0) c = ph > 0.8 ? B.fold[c][0] : ph < -0.8 ? B.fold[c][1] : c;
      p(1 + i + dx, y, 1, 1, B.key[c]);
    }
  }
}

// --- the gargoyle -------------------------------------------------------------------------
// GARGOYLE.w x GARGOYLE.h art px, for the wall's left edge (mirrored at the
// right one): a little stone dragon that leans out and down from the end
// of a string course, on a block that is the course's last stone. A neck,
// a folded wing on its back, an ear, a hollow eye under its brow, and its
// mouth open with two fangs: when it rains the water of the course runs
// out of it (background.js), which is what a gargoyle is for. Dressed
// stone like the course, lit from above; it is drawn after the wall's veil
// (it stands out past the wall's edge, where there is none), so its tones
// have the veil in them already. The anchor is the block's upper corner
// at the wall's edge, which is the course's top.
// `mouth`: where the water leaves it; `snow`: the tops snow lies on, each
// [x, y, w]; both from the sprite's upper left corner, art px.
export const GARGOYLE = { w: 22, h: 13, edge: 17, top: 3, mouth: [1, 10], snow: [[4, 5, 5], [0, 7, 4], [13, 2, 3], [17, 3, 5]] };
const VEIL = '#14242b';
const S = [C.stoneHi, C.stoneLight, C.stone, C.stoneDark, C.stoneShade, C.wallDeep].map((c) => mixHex(c, VEIL, 0.3));
function drawGargoyle(t) {
  stamp(t, 0, 0, [
    '...............a......',
    '..............aab.....',
    '.............aabb.....',
    '........a....ccaaaaaaa',
    '.......ab....aabbbbbcb',
    '....aaaaa..aabbbbbbbcb',
    '...abebbbaabbbbbbbbbcb',
    'aaaabbbbbbbbbbbccbbbcb',
    'abbbbbbbbbbbbcc..ccccc',
    '.fefeebbbbbcc.........',
    '..eeeebbbcc...........',
    '..bbbbbbc.............',
    '...ccccc..............',
  ], { a: S[1], b: S[2], c: S[3], d: S[4], e: S[5], f: S[0] });
}

export function buildHung() {
  const lantern = (lit) => makeSprite(LANTERN.w, LANTERN.h, (t) => drawLantern(t, lit), undefined, { axPx: 0, ayPx: 5 * 4 });
  return {
    lantern: lantern(false), lanternLit: lantern(true),
    niches: FIGURES.map((_, f) => makeSprite(NICHE.w, NICHE.h, (t) => drawNiche(t, f), undefined, { axPx: (NICHE.w / 2) * 4, ayPx: NICHE.h * 4 })),
    clock: makeSprite(CLOCK.d, CLOCK.d, (t) => drawClock(t), { ax: 0.5, ay: 0.5 }),
    hands: { long: [0, 1, 2].map((n) => makeSprite(17, 17, (t) => drawHand(t, true, n), { ax: 0.5, ay: 0.5 })), short: [0, 1, 2].map((n) => makeSprite(17, 17, (t) => drawHand(t, false, n), { ax: 0.5, ay: 0.5 })) },
    dove: makeSprite(8, 7, (t) => stamp(t, 0, 0, DOVE_SIT, DOVE), undefined, { axPx: 3 * 4, ayPx: 7 * 4 }),
    doveFly: DOVE_FLY.map((rows) => makeSprite(10, 7, (t) => stamp(t, 0, 0, rows, DOVE), { ax: 0.5, ay: 0.5 })),
    torch: makeSprite(TORCH.w, TORCH.h, (t) => drawTorch(t), undefined, { axPx: 0, ayPx: TORCH.at * 4 }),
    flames: FLAMES.map((rows) => makeSprite(7, 10, (t) => stamp(t, 0, 0, rows, FIRE), undefined, { axPx: 3.5 * 4, ayPx: 10 * 4 })),
    banners: BANNERS.map((_, look) => BLOWN.map((_f, frame) => makeSprite(BANNER.w, BANNER.h, (t) => drawBanner(t, look, frame), undefined, { axPx: (BANNER.rod / 2) * 4, ayPx: 0 }))),
    gargoyle: makeSprite(GARGOYLE.w, GARGOYLE.h, (t) => drawGargoyle(t), undefined, { axPx: GARGOYLE.edge * 4, ayPx: GARGOYLE.top * 4 }),
  };
}
