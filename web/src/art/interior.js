import { makeSprite, flipH, pixelLine } from './sprite.js';
import { PAL as C } from '../palette.js';
import { RNG } from '../util.js';
import { BRANCH_LEN } from '../platforms.js';

// The inside of the tower (places.js, interior.js): the back wall with its
// windows, the two pillars that stand where the trees stand outside, the
// entrance hall's floor and door, a torch, and what the prince stands on in
// here: stone ledges (a "tree style" of their own, so they take the
// branches' place in every length), chandeliers, a bell, galleries.
//
// The room is dim and cool so that its lamps count: the wall and the
// pillars keep to a violet-grey stone, what he can stand on is a pale warm
// stone or wood and stays bright, and the warm colours belong to flames.
// Light comes from the room's lamps and windows, so tops are lit as
// everywhere and a pillar is lit on the side that faces the room.

// The `style` a ledge carries (platforms.js): the world then draws it from
// `stone` here instead of from a tree style.
export const STONE_STYLE = 4;
// Colours the painter and the world draw with at runtime (chains, glows).
export const INSIDE = { chain: '#8f8ca1', chainDark: '#55526a', torchLight: '#ffac5c', candleLight: '#ffd596', floorDark: '#3a352f', rubble: ['#aea79b', '#807a70'] };

const K = {
  // back wall: far and in shade
  wallHi: '#5a5670', wall: '#4a465f', wallDark: '#3c384e', wallMortar: '#2c2939',
  // pillars: nearer, lit from the room
  pilHi: '#9089a3', pil: '#756f89', pilDark: '#57516b', pilDeep: '#3f3a50', pilMortar: '#2e2a3b',
  // window frames and door surrounds: dressed stone, a step lighter than the wall
  frameHi: '#b2abc2', frame: '#8a84a0', frameDark: '#625c78',
  // what he stands on: pale warm stone
  ledgeHi: '#efe8d8', ledge: '#c2b9a8', ledgeShade: '#8f877a', ledgeDark: '#5f584f',
  // a cracked ledge: greyer, tired
  oldHi: '#ddd6c9', old: '#aea79b', oldShade: '#807a70', oldDark: '#544f49',
  hole: '#17141f',            // an opening into the dark (a guard's hatch, a doorway)
  iron: '#34343f', ironHi: '#70707f',
  // the chain down the middle of the shaft and the chandeliers on it: worn
  // steel and pewter, so they show on the wall and stand off the golden
  // braid behind the windows
  chainHi: '#c9c6d6', chain: '#8f8ca1', chainDark: '#55526a',
  candle: '#fff1c4',
  // brass: the bell, the pull ring, door fittings
  bellHi: '#ffe9a0', bell: '#d9a84a', bellShade: '#a87a2c', bellDark: '#6e4c1c',
};

// --- the back wall -----------------------------------------------------------
// 150 x 48 art px, laid centred behind the pillars. Variants: 0 and 1 plain,
// 2 the lower half of a window (the sill and the opening above it), 3 its
// upper half (the opening and its arch), 4 and 5 the hall's door and its
// arch. The window is a real hole: what is outside is drawn first and shows
// through.
export const WALL_W = 150;
const WIN_X0 = 60, WIN_W = 30, WIN_CX = WIN_X0 + WIN_W / 2;
function drawWall(t, variant, rng) {
  const { p, line, ctx } = t;
  const H = 48, rowH = 6, brickW = 14;
  const PXS = t.ctx.canvas.width / WALL_W;
  const hole = (x, y, w, h) => ctx.clearRect(x * PXS, y * PXS, w * PXS, h * PXS);
  p(0, 0, WALL_W, H, K.wall);
  for (let y = 0; y < H; y += rowH) {
    const off = (y / rowH) % 2 ? 7 : 0;
    for (let x = -brickW + off; x < WALL_W; x += brickW) {
      const s = rng.next(), x0 = Math.max(0, x), w = Math.min(x + brickW - 1, WALL_W) - x0;
      if (w <= 0) continue;
      p(x0, y, w, rowH - 1, s < 0.14 ? K.wallHi : s < 0.74 ? K.wall : K.wallDark);
      if (s > 0.9) p(x0, y, w, 1, K.wallHi);            // a course catching the light
    }
    p(0, y + rowH - 1, WALL_W, 1, K.wallMortar);
  }
  for (let y = 0; y < H; y += rowH) {
    const off = (y / rowH) % 2 ? 7 : 0;
    for (let x = off; x < WALL_W; x += brickW) line(x, y, x, y + rowH - 2, K.wallMortar);
  }
  if (variant === 1) {
    // damp: dark streaks under a course, a crack
    for (let i = 0; i < 7; i++) { const x = rng.int(6, WALL_W - 8); p(x, rng.int(6, 30), 1, rng.int(4, 10), K.wallDark); }
    line(112, 4, 116, 16, K.wallMortar); line(116, 16, 113, 26, K.wallMortar); line(113, 26, 118, 34, K.wallMortar);
  } else if (variant === 2) {
    // the opening from the sill up, its jambs, the sill
    p(WIN_X0 - 3, 0, 3, 31, K.frame); p(WIN_X0 + WIN_W, 0, 3, 31, K.frame);
    p(WIN_X0 - 1, 0, 1, 31, K.frameHi); p(WIN_X0 + WIN_W + 2, 0, 1, 31, K.frameDark);
    p(WIN_X0 - 5, 30, WIN_W + 10, 1, K.frameHi); p(WIN_X0 - 5, 31, WIN_W + 10, 2, K.frame); p(WIN_X0 - 4, 33, WIN_W + 8, 1, K.frameDark);
    hole(WIN_X0, 0, WIN_W, 30);
  } else if (variant === 3) {
    // the opening up to its round arch
    const top = 6, spring = 19;           // the arch from row `top` to row `spring`, straight below
    for (let y = top - 3; y < spring; y++) { const d = (spring - y) / (spring - top + 3), hw = Math.round((WIN_W / 2 + 3) * Math.sqrt(Math.max(0, 1 - d * d))); p(WIN_CX - hw, y, hw * 2, 1, y < top ? K.frameHi : K.frame); }
    p(WIN_X0 - 3, spring, 3, H - spring, K.frame); p(WIN_X0 + WIN_W, spring, 3, H - spring, K.frame);
    p(WIN_X0 - 1, spring, 1, H - spring, K.frameHi); p(WIN_X0 + WIN_W + 2, spring, 1, H - spring, K.frameDark);
    p(WIN_CX - 2, top - 4, 4, 3, K.frameHi);                                   // keystone
    for (let y = top; y < spring; y++) { const d = (spring - y) / (spring - top), hw = Math.round((WIN_W / 2) * Math.sqrt(Math.max(0, 1 - d * d))); if (hw > 0) hole(WIN_CX - hw, y, hw * 2, 1); }
    hole(WIN_X0, spring, WIN_W, H - spring);
  } else if (variant === 4 || variant === 5) {
    // The hall's door, shut, two tiles tall so it is a door for the prince:
    // its leaves of planks with iron bands (4), the round arch over them (5).
    const cx = 75, hw = 23, fr = 3;
    const half = (y, r) => (variant === 4 ? r : (H - y) >= r ? 0 : Math.round(Math.sqrt(r * r - (H - y) * (H - y))));
    for (let y = 0; y < H; y++) {
      const f = half(y, hw + fr), d = half(y, hw);
      if (f > 0) { p(cx - f, y, f * 2, 1, K.frame); p(cx - f, y, 1, 1, K.frameHi); p(cx + f - 1, y, 1, 1, K.frameDark); }
      if (variant === 5 && f > 0 && half(y - 1, hw + fr) < f - 1) p(cx - f, y, f * 2, 1, K.frameHi);   // the arch's lit back
      if (d > 0) { p(cx - d, y, d * 2, 1, C.plank); p(cx - d, y, 1, 1, C.plankDark); p(cx + d - 1, y, 1, 1, C.plankDark); }
    }
    const top = variant === 4 ? 0 : H - hw + 3;
    for (let x = cx - hw + 5; x < cx + hw; x += 6) { const y0 = Math.max(top, variant === 4 ? 0 : H - Math.round(Math.sqrt(Math.max(0, hw * hw - (x - cx) * (x - cx)))) + 1); if (y0 < H) line(x, y0, x, H - 1, C.plankDark); }
    for (let y = top; y < H; y++) p(cx - 1, y, 2, 1, C.barkShadow);                    // where the leaves meet
    for (const y of variant === 4 ? [8, 32] : [40]) { p(cx - hw + 1, y, hw * 2 - 2, 3, K.iron); p(cx - hw + 1, y, hw * 2 - 2, 1, K.ironHi); }
    if (variant === 4) for (const x of [cx - 8, cx + 5]) { p(x, 18, 3, 1, K.iron); p(x, 19, 1, 3, K.bell); p(x + 2, 19, 1, 3, K.bell); p(x, 22, 3, 1, K.bellShade); p(x, 19, 1, 1, K.bellHi); }   // ring handles
    else p(cx - 3, H - hw - fr - 2, 6, 3, K.frameHi);                                  // keystone
  }
}

// --- the pillars -------------------------------------------------------------
// 25 x 48 art px, the LEFT pillar (screen edge at x = 0, the face toward the
// room at x = 24): big dressed blocks, lit along the room's side. Variants:
// 0 and 1 plain, 2 with a guard's hatch (an arched opening 13 wide around
// column 12 whose bottom edge is at row 34; pillars.js knows where that is
// in the world), 3 with the iron plate a torch hangs on.
function drawPillar(t, variant, rng) {
  const { p, line, disc } = t;
  const W = 25, H = 48, course = 12;
  p(0, 0, W, H, K.pil);
  for (let y = 0; y < H; y += course) {
    const off = (y / course) % 2 ? 9 : 0;
    for (let x = -16 + off; x < W; x += 16) {
      const s = rng.next(), x0 = Math.max(0, x), w = Math.min(x + 15, W) - x0;
      if (w > 0) { p(x0, y, w, course - 1, s < 0.25 ? K.pilHi : s < 0.8 ? K.pil : K.pilDark); p(x0, y, w, 1, K.pilHi); }
    }
    p(0, y + course - 1, W, 1, K.pilMortar);
    for (let x = off; x < W; x += 16) if (x > 0) line(x, y, x, y + course - 2, K.pilMortar);
  }
  p(0, 0, 4, H, K.pilDark); p(0, 0, 1, H, K.pilDeep);            // the far side, toward the screen's edge
  p(21, 0, 3, H, K.pilHi); p(24, 0, 1, H, K.pilDeep);            // the lit arris toward the room
  if (variant === 1) { line(9, 6, 11, 14, K.pilMortar); line(11, 14, 8, 22, K.pilMortar); p(14, 30, 2, 1, K.pilDark); p(6, 40, 3, 1, K.pilDark); }
  if (variant === 2) {
    p(4, 14, 17, 20, K.frame); disc(12, 14, 8, K.frame); p(4, 14, 1, 20, K.frameHi);
    p(6, 14, 13, 20, K.hole); disc(12, 14, 6, K.hole);
    p(4, 34, 17, 2, K.frameHi); p(3, 36, 19, 1, K.frameDark);    // the sill he looks over
  }
  if (variant === 3) { p(10, 20, 5, 6, K.iron); p(10, 20, 5, 1, K.ironHi); p(11, 26, 3, 2, K.iron); }
}

// A torch on its plate: 9 x 16 art px, the anchor where the cup meets the wall. Three flames.
function drawTorch(t, frame) {
  const { p } = t;
  p(3, 10, 3, 6, K.iron); p(2, 8, 5, 2, K.iron); p(2, 8, 5, 1, K.ironHi); p(3, 10, 1, 6, K.ironHi);
  const lean = [0, -1, 1][frame], tall = frame === 2 ? 1 : 0;
  p(2, 4 - tall, 5, 4 + tall, C.flame3); p(3 + lean, 1 - tall, 3, 3, C.flame3); p(4 + lean, 0 - tall + 1, 1, 1, C.flame3);
  p(3, 4, 3, 4, C.flame2); p(4 + lean, 2, 1, 2, C.flame2);
  p(4, 5, 1, 3, C.flame1);
}

// --- the hall ------------------------------------------------------------------
// Flagstones across the whole width, 192 x 24 art px; the surface is row 4.
function drawFloor(t) {
  const { p, line } = t;
  const r = new RNG(11);
  p(0, 4, 192, 20, K.ledgeDark);
  for (let x = 0; x < 192;) {
    const w = r.int(12, 22);
    p(x, 4, Math.min(w - 1, 192 - x), 6, r.chance(0.3) ? K.ledge : K.ledgeShade);
    p(x, 4, Math.min(w - 1, 192 - x), 1, K.ledgeHi);
    x += w;
  }
  p(0, 10, 192, 1, K.oldDark);
  for (let i = 0; i < 26; i++) { const x = r.int(0, 186), y = r.int(12, 22); p(x, y, r.int(4, 9), 1, K.oldDark); }
  for (let i = 0; i < 12; i++) line(r.int(0, 190), 5, r.int(0, 190), 8, K.ledgeDark);
}

