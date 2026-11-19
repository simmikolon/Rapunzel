import { makeSprite, flipH } from './sprite.js';
import { PAL as C } from '../palette.js';

// String lights for the deep forest (src/lights.js strings them between the
// trunks): fat round bulbs in a dark socket, 7 x 9 art px, hanging from the
// wire at the socket's top (the anchor, so a bulb swings about it); the
// moths that circle them; and a dormouse that sits on the wire and warms
// its paws at a bulb.
//
// A bulb is a lamp, so its ramp runs from the glass's bright window to a
// deeper rim on the side away from the upper left; `glow` is the colour of
// the light it throws (the halo and the light on the wall).
export const BULBS = [
  { name: 'cream',  hi: '#ffffff', base: '#fff1c4', shade: '#f0c878', glow: '#ffcf70' },
  { name: 'pink',   hi: '#ffe3ee', base: '#ff9ab8', shade: '#e85d8a', glow: '#ff8fb5' },
  { name: 'mint',   hi: '#e9fff4', base: '#8fe8c0', shade: '#4fbf93', glow: '#7fe0b8' },
  { name: 'sky',    hi: '#eaf6ff', base: '#8fd0ff', shade: '#4f9ee0', glow: '#7fc4ff' },
  { name: 'orange', hi: '#fff0d8', base: '#ffb347', shade: '#ee7f2a', glow: '#ffa040' },
];
const SOCKET = '#26352f', SOCKET_HI = '#4a6257';

function drawBulb(t, c) {
  const { p, disc } = t;
  p(2, 0, 3, 2, SOCKET); p(2, 0, 1, 2, SOCKET_HI);
  disc(3, 5, 3, c.base);
  p(1, 3, 2, 2, c.hi); p(2, 2, 2, 1, c.hi);                    // the glass's window, upper left
  p(5, 5, 1, 2, c.shade); p(4, 7, 1, 1, c.shade); p(3, 8, 2, 1, c.shade); p(5, 4, 1, 1, c.shade);   // the far rim
}

// Moth, 5 x 4 art px: wings spread (frame 0) or folded up (frame 1).
function drawMoth(t, frame) {
  const { p } = t;
  const wing = C.storkHi, under = C.storkShade, body = C.barkDark;
  if (frame === 0) { p(0, 0, 2, 2, wing); p(3, 0, 2, 2, wing); p(1, 2, 1, 1, under); p(3, 2, 1, 1, under); }
  else { p(1, 0, 1, 3, wing); p(3, 0, 1, 3, wing); p(1, 2, 1, 1, under); p(3, 2, 1, 1, under); }
  p(2, 1, 1, 3, body);
}

// Dormouse, 15 x 20 art px, facing right, sitting on the wire (which runs
// along the top of row 16: the anchor) with its bushy tail hanging down
// behind, the tip curling forward. Chibi like the rest: the head is half of
// it. Its light is the bulb in front of it: face, belly and paws are the
// lit plane, the back and the tail the shaded one. Frames: 0 paws held out
// to the bulb, eyes shut; 1 the paws a pixel higher (it rubs them);
// 2 looking up, eyes wide (somebody is coming).
const FUR = { hi: '#d6d1e2', base: '#a8a2b8', shade: '#7b7590', dark: '#575168', belly: '#f6efe2' };
function drawDormouse(t, frame) {
  const { p, disc, ellipse } = t;
  const alert = frame === 2, up = frame === 1 ? 1 : 0;
  // the tail: over the wire and down, three pixels thick
  p(0, 13, 3, 6, FUR.shade); p(1, 13, 1, 5, FUR.base); p(1, 19, 3, 1, FUR.shade); p(3, 18, 2, 1, FUR.shade); p(4, 17, 1, 1, FUR.base);
  // body and belly
  ellipse(6, 12, 4, 3, FUR.base); p(2, 11, 2, 3, FUR.shade); p(3, 14, 3, 1, FUR.shade);
  ellipse(8, 13, 2, 2, FUR.belly);
  // the head with two round ears
  const hy = alert ? 0 : 1;
  p(5, hy, 3, 2, FUR.shade); p(6, hy + 1, 1, 1, C.cheek);
  p(11, hy, 3, 2, FUR.base); p(12, hy + 1, 1, 1, C.cheek);
  disc(9, hy + 5, 4, FUR.base);
  p(10, hy + 2, 3, 1, FUR.hi); p(12, hy + 3, 2, 2, FUR.hi); p(5, hy + 4, 1, 4, FUR.shade); p(6, hy + 8, 3, 1, FUR.shade);
  p(13, hy + 6, 2, 2, FUR.hi); p(14, hy + 6, 1, 1, C.cheek);      // snout and nose
  p(10, hy + 7, 1, 1, C.cheek);                                   // cheek
  if (alert) { p(10, hy + 4, 2, 2, C.eyeWhite); p(11, hy + 4, 1, 2, C.black); }
  else p(10, hy + 5, 2, 1, C.black);                              // shut, content
  // arms out to the warmth, paws pink
  if (alert) { p(10, 12, 2, 1, FUR.base); p(12, 12, 1, 1, C.cheek); }
  else { p(10, 11 - up, 3, 1, FUR.base); p(13, 11 - up, 1, 1, C.cheek); p(10, 12, 2, 1, FUR.shade); p(12, 12 - up, 1, 1, C.cheek); }
  // feet on the wire
  p(5, 15, 2, 1, FUR.dark); p(8, 15, 2, 1, FUR.dark);
}

export function buildLights() {
  const mouseR = [0, 1, 2].map((f) => makeSprite(15, 20, (t) => drawDormouse(t, f), undefined, { axPx: 7 * 4, ayPx: 16 * 4 }));
  return {
    bulbs: BULBS.map((c) => makeSprite(7, 9, (t) => drawBulb(t, c), { ax: 0.5, ay: 0 })),
    moth: [0, 1].map((f) => makeSprite(5, 4, (t) => drawMoth(t, f), { ax: 0.5, ay: 0.5 })),
    mouseR, mouseL: mouseR.map(flipH),
  };
}
