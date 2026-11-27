import { makeSprite, makeCanvas, tint } from './sprite.js';
import { PAL as C } from '../palette.js';

// Lord Springalot, the second one who climbs the tower, on a pogo pony of his own.
// 20 x 42 art pixels (the prince is 26 x 58): a child, three quarters of
// his father's height with a head nearly as big. Anchor: bottom-center
// (the rubber tip of the pogo stick).
//
// His idea: he has everything the prince has, home-made. A cooking pot for
// the crown (it never sits right: it slips over his eyes when he lands and
// lifts off his head when he falls), a yellow towel for the cape, a piebald
// pony's head on the pogo stick, and on his back his master ability: a
// firework rocket (player.js, the rocket). The steel, the skin and the
// flame are the prince's ramps; what is his alone is named here.
const LORD = {
  shirt: '#d8503a', shirtDark: '#a53328',
  jeans: '#2865bf', jeansDark: '#143fa0',
  towel: '#f2c94c', towelHi: '#ffe58a',
  hair: '#7a4a2a', hairHi: '#a56a3e',
  boots: '#5a3d22', bootsHi: '#8d6336',
  pot: '#b8b8c2', potHi: '#ececf2', potDark: '#8c8c96', potRim: '#6a6a76',
  pony: '#f2dcb8', ponyShade: '#d9b98a', ponyPatch: '#8a4f22', ponyMane: '#5a3d22', rein: '#e04545',
  rocket: '#f6ecd6', rocketHi: '#ffffff', rocketRed: '#e04545', rocketRedHi: '#ff8a8a', fin: '#2865bf', nozzle: '#3a3a44',
};

// All poses from one parametrized drawing, as the prince's: springGap (1
// compressed .. 3 extended), legBend (0..2), where the pot sits (pot: -1
// slipped down, 0, up to 2 lifted off), its handle and the towel's direction,
// and the rocket's flame (flame: 1 or 2, two lengths of it).
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

  // --- The towel (behind the body) ---------------------------------------
  const towel = o.towel || 'neutral';
  if (towel === 'neutral') {
    poly([[5, bodyTop], [2, bodyTop + 10], [6, bodyTop + 10], [7, bodyTop + 1]], LORD.towel);
    p(3, bodyTop + 3, 1, 6, LORD.towelHi);
  } else if (towel === 'down') {
    poly([[5, bodyTop], [1, bodyTop + 13], [5, bodyTop + 13], [7, bodyTop + 1]], LORD.towel);
    line(3, bodyTop + 3, 2, bodyTop + 10, LORD.towelHi);
  } else if (towel === 'up') {
    poly([[6, bodyTop + 1], [0, bodyTop - 4], [1, bodyTop + 1], [3, bodyTop + 5], [7, bodyTop + 4]], LORD.towel);
    line(2, bodyTop - 1, 3, bodyTop + 2, LORD.towelHi);
  } else if (towel === 'side') {
    poly([[5, bodyTop], [0, bodyTop + 4], [1, bodyTop + 8], [6, bodyTop + 8], [7, bodyTop + 1]], LORD.towel);
    line(1, bodyTop + 5, 4, bodyTop + 3, LORD.towelHi);
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
  p(5, bodyTop, 2, 1, LORD.towel);                 // the towel's knot on his shoulder

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
  p(5, headTop, 10, 9, C.skin);
  p(5, headTop + 8, 10, 1, C.skinShade);
  p(5, headTop, 10, 3, LORD.hair);                 // hair, most of it under the pot
  p(6, headTop + 1, 6, 1, LORD.hairHi);
  p(5, headTop + 3, 1, 2, LORD.hair); p(14, headTop + 3, 1, 2, LORD.hair);
  p(7, headTop + 3, 2, 1, LORD.hair);              // a tuft on his forehead
  // face
  const eyes = o.eyes || 'open';
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
  if (mouth === 'smile') { p(8, headTop + 7, 4, 1, LORD.hair); p(10, headTop + 7, 1, 1, C.eyeWhite); }   // a grin with a gap in it
  else if (mouth === 'o') { p(9, headTop + 6, 2, 2, LORD.hair); }
  else if (mouth === 'grit') { p(8, headTop + 7, 4, 1, LORD.hair); }
  p(6, headTop + 6, 1, 1, C.cheek); p(13, headTop + 6, 1, 1, C.cheek);

  // --- The pot on his head -------------------------------------------------
  const py = headTop - 2 - (o.pot ?? 0);
  p(4, py, 12, 4, LORD.pot);
  p(4, py, 12, 1, LORD.potHi);                     // lit on top
  p(5, py + 1, 3, 1, LORD.potHi);
  p(14, py + 1, 2, 3, LORD.potDark);               // its far side in shade
  p(3, py + 4, 14, 1, LORD.potRim);                // the rim
  p(3, py + 4, 5, 1, LORD.potDark);
  // the handle, out behind him
  const handle = o.handle || 'neutral';
  if (handle === 'up') { p(2, py + 1, 2, 1, LORD.potRim); p(0, py, 2, 1, LORD.potRim); }
  else if (handle === 'down') { p(2, py + 2, 2, 1, LORD.potRim); p(0, py + 3, 2, 1, LORD.potRim); }
  else p(0, py + 2, 4, 1, LORD.potRim);
}

// His poses, facing right only: the round draws him facing left with `flip`
// on the draw call (`flip` here says so to player.js), which halves what he
// costs. The same set as the prince's (art/prince.js), and two frames of
// the rocket burning; every pose once more as a flat white shape for the
// rims the power-ups draw. `life` is his head, for the lives in the HUD.
export function buildLord() {
  const W = 20, H = 42;
  const mk = (o) => makeSprite(W, H, (t) => drawLord(t, o));
  const burn = (flame) => mk({ springGap: 3, pot: 1, handle: 'down', towel: 'side', eyes: 'squint', mouth: 'grit', flame });
  const right = {
    standing: mk({ springGap: 2, eyes: 'open', mouth: 'smile' }),
    bounceDown: mk({ springGap: 1, legBend: 2, pot: -1, handle: 'up', towel: 'up', eyes: 'squint', mouth: 'grit', legSpread: 1 }),
    bounceUp: mk({ springGap: 3, handle: 'down', towel: 'down', eyes: 'open', mouth: 'o' }),
    jumpUp: mk({ springGap: 2, handle: 'down', towel: 'down', eyes: 'open', mouth: 'smile' }),
    falling: mk({ springGap: 2, legBend: 1, pot: 2, handle: 'up', towel: 'up', eyes: 'wide', mouth: 'o', legSpread: 1 }),
    boosting: burn(1), boosting2: burn(2),
    hurt: tint(mk({ springGap: 2, legBend: 1, pot: 2, handle: 'up', towel: 'side', eyes: 'x', mouth: 'o', legSpread: 1 }), '#ff2a2a', 0.45),
  };
  const rightSil = {};
  for (const k of Object.keys(right)) rightSil[k] = tint(right[k], '#ffffff', 1);
  // his head with the pot on it: the top 17 rows of his standing sprite (on the art grid)
  const rows = 17, life = makeCanvas(W * 4, rows * 4);
  life.getContext('2d').drawImage(right.standing.canvas, 0, 0, W * 4, rows * 4, 0, 0, W * 4, rows * 4);
  return { right, rightSil, flip: true, life: { canvas: life, w: W * 4, h: rows * 4, ax: W * 2, ay: rows * 4 }, lifeScale: 0.64 };
}
