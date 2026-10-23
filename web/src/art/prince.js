import { makeSprite, flipH, tint } from './sprite.js';
import { PAL as C } from '../palette.js';

// The prince on his pogo stick. 26 x 58 art pixels = 104 x 232 logical,
// the texture size of the original RPPlayerEntity. Anchor: bottom-center
// (the rubber tip of the pogo stick).
//
// All poses come from one parametrized drawing so proportions stay
// consistent: springGap (1 compressed .. 3 extended), legBend (0..3),
// hair / cape direction, eyes and an optional boost flame.

function drawPrince(t, o) {
  const { p, line, poly } = t;
  const gap = o.springGap ?? 2;
  const legBend = o.legBend ?? 0;
  const lean = o.lean ?? 0;          // columns to shift the rider sideways
  const bottom = 57;

  // --- Pogo stick: rubber tip and spring ---------------------------------
  p(11, bottom - 2, 4, 3, C.rubber);
  p(12, bottom - 3, 2, 1, C.rubber);
  if (o.flame) {
    // Boost flame below / around the tip.
    p(9, bottom - 1, 8, 2, C.flame3);
    p(10, bottom - 3, 6, 3, C.flame2);
    p(11, bottom - 5, 4, 3, C.flame1);
    p(8, bottom - 4, 2, 2, C.flame2);
    p(16, bottom - 4, 2, 2, C.flame2);
    p(7, bottom, 1, 1, C.flame3); p(18, bottom, 1, 1, C.flame3);
  }
  let y = bottom - 4;
  for (let i = 0; i < 5; i++) {
    p(10, y, 6, 1, i % 2 ? C.springHi : C.spring);
    p(10, y, 1, 1, C.pole);
    if (i < 4) p(12, y - gap, 2, gap, C.pole); // pole segment between coils
    y -= gap;
  }
  const springTop = y + gap;          // y of the top coil
  const pegY = springTop - 2;         // foot peg sits on the spring
  p(5 + lean, pegY, 16, 2, C.pole);
  p(5 + lean, pegY, 16, 1, C.poleHi);

  // --- Rider geometry (relative to the peg) ------------------------------
  const legH = 7 - legBend;
  const bootTop = pegY - 3;
  const legTop = bootTop - legH;
  const bodyTop = legTop - 11;
  const headTop = bodyTop - 11;
  const handleY = bodyTop + 3;
  const x = lean;

  // Pole from handlebar down to the spring (behind everything else).
  p(12, handleY, 2, springTop - handleY, C.pole);
  p(12, handleY, 1, springTop - handleY, C.poleHi);

  // --- Cape (behind the body) --------------------------------------------
  const capeDir = o.cape || 'neutral';
  if (capeDir === 'neutral') {
    poly([[7 + x, bodyTop], [3 + x, bodyTop + 13], [8 + x, bodyTop + 12], [9 + x, bodyTop + 1]], C.cape);
    p(4 + x, bodyTop + 2, 1, 9, C.capeHi);
  } else if (capeDir === 'down') {
    poly([[7 + x, bodyTop], [1 + x, bodyTop + 18], [6 + x, bodyTop + 17], [9 + x, bodyTop + 1]], C.cape);
    line(3 + x, bodyTop + 3, 2 + x, bodyTop + 14, C.capeHi);
  } else if (capeDir === 'up') {
    poly([[8 + x, bodyTop + 1], [0 + x, bodyTop - 6], [1 + x, bodyTop - 1], [3 + x, bodyTop + 6], [9 + x, bodyTop + 4]], C.cape);
    line(2 + x, bodyTop - 3, 4 + x, bodyTop + 3, C.capeHi);
  } else if (capeDir === 'side') {
    poly([[7 + x, bodyTop], [-1 + x, bodyTop + 6], [1 + x, bodyTop + 10], [8 + x, bodyTop + 10], [9 + x, bodyTop + 1]], C.cape);
    line(1 + x, bodyTop + 7, 5 + x, bodyTop + 4, C.capeHi);
  }

  // --- Legs and boots ------------------------------------------------------
  const spread = o.legSpread ?? 0;
  p(8 + x - spread, legTop, 3, legH, C.tights);
  p(15 + x + spread, legTop, 3, legH, C.tights);
  p(8 + x - spread, legTop, 1, legH, C.tightsDark);
  p(17 + x + spread, legTop, 1, legH, C.tightsDark);
  p(7 + x - spread, bootTop, 4, 3, C.boots);
  p(15 + x + spread, bootTop, 4, 3, C.boots);
  p(7 + x - spread, bootTop, 4, 1, C.hairHi);
  p(15 + x + spread, bootTop, 4, 1, C.hairHi);

  // --- Body / tunic ----------------------------------------------------------
  p(7 + x, bodyTop, 12, 11, C.tunic);
  p(7 + x, bodyTop, 2, 11, C.tunicDark);
  p(13 + x, bodyTop + 1, 1, 8, C.tunicDark);        // coat seam
  p(11 + x, bodyTop + 2, 1, 1, C.gold); p(11 + x, bodyTop + 4, 1, 1, C.gold); p(11 + x, bodyTop + 6, 1, 1, C.gold);
  p(14 + x, bodyTop + 2, 1, 1, C.gold); p(14 + x, bodyTop + 4, 1, 1, C.gold); p(14 + x, bodyTop + 6, 1, 1, C.gold);
  p(7 + x, bodyTop + 8, 12, 2, C.gold);          // belt
  p(12 + x, bodyTop + 8, 2, 2, C.goldDark);        // buckle
  p(7 + x, bodyTop, 3, 1, C.gold); p(16 + x, bodyTop, 3, 1, C.gold);   // epaulettes
  p(10 + x, bodyTop, 6, 1, C.skin);                // collar skin

  // --- Hobby-horse head (the original app icon's pogo stick) ----------------
  const hx = 18 + x, hy = handleY - 6;
  p(hx, hy + 1, 5, 4, C.horse);                    // head
  p(hx + 4, hy + 2, 3, 3, C.horse);                // muzzle
  p(hx + 4, hy + 4, 3, 1, C.horseShade);
  p(hx + 1, hy, 1, 1, C.horse);                    // ear
  p(hx, hy + 1, 1, 4, C.mane);                     // mane
  p(hx + 2, hy + 2, 1, 1, C.black);                // eye
  p(hx + 6, hy + 3, 1, 1, C.cheek);                // nostril
  p(hx + 1, hy + 5, 5, 1, C.rein);                 // rein

  // --- Arms to the handlebar ---------------------------------------------
  p(4 + x, handleY, 18, 1, C.pole);                // handlebar
  p(4 + x, handleY, 2, 1, C.grip); p(20 + x, handleY, 2, 1, C.grip);
  p(5 + x, bodyTop + 1, 3, 2, C.tunic);            // sleeves
  p(18 + x, bodyTop + 1, 3, 2, C.tunic);
  p(4 + x, bodyTop + 2, 2, 2, C.skin);             // hands
  p(20 + x, bodyTop + 2, 2, 2, C.skin);

  // --- Head ----------------------------------------------------------------
  p(8 + x, headTop, 10, 11, C.skin);
  p(8 + x, headTop + 9, 10, 2, C.skinShade);
  // hair
  const hairDir = o.hair || 'neutral';
  p(8 + x, headTop, 10, 4, C.hair);
  p(9 + x, headTop + 1, 8, 1, C.hairHi);
  p(8 + x, headTop + 4, 1, 3, C.hair); p(17 + x, headTop + 4, 1, 3, C.hair);
  if (hairDir === 'up') {
    p(9 + x, headTop - 2, 1, 2, C.hair); p(12 + x, headTop - 3, 2, 3, C.hair); p(16 + x, headTop - 2, 1, 2, C.hair);
    p(7 + x, headTop - 1, 1, 2, C.hair); p(18 + x, headTop - 1, 1, 2, C.hair);
  } else if (hairDir === 'down') {
    p(7 + x, headTop + 2, 1, 6, C.hair); p(18 + x, headTop + 2, 1, 6, C.hair);
    p(6 + x, headTop + 5, 1, 3, C.hair); p(19 + x, headTop + 5, 1, 3, C.hair);
  } else {
    p(7 + x, headTop + 1, 1, 3, C.hair); p(18 + x, headTop + 1, 1, 3, C.hair);
  }
  // crown
  p(9 + x, headTop - 1, 8, 1, C.gold);
  p(9 + x, headTop - 2, 2, 1, C.gold); p(12 + x, headTop - 2, 2, 1, C.gold); p(15 + x, headTop - 2, 2, 1, C.gold);
  p(9 + x, headTop - 3, 1, 1, C.gold); p(12 + x, headTop - 3, 1, 1, C.gold); p(16 + x, headTop - 3, 1, 1, C.gold);
  p(12 + x, headTop - 1, 2, 1, C.gem);
  p(9 + x, headTop - 1, 1, 1, C.goldDark); p(16 + x, headTop - 1, 1, 1, C.goldDark);
  // face
  const eyes = o.eyes || 'open';
  if (eyes === 'open') {
    p(10 + x, headTop + 5, 2, 2, C.eyeWhite); p(14 + x, headTop + 5, 2, 2, C.eyeWhite);
    p(11 + x, headTop + 6, 1, 1, C.black); p(15 + x, headTop + 6, 1, 1, C.black);
  } else if (eyes === 'squint') {
    p(10 + x, headTop + 6, 2, 1, C.black); p(14 + x, headTop + 6, 2, 1, C.black);
  } else if (eyes === 'x') {
    p(10 + x, headTop + 5, 1, 1, C.black); p(11 + x, headTop + 6, 1, 1, C.black); p(10 + x, headTop + 6, 1, 1, C.black); p(11 + x, headTop + 5, 1, 1, C.black);
    p(14 + x, headTop + 5, 1, 1, C.black); p(15 + x, headTop + 6, 1, 1, C.black); p(14 + x, headTop + 6, 1, 1, C.black); p(15 + x, headTop + 5, 1, 1, C.black);
  } else if (eyes === 'wide') {
    p(10 + x, headTop + 4, 2, 3, C.eyeWhite); p(14 + x, headTop + 4, 2, 3, C.eyeWhite);
    p(11 + x, headTop + 5, 1, 1, C.black); p(15 + x, headTop + 5, 1, 1, C.black);
  }
  const mouth = o.mouth || 'smile';
  if (mouth === 'smile') { p(12 + x, headTop + 9, 2, 1, C.hair); p(11 + x, headTop + 8, 1, 1, C.hair); p(14 + x, headTop + 8, 1, 1, C.hair); }
  else if (mouth === 'o') { p(12 + x, headTop + 8, 2, 2, C.hair); }
  else if (mouth === 'grit') { p(11 + x, headTop + 9, 4, 1, C.hair); }
  p(9 + x, headTop + 7, 1, 1, C.cheek); p(16 + x, headTop + 7, 1, 1, C.cheek); // cheeks
}