// --- ledges --------------------------------------------------------------------
// The branches' width and anchor (art/trees.js), on a taller canvas: L x 28
// art px, growing out of the RIGHT pillar toward the left, root at x = L - 1,
// tip at x = 3, the surface at y = 7. A slab of pale stone on a stepped
// corbel. Variants give it something small of its own; cracked ones are the
// crumbling kind. Nothing under a ledge is red: red is what bites.
function drawLedge(t, variant, L, cracked = false) {
  const { p, line, ctx } = t;
  const R = L - 1, stub = L <= 24;
  const k = cracked ? { hi: K.oldHi, base: K.old, shade: K.oldShade, dark: K.oldDark } : { hi: K.ledgeHi, base: K.ledge, shade: K.ledgeShade, dark: K.ledgeDark };
  const at = (f) => Math.round(3 + (R - 3) * f);
  const S = ctx.canvas.width / L, cut = (x, y, w, h) => ctx.clearRect(x * S, y * S, w * S, h * S);
  // the corbel under the root, two steps
  const c1 = stub ? 8 : 13, c2 = stub ? 5 : 8, c3 = stub ? 2 : 4;
  p(R - c1 + 1, 14, c1, 3, k.shade); p(R - c1 + 1, 14, 1, 3, k.base);
  p(R - c2 + 1, 17, c2, 3, k.dark); p(R - c2 + 1, 17, 1, 3, k.shade);
  p(R - c3 + 1, 20, c3, 3, k.dark);
  // the slab: lit on top, shaded underneath
  p(3, 7, R - 2, 7, k.base); p(3, 7, R - 2, 1, k.hi); p(3, 12, R - 2, 2, k.shade); p(3, 8, 1, 4, k.hi);
  for (let x = R - 11; x > 8; x -= 13) { p(x, 8, 1, 4, k.shade); p(x + 1, 8, 1, 1, k.hi); }     // joints between its stones
  if (cracked) {
    // loose stones: gaps right through the slab, one stone sagging, bits already gone
    for (const f of [0.3, 0.62]) { const x = at(f); cut(x, 7, 1, 7); p(x + 1, 7, 1, 7, k.hi); p(x - 1, 8, 1, 6, k.dark); }
    const a = at(0.3) + 2, b = at(0.62) - 1;
    cut(a, 7, b - a, 1); p(a, 8, b - a, 1, k.hi); p(a, 14, b - a, 1, k.shade);                           // the middle stone has dropped a pixel
    cut(3, 11, 3, 3); cut(at(0.8), 13, 3, 1); line(at(0.85), 7, at(0.85) + 1, 10, k.dark);
    p(at(0.45), 17, 1, 1, k.shade); p(at(0.7), 16, 2, 1, k.shade); p(at(0.5), 20, 1, 1, k.dark);         // crumbs on their way down
    return;
  }
  if (stub) { if (variant === 1) { cut(3, 7, 2, 1); p(5, 7, 1, 1, k.shade); } return; }
  if (variant === 1) { cut(3, 11, 2, 3); p(5, 13, 1, 1, k.dark); }                                       // a chipped tip
  if (variant === 2) { const x = at(0.3); p(x, 4, 2, 3, K.candle); p(x, 2, 1, 2, C.flame2); p(x, 3, 1, 1, C.flame1); p(x - 1, 6, 4, 1, k.hi); }   // a candle stub
  if (variant === 3) { for (const f of [0.25, 0.55, 0.8]) p(at(f), 14, 1, 1 + Math.round(f * 3), k.dark); p(at(0.4), 7, 3, 1, C.mossDark); p(at(0.4) + 1, 6, 1, 1, C.mossDark); }   // damp, a bit of moss
  if (variant === 4) { const x = at(0.5); p(x, 7, 2, 7, K.iron); p(x, 7, 2, 1, K.ironHi); p(x, 14, 2, 1, K.iron); p(x - 1, 15, 4, 1, K.iron); p(x - 1, 16, 1, 1, K.iron); p(x + 2, 16, 1, 1, K.iron); p(x - 1, 17, 4, 1, K.iron); }   // an iron band and its ring
  if (variant === 5) {
    // a pennant in the prince's colours on a rod under the slab
    const x = at(0.4);
    p(x - 1, 14, 9, 1, K.iron);
    p(x, 15, 7, 8, C.tunic); p(x, 15, 1, 8, C.tunicHi); p(x + 6, 15, 1, 8, C.tunicDark); p(x, 23, 2, 2, C.tunic); p(x + 5, 23, 2, 2, C.tunicDark); p(x + 2, 23, 3, 1, C.tunic);
    p(x + 2, 17, 3, 1, C.gold); p(x + 3, 16, 1, 3, C.gold); p(x, 21, 7, 1, C.goldDark);
  }
}

// --- the chain -------------------------------------------------------------------
// One long chain hangs down the middle of the shaft (the inside's braid:
// what hangs in the centre lane rides on it). A link pair, 5 x 10 art px,
// repeated every 40 px: a link seen flat, the next one edge-on.
function drawChain(t) {
  const { p } = t;
  p(1, 0, 3, 1, K.chain); p(0, 1, 1, 4, K.chainHi); p(4, 1, 1, 4, K.chainDark); p(1, 5, 3, 1, K.chainDark);
  p(2, 4, 1, 6, K.chain); p(2, 5, 1, 1, K.chainHi); p(2, 9, 1, 1, K.chainDark);
}
// Its loose end above the hall: the last links and a pull ring, 9 x 12 art px, hanging from the top centre.
function drawChainEnd(t) {
  const { p, ring } = t;
  p(4, 0, 1, 4, K.chain); p(4, 1, 1, 1, K.chainHi);
  ring(4, 7, 4, K.bell); p(1, 5, 1, 3, K.bellHi); p(2, 4, 2, 1, K.bellHi); p(6, 10, 2, 1, K.bellShade); p(7, 8, 1, 2, K.bellShade);
}

// --- chandelier ----------------------------------------------------------------
// 30 x 15 art px: a pewter ring seen from the side with four candles on it,
// three chains gathering at a hook above. The surface is the ring's top (row
// 9); it rides on the shaft's chain. Two frames of flames.
function drawChandelier(t, frame) {
  const { p, line } = t;
  line(15, 1, 3, 8, K.chainDark); line(15, 1, 27, 8, K.chainDark); p(14, 1, 2, 8, K.chain); p(14, 0, 2, 2, K.chainHi);
  p(1, 9, 28, 3, K.chain); p(0, 9, 1, 2, K.chain); p(29, 9, 1, 2, K.chainDark); p(0, 9, 30, 1, K.chainHi); p(1, 11, 28, 1, K.chainDark); p(2, 12, 26, 1, K.iron);
  for (const x of [7, 15, 22]) p(x, 10, 1, 1, K.chainHi);                      // studs
  p(13, 13, 4, 1, K.chainDark); p(14, 14, 2, 1, K.iron);                        // the boss underneath
  [3, 10, 18, 25].forEach((x, i) => {
    p(x, 6, 2, 3, K.candle); p(x, 6, 1, 3, C.white);
    const up = (frame + i) % 2;
    p(x, 4 - up, 2, 2 + up, C.flame2); p(x + (up ? 1 : 0), 3 - up, 1, 1, C.flame3); p(x, 5, 1, 1, C.flame1);
  });
}

// --- bell ------------------------------------------------------------------------
// 26 x 26 art px: a brass bell under its wooden headstock. He lands on the
// headstock (the surface is row 1); the bell rocks and rings.
function drawBell(t) {
  const { p } = t;
  const o = 2;                                                                   // the bell hangs in the headstock's middle
  p(0, 1, 26, 3, C.plank); p(0, 1, 26, 1, C.plankHi); p(0, 3, 26, 1, C.plankDark); p(2, 0, 2, 1, K.iron); p(22, 0, 2, 1, K.iron);
  p(o + 9, 4, 4, 2, K.iron);                                                     // the strap it hangs by
  const rows = [[6, 8, 13], [7, 7, 14], [8, 6, 15], [9, 6, 15], [10, 5, 16], [11, 5, 16], [12, 5, 16], [13, 4, 17], [14, 4, 17], [15, 4, 17], [16, 3, 18], [17, 3, 18], [18, 2, 19], [19, 1, 20], [20, 1, 20]];
  for (const [y, x0, x1] of rows) { p(o + x0, y, x1 - x0 + 1, 1, K.bell); p(o + x0, y, 2, 1, K.bellHi); p(o + x1 - 1, y, 2, 1, K.bellShade); }
  p(o + 8, 6, 6, 1, K.bellHi); p(o + 7, 9, 2, 6, K.bellHi); p(o + 1, 20, 20, 1, K.bellDark); p(o + 1, 19, 20, 1, K.bellShade); p(o + 2, 19, 4, 1, K.bellHi);
  p(o + 5, 12, 12, 1, K.bellShade);                                              // a moulding round its waist
  p(o + 10, 21, 2, 3, K.iron); p(o + 9, 23, 4, 2, K.bellDark); p(o + 9, 23, 1, 1, K.bellShade);   // the clapper
}

// --- gallery -----------------------------------------------------------------------
// A wooden landing in front of a door in the LEFT pillar, 56 x 72 art px:
// the door over the pillar (columns 0 to 15), the deck out into the room
// (columns 16 to 55, the surface at row 56), a railing behind where he
// stands, a strut under it. Variant 1 has a cloth over the rail.
function drawGallery(t, variant) {
  const { p, line, disc } = t;
  // the door in the pillar: a dressed-stone arch, a room behind with a light in it
  p(1, 18, 14, 38, K.frame); disc(7.5, 19, 7, K.frame); p(1, 18, 1, 38, K.frameHi);
  p(3, 20, 10, 36, K.hole); disc(7.5, 20, 5, K.hole);
  p(6, 40, 4, 8, C.dusk); p(7, 36, 2, 5, C.lanternGlow); p(7, 35, 2, 1, C.sun1);
  // the railing
  p(16, 42, 40, 2, C.plank); p(16, 42, 40, 1, C.plankHi);
  for (const x of [17, 29, 41, 53]) { p(x, 42, 2, 14, C.plankDark); p(x, 42, 1, 14, C.plank); }
  for (const x of [23, 35, 47]) p(x, 44, 1, 12, C.plank);
  p(16, 50, 40, 1, C.plankDark);
  if (variant === 1) { p(33, 43, 9, 9, C.tunic); p(33, 43, 9, 1, C.tunicHi); p(41, 44, 1, 8, C.tunicDark); p(33, 52, 3, 1, C.tunic); p(39, 52, 3, 1, C.tunicDark); p(36, 46, 3, 3, C.gold); p(37, 47, 1, 1, C.goldDark); }
  // the deck: planks end-on, a beam under their far end
  p(14, 56, 42, 4, C.plank); p(14, 56, 42, 1, C.plankHi); p(14, 59, 42, 1, C.plankDark);
  for (let x = 20; x < 56; x += 7) p(x, 57, 1, 2, C.plankDark);
  p(52, 60, 3, 2, C.plankDark);
  // the strut back to the pillar
  line(16, 70, 34, 60, C.plankDark, 2); line(16, 69, 33, 60, C.plank); p(16, 60, 2, 11, C.plankDark);
}

