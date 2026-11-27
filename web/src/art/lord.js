import { makeSprite, makeCanvas, tint } from './sprite.js';
import { PAL as C } from '../palette.js';

// Lord Springalot, the second one who climbs the tower, on a pogo pony of his own.
// 20 x 42 art pixels (the prince is 26 x 58): a child, three quarters of
// his father's height with a head nearly as big. Anchor: bottom-center
// (the rubber tip of the pogo stick).
//
// The prince's son, and his father's colours the other way round: a red
// tunic and a blue cape, blond hair, a piebald pony's head on the pogo
// stick. What is his own is a flyer's: on his back his master ability, a
// firework rocket (player.js, the rocket), and on his forehead a pair of
// goggles, which he pulls over his eyes when it burns (they slip there by
// themselves when he lands, and lift off when he falls). The steel, the
// skin and the flame are the prince's ramps; what is his alone is named here.
//
// He was drawn with a cooking pot on his head first, as a boy playing
// knight. Simon: it looks like a pot; it has to be something else. Three
// things to wear were drawn to choose from (HATS): the goggles, a small
// silver coronet, a green cap with a feather.
export const HATS = ['goggles', 'coronet', 'cap'];
const LORD = {
  shirt: '#d8503a', shirtDark: '#a53328',
  jeans: '#2865bf', jeansDark: '#143fa0',
  cape: '#2865bf', capeHi: '#4a86de', clasp: '#ffee9e',
  hair: '#f2cf63', hairHi: '#fff1a8', hairShade: '#d9a62c', mouth: '#7a4a2a',
  boots: '#5a3d22', bootsHi: '#8d6336',
  strap: '#5a3d22', glass: '#8fd0ff', glassHi: '#d6f0ff',
  silver: '#c4c4cc', silverHi: '#ececf2', silverDark: '#8c8c96', gem: '#4a86de',
  capHi: '#4ada62', capGreen: '#1c8730', capDark: '#25581f', feather: '#fffdf6', featherTip: '#e04545',
  pony: '#f2dcb8', ponyShade: '#d9b98a', ponyPatch: '#8a4f22', ponyMane: '#5a3d22', rein: '#e04545',
  rocket: '#f6ecd6', rocketHi: '#ffffff', rocketRed: '#e04545', rocketRedHi: '#ff8a8a', fin: '#2865bf', nozzle: '#3a3a44',
};

