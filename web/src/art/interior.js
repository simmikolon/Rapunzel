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
    banner: [0, 1].map((k) => makeSprite(16, 36, (t) => drawBanner(t, k), { ax: 0.5, ay: 0 })),
    shield: makeSprite(22, 22, drawShield, { ax: 0.5, ay: 0.5 }),
    frame: makeSprite(24, 27, drawFrame, { ax: 0.5, ay: 0 }),
    chain: makeSprite(5, 10, drawChain, { ax: 0.5, ay: 0 }),
    chainEnd: makeSprite(9, 12, drawChainEnd, { ax: 0.5, ay: 0 }),
    gallery: { L: galleryL, R: galleryL.map(flipH) },
  };
}