// --- the spider's web ----------------------------------------------------------
// A quarter of an orb web for the corner under a ledge at the RIGHT pillar,
// 30 x 34 art px: the pillar's face is the right edge, the ledge's underside
// the top edge, the anchor that corner. Spokes run from a hub just clear of
// the ledge's corbel out to a scalloped rim; two rings; dew on the crossings
// and something wrapped up for later. Four states: whole, and torn further
// with each tug until only tatters hang from the stone (`tear` 0 to 3). A
// web is thin threads by nature, so it is the brightest thing on the wall:
// silk runs from near white on the rim to lilac on the rings.
const SILK = { hi: '#f6f3ff', base: '#cdc9e4', shade: '#9792b6' };
const WEB_HUB = [23, 8];
const WEB_RIM = [[1, 0], [3, 10], [8, 19], [15, 27], [23, 32], [29, 33]];
function drawWeb(t, tear) {
  const O = WEB_HUB, R = WEB_RIM;
  const angle = (x, y) => Math.atan2(y - O[1], O[0] - x);
  const spokeA = R.map((q) => angle(q[0], q[1])), spokeD = R.map((q) => Math.hypot(q[0] - O[0], q[1] - O[1]));
  // where a pixel lies: between which two spokes, and how far out (0 hub, 1 rim)
  const where = (x, y) => {
    const a = angle(x, y);
    let s = 0; while (s < R.length - 2 && a > spokeA[s + 1]) s++;
    const u = Math.max(0, Math.min(1, (a - spokeA[s]) / (spokeA[s + 1] - spokeA[s])));
    return [s, Math.hypot(x - O[0], y - O[1]) / (spokeD[s] + (spokeD[s + 1] - spokeD[s]) * u)];
  };
  const near = (x, y, q, r) => Math.hypot(x - q[0], y - q[1]) <= r;
  const keep = (x, y) => {
    if (tear === 0) return true;
    const [s, f] = where(x, y);
    if (tear === 3) return near(x, y, R[0], 5) || near(x, y, R[5], 5) || (f < 0.3 && s >= 3) || near(x, y, [17, 0], 3);
    if (s === 2 && f > 0.36) return false;
    if (tear === 2 && ((s === 0 && f > 0.42) || (s === 3 && f > 0.3) || (s === 4 && f > 0.7))) return false;
    return true;
  };
  const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (keep(x, y)) t.p(x, y, 1, 1, c); };
  const seg = (a, b, c) => pixelLine((x, y, w, h, col) => px(x, y, col), a[0], a[1], b[0], b[1], c);
  const at = (i, f) => [O[0] + (R[i][0] - O[0]) * f, O[1] + (R[i][1] - O[1]) * f];
  const sag = (a, b, k) => [(a[0] + b[0]) / 2 + (O[0] - (a[0] + b[0]) / 2) * k, (a[1] + b[1]) / 2 + (O[1] - (a[1] + b[1]) / 2) * k];
  // rings first, spokes over them, the rim last
  for (const [f, c] of [[0.36, SILK.shade], [0.68, SILK.shade]]) {
    for (let i = 0; i < R.length - 1; i++) { const a = at(i, f), b = at(i + 1, f), m = sag(a, b, 0.14); seg(a, m, c); seg(m, b, c); }
  }
  for (let i = 0; i < R.length; i++) seg(O, R[i], SILK.base);
  seg(O, [17, 0], SILK.base); seg(O, [29, 13], SILK.base);                 // two short ones to the stone
  for (let i = 0; i < R.length - 1; i++) { const m = sag(R[i], R[i + 1], 0.1); seg(R[i], m, SILK.hi); seg(m, R[i + 1], SILK.hi); }
  // dew where threads cross, and a wrapped-up fly
  for (const [i, f] of [[1, 0.68], [2, 0.36], [3, 0.68], [4, 0.36], [0, 0.36]]) { const q = at(i, f); px(q[0], q[1], SILK.hi); }
  const fly = at(3, 0.52); px(fly[0], fly[1], SILK.hi); px(fly[0] + 1, fly[1], SILK.hi); px(fly[0], fly[1] + 1, SILK.hi); px(fly[0] + 1, fly[1] + 1, SILK.shade);
  px(O[0], O[1], SILK.hi);
  // loose ends where it has been torn
  const loose = [[], [[11, 15, 4], [16, 19, 3]], [[11, 15, 5], [16, 19, 3], [5, 6, 5], [20, 22, 4], [26, 26, 3]], [[2, 1, 7], [5, 2, 4], [8, 1, 2], [28, 29, 4], [26, 31, 2], [19, 12, 4], [17, 2, 3]]][tear];
  for (const [x, y, n] of loose) { t.p(x, y, 1, n, SILK.shade); t.p(x, y + n, 1, 1, SILK.base); }
}

// --- stairs ----------------------------------------------------------------------
// A flight of four stone treads built out from the RIGHT pillar, 80 x 118
// art px: the lowest tread is the one furthest into the room, each next one
// 16 nearer the pillar and 12 higher, the top one at the pillar under a
// door in it (the 16 columns on the right lie over the pillar). The flight
// is one piece of the pillar's masonry on a half arch that springs from the
// pillar far below, so it is plainly carried; only the treads are the pale
// stone he stands on. The anchor is the middle of the lowest tread. The
// world draws it once for the four platforms it carries.
export const STAIR = { steps: 4, run: 64, rise: 48 };
function drawStairs(t) {
  const { p, disc } = t;
  const TOP = 40, RISE = 12, FACE = 64;                                   // the top tread's row; the pillar's face
  const tread = (x) => TOP + RISE * (3 - Math.min(3, Math.floor(x / 16)));
  // the half arch under it: shallow at the tip, steep into the pillar
  const under = (x) => Math.round(TOP + RISE * 3 + 8 + 30 * (1 - Math.sqrt(Math.max(0, 1 - (x / 63) ** 2))));
  for (let x = 0; x < FACE; x++) {
    const y0 = tread(x), y1 = under(x);
    p(x, y0, 1, y1 - y0 + 1, K.pil);
    p(x, y1 - 2, 1, 3, K.pilDark); p(x, y1, 1, 1, K.pilDeep);            // the arch's ring, in shade
    p(x, y0, 1, 4, K.ledge); p(x, y0, 1, 1, K.ledgeHi); p(x, y0 + 3, 1, 1, K.ledgeShade);   // the tread
  }
  for (const x of [16, 32, 48]) { p(x, tread(x) + 4, 1, RISE - 4, K.pilHi); p(x + 1, tread(x) + 5, 1, RISE - 4, K.pilDark); }   // risers, lit from the room
  p(0, tread(0) + 4, 1, 4, K.pilHi);
  // courses of the masonry and the arch stones
  for (let y = TOP + 9; y < 116; y += 9) for (let x = 0; x < FACE; x++) if (y > tread(x) + 5 && y < under(x) - 3) p(x, y, 1, 1, K.pilMortar);
  for (const [x, y, n] of [[40, 58, 8], [52, 49, 8], [56, 67, 8], [44, 76, 8], [28, 68, 8], [58, 85, 8], [50, 94, 7], [60, 103, 8]]) if (y > tread(x) + 5 && y + n < under(x) - 2) p(x, y, 1, n, K.pilMortar);
  for (const x of [8, 20, 32, 42, 50, 56, 60]) { const y = under(x); p(x, y - 5, 1, 4, K.pilMortar); }
  p(36, TOP + 12, 3, 1, C.mossDark); p(6, tread(6), 2, 1, K.ledge);
  // the door at the top, in the pillar: a dressed arch, a room with a light behind
  p(66, 12, 13, 28, K.frame); disc(72, 12, 6, K.frame); p(66, 12, 1, 28, K.frameHi);
  p(68, 14, 9, 26, K.hole); disc(72, 14, 4, K.hole);
  p(71, 28, 3, 7, C.dusk); p(72, 24, 1, 5, C.lanternGlow); p(72, 23, 1, 1, C.sun1);
  p(64, TOP, 16, 2, K.ledge); p(64, TOP, 16, 1, K.ledgeHi);              // the threshold
}

// --- on the walls --------------------------------------------------------------
// What hangs on the back wall between the windows (interior.js places it by
// hash). Nothing here is red or pink-red: red is what bites. Lit from above:
// a cloth's top edge and left fold are light, its right fold and tail dark.
const CLOTH = [
  { hi: C.tunicHi, base: C.tunic, dark: C.tunicDark },                 // the prince's blue, a sun on it
  { hi: '#a57fc4', base: C.tights, dark: C.tightsDark },               // violet, a crown on it
];
// A banner on an iron rod, 16 x 36 art px, hanging from the rod's middle (the anchor): a swallow tail.
function drawBanner(t, look) {
  const { p } = t;
  const k = CLOTH[look];
  p(0, 0, 16, 2, K.iron); p(0, 0, 16, 1, K.ironHi); p(0, 0, 1, 3, K.ironHi); p(15, 0, 1, 3, K.iron);
  p(2, 2, 12, 27, k.base); p(2, 2, 12, 1, k.hi); p(2, 3, 2, 26, k.hi); p(11, 3, 3, 26, k.dark); p(7, 4, 1, 24, k.dark);
  // the tail: two points, the notch between them
  for (let i = 0; i < 5; i++) { p(2, 29 + i, 5 - i, 1, i < 2 ? k.hi : k.base); p(9 + i, 29 + i, 5 - i, 1, k.dark); }
  p(2, 26, 12, 1, C.goldDark); p(2, 5, 12, 1, C.goldDark);
  if (look === 0) { p(6, 12, 4, 4, C.gold); p(7, 10, 2, 1, C.gold); p(7, 17, 2, 1, C.gold); p(4, 13, 1, 2, C.gold); p(11, 13, 1, 2, C.gold); p(5, 11, 1, 1, C.goldDark); p(10, 11, 1, 1, C.goldDark); p(5, 16, 1, 1, C.goldDark); p(10, 16, 1, 1, C.goldDark); p(7, 13, 2, 2, C.sun2); }
  else { p(5, 14, 6, 3, C.gold); p(5, 11, 1, 3, C.gold); p(7, 12, 2, 2, C.gold); p(10, 11, 1, 3, C.gold); p(5, 16, 6, 1, C.goldDark); p(7, 15, 1, 1, C.gem); }
}
// A shield on two crossed pikes, 22 x 22 art px, the anchor its middle.
function drawShield(t) {
  const { p, line } = t;
  line(1, 20, 19, 2, C.plankDark, 2); line(20, 20, 2, 2, C.plank, 2);
  p(18, 0, 3, 3, K.chain); p(19, 0, 2, 1, K.chainHi); p(1, 0, 3, 3, K.chain); p(1, 0, 2, 1, K.chainHi);
  const rows = [[5, 16], [5, 16], [5, 16], [5, 16], [5, 16], [5, 16], [5, 16], [6, 15], [6, 15], [7, 14], [8, 13], [9, 12], [10, 11]];
  rows.forEach(([x0, x1], i) => {
    const y = 5 + i, m = 11;
    p(x0, y, x1 - x0 + 1, 1, K.chain);
    if (x1 - x0 > 3) { p(x0 + 1, y, m - x0 - 1, 1, C.tunic); p(m, y, x1 - m, 1, C.braid); }
  });
  p(5, 5, 12, 1, K.chainHi); p(5, 5, 1, 7, K.chainHi); p(6, 6, 2, 5, C.tunicHi); p(14, 7, 2, 6, C.braidShade); p(8, 9, 2, 2, C.gold); p(12, 8, 2, 2, C.tunic);
}
// A gilt frame, 24 x 27 art px, hanging from its top middle; the painting
// in it is Rapunzel (the sign's portrait is drawn into it at runtime, and
// now and then she blinks).
function drawFrame(t) {
  const { p } = t;
  p(11, 0, 2, 2, K.iron);
  p(0, 2, 24, 25, C.braidShade); p(0, 2, 24, 1, C.braidHi); p(0, 2, 1, 25, C.braidHi); p(1, 3, 22, 1, C.braid); p(1, 3, 1, 23, C.braid); p(22, 4, 2, 23, C.braidDark); p(1, 25, 23, 2, C.braidDark);
  p(3, 5, 18, 20, C.dusk); p(3, 5, 18, 7, C.nightDeep);
  for (const [x, y] of [[0, 2], [22, 2], [0, 25], [22, 25]]) p(x, y, 2, 2, C.braidHi);
}

// Shelves of books for the library, 28 x 22 art px, hanging from the top
// middle: two boards on brackets, books of many colours (none of them red),
// one leaning, one lying. Two fillings.
const BOOKS = [C.tunic, C.tights, C.leaf, C.braidShade, C.tunicHi, '#a57fc4', K.candle, C.grass, C.goldDark];
function drawShelf(t, look) {
  const { p } = t;
  const r = new RNG(700 + look);
  for (const y0 of [0, 11]) {
    // books standing on the board at row y0 + 9
    let x = 2;
    while (x < 25) {
      const w = r.int(2, 3), h = r.int(5, 8), c = r.pick(BOOKS);
      if (r.chance(0.12) && x < 20) { p(x, y0 + 7, 5, 2, c); p(x, y0 + 7, 5, 1, K.candle); x += 6; continue; }   // one lying down
      p(x, y0 + 9 - h, w, h, c); p(x, y0 + 9 - h, 1, h, K.frameHi); p(x, y0 + 9 - h + 2, w, 1, C.gold);
      x += w + (r.chance(0.2) ? 1 : 0);
    }
    p(0, y0 + 9, 28, 2, C.plank); p(0, y0 + 9, 28, 1, C.plankHi); p(2, y0 + 11, 2, 1, C.plankDark); p(24, y0 + 11, 2, 1, C.plankDark);
  }
  p(0, 20, 28, 2, C.plankDark);
}
// A wooden cog wheel of the tower's clockwork, 24 x 24 art px, the anchor
// its middle (it turns): eight teeth, four spokes, an iron hub.
function drawCog(t) {
  const { p, ring, disc, line } = t;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = 11.5 + Math.cos(a) * 10.5, y = 11.5 + Math.sin(a) * 10.5; p(Math.round(x - 1), Math.round(y - 1), 3, 3, i < 4 ? C.plankDark : C.plank); }
  disc(11.5, 11.5, 9, C.plank); disc(11.5, 11.5, 6, K.wallDark);
  ring(12, 12, 9, C.plankDark); p(5, 3, 8, 1, C.plankHi); p(3, 5, 1, 6, C.plankHi);
  line(12, 4, 12, 20, C.plank, 2); line(4, 12, 20, 12, C.plank, 2); p(12, 4, 1, 16, C.plankHi);
  disc(12, 12, 2, K.iron); p(11, 11, 1, 1, K.ironHi);
}