// All poses from one parametrized drawing, as the prince's: springGap (1
// compressed .. 3 extended), legBend (0..2), which way his hair and his
// cape fly, what he wears on his head (hat, one of HATS) and where it sits
// (lift: -1 slipped down, 0, up to 2 lifted off; -2 is the goggles pulled
// right over his eyes), and the rocket's flame (flame: 1 or 2, two lengths).
function drawLord(t, o) {
  const { p, line, poly } = t;
  const gap = o.springGap ?? 2;
  const legBend = o.legBend ?? 0;
  const bottom = 41;

  // --- Pogo stick: rubber tip and spring ---------------------------------
  p(8, bottom - 1, 4, 2, C.rubber);
  p(9, bottom - 2, 2, 1, C.rubber);
  let y = bottom - 3;
  for (let i = 0; i < 4; i++) {
    p(7, y, 6, 1, i % 2 ? C.springHi : C.spring);
    p(7, y, 1, 1, C.pole);
    if (i < 3) p(9, y - gap, 2, gap, C.pole);
    y -= gap;
  }
  const springTop = y + gap;
  const pegY = springTop - 2;
  p(4, pegY, 12, 2, C.pole);
  p(4, pegY, 12, 1, C.poleHi);

  // --- Rider geometry (relative to the peg) ------------------------------
  const legH = 4 - legBend;
  const bootTop = pegY - 2;
  const legTop = bootTop - legH;
  const bodyTop = legTop - 8;
  const headTop = bodyTop - 9;
  const handleY = bodyTop + 3;

  // Pole from the handlebar down to the spring (behind everything else).
  p(9, handleY, 2, springTop - handleY, C.pole);
  p(9, handleY, 1, springTop - handleY, C.poleHi);

  // --- The cape (behind the body) ----------------------------------------
  const cape = o.cape || 'neutral';
  if (cape === 'neutral') {
    poly([[5, bodyTop], [2, bodyTop + 10], [6, bodyTop + 10], [7, bodyTop + 1]], LORD.cape);
    p(3, bodyTop + 3, 1, 6, LORD.capeHi);
  } else if (cape === 'down') {
    poly([[5, bodyTop], [1, bodyTop + 13], [5, bodyTop + 13], [7, bodyTop + 1]], LORD.cape);
    line(3, bodyTop + 3, 2, bodyTop + 10, LORD.capeHi);
  } else if (cape === 'up') {
    poly([[6, bodyTop + 1], [0, bodyTop - 4], [1, bodyTop + 1], [3, bodyTop + 5], [7, bodyTop + 4]], LORD.cape);
    line(2, bodyTop - 1, 3, bodyTop + 2, LORD.capeHi);
  } else if (cape === 'side') {
    poly([[5, bodyTop], [0, bodyTop + 4], [1, bodyTop + 8], [6, bodyTop + 8], [7, bodyTop + 1]], LORD.cape);
    line(1, bodyTop + 5, 4, bodyTop + 3, LORD.capeHi);
  }

  // --- The rocket on his back: a firework, tied on with string -------------
  const rx = 2, ry = bodyTop - 3;
  if (o.flame) {
    const y0 = ry + 10, long = o.flame === 2;
    p(rx, y0, 3, long ? 6 : 4, C.flame3); p(rx, y0, 3, long ? 4 : 2, C.flame2); p(rx + 1, y0, 1, long ? 5 : 3, C.flame1);
    p(rx + 1, y0 + (long ? 6 : 4), 1, 2, long ? C.flame4 : C.flame3);
    p(long ? rx + 3 : rx - 1, y0 + 1, 1, 2, C.flame3);
  }
  p(rx + 1, ry, 1, 1, LORD.rocketRed);
  p(rx, ry + 1, 3, 2, LORD.rocketRed); p(rx, ry + 1, 1, 2, LORD.rocketRedHi);
  p(rx, ry + 3, 3, 6, LORD.rocket); p(rx, ry + 3, 1, 6, LORD.rocketHi);
  p(rx, ry + 5, 3, 1, LORD.rocketRed); p(rx, ry + 7, 3, 1, LORD.rocketRed);
  p(rx - 1, ry + 8, 1, 2, LORD.fin); p(rx + 3, ry + 8, 1, 2, LORD.fin);
  p(rx, ry + 9, 3, 1, LORD.nozzle);

  // --- Legs and boots ------------------------------------------------------
  const spread = o.legSpread ?? 0;
  p(6 - spread, legTop, 3, legH, LORD.jeans);
  p(11 + spread, legTop, 3, legH, LORD.jeans);
  p(6 - spread, legTop, 1, legH, LORD.jeansDark);
  p(13 + spread, legTop, 1, legH, LORD.jeansDark);
  p(5 - spread, bootTop, 4, 2, LORD.boots);
  p(11 + spread, bootTop, 4, 2, LORD.boots);
  p(5 - spread, bootTop, 4, 1, LORD.bootsHi);
  p(11 + spread, bootTop, 4, 1, LORD.bootsHi);

  // --- Body: a red shirt with one big gold button, a rope for a belt -------
  p(5, bodyTop, 10, 8, LORD.shirt);
  p(5, bodyTop, 2, 8, LORD.shirtDark);
  p(9, bodyTop + 2, 2, 2, C.gold);
  p(10, bodyTop + 3, 1, 1, C.goldDark);
  p(5, bodyTop + 6, 10, 1, C.rope);
  p(5, bodyTop + 6, 2, 1, C.ropeDark);
  p(8, bodyTop, 4, 1, C.skin);                     // collar skin
  p(5, bodyTop, 2, 1, LORD.clasp);                 // the cape's clasp on his shoulder

  // --- The pony's head on the pogo stick ---------------------------------
  const hx = 14, hy = handleY - 5;
  p(hx, hy + 1, 4, 4, LORD.pony);                  // head
  p(hx + 3, hy + 2, 3, 3, LORD.pony);              // muzzle
  p(hx + 3, hy + 4, 3, 1, LORD.ponyShade);
  p(hx + 1, hy + 3, 2, 2, LORD.ponyPatch);         // a brown patch on its cheek
  p(hx + 1, hy, 1, 1, LORD.ponyPatch);             // ear
  p(hx, hy + 1, 1, 4, LORD.ponyMane);              // mane
  p(hx + 2, hy + 2, 1, 1, C.black);                // eye
  p(hx + 5, hy + 3, 1, 1, C.cheek);                // nostril
  p(hx + 1, hy + 5, 4, 1, LORD.rein);              // rein

  // --- Arms to the handlebar ---------------------------------------------
  p(3, handleY, 14, 1, C.pole);
  p(3, handleY, 2, 1, C.grip); p(15, handleY, 2, 1, C.grip);
  p(4, bodyTop + 1, 2, 2, LORD.shirt);             // sleeves
  p(14, bodyTop + 1, 2, 2, LORD.shirt);
  p(3, bodyTop + 2, 2, 2, C.skin);                 // hands
  p(15, bodyTop + 2, 2, 2, C.skin);

  // --- Head ----------------------------------------------------------------
  const hat = o.hat || 'goggles', lift = o.lift ?? 0, hair = o.hair || 'neutral';
  const over = hat === 'goggles' && lift <= -2;       // the goggles are over his eyes
  p(5, headTop, 10, 9, C.skin);
  p(5, headTop + 8, 10, 1, C.skinShade);
  // a mop of blond hair
  p(5, headTop, 10, 3, LORD.hair); p(6, headTop, 6, 1, LORD.hairHi); p(13, headTop + 1, 2, 2, LORD.hairShade);
  p(5, headTop + 3, 1, 2, LORD.hair); p(14, headTop + 3, 1, 2, LORD.hairShade);
  p(7, headTop + 3, 2, 1, LORD.hair);              // a tuft on his forehead
  if (hair === 'up') {
    p(6, headTop - 2, 1, 2, LORD.hair); p(9, headTop - 3, 2, 3, LORD.hair); p(9, headTop - 3, 1, 1, LORD.hairHi); p(13, headTop - 2, 1, 2, LORD.hairShade);
    p(4, headTop - 1, 1, 2, LORD.hair); p(15, headTop - 1, 1, 2, LORD.hairShade);
  } else if (hair === 'down') {
    p(4, headTop + 2, 1, 5, LORD.hair); p(15, headTop + 2, 1, 5, LORD.hairShade); p(6, headTop - 1, 7, 1, LORD.hair);
  } else {
    p(4, headTop + 1, 1, 3, LORD.hair); p(15, headTop + 1, 1, 3, LORD.hairShade);
    p(6, headTop - 1, 7, 1, LORD.hair); p(7, headTop - 1, 3, 1, LORD.hairHi); p(10, headTop - 2, 2, 1, LORD.hair);      // and a tuft that will not lie down
  }
  // face
  const eyes = over ? 'none' : o.eyes || 'open';
  if (eyes === 'open') {
    p(7, headTop + 4, 2, 2, C.eyeWhite); p(11, headTop + 4, 2, 2, C.eyeWhite);
    p(8, headTop + 5, 1, 1, C.black); p(12, headTop + 5, 1, 1, C.black);
  } else if (eyes === 'squint') {
    p(7, headTop + 5, 2, 1, C.black); p(11, headTop + 5, 2, 1, C.black);
  } else if (eyes === 'wide') {
    p(7, headTop + 3, 2, 3, C.eyeWhite); p(11, headTop + 3, 2, 3, C.eyeWhite);
    p(8, headTop + 4, 1, 1, C.black); p(12, headTop + 4, 1, 1, C.black);
  } else if (eyes === 'x') {
    for (const x of [7, 11]) { p(x, headTop + 4, 1, 1, C.black); p(x + 1, headTop + 5, 1, 1, C.black); p(x, headTop + 5, 1, 1, C.black); p(x + 1, headTop + 4, 1, 1, C.black); }
  }
  const mouth = o.mouth || 'smile';
  if (mouth === 'smile') { p(8, headTop + 7, 4, 1, LORD.mouth); p(10, headTop + 7, 1, 1, C.eyeWhite); }   // a grin with a gap in it
  else if (mouth === 'o') { p(9, headTop + 6, 2, 2, LORD.mouth); }
  else if (mouth === 'grit') { p(8, headTop + 7, 4, 1, LORD.mouth); }
  p(6, headTop + 6, 1, 1, C.cheek); p(13, headTop + 6, 1, 1, C.cheek);

  // --- What he wears on his head ---------------------------------------------
  if (hat === 'goggles') {
    // a strap round his head and two round glasses: on his forehead, slipped half over his eyes, pulled right over them, or lifted into his hair
    const gy = over ? headTop + 4 : lift === -1 ? headTop + 3 : headTop + 1 - Math.min(2, lift);
    p(4, gy, 12, 1, LORD.strap); p(4, gy + 1, 1, 1, LORD.strap); p(15, gy + 1, 1, 1, LORD.strap);
    for (const x of [6, 11]) { p(x, gy, 3, 2, LORD.glass); p(x, gy, 3, 1, LORD.glassHi); p(x, gy, 1, 1, C.white); }
    p(9, gy + 1, 2, 1, LORD.strap);
  } else if (hat === 'coronet') {
    // a small silver coronet, three points and a blue stone
    const cy = headTop - 2 - Math.max(-1, lift);
    p(6, cy + 1, 8, 1, LORD.silver); p(6, cy + 1, 3, 1, LORD.silverHi); p(13, cy + 1, 1, 1, LORD.silverDark);
    p(6, cy, 1, 1, LORD.silverHi); p(9, cy - 1, 2, 2, LORD.silver); p(9, cy - 1, 1, 1, LORD.silverHi); p(13, cy, 1, 1, LORD.silver);
    p(9, cy + 1, 2, 1, LORD.gem);
  } else {
    // a green cap, its peak to the front, a feather in it
    const cy = headTop - Math.max(-1, lift);
    p(5, cy - 3, 8, 3, LORD.capGreen); p(5, cy - 3, 6, 1, LORD.capHi); p(12, cy - 2, 1, 2, LORD.capDark);
    p(4, cy, 11, 1, LORD.capDark); p(4, cy - 1, 12, 1, LORD.capGreen); p(15, cy, 2, 1, LORD.capGreen);
    const up = hair === 'up';
    for (let i = 0; i < 4; i++) p(6 - i - (up ? 0 : 1), cy - 4 - (up ? i : Math.floor(i / 2)), 2, 1, i === 3 ? LORD.featherTip : LORD.feather);
  }
}