export function buildPrince() {
  const W = 26, H = 58;
  const mk = (o) => makeSprite(W, H, (t) => drawPrince(t, o));
  const standing = mk({ springGap: 2, legBend: 0, hair: 'neutral', cape: 'neutral', eyes: 'open', mouth: 'smile' });
  const bounceDown = mk({ springGap: 1, legBend: 3, hair: 'neutral', cape: 'up', eyes: 'squint', mouth: 'grit', legSpread: 1 });
  const bounceUp = mk({ springGap: 3, legBend: 0, hair: 'down', cape: 'down', eyes: 'open', mouth: 'o' });
  const jumpUp = mk({ springGap: 2, legBend: 0, hair: 'down', cape: 'down', eyes: 'open', mouth: 'smile' });
  const falling = mk({ springGap: 2, legBend: 1, hair: 'up', cape: 'up', eyes: 'wide', mouth: 'o', legSpread: 1 });
  const boosting = mk({ springGap: 3, legBend: 0, hair: 'down', cape: 'side', eyes: 'squint', mouth: 'grit', flame: true });
  const hurt = tint(mk({ springGap: 2, legBend: 1, hair: 'up', cape: 'side', eyes: 'x', mouth: 'o', legSpread: 1 }), '#ff2a2a', 0.45);
  const sprites = { standing, bounceDown, bounceUp, jumpUp, falling, boosting, hurt };
  const flipped = {};
  for (const k of Object.keys(sprites)) flipped[k] = flipH(sprites[k]);
  return { right: sprites, left: flipped };
}