// --- the gallery ---------------------------------------------------------------
// The tower is the witch's house, so its pictures are hers: herself, her
// grandmother, her cat, her raven, the rampion in her garden that the tale
// began with, the tower in its forest. (Rapunzel's own portrait is the gilt
// frame above with the sign's Rapunzel in it.) Sizes differ, frames are dark
// wood or gilt, two px wide; each hangs from its top middle. Where a face
// looks out of a picture its eyes are left white: the painter (interior.js)
// puts the pupils in, turned toward the prince (PICTURES says where).
const WOOD = { hi: C.plankHi, base: C.plank, dark: C.plankDark }, GILT = { hi: C.braidHi, base: C.braid, dark: C.braidDark };
const HAG = { skin: C.witchSkin, skinShade: '#a3c48a', lip: '#5a2a4a' };
export const PICTURES = [
  { key: 'witch',   w: 28, h: 34, eyes: [[11, 16], [16, 16]], ew: 3 },
  { key: 'granny',  w: 22, h: 28, eyes: [[8, 12], [13, 12]], ew: 3 },
  { key: 'cat',     w: 16, h: 16, eyes: [[5, 8], [9, 8]], ew: 2 },
  { key: 'raven',   w: 16, h: 18 },
  { key: 'rampion', w: 16, h: 20 },
  { key: 'tower',   w: 28, h: 18 },
  { key: 'rapunzel', w: 24, h: 27 },             // the gilt frame (`frame`) with the sign's portrait
];
function picFrame(t, w, h, m) {
  const { p } = t;
  p(0, 0, w, h, m.base); p(0, 0, w, 1, m.hi); p(0, 0, 1, h, m.hi); p(w - 1, 1, 1, h - 1, m.dark); p(1, h - 1, w - 1, 1, m.dark);
  p(1, 1, w - 2, 1, m.base); p(2, h - 2, w - 3, 1, m.dark); p(w - 2, 2, 1, h - 3, m.dark);
  for (const [x, y] of [[0, 0], [w - 2, 0], [0, h - 2], [w - 2, h - 2]]) p(x, y, 2, 2, m.hi);
}
// The witch from the shoulders up, in an 18 x 24 box at (ox, oy): the hat,
// the wild hair, the long nose. `granny`: grey hair, a plum hat, a shawl, spectacles.
function drawHag(t, ox, oy, granny) {
  const { p, disc } = t;
  const hair = granny ? K.chainHi : C.witchHair, hat = granny ? C.witchDressHi : C.witchHat, hatHi = granny ? '#6a4a94' : C.witchDressHi;
  const P = (x, y, w, h, c) => p(ox + x, oy + y, w, h, c);
  // dress or shawl
  P(2, 19, 14, 5, granny ? C.tunicDark : C.witchDress); P(6, 19, 6, 2, granny ? C.tunic : C.witchDressHi); P(8, 21, 2, 1, C.gold);
  // hair, wild, behind the face
  P(2, 8, 3, 10, hair); P(13, 8, 3, 9, hair); P(1, 12, 1, 5, hair); P(16, 11, 1, 4, hair); P(3, 17, 2, 2, hair); P(14, 16, 2, 2, hair);
  // the face
  disc(ox + 9, oy + 12, 5, HAG.skin); P(8, 17, 3, 2, HAG.skin); P(13, 10, 1, 5, HAG.skinShade); P(8, 18, 3, 1, HAG.skinShade);
  P(10, 12, 2, 2, HAG.skin); P(11, 14, 2, 1, HAG.skin); P(12, 14, 1, 1, HAG.skinShade); P(6, 14, 1, 1, HAG.skinShade);     // the nose, a wart
  P(6, 10, 3, 2, C.eyeWhite); P(11, 10, 3, 2, C.eyeWhite);                                                               // eyes: the painter adds the pupils
  if (granny) { P(5, 9, 5, 1, C.goldDark); P(10, 9, 5, 1, C.goldDark); P(5, 12, 5, 1, C.goldDark); P(10, 12, 5, 1, C.goldDark); P(5, 10, 1, 2, C.goldDark); P(14, 10, 1, 2, C.goldDark); }
  else { P(5, 9, 4, 1, C.witchHair); P(11, 8, 3, 1, C.witchHair); P(10, 9, 1, 1, C.witchHair); }                        // brows, one raised
  P(7, 16, 4, 1, HAG.lip); P(10, 15, 1, 1, HAG.lip); P(8, 16, 1, 1, C.white);                                             // a crooked smile, one tooth
  // the hat: brim, cone, band and buckle, the tip bent over
  P(0, 6, 18, 2, hat); P(0, 6, 18, 1, hatHi);
  [[5, 12], [6, 11], [6, 10], [7, 10], [8, 10], [9, 11]].forEach(([x0, x1], i) => P(x0, 5 - i, x1 - x0 + 1, 1, hat));
  P(5, 5, 8, 1, C.goldDark); P(8, 5, 2, 1, C.gold); P(6, 2, 1, 3, hatHi); P(11, 0, 2, 1, hat);
}
function drawPicture(t, key) {
  const { p, disc, ellipse, line } = t;
  const d = PICTURES.find((q) => q.key === key), w = d.w, h = d.h;
  if (key === 'witch') {
    picFrame(t, w, h, WOOD); p(2, 2, w - 4, 1, C.goldDark); p(2, 2, 1, h - 4, C.goldDark);
    p(3, 3, w - 5, h - 5, '#4f7180'); p(3, 3, w - 5, 9, '#648b9a'); p(3, h - 12, w - 5, 10, '#3d5967');   // a dusk behind her
    disc(6, 7, 2, C.sun1); p(7, 6, 2, 2, '#648b9a');                                                      // a sickle moon
    drawHag(t, 5, 6, false);
  } else if (key === 'granny') {
    picFrame(t, w, h, GILT); p(2, 2, w - 4, h - 4, '#7d8a5c'); p(2, 2, w - 4, 8, '#94a06e');
    drawHag(t, 2, 2, true);
  } else if (key === 'cat') {
    picFrame(t, w, h, WOOD); p(2, 2, w - 4, h - 4, '#c9a468'); p(2, 2, w - 4, 4, '#dcbb80');
    disc(8, 9, 4, C.crow); p(4, 4, 2, 3, C.crow); p(10, 4, 2, 3, C.crow); p(5, 5, 1, 1, C.cheek); p(10, 5, 1, 1, C.cheek);
    p(5, 6, 6, 1, C.crowHi); p(4, 12, 8, 2, C.crow);
    p(5, 8, 2, 2, C.sun2); p(9, 8, 2, 2, C.sun2); p(7, 10, 2, 1, C.cheek);                                // eyes: the painter adds the slits
    p(2, 10, 2, 1, K.chainHi); p(12, 10, 2, 1, K.chainHi);
  } else if (key === 'raven') {
    picFrame(t, w, h, GILT); p(2, 2, w - 4, h - 4, '#a9c6d8'); p(2, 2, w - 4, 5, '#c4dcea');
    ellipse(7, 10, 3, 4, C.crow); disc(9, 6, 2, C.crow); p(11, 6, 2, 1, C.beak); p(9, 5, 1, 1, C.eyeWhite);
    p(4, 11, 2, 4, C.crow); p(6, 8, 2, 4, C.crowHi); p(2, 14, 12, 1, C.plankDark); p(7, 14, 1, 1, C.beak); p(9, 14, 1, 1, C.beak);
  } else if (key === 'rampion') {
    picFrame(t, w, h, WOOD); p(2, 2, w - 4, h - 4, '#e6dcc0'); p(2, 14, w - 4, 4, '#cfc2a0');
    p(5, 13, 6, 4, C.lanternFrame); p(4, 12, 8, 1, C.lanternFrame); p(5, 13, 1, 4, C.lanternPaper); p(4, 12, 8, 1, C.lanternPaper);
    ellipse(8, 9, 4, 3, C.grass); p(5, 7, 2, 2, C.grassLight); p(9, 6, 2, 3, C.grassLight); p(7, 8, 2, 3, C.leaf); p(3, 10, 2, 1, C.grass); p(11, 9, 2, 1, C.grass);
    for (const [x, y] of [[6, 4], [9, 3], [11, 5]]) { p(x, y + 1, 1, 3, C.leaf); p(x, y, 2, 2, '#a57fc4'); p(x, y, 1, 1, C.tights); }
  } else if (key === 'tower') {
    picFrame(t, w, h, GILT); p(2, 2, w - 4, 8, '#8fd0ff'); p(2, 7, w - 4, 3, '#bfe6ff');
    disc(6, 5, 1, C.sun2); p(16, 4, 5, 1, C.white); p(18, 3, 3, 1, C.white);
    p(2, 10, w - 4, 6, C.grass); p(2, 13, w - 4, 3, C.grassDark); ellipse(8, 11, 4, 2, C.leaf); ellipse(21, 12, 4, 2, C.leaf); ellipse(15, 13, 5, 2, C.grassDark);
    p(12, 5, 4, 9, '#9fc4bb'); p(15, 5, 1, 9, '#6f988f'); p(11, 4, 6, 1, C.tights); p(12, 3, 4, 1, C.tights); p(13, 2, 2, 1, C.tights);
    p(13, 7, 2, 2, C.nightDeep); p(13, 9, 1, 4, C.braid);
  }
}

// --- small things on the wall ----------------------------------------------------
// An old candle on an iron sconce, 8 x 15 art px, the anchor where the
// plate meets the wall: wax has run down its side. Two flames, and one
// burnt down to a stub (frame 2), a thread of smoke left.
function drawSconce(t, frame) {
  const { p } = t;
  p(3, 10, 2, 5, K.iron); p(3, 10, 1, 5, K.ironHi); p(1, 9, 6, 1, K.iron); p(1, 9, 6, 1, K.ironHi); p(2, 10, 4, 1, K.iron);
  const top = frame === 2 ? 7 : 3;
  p(3, top, 2, 9 - top, K.candle); p(3, top, 1, 9 - top, C.white); p(5, top + 1, 1, 3, K.candle); p(2, 8, 1, 1, K.candle);      // the candle and its drips
  if (frame === 2) { p(4, 5, 1, 2, K.chain); p(3, 3, 1, 2, K.chainDark); return; }
  p(3, frame ? 0 : 1, 2, frame ? 3 : 2, C.flame2); p(frame ? 4 : 3, frame ? 0 : 1, 1, 1, C.flame3); p(3, 2, 1, 1, C.flame1);
}
// A niche in the wall with the witch's things, 18 x 22 art px, hanging from
// its top middle: potions (0), or a crystal ball and a book (1).
function drawNiche(t, look) {
  const { p, disc } = t;
  p(1, 6, 16, 16, K.frame); disc(8.5, 7, 8, K.frame); p(1, 6, 1, 16, K.frameHi);
  p(3, 7, 12, 13, '#221e30'); disc(8.5, 8, 6, '#221e30'); p(3, 20, 12, 2, K.frameHi); p(2, 21, 14, 1, K.frameDark);
  if (look === 0) {
    for (const [x, hgt, c, hi] of [[4, 6, C.grass, C.grassLight], [8, 8, C.tights, '#a57fc4'], [12, 5, C.tunic, C.tunicHi]]) {
      p(x, 20 - hgt + 2, 3, hgt - 2, c); p(x, 20 - hgt + 2, 1, hgt - 2, hi); p(x + 1, 20 - hgt, 1, 2, K.candle); p(x + 1, 20 - hgt - 1, 1, 1, C.plank);
    }
  } else {
    p(5, 18, 6, 2, K.bell); p(5, 18, 6, 1, K.bellHi); disc(8, 14, 3, '#9fd0ff'); p(6, 12, 2, 2, C.white); p(10, 15, 1, 2, '#5f9fe0');
    p(12, 17, 3, 3, C.tights); p(12, 17, 3, 1, '#a57fc4'); p(12, 19, 3, 1, K.candle);
  }
}
// A board with the tower's keys, 20 x 14 art px, hanging from its top middle.
function drawKeys(t) {
  const { p } = t;
  p(0, 0, 20, 4, C.plank); p(0, 0, 20, 1, C.plankHi); p(0, 3, 20, 1, C.plankDark);
  [[3, 8, K.bell, K.bellHi], [9, 6, K.chain, K.chainHi], [15, 9, K.bell, K.bellHi]].forEach(([x, len, c, hi]) => {
    p(x, 2, 1, 2, K.iron);
    p(x - 1, 4, 3, 3, c); p(x, 5, 1, 1, C.plankDark); p(x - 1, 4, 1, 1, hi);                 // the bow
    p(x, 7, 1, len - 3, c); p(x + 1, 4 + len - 2, 1, 1, c); p(x + 1, 4 + len, 1, 1, c);      // the shank and its bit
  });
}
// A bunch of herbs hung up to dry, 10 x 15 art px, from a nail at its top middle.
function drawHerbs(t) {
  const { p } = t;
  p(4, 0, 2, 1, K.iron); p(4, 1, 2, 3, C.rope);
  for (const [x, y, n, c] of [[2, 4, 8, C.leaf], [4, 4, 10, C.grass], [6, 4, 9, C.leaf], [3, 5, 7, C.grassDark], [7, 5, 6, C.grass]]) p(x, y, 1, n, c);
  for (const [x, y] of [[1, 11], [4, 13], [6, 12], [3, 10], [8, 10]]) { p(x, y, 2, 2, '#a57fc4'); p(x, y, 1, 1, C.tights); }
}
// A wall clock, 16 x 20 art px, hanging from its top middle; its pendulum
// (4 x 12, hanging from its top) is drawn apart and swings.
function drawClock(t) {
  const { p, disc, ring } = t;
  p(1, 0, 14, 18, C.plank); p(1, 0, 14, 1, C.plankHi); p(1, 0, 1, 18, C.plankHi); p(14, 1, 1, 17, C.plankDark); p(0, 17, 16, 3, C.plankDark); p(0, 17, 16, 1, C.plank);
  disc(8, 8, 5, K.candle); ring(8, 8, 5, C.goldDark); p(8, 5, 1, 4, K.iron); p(8, 8, 3, 1, K.iron); p(8, 8, 1, 1, C.gold);
  for (const [x, y] of [[8, 4], [12, 8], [8, 12], [4, 8]]) p(x, y, 1, 1, C.plankDark);
}
function drawPendulum(t) { const { p, disc } = t; p(1, 0, 2, 8, K.iron); disc(2, 9, 2, K.bell); p(1, 8, 1, 1, K.bellHi); }