// His poses, facing right only: the round draws him facing left with `flip`
// on the draw call (`flip` here says so to player.js), which halves what he
// costs. The same set as the prince's (art/prince.js), and two frames of
// the rocket burning; every pose once more as a flat white shape for the
// rims the power-ups draw. `life` is his head, for the lives in the HUD.
// `hat`: what he wears (HATS; ?hat= tries the others).
export function buildLord(hat = HATS[0]) {
  const W = 20, H = 42;
  if (!HATS.includes(hat)) hat = HATS[0];
  const mk = (o) => makeSprite(W, H, (t) => drawLord(t, { hat, ...o }));
  const burn = (flame) => mk({ springGap: 3, lift: hat === 'goggles' ? -2 : hat === 'cap' ? 0 : 1, hair: 'down', cape: 'side', eyes: 'squint', mouth: 'grit', flame });
  const right = {
    standing: mk({ springGap: 2, eyes: 'open', mouth: 'smile' }),
    bounceDown: mk({ springGap: 1, legBend: 2, lift: -1, cape: 'up', eyes: 'squint', mouth: 'grit', legSpread: 1 }),
    bounceUp: mk({ springGap: 3, hair: 'down', cape: 'down', eyes: 'open', mouth: 'o' }),
    jumpUp: mk({ springGap: 2, hair: 'down', cape: 'down', eyes: 'open', mouth: 'smile' }),
    falling: mk({ springGap: 2, legBend: 1, lift: 2, hair: 'up', cape: 'up', eyes: 'wide', mouth: 'o', legSpread: 1 }),
    boosting: burn(1), boosting2: burn(2),
    hurt: tint(mk({ springGap: 2, legBend: 1, lift: 2, hair: 'up', cape: 'side', eyes: 'x', mouth: 'o', legSpread: 1 }), '#ff2a2a', 0.45),
  };
  const rightSil = {};
  for (const k of Object.keys(right)) rightSil[k] = tint(right[k], '#ffffff', 1);
  // his head: the top 17 rows of his standing sprite (on the art grid)
  const rows = 17, life = makeCanvas(W * 4, rows * 4);
  life.getContext('2d').drawImage(right.standing.canvas, 0, 0, W * 4, rows * 4, 0, 0, W * 4, rows * 4);
  return { right, rightSil, flip: true, life: { canvas: life, w: W * 4, h: rows * 4, ax: W * 2, ay: rows * 4 }, lifeScale: 0.64 };
}