// --- the witch's things ----------------------------------------------------------
// A tapestry with the tale on it, 44 x 36 art px, hanging from the middle of
// its rod: the tower at night, the braid down its wall, the prince at its
// foot, the witch on her broom above. Woven, so flat colours and a border.
function drawTapestry(t) {
  const { p, disc, ellipse, hatch } = t;
  p(0, 0, 44, 2, K.iron); p(0, 0, 44, 1, K.ironHi); for (const x of [4, 14, 22, 30, 39]) p(x, 1, 2, 2, K.bell);
  p(1, 3, 42, 28, C.goldDark); p(1, 3, 42, 1, C.gold); p(42, 4, 1, 27, C.plankDark);
  for (let x = 2; x < 42; x += 4) { p(x, 4, 2, 1, C.tights); p(x + 2, 5, 2, 1, C.tights); p(x, 29, 2, 1, C.tights); p(x + 2, 28, 2, 1, C.tights); }
  p(3, 6, 38, 22, '#34497a'); hatch(3, 6, 38, 16, '#3e5690', 3); p(3, 22, 38, 6, '#2f6b4c'); p(3, 22, 38, 1, '#3f8a5f');
  for (const [x, y] of [[6, 8], [13, 12], [17, 7], [29, 15], [36, 8], [38, 13], [10, 17]]) p(x, y, 1, 1, K.candle);
  disc(9, 10, 2, C.sun1); p(10, 9, 2, 2, '#34497a');                                           // a sickle moon
  ellipse(7, 23, 3, 2, C.leafDark); ellipse(35, 23, 4, 2, C.leafDark); p(6, 20, 2, 2, C.leaf); p(34, 20, 3, 2, C.leaf);
  // the tower, its window, Rapunzel and the braid
  p(19, 10, 6, 15, '#b9c9c4'); p(24, 10, 1, 15, '#8ea39d'); p(18, 9, 8, 1, C.tights); p(19, 8, 6, 1, C.tights); p(20, 7, 4, 1, C.tights); p(21, 6, 2, 1, C.tights);
  p(21, 12, 2, 3, C.nightDeep); p(21, 12, 1, 1, C.skin); p(22, 12, 1, 1, C.braid);
  p(22, 14, 1, 3, C.braid); p(23, 17, 1, 3, C.braid); p(22, 20, 1, 3, C.braid); p(23, 19, 1, 1, C.braidHi);
  // the prince at its foot, on his pogo
  p(14, 19, 2, 1, C.gold); p(14, 20, 2, 1, C.skin); p(14, 21, 2, 2, C.tunic); p(13, 21, 1, 2, C.cape); p(15, 23, 1, 2, C.pole);
  // the witch on her broom
  p(29, 11, 7, 1, C.broom); p(28, 10, 1, 3, C.broomStraw); p(32, 8, 2, 3, C.witchDressHi); p(32, 7, 2, 1, C.witchSkin); p(31, 6, 4, 1, C.witchHat); p(32, 5, 2, 1, C.witchHat); p(33, 4, 1, 1, C.witchHat);
  // the fringe
  for (let x = 1; x < 43; x += 2) p(x, 31, 1, 3 + (x % 4 === 1 ? 1 : 0), x % 4 === 1 ? C.gold : C.goldDark);
}
// Ivy that has come in at a window. Hanging over the sill (12 x 30 art px,
// from its top middle), or climbing the wall from the sill's left end up
// and outward (22 x 44, the anchor its foot at the bottom right; flipped
// for the right end). Stems dark, leaves in three greens, lit ones on top.
function ivyLeaf(p, x, y, i) { const c = [C.leaf, C.grass, C.leaf, C.grassDark][i % 4]; p(x, y, 2, 2, c); p(x + (i % 2), y + 2, 1, 1, c); p(x, y, 1, 1, i % 3 ? C.grass : C.grassLight); }
function drawIvyHang(t) {
  const { p } = t;
  let x = 6;
  for (let y = 0; y < 28; y++) { if (y % 5 === 4) x += (y % 10 === 4 ? -1 : 1); p(x, y, 1, 1, C.leafDark); }
  [[3, 2], [8, 6], [3, 10], [7, 14], [2, 18], [7, 21], [4, 25], [6, 28]].forEach(([lx, ly], i) => ivyLeaf(p, lx, ly, i));
}
function drawIvyClimb(t) {
  const { p, line } = t;
  line(20, 43, 19, 26, C.leafDark); line(19, 26, 20, 10, C.leafDark); line(20, 10, 17, 2, C.leafDark);       // up the jamb
  line(19, 30, 10, 22, C.leafDark); line(10, 22, 3, 21, C.leafDark);                                          // a runner out over the wall
  line(20, 14, 12, 8, C.leafDark); line(12, 8, 6, 9, C.leafDark);
  [[18, 40], [20, 35], [16, 31], [13, 26], [8, 23], [3, 18], [1, 22], [17, 20], [20, 16], [15, 11], [9, 5], [5, 10], [18, 5], [15, 0], [11, 18]].forEach(([lx, ly], i) => ivyLeaf(p, lx, ly, i));
}
// By the hall's door: a board with two pegs, her spare hat on one, a broom
// hung by its loop on the other, 26 x 42 art px, hanging from its top middle.
function drawHook(t) {
  const { p } = t;
  p(1, 0, 24, 3, C.plank); p(1, 0, 24, 1, C.plankHi); p(1, 2, 24, 1, C.plankDark); p(6, 2, 2, 2, K.iron); p(18, 2, 2, 2, K.iron); p(6, 2, 1, 1, K.ironHi); p(18, 2, 1, 1, K.ironHi);
  // the hat: cone, band and buckle, a wide brim, its tip bent over
  [[6, 8], [5, 8], [5, 9], [4, 9], [4, 10], [3, 10], [3, 11]].forEach(([x0, x1], i) => { p(x0, 4 + i, x1 - x0 + 1, 1, C.witchHat); p(x0, 4 + i, 1, 1, C.witchDressHi); });
  p(8, 3, 2, 1, C.witchHat); p(3, 11, 9, 1, C.goldDark); p(6, 11, 2, 1, C.gold); p(0, 12, 15, 2, C.witchHat); p(0, 12, 15, 1, C.witchDressHi);
  // the broom: a leather loop, the handle, the bound straw
  p(18, 4, 2, 2, C.rope); p(18, 6, 2, 22, C.broom); p(18, 6, 1, 22, C.plankHi);
  p(17, 28, 4, 2, K.iron); p(17, 28, 4, 1, K.ironHi);
  [[16, 21], [16, 22], [15, 22], [15, 23], [14, 23], [14, 24], [13, 24], [13, 25], [13, 25], [12, 25], [12, 25]].forEach(([x0, x1], i) => { p(x0, 30 + i, x1 - x0 + 1, 1, C.broomStraw); p(x0, 30 + i, 1, 1, C.lanternHi); });
  for (const x of [15, 18, 21, 23]) p(x, 33, 1, 8, C.lanternFrame);
}
// A mirror in a gilt frame, 24 x 34 art px, hanging from its top middle,
// and what shows in it when the prince comes near (drawn over it by the
// painter): the witch, looking out.
const GLASS = { hi: '#cfe0ee', base: '#9db8cc', shade: '#7896ae' };
function glassRows() { return [[7, 16], [5, 18], [4, 19], [3, 20], [3, 20]]; }        // the glass's arched top, row 4 on; straight below
function drawMirror(t, witch) {
  const { p } = t;
  const row = (y) => (y - 4 < 5 ? glassRows()[y - 4] : [3, 20]);
  if (!witch) {
    for (let y = 2; y < 33; y++) { const [x0, x1] = y < 4 ? [6, 17] : row(y); p(x0 - 2, y, x1 - x0 + 5, 1, C.braid); p(x0 - 2, y, 1, 1, C.braidHi); p(x1 + 2, y, 1, 1, C.braidDark); }
    p(6, 2, 12, 1, C.braidHi); p(1, 32, 22, 2, C.braidDark); p(10, 0, 4, 2, C.braid); p(11, 0, 2, 1, C.braidHi); p(2, 31, 2, 2, C.braidHi); p(20, 31, 2, 2, C.braid);
    for (let y = 4; y < 31; y++) { const [x0, x1] = row(y); p(x0, y, x1 - x0 + 1, 1, y > 24 ? GLASS.shade : GLASS.base); }
    for (let i = 0; i < 7; i++) { p(6 + i, 12 - i, 2, 1, GLASS.hi); p(10 + i, 20 - i, 1, 1, GLASS.hi); }       // glints across the glass
    return;
  }
  drawHag(t, 3, 6, false);
  p(9, 16, 3, 2, C.sun1); p(14, 16, 3, 2, C.sun1); p(10, 16, 1, 2, C.witchHair); p(15, 16, 1, 2, C.witchHair);   // her eyes, alight
  for (let y = 0; y < 34; y++) { const [x0, x1] = y < 4 || y > 30 ? [1, 0] : row(y); t.ctx.clearRect(0, y * 4, x0 * 4, 4); t.ctx.clearRect((x1 + 1) * 4, y * 4, (24 - x1 - 1) * 4, 4); }   // only what is in the glass
}

// --- the library -------------------------------------------------------------------
// A tall bookcase, 38 x 62 art px, hanging from its top middle: five
// shelves of books in many colours (none red), some leaning, some lying,
// and between them what a witch keeps: a potion, an hourglass, a candle
// end, a scroll. Three fillings.
const CASE_BACK = '#2a2233';
function drawBookcase(t, look) {
  const { p } = t;
  const r = new RNG(900 + look * 7);
  p(0, 3, 38, 59, C.plankDark); p(0, 3, 1, 59, C.plank); p(2, 5, 34, 55, CASE_BACK);
  p(0, 0, 38, 3, C.plank); p(0, 0, 38, 1, C.plankHi); p(1, 3, 36, 1, C.plankHi); p(16, 1, 6, 1, C.gold);          // the cornice
  for (let s = 0; s < 5; s++) {
    const base = 14 + s * 11;                                                // the board's row
    let x = 2;
    const gap = (s + look) % 3 === 1 ? r.int(8, 22) : -1;                    // where something other than a book stands
    while (x < 35) {
      if (gap >= 0 && x >= gap && x < gap + 6) {
        const what = (s + look) % 4;
        if (what === 0) { p(x + 1, base - 5, 3, 5, C.grass); p(x + 1, base - 5, 1, 5, C.grassLight); p(x + 2, base - 7, 1, 2, K.candle); }          // a potion
        else if (what === 1) { p(x, base - 6, 5, 1, C.goldDark); p(x, base - 1, 5, 1, C.goldDark); p(x + 1, base - 5, 3, 1, K.candle); p(x + 2, base - 4, 1, 2, K.candle); p(x + 1, base - 2, 3, 1, C.braid); }   // an hourglass
        else if (what === 2) { p(x + 2, base - 4, 1, 4, K.candle); p(x + 1, base - 1, 3, 1, K.bell); p(x + 2, base - 5, 1, 1, K.iron); }              // a candle end
        else { p(x, base - 3, 6, 3, K.candle); p(x, base - 3, 1, 3, C.plank); p(x + 5, base - 3, 1, 3, C.plank); p(x + 2, base - 2, 2, 1, C.tights); }   // a scroll
        x = gap + 7; continue;
      }
      const c = r.pick(BOOKS), w = r.int(2, 3), h = r.int(6, 9);
      if (r.chance(0.1) && x < 30) { for (let i = 0; i < 2; i++) { const cc = r.pick(BOOKS); p(x, base - 2 - i * 2, 6, 2, cc); p(x, base - 2 - i * 2, 6, 1, K.candle); } x += 7; continue; }   // two lying
      if (r.chance(0.1) && x < 31) { for (let i = 0; i < h; i++) p(x + Math.floor(i / 3), base - 1 - i, w, 1, c); x += w + 3; continue; }                 // one leaning
      p(x, base - h, w, h, c); p(x, base - h, 1, h, K.frameHi); p(x, base - h + 2, w, 1, C.gold); if (h > 7) p(x, base - 2, w, 1, C.goldDark);
      x += w + (r.chance(0.15) ? 1 : 0);
    }
    p(1, base, 36, 2, C.plank); p(1, base, 36, 1, C.plankHi);
  }
  p(0, 60, 38, 2, C.plankDark); p(36, 4, 2, 56, C.plankDark);
}
// A library ladder, 9 x 60 art px, the anchor its foot (it leans against a case).
function drawLadder(t) {
  const { p } = t;
  p(0, 0, 2, 60, C.plank); p(7, 0, 2, 60, C.plankDark); p(0, 0, 1, 60, C.plankHi);
  for (let y = 5; y < 58; y += 7) { p(1, y, 7, 2, C.plank); p(1, y, 7, 1, C.plankHi); }
}
// A rack of scrolls with one unrolled below it, 30 x 40 art px, from its top middle.
function drawScrolls(t) {
  const { p, disc } = t;
  p(0, 0, 30, 20, C.plankDark); p(0, 0, 30, 1, C.plankHi); p(0, 0, 1, 20, C.plank); p(1, 1, 28, 18, CASE_BACK);
  for (const x of [10, 20]) p(x - 1, 1, 2, 18, C.plank); p(1, 9, 28, 2, C.plank); p(1, 9, 28, 1, C.plankHi);
  // the rolls, end on: cream rounds with a darker heart, some with a ribbon
  [[4, 5], [7, 6], [14, 4], [16, 7], [24, 5], [26, 7], [3, 15], [6, 16], [13, 15], [17, 16], [23, 14], [26, 16], [15, 13]].forEach(([x, y], i) => {
    disc(x, y, 1, K.candle); p(x, y, 1, 1, C.plank); p(x - 1, y - 1, 1, 1, C.white); if (i % 4 === 0) p(x + 1, y, 1, 1, i % 8 ? C.tights : C.tunic);
  });
  // one hung up open: a rod, the sheet with its lines, a curl and a seal
  p(8, 21, 14, 2, C.plank); p(8, 21, 14, 1, C.plankHi); p(9, 23, 12, 14, K.candle); p(9, 23, 1, 14, C.white); p(20, 24, 1, 13, '#d8c9a0');
  for (let y = 25; y < 35; y += 2) p(11, y, y % 4 === 1 ? 8 : 6, 1, '#8a7a5a');
  p(9, 37, 12, 2, '#d8c9a0'); p(9, 37, 12, 1, K.candle); p(18, 34, 2, 2, C.gold); p(18, 34, 1, 1, C.goldDark);
}
// The spell book on a lectern on the wall, 26 x 34 art px, from its top
// middle: a carved bracket, a slanted desk, the great book open on it.
// Frame 1: a page on its way over. The painter adds its glow and the runes
// that rise from it (`rune`, three of them, 5 x 5).
function drawLectern(t, frame) {
  const { p, line } = t;
  p(11, 20, 4, 12, C.plankDark); p(11, 20, 1, 12, C.plank); p(8, 31, 10, 3, C.plankDark); p(8, 31, 10, 1, C.plank);     // the post and its foot on the wall
  line(4, 20, 21, 17, C.plankDark, 2); p(3, 18, 20, 2, C.plank); p(3, 18, 20, 1, C.plankHi);                          // the desk
  // the book: violet boards with gold corners, two blocks of pages, a blue ribbon
  p(1, 9, 24, 9, C.tights); p(1, 9, 24, 1, '#a57fc4'); p(1, 9, 2, 2, C.gold); p(23, 9, 2, 2, C.gold); p(1, 16, 2, 2, C.goldDark); p(23, 16, 2, 2, C.goldDark);
  p(3, 7, 9, 10, K.candle); p(14, 7, 9, 10, K.candle); p(3, 7, 9, 1, C.white); p(14, 7, 9, 1, C.white); p(12, 8, 2, 9, '#d8c9a0');
  for (let y = 9; y < 16; y += 2) { p(4, y, 7, 1, '#8a7a5a'); p(15, y, y === 11 ? 5 : 7, 1, '#8a7a5a'); }
  p(5, 9, 2, 2, C.tunic); p(12, 15, 2, 5, C.tunicHi);                                                               // an initial, the ribbon
  if (frame) { p(10, 2, 3, 6, K.candle); p(10, 2, 1, 6, C.white); p(12, 3, 1, 5, '#d8c9a0'); }                        // a page standing up, turning
}
function drawRune(t, k) {
  const { p } = t;
  const c = '#e3d6ff';
  if (k === 0) { p(2, 0, 1, 5, c); p(0, 1, 5, 1, c); p(1, 3, 3, 1, c); }
  else if (k === 1) { p(0, 0, 1, 5, c); p(1, 1, 1, 1, c); p(2, 2, 1, 1, c); p(3, 1, 1, 1, c); p(4, 0, 1, 5, c); }
  else { p(1, 0, 3, 1, c); p(0, 1, 1, 3, c); p(4, 1, 1, 3, c); p(1, 4, 3, 1, c); p(2, 2, 1, 1, c); }
}
// A parchment hung on the wall, 9 x 20 art px, from its top middle.
function drawScroll(t) {
  const { p } = t;
  p(0, 0, 9, 2, C.plank); p(0, 0, 9, 1, C.plankHi); p(1, 2, 7, 15, K.candle); p(1, 2, 1, 15, C.white); p(7, 3, 1, 14, '#d8c9a0');
  for (let y = 4; y < 15; y += 2) p(2, y, y % 4 === 0 ? 5 : 4, 1, '#8a7a5a');
  p(1, 17, 7, 2, '#d8c9a0'); p(1, 17, 7, 1, K.candle); p(5, 14, 2, 2, C.tights);
}
// A few books on a bracket with an inkwell and a quill, 14 x 14 art px, from its top middle.
function drawPile(t) {
  const { p, line } = t;
  p(0, 11, 14, 2, C.plank); p(0, 11, 14, 1, C.plankHi); p(2, 13, 2, 1, C.plankDark); p(10, 13, 2, 1, C.plankDark);
  [[1, 9, 9, C.tunic], [2, 7, 8, C.leaf], [1, 5, 7, C.tights]].forEach(([x, y, w, c]) => { p(x, y, w, 2, c); p(x, y, w, 1, K.candle); p(x, y, 1, 2, C.gold); });
  p(10, 8, 3, 3, K.iron); p(10, 8, 3, 1, K.ironHi); line(11, 7, 13, 1, C.white); p(12, 2, 2, 2, C.white); p(13, 1, 1, 1, K.candle);
}
// A book that flies, 11 x 7 art px, the anchor its middle: its boards beat
// like wings (up, down). Small, pale and made of paper: it is the room's
// life, not a creature to mind (the bats are violet, so these are not).
function drawFlyingBook(t, frame) {
  const { p } = t;
  const up = frame === 0;
  // brown boards, a broad cream of pages under them: paper, not a bat
  for (let i = 0; i < 5; i++) {
    const y = up ? (i === 0 ? 0 : i < 3 ? 1 : 2) : (i === 0 ? 5 : i < 3 ? 4 : 3);
    p(i, y, 1, 1, C.plank); p(10 - i, y, 1, 1, C.plank);
    p(i, y + (up ? 1 : -2), 1, 2, K.candle); p(10 - i, y + (up ? 1 : -2), 1, 2, K.candle); p(i, y + (up ? 1 : -2), 1, 1, C.white);
  }
  p(5, 2, 1, 4, C.goldDark);
}
// The great chained book (the library's spring, on the chain where the bell
// hangs elsewhere), 28 x 22 art px: a tome lying shut, iron corners and a
// clasp, a ring where the chain holds it. He lands on its upper board (row
// 4, the anchor its middle). Frame 1: thrown open a hand's breadth by the bounce.
function drawTome(t, frame) {
  const { p } = t;
  const o = frame ? 2 : 0;                                                    // how far the upper board has lifted
  p(12, 0, 4, 4 - o, K.chain); p(13, 0, 2, 1, K.chainHi);                      // the ring it hangs by
  p(2, 6, 25, 12, K.candle); for (let y = 7; y < 18; y += 2) p(3, y, 24, 1, '#d8c9a0'); p(26, 6, 1, 12, '#b9a982');   // the pages, a hand thick
  if (frame) { p(4, 4, 22, 2, C.white); p(6, 3, 17, 1, K.candle); }                                                // a breath of pages
  p(0, 4 - o, 28, 2, C.tights); p(0, 4 - o, 28, 1, '#a57fc4'); p(0, 18, 28, 2, C.tightsDark); p(0, 18, 28, 1, C.tights);   // the boards
  p(0, 4 - o, 3, 16 + o, C.tights); p(0, 4 - o, 1, 16 + o, '#a57fc4'); p(2, 6, 1, 12, C.tightsDark);              // the spine
  for (const y of [8, 12, 16]) p(0, y, 3, 1, C.gold);                                                             // its bands
  for (const x of [3, 24]) { p(x, 4 - o, 3, 2, K.chain); p(x, 18, 3, 2, K.chainDark); p(x, 4 - o, 3, 1, K.chainHi); }  // iron corners
  p(13, 4 - o, 3, 2, C.gold); p(25, 9, 3, 6, K.chain); p(25, 9, 1, 6, K.chainHi); p(26, 11, 1, 2, C.gold);          // a boss, the clasp
  p(9, 20, 2, 2, C.tunicHi); p(9, 20, 1, 2, C.tunic);                                                              // the ribbon, hanging out
}

// --- the guard rooms ---------------------------------------------------------------
// A rack of pole arms, 26 x 46 art px, from its top middle: two rails on the
// wall, a halberd, a pike and a bill stood in them. No red collars: these
// are put away (the one that thrusts from a hatch has one).
function drawRack(t) {
  const { p } = t;
  const shaft = (x, top) => { p(x, top, 2, 44 - top, C.plank); p(x, top, 1, 44 - top, C.plankHi); };
  shaft(5, 8); shaft(12, 3); shaft(19, 10);
  // the halberd: a spike, an axe blade to the left, a hook to the right
  p(5, 3, 2, 5, K.chain); p(5, 2, 1, 2, K.chainHi); p(2, 6, 3, 5, K.chain); p(1, 7, 1, 3, K.chainHi); p(7, 7, 2, 2, K.chainDark);
  // the pike: a long leaf
  p(12, 0, 2, 4, K.chain); p(12, 0, 1, 3, K.chainHi); p(11, 2, 1, 2, K.chain); p(14, 2, 1, 2, K.chainDark);
  // the bill: a hooked blade
  p(19, 5, 2, 5, K.chain); p(21, 6, 2, 3, K.chain); p(22, 5, 1, 2, K.chainHi); p(19, 4, 1, 2, K.chainHi); p(17, 8, 2, 2, K.chainDark);
  for (const y of [16, 38]) { p(0, y, 26, 3, C.plankDark); p(0, y, 26, 1, C.plank); for (const x of [4, 11, 18]) p(x, y, 4, 3, K.iron); }
  p(0, 44, 26, 2, C.plankDark); p(0, 44, 26, 1, C.plank);
}
// A shelf of helmets, 30 x 16 art px, from its top middle: three kettle
// hats, the captain's with a blue plume, one with a dent.
function drawHelmets(t) {
  const { p } = t;
  const hat = (x, plume) => {
    p(x + 2, 4, 5, 5, K.chain); p(x + 3, 3, 3, 1, K.chain); p(x + 2, 4, 2, 3, K.chainHi); p(x + 6, 5, 1, 4, K.chainDark);
    p(x, 9, 9, 2, K.chain); p(x, 9, 9, 1, K.chainHi); p(x + 8, 10, 1, 1, K.chainDark);
    if (plume) { p(x + 4, 0, 2, 3, C.tunic); p(x + 5, 0, 2, 2, C.tunicHi); }
  };
  hat(1, false); hat(11, true); hat(21, false); p(25, 6, 2, 1, K.chainDark);
  p(0, 11, 30, 2, C.plank); p(0, 11, 30, 1, C.plankHi); p(3, 13, 2, 3, C.plankDark); p(25, 13, 2, 3, C.plankDark);
}
// The guards' table, 30 x 22 art px, from its top middle: a board on two
// brackets with what an idle watch leaves on it: a tankard, dice, a hand of cards.
function drawTable(t) {
  const { p, line } = t;
  p(0, 12, 30, 3, C.plank); p(0, 12, 30, 1, C.plankHi); p(0, 14, 30, 1, C.plankDark);
  line(3, 15, 8, 21, C.plankDark, 2); line(26, 15, 21, 21, C.plankDark, 2); p(3, 15, 2, 7, C.plankDark); p(25, 15, 2, 7, C.plankDark);
  p(3, 5, 5, 7, K.chain); p(3, 5, 1, 7, K.chainHi); p(7, 6, 1, 6, K.chainDark); p(8, 7, 2, 1, K.chain); p(9, 8, 1, 3, K.chain); p(8, 10, 2, 1, K.chain); p(3, 4, 5, 2, K.candle); p(4, 3, 3, 1, C.white);   // the tankard and its foam
  p(12, 9, 3, 3, C.white); p(13, 10, 1, 1, K.iron); p(16, 10, 3, 2, K.candle); p(16, 10, 1, 1, K.iron); p(18, 11, 1, 1, K.iron);                                                         // dice
  for (const [x, c] of [[21, C.tunic], [23, C.goldDark], [25, C.tights]]) { p(x, 6, 3, 6, K.candle); p(x, 6, 1, 6, C.white); p(x + 1, 8, 1, 2, c); }                                    // cards, fanned
}
// A notice nailed to the wall, 16 x 24 art px, from its top middle: the
// prince's face, a line of heavy letters over it, a purse under it.
function drawPoster(t) {
  const { p } = t;
  p(1, 1, 14, 22, K.candle); p(1, 1, 1, 22, C.white); p(14, 2, 1, 21, '#d8c9a0'); p(12, 21, 3, 2, '#d8c9a0'); p(13, 22, 2, 1, K.wallDark);
  p(7, 0, 2, 2, K.iron);
  for (const x of [3, 6, 9, 12]) p(x, 3, 2, 2, K.iron);                                                // W A N T E D, as it were
  p(5, 9, 6, 6, C.skin); p(5, 8, 6, 2, C.hair); p(5, 6, 6, 2, C.gold); p(5, 6, 1, 1, C.goldDark); p(7, 6, 1, 1, C.tunic); p(10, 6, 1, 1, C.goldDark);
  p(6, 11, 1, 1, C.black); p(9, 11, 1, 1, C.black); p(7, 13, 2, 1, C.hair); p(4, 15, 8, 2, C.tunic); p(7, 15, 2, 2, C.gold);
  p(6, 19, 4, 3, C.goldDark); p(7, 18, 2, 1, C.plank); p(6, 19, 1, 1, C.gold); for (const x of [3, 11]) p(x, 20, 2, 1, '#8a7a5a');
}
// A signal horn on a strap, 14 x 12 art px, from its top middle.
function drawHorn(t) {
  const { p } = t;
  p(6, 0, 2, 1, K.iron); p(2, 1, 1, 4, C.plankDark); p(11, 1, 1, 3, C.plankDark); p(3, 0, 8, 1, C.plankDark);
  [[1, 5, 4], [2, 6, 5], [4, 7, 5], [6, 8, 5], [9, 8, 4], [11, 7, 3]].forEach(([x, y, w]) => p(x, y, w, 2, K.candle));
  p(1, 5, 3, 1, C.white); p(0, 4, 2, 3, K.chain); p(7, 8, 1, 2, K.chain); p(12, 6, 2, 3, K.chain); p(12, 6, 2, 1, K.chainHi);
}

// --- the belfry ----------------------------------------------------------------------
// The great clock's dial, 34 x 34 art px, the anchor its middle; its two
// hands (`hand`, 3 x 14 and 3 x 10, from their foot) turn at runtime.
function drawDial(t) {
  const { p, disc, ring } = t;
  disc(17, 17, 16, C.plankDark); disc(17, 17, 15, C.goldDark); disc(17, 17, 13, K.candle); ring(17, 17, 13, '#d8c9a0');
  p(8, 5, 10, 1, C.gold); p(4, 9, 1, 8, C.gold);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = 17 + Math.sin(a) * 11, y = 17 - Math.cos(a) * 11; p(Math.round(x), Math.round(y), i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, K.iron); }
}
function drawHand(t, len) { const { p } = t; p(1, 0, 1, len, K.iron); p(0, 1, 3, 2, K.iron); p(1, 0, 1, 2, K.ironHi); }
// A bell rope, 5 x 60 art px, from its top middle: the rope, the woolly
// grip in three colours, the tail with its knot.
function drawBellRope(t) {
  const { p } = t;
  p(2, 0, 1, 36, C.rope); for (let y = 2; y < 36; y += 4) p(2, y, 1, 1, C.ropeDark);
  [C.tunic, K.candle, C.goldDark, K.candle, C.tunic, K.candle, C.goldDark].forEach((c, i) => { p(1, 36 + i * 2, 3, 2, c); p(1, 36 + i * 2, 1, 2, i % 2 ? C.white : C.tunicHi); });
  p(2, 50, 1, 7, C.rope); p(1, 57, 3, 2, C.ropeDark); p(1, 57, 1, 1, C.rope);
}
// Roof timbers, 46 x 42 art px, from the top middle: a tie beam and two
// braces crossing under it, bolted. An owl may sit on the beam (`owl`, 12 x
// 13, standing on its feet; frame 1 with its eyes shut).
function drawTruss(t) {
  const { p, line } = t;
  line(2, 40, 42, 6, C.plankDark, 3); line(2, 40, 41, 6, C.plank, 2);
  line(43, 40, 3, 6, C.plankDark, 3); line(43, 39, 4, 5, C.plank, 2);
  p(0, 2, 46, 5, C.plank); p(0, 2, 46, 1, C.plankHi); p(0, 6, 46, 1, C.plankDark); for (let x = 6; x < 46; x += 11) p(x, 3, 1, 3, C.plankDark);
  p(21, 21, 4, 4, K.iron); p(21, 21, 2, 1, K.ironHi); p(2, 3, 2, 2, K.iron); p(42, 3, 2, 2, K.iron);
}
function drawOwl(t, shut) {
  const { p } = t;
  const B = { hi: C.barkLight, base: C.barkMid, dark: C.barkDeep };
  p(2, 3, 8, 9, B.base); p(1, 5, 1, 5, B.base); p(10, 5, 1, 5, B.dark); p(2, 2, 2, 2, B.base); p(8, 2, 2, 2, B.dark); p(3, 3, 6, 1, B.hi);
  p(3, 4, 6, 4, K.candle); p(5, 7, 2, 4, K.candle); p(4, 9, 1, 2, B.hi); p(7, 9, 1, 2, B.hi);
  if (shut) { p(3, 6, 2, 1, B.dark); p(7, 6, 2, 1, B.dark); } else { p(3, 5, 2, 2, C.sun2); p(7, 5, 2, 2, C.sun2); p(4, 5, 1, 2, C.black); p(7, 5, 1, 2, C.black); }
  p(5, 7, 2, 1, C.beak); p(3, 12, 2, 1, C.beak); p(7, 12, 2, 1, C.beak);
}
// A small bell for a row of them, 9 x 11 art px, hanging from its top middle (it swings).
function drawSmallBell(t) {
  const { p } = t;
  p(4, 0, 1, 2, K.iron);
  [[3, 5], [2, 6], [2, 6], [1, 7], [1, 7], [0, 8]].forEach(([x0, x1], i) => { p(x0, 2 + i, x1 - x0 + 1, 1, K.bell); p(x0, 2 + i, 1, 1, K.bellHi); p(x1, 2 + i, 1, 1, K.bellShade); });
  p(0, 8, 9, 1, K.bellShade); p(4, 9, 1, 2, K.iron);
}
// A coil of rope on a hook, 10 x 13 art px, from its top middle.
function drawCoil(t) {
  const { p, ring } = t;
  p(4, 0, 2, 2, K.iron); ring(5, 6, 4, C.rope); ring(5, 6, 3, C.ropeDark); ring(5, 7, 4, C.rope); p(8, 9, 1, 4, C.rope); p(2, 3, 2, 1, C.white);
}

// --- the gate ----------------------------------------------------------------------
// A door between the outside and the inside of the tower, on a stone landing
// he can stand on, 46 x 58 art px, the anchor the landing's top middle. Two
// looks, by where it leads: 'in' (seen from outside: a warm, torch-lit room
// behind it) and 'out' (seen from inside: daylight and treetops). The
// fanlight over the leaves always shows the other side, so a shut gate
// already says where it goes; open (frame 1), the leaves stand back against
// the jambs and the whole doorway shows it.
function drawGate(t, look, open) {
  const { p, disc } = t;
  const cx = 23, SURF = 46, hw = 13, spring = 20;        // the landing's row, the doorway's half width, where the arch begins
  // the surround: dressed stone, lit on its left
  p(cx - hw - 3, spring, hw * 2 + 6, SURF - spring, K.frame); disc(cx, spring, hw + 3, K.frame);
  p(cx - hw - 3, spring, 1, SURF - spring, K.frameHi); p(cx + hw + 2, spring, 1, SURF - spring, K.frameDark);
  p(cx - 2, spring - hw - 5, 4, 3, K.frameHi);                                           // keystone
  // what lies beyond, in the doorway's shape
  const beyond = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const inArch = yy >= spring || (xx - cx + 0.5) ** 2 + (yy - spring) ** 2 <= hw * hw;
      if (!inArch || Math.abs(xx - cx + 0.5) > hw) continue;
      let c;
      if (look === 'out') c = yy < 22 ? '#8fd0ff' : yy < 32 ? '#bfe6ff' : yy < 36 ? C.grassLight : yy < 41 ? C.grass : C.grassDark;
      else c = yy < 20 ? '#3a2f52' : yy < 34 ? '#5a4470' : '#7a5a6a';
      p(xx, yy, 1, 1, c);
    }
  };
  beyond(cx - hw, spring - hw, hw * 2, SURF - spring + hw);
  if (look === 'out') { p(cx + 5, 12, 3, 3, C.sun1); p(cx - 9, 31, 5, 2, C.leaf); p(cx + 2, 33, 6, 2, C.leaf); p(cx - 4, 26, 4, 1, C.white); }
  else { p(cx - 1, 24, 2, 5, C.flame2); p(cx - 1, 26, 1, 2, C.flame1); p(cx - 2, 29, 4, 2, K.iron); p(cx - 7, 40, 14, 1, '#9a7a80'); p(cx - 5, 37, 10, 1, '#8a6a78'); p(cx - 3, 34, 6, 1, '#7a5a70'); }
  // the leaves: shut below the fanlight, or stood back against the jambs
  if (!open) {
    p(cx - hw, spring + 2, hw * 2, SURF - spring - 2, C.plank);
    for (let x = cx - hw + 4; x < cx + hw; x += 5) p(x, spring + 3, 1, SURF - spring - 3, C.plankDark);
    p(cx - 1, spring + 2, 2, SURF - spring - 2, C.barkShadow);
    p(cx - hw, spring + 2, hw * 2, 1, C.plankHi); p(cx - hw, spring, hw * 2, 2, K.frameDark);            // the transom under the fanlight
    for (const y of [spring + 8, SURF - 8]) { p(cx - hw, y, hw * 2, 2, K.iron); p(cx - hw, y, hw * 2, 1, K.ironHi); }
    p(cx - 5, 34, 2, 2, K.bell); p(cx + 3, 34, 2, 2, K.bell); p(cx - 5, 34, 1, 1, K.bellHi); p(cx + 3, 34, 1, 1, K.bellHi);
  } else {
    p(cx - hw, spring - 4, 3, SURF - spring + 4, C.plank); p(cx - hw, spring - 4, 1, SURF - spring + 4, C.plankHi); p(cx - hw + 2, spring - 4, 1, SURF - spring + 4, C.plankDark);
    p(cx + hw - 3, spring - 4, 3, SURF - spring + 4, C.plankDark); p(cx + hw - 3, spring - 4, 1, SURF - spring + 4, C.plank);
  }
  // the landing: a pale slab on two brackets
  p(0, SURF, 46, 6, K.ledge); p(0, SURF, 46, 1, K.ledgeHi); p(0, SURF + 4, 46, 2, K.ledgeShade); p(0, SURF + 1, 1, 3, K.ledgeHi);
  for (const x of [11, 23, 34]) p(x, SURF + 1, 1, 3, K.ledgeShade);
  for (const x of [5, 35]) { p(x, SURF + 6, 6, 3, K.ledgeShade); p(x + 1, SURF + 9, 4, 3, K.ledgeDark); }
}

// --- the ghost -------------------------------------------------------------------
// 16 x 20 art px, facing RIGHT, the anchor its middle: a small round ghost
// with a scalloped hem, rosy cheeks and a round mouth. It carries a candle
// (drawn apart, so the flame stays when the ghost fades: that is how one
// knows where it is). Lit from above like everything: the crown white, the
// side away from the light and the hem lilac. Frames: 0 and 1 drifting (the
// hem waves), 2 "boo" (arms up, mouth wide), 3 knocked out (X eyes).
const GHOST = { hi: '#ffffff', base: '#e9e6f7', shade: '#bdb8da', dark: '#8f89b6', mouth: '#4a4470' };
function drawGhost(t, frame) {
  const { p } = t;
  const boo = frame === 2, out = frame === 3;
  // the body: a dome, then straight sides
  const rows = [[5, 10], [3, 12], [2, 13], [2, 13], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14]];
  rows.forEach(([x0, x1], i) => { const y = 1 + i; p(x0, y, x1 - x0 + 1, 1, GHOST.base); p(x1 - 1, y, 2, 1, GHOST.shade); });
  p(5, 1, 5, 1, GHOST.hi); p(3, 2, 6, 1, GHOST.hi); p(2, 3, 4, 2, GHOST.hi); p(1, 5, 2, 3, GHOST.hi);
  // the hem: three scallops, shifting by a pixel between the two drifting frames
  const o = frame === 1 ? 1 : 0;
  for (const x of [1, 6, 11]) { p(x + o, 16, 4 - (x === 11 ? o : 0), 2, GHOST.base); p(x + o, 18, 3 - (x === 11 ? o : 0), 1, GHOST.shade); p(x + 1 + o, 19, 1, 1, GHOST.shade); }
  p(13, 16, 2 - o, 2, GHOST.shade);
  // the face, toward the right
  if (out) {
    for (const x of [6, 11]) { p(x, 6, 1, 1, C.black); p(x + 2, 6, 1, 1, C.black); p(x + 1, 7, 1, 1, C.black); p(x, 8, 1, 1, C.black); p(x + 2, 8, 1, 1, C.black); }
    p(9, 11, 3, 1, GHOST.mouth);
  } else {
    p(6, 6, 2, boo ? 3 : 2, C.black); p(11, 6, 2, boo ? 3 : 2, C.black); p(6, 6, 1, 1, GHOST.dark); p(11, 6, 1, 1, GHOST.dark);
    p(9, boo ? 10 : 11, boo ? 3 : 2, boo ? 4 : 2, GHOST.mouth);
    p(4, 10, 2, 1, C.cheek); p(13, 10, 1, 1, C.cheek);
  }
  // stubby arms: the right one holds the candle (its hand at 15, 11), both up for a boo
  if (boo) { p(0, 6, 2, 2, GHOST.base); p(0, 5, 1, 1, GHOST.hi); p(14, 6, 2, 2, GHOST.shade); }
  else { p(14, 11, 2, 2, GHOST.base); p(15, 12, 1, 1, GHOST.shade); p(0, 11, 2, 2, GHOST.base); }
}
// Its candle on a brass dish, 5 x 9 art px, the anchor the dish's middle; two flames.
function drawGhostCandle(t, frame) {
  const { p } = t;
  p(0, 7, 5, 1, K.bell); p(0, 7, 2, 1, K.bellHi); p(1, 8, 3, 1, K.bellShade);
  p(2, 3, 1, 4, K.candle); p(2, 3, 1, 1, C.white);
  p(2, frame ? 0 : 1, 1, frame ? 3 : 2, C.flame2); p(2, 2, 1, 1, C.flame1); if (frame) p(1, 1, 1, 1, C.flame3); else p(3, 1, 1, 1, C.flame3);
}

export function buildInterior() {
  const wall = [0, 1, 2, 3, 4, 5].map((v) => makeSprite(WALL_W, 48, (t) => drawWall(t, v, new RNG(300 + v)), { ax: 0.5, ay: 1 }));
  const pillarL = [0, 1, 2, 3].map((v) => makeSprite(25, 48, (t) => drawPillar(t, v, new RNG(400 + v)), { ax: 0, ay: 1 }));
  const torch = [0, 1, 2].map((f) => makeSprite(9, 16, (t) => drawTorch(t, f), undefined, { axPx: 4.5 * 4, ayPx: 10 * 4 }));
  const floor = makeSprite(192, 24, drawFloor, { ax: 0.5, ay: 0 }, { ayPx: 4 * 4 });
  // the ledges as a tree style: the same canvases and anchors as the branches
  const ledge = (L, draw) => makeSprite(L, 28, draw, undefined, { axPx: L * 2, ayPx: 7 * 4 });
  const branchR = {};
  for (const [len, { art }] of Object.entries(BRANCH_LEN)) {
    const variants = len === 'stub' ? [0, 1] : [0, 1, 2, 3, 4, 5];
    branchR[len] = variants.map((v) => ledge(art, (t) => drawLedge(t, v, art)));
  }
  const dryR = { normal: ledge(BRANCH_LEN.normal.art, (t) => drawLedge(t, 0, BRANCH_LEN.normal.art, true)), long: ledge(BRANCH_LEN.long.art, (t) => drawLedge(t, 0, BRANCH_LEN.long.art, true)) };
  const flipAll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(flipH) : flipH(v)]));
  const stone = { name: 'stone', branchR, branchL: flipAll(branchR), dryR, dryL: flipAll(dryR) };
  const galleryL = [0, 1].map((v) => makeSprite(56, 72, (t) => drawGallery(t, v), undefined, { axPx: 36 * 4, ayPx: 56 * 4 }));
  return {
    wall, pillarL, pillarR: pillarL.map(flipH), torch, floor, stone,
    chandelier: [0, 1].map((f) => makeSprite(30, 15, (t) => drawChandelier(t, f), undefined, { axPx: 15 * 4, ayPx: 9 * 4 })),
    bell: makeSprite(26, 26, drawBell, undefined, { axPx: 13 * 4, ayPx: 1 * 4 }),
    web: (() => { const R = [0, 1, 2, 3].map((k) => makeSprite(30, 36, (t) => drawWeb(t, k), undefined, { axPx: 30 * 4, ayPx: 0 })); return { R, L: R.map(flipH) }; })(),
    ghost: (() => { const R = [0, 1, 2, 3].map((f) => makeSprite(16, 20, (t) => drawGhost(t, f), { ax: 0.5, ay: 0.5 })); return { R, L: R.map(flipH) }; })(),
    ghostCandle: [0, 1].map((f) => makeSprite(5, 9, (t) => drawGhostCandle(t, f), undefined, { axPx: 2.5 * 4, ayPx: 7 * 4 })),
    stairs: (() => { const R = makeSprite(80, 118, drawStairs, undefined, { axPx: 8 * 4, ayPx: 76 * 4 }); return { R, L: flipH(R) }; })(),
    shelf: [0, 1].map((k) => makeSprite(28, 22, (t) => drawShelf(t, k), { ax: 0.5, ay: 0 })),
    cog: makeSprite(24, 24, drawCog, { ax: 0.5, ay: 0.5 }),
    gate: { in: [false, true].map((o) => makeSprite(46, 58, (t) => drawGate(t, 'in', o), undefined, { axPx: 23 * 4, ayPx: 46 * 4 })), out: [false, true].map((o) => makeSprite(46, 58, (t) => drawGate(t, 'out', o), undefined, { axPx: 23 * 4, ayPx: 46 * 4 })) },
    pictures: Object.fromEntries(PICTURES.filter((d) => d.key !== 'rapunzel').map((d) => [d.key, makeSprite(d.w, d.h, (t) => drawPicture(t, d.key), { ax: 0.5, ay: 0 })])),
    sconce: [0, 1, 2].map((f) => makeSprite(8, 15, (t) => drawSconce(t, f), undefined, { axPx: 4 * 4, ayPx: 12 * 4 })),
    niche: [0, 1].map((k) => makeSprite(18, 22, (t) => drawNiche(t, k), { ax: 0.5, ay: 0 })),
    keys: makeSprite(20, 14, drawKeys, { ax: 0.5, ay: 0 }),
    herbs: makeSprite(10, 15, drawHerbs, { ax: 0.5, ay: 0 }),
    clock: makeSprite(16, 20, drawClock, { ax: 0.5, ay: 0 }),
    pendulum: makeSprite(4, 12, drawPendulum, { ax: 0.5, ay: 0 }),
    tapestry: makeSprite(44, 36, drawTapestry, { ax: 0.5, ay: 0 }),
    ivyHang: makeSprite(12, 31, drawIvyHang, { ax: 0.5, ay: 0 }),
    ivyClimb: (() => { const L = makeSprite(22, 44, drawIvyClimb, { ax: 1, ay: 1 }); return { L, R: flipH(L) }; })(),
    hook: makeSprite(26, 42, drawHook, { ax: 0.5, ay: 0 }),
    mirror: makeSprite(24, 34, (t) => drawMirror(t, false), { ax: 0.5, ay: 0 }),
    mirrorWitch: makeSprite(24, 34, (t) => drawMirror(t, true), { ax: 0.5, ay: 0 }),
    bookcase: [0, 1, 2].map((k) => makeSprite(38, 62, (t) => drawBookcase(t, k), { ax: 0.5, ay: 0 })),
    ladder: makeSprite(9, 60, drawLadder, { ax: 0.5, ay: 1 }),
    scrolls: makeSprite(30, 40, drawScrolls, { ax: 0.5, ay: 0 }),
    lectern: [0, 1].map((f) => makeSprite(26, 34, (t) => drawLectern(t, f), { ax: 0.5, ay: 0 })),
    rune: [0, 1, 2].map((k) => makeSprite(5, 5, (t) => drawRune(t, k), { ax: 0.5, ay: 0.5 })),
    scroll: makeSprite(9, 20, drawScroll, { ax: 0.5, ay: 0 }),
    pile: makeSprite(14, 14, drawPile, { ax: 0.5, ay: 0 }),
    flyingBook: [0, 1].map((f) => makeSprite(11, 7, (t) => drawFlyingBook(t, f), { ax: 0.5, ay: 0.5 })),
    tome: [0, 1].map((f) => makeSprite(28, 22, (t) => drawTome(t, f), undefined, { axPx: 14 * 4, ayPx: 4 * 4 })),
    rack: makeSprite(26, 46, drawRack, { ax: 0.5, ay: 0 }),
    helmets: makeSprite(30, 16, drawHelmets, { ax: 0.5, ay: 0 }),
    table: makeSprite(30, 22, drawTable, { ax: 0.5, ay: 0 }),
    poster: makeSprite(16, 24, drawPoster, { ax: 0.5, ay: 0 }),
    horn: makeSprite(14, 12, drawHorn, { ax: 0.5, ay: 0 }),
    dial: makeSprite(34, 34, drawDial, { ax: 0.5, ay: 0.5 }),
    hand: [14, 10].map((n) => makeSprite(3, n, (t) => drawHand(t, n), { ax: 0.5, ay: 1 })),
    bellRope: makeSprite(5, 60, drawBellRope, { ax: 0.5, ay: 0 }),
    truss: makeSprite(46, 42, drawTruss, { ax: 0.5, ay: 0 }),
    owl: [false, true].map((s) => makeSprite(12, 13, (t) => drawOwl(t, s), { ax: 0.5, ay: 1 })),
    smallBell: makeSprite(9, 11, drawSmallBell, { ax: 0.5, ay: 0 }),
    coil: makeSprite(10, 13, drawCoil, { ax: 0.5, ay: 0 }),
    banner: [0, 1].map((k) => makeSprite(16, 36, (t) => drawBanner(t, k), { ax: 0.5, ay: 0 })),
    shield: makeSprite(22, 22, drawShield, { ax: 0.5, ay: 0.5 }),
    frame: makeSprite(24, 27, drawFrame, { ax: 0.5, ay: 0 }),
    chain: makeSprite(5, 10, drawChain, { ax: 0.5, ay: 0 }),
    chainEnd: makeSprite(9, 12, drawChainEnd, { ax: 0.5, ay: 0 }),
    gallery: { L: galleryL, R: galleryL.map(flipH) },
  };
}
