import { RNG, TAU } from '../util.js';

// More of what the tower's wall is built of and overgrown with, beside the
// bricks, the old stones, the crumbling wall and the masons' site, the ivy,
// the moss and the briar (art/tower.js, which lays these among its own:
// TOWER_AREAS, and says what an area is). Each is a look of its own that a
// whole stretch of the tower can have:
//   slate     the wall hung with slates against the weather, as the roofs
//             are: small scales in courses, dark and violet where the
//             bricks are light and green
//   timber    a storey or more built in timber: posts, rails and braces of
//             dark oak, the fields between them plastered
//   wisteria  (it grows on the wall) grey stems that wind up it, light
//             leaves, and its flowers hanging from every twig in violet
//             tails
// The wall is round and so are these: what is on it gets narrower toward
// the edges and takes the wall's planes of light (`wall`, art/tower.js's
// own measures, handed over so that this module needs nothing of that one).
export const CLADDING_AREAS = {
  slate: { loop: 2, overlay: false },
  timber: { loop: 3, overlay: false, band: 'timber' },
  wisteria: { loop: 4, overlay: true },
};
const seedOf = (j) => (typeof j === 'number' ? j : j === 'enter' ? 40 : 41);
const step = (ramp, k) => ramp[Math.max(0, Math.min(ramp.length - 1, k))];
const CAST = 'rgba(16, 26, 31, 0.5)';        // the shadow a thing throws on the wall under it (as art/tower.js has it)

// By plane of light, lit to shade.
const SLATE = ['#989abd', '#7e80a8', '#666892', '#4f5078', '#3c3d5f'];
const SLATE_LINE = ['#3c3d5f', '#343558', '#2c2d4d', '#252640', '#1e1f35'];      // the shadow under a course, and what is between two slates
const SLATE_BARE = '#1b1c2e', LICHEN = ['#8fa88c', '#748f7c', '#5c7669'];
const PLASTER = ['#d2c7ad', '#bfb399', '#a59a84', '#897f6e', '#6d665a'];
const BEAM = ['#8f6846', '#735238', '#5a3f2c', '#453023', '#34251c'];
const BEAM_DEEP = '#2a2019';
// The wisteria, by how much light it is in (lit, between, in shade).
const STEM = [{ hi: '#b09a7c', base: '#8c7860', dark: '#5f5143' }, { hi: '#96826a', base: '#766552', dark: '#4f4439' }, { hi: '#786858', base: '#5d5045', dark: '#3f3630' }];
const LEAF = [{ hi: '#c2e070', base: '#8fbd4a', dark: '#548f36' }, { hi: '#97c556', base: '#689d3e', dark: '#3d7532' }, { hi: '#6a9c4c', base: '#467c3a', dark: '#275832' }];
const BLOOM = [{ hi: '#efe2ff', base: '#c9aaf2', shade: '#a07cdc', dark: '#7a59b6' }, { hi: '#d8c4f8', base: '#ae90e4', shade: '#896aca', dark: '#654aa0' }, { hi: '#b8a0e4', base: '#9174cc', shade: '#7056ac', dark: '#513c88' }];
// The petals it lets go of (background.js): their two tones.
export const WISTERIA_PETAL = { hi: '#d8c4f8', base: '#ae90e4' };

// And what runs under a string course (`friezes`, each a strip the wall's
// width that hangs from the course's foot): a row of small round arches on
// little corbels, a row of teeth, a chequer of light and dark stone, a band
// of glazed tiles in blue and gold. FRIEZES: their heights, art px.
export const FRIEZES = { arches: 12, dentils: 4, checker: 6, tiles: 7 };
// `wall`: { A (the wall's width, art px), E (how far round one sees), brick (a brick's angle), xOf(a), planeAt(a), layWall(t, r),
// stone (dressed stone by plane of light), glaze: { blue, gold } (each lit, between, in shade), joint }.
export function claddingDraws(wall) {
  const { A, E, brick, xOf, planeAt, layWall } = wall, H = 48, ROW = 6;
  const angleAt = (x) => Math.asin(Math.max(-1, Math.min(1, ((x + 0.5) / (A / 2) - 1) * Math.sin(E))));
  const planeX = Array.from({ length: A }, (_, x) => planeAt(angleAt(x)));

  // --- slate ---------------------------------------------------------------------------
  // Courses of slates a brick's course high, each slate half a brick wide and
  // rounded at its foot, each course's joints off the one above it. A line of
  // shadow lies under every course (the slates of the one above stand proud
  // of it). They are not all one tone, here and there one is new or has
  // lichen on it, one or two are gone and show the dark of the battens, one
  // has slipped.
  function slateCourse(t, r, y, odd, gone = 0.012) {
    const { p } = t, da = brick / 2;
    p(0, y, A, ROW, SLATE[2]);
    for (let a = -E - (odd ? da / 2 : 0); a < E; a += da) {
      const a0 = Math.max(a, -E), a1 = Math.min(a + da, E), x0 = Math.round(xOf(a0)), x1 = Math.round(xOf(a1)), w = x1 - x0;
      if (w < 1) continue;
      const plane = planeAt((a0 + a1) / 2), u = r.next(), k = plane + (u < 0.14 ? -1 : u > 0.84 ? 1 : 0), line = SLATE_LINE[plane];
      if (w >= 5 && r.chance(gone)) {                                           // one that is gone: the batten it hung on, and the dark behind
        p(x0, y, w, ROW, SLATE_BARE); p(x0, y + 2, w, 1, step(BEAM, plane + 1)); p(x0, y, w, 1, line);
        continue;
      }
      const lichen = w >= 4 && r.chance(0.03);
      p(x0, y, w, ROW, lichen ? step(LICHEN, plane - 1) : step(SLATE, k));
      p(x0, y, w, 1, line);                                                     // in the shadow of the course above
      if (w >= 3) { p(x0, y + 1, 1, ROW - 2, step(SLATE, k + 1)); p(x0, y + ROW - 1, 1, 1, line); p(x1 - 1, y + ROW - 1, 1, 1, line); }      // the joint at its left, its rounded foot
      if (w >= 6) { p(x0 + 1, y + ROW - 1, 1, 1, step(SLATE, k + 1)); if (plane <= 2 && r.chance(0.5)) p(x0 + 2, y + 1, w - 4, 1, step(SLATE, k - 1)); }
      if (w >= 6 && r.chance(0.02)) { p(x0 + 1, y + ROW, w - 2, 2, step(SLATE, k)); p(x0 + 1, y + ROW + 2, w - 2, 1, line); }          // one that has slipped
    }
    p(0, y, 1, ROW, SLATE_LINE[1]); p(A - 1, y, 1, ROW, SLATE_LINE[4]);
  }
  function drawSlate(t, j) {
    const { p } = t, r = new RNG(7100 + seedOf(j) * 17);
    if (typeof j === 'number') { for (let n = 7; n >= 0; n--) slateCourse(t, r, n * ROW, (n + j) % 2 === 1); return; }
    layWall(t, r);
    if (j === 'enter') {
      // the area's lower end: the lowest course hangs over the bricks, dark underneath, and throws its shadow on them
      for (let n = 4; n >= 0; n--) slateCourse(t, r, n * ROW, n % 2 === 1, 0);
      p(0, 5 * ROW, A, 1, SLATE_BARE); p(0, 5 * ROW + 1, A, 2, CAST);
    } else {
      // its upper end: a board over the topmost course, under the bricks
      for (let n = 7; n >= 3; n--) slateCourse(t, r, n * ROW, n % 2 === 0, 0);
      for (let x = 0; x < A; x++) { const k = planeX[x]; p(x, 3 * ROW - 2, 1, 1, step(BEAM, k - 1)); p(x, 3 * ROW - 1, 1, 1, step(BEAM, k + 1)); }
      p(0, 3 * ROW, A, 1, SLATE_LINE[3]);
    }
  }

  // --- timber --------------------------------------------------------------------------
  // Posts two bricks apart round the tower, a rail across them every 24 rows,
  // the fields between plastered and lit by the wall's planes. In some fields
  // a brace leans toward the tower's middle, in some two cross, some have a
  // short rail of their own half way up; the plaster is in the shade under
  // every rail and right of every post, it is not of one tone, and here and
  // there it has a crack or a stain.
  const POSTS = [];
  for (let k = -6; k <= 6; k++) { const a = (k + 0.5) * 2 * brick; if (Math.abs(a) < E * 0.985) POSTS.push({ a, x: Math.round(xOf(a)), w: Math.max(1, Math.round(4.3 * Math.cos(a))), plane: planeAt(a) }); }
  const RAIL = 4;
  function rail(t, y, h = RAIL) {
    const { p } = t;
    for (let x = 0; x < A; x++) { const k = planeX[x]; p(x, y, 1, 1, step(BEAM, k - 1)); p(x, y + 1, 1, h - 2, BEAM[k]); p(x, y + h - 1, 1, 1, step(BEAM, k + 1)); }
    for (const q of POSTS) p(q.x + (q.w >> 1), y + 1, 1, 1, step(BEAM, q.plane + 2));          // the pegs
  }
  function fieldRow(t, r, y, h) {
    const { p, line } = t, y0 = y + RAIL, fh = h - RAIL;
    for (let x = 0; x < A; x++) { const k = planeX[x]; p(x, y0, 1, fh, PLASTER[k]); p(x, y0, 1, 1, step(PLASTER, k + 1)); }
    // what is in a field: a brace, a cross, a rail of its own, a crack, a stain
    for (let i = 0; i < POSTS.length - 1; i++) {
      const L = POSTS[i], R = POSTS[i + 1], x0 = L.x + L.w, x1 = R.x - 1, fw = x1 - x0 + 1, mid = (L.a + R.a) / 2, k = planeAt(mid), u = r.next();
      if (fw < 4) continue;
      // the plaster was put on by hand: lighter and darker places in it
      for (let n = Math.round(fw / 5); n > 0; n--) p(x0 + r.int(1, Math.max(1, fw - 4)), y0 + r.int(2, fh - 3), r.int(2, 3), r.int(1, 2), step(PLASTER, k + (r.chance(0.6) ? 1 : -1)));
      const wood = step(BEAM, k), up = mid < 0 ? [x0, y0 + fh - 1, x1 - 2, y0] : [x1 - 2, y0 + fh - 1, x0, y0];      // from a post's foot up to the rail, toward the middle
      const brace = (q, col) => { for (let d = 0; d < (fw >= 12 ? 3 : 2); d++) line(q[0] + d, q[1], q[2] + d, q[3], d === 0 && fw >= 12 ? step(BEAM, k - 1) : col); };
      const half = y0 + (fh >> 1) - 1;
      if (u < 0.3) brace(up, wood);
      else if (u < 0.44 && fw >= 9) { brace([up[2], up[1], up[0], up[3]], step(BEAM, k + 1)); brace(up, wood); }
      else if (u < 0.6) { p(x0, half, fw, 3, wood); p(x0, half, fw, 1, step(BEAM, k - 1)); p(x0, half + 3, fw, 1, step(PLASTER, k + 1)); if (u < 0.5 && fw >= 9) brace([up[0], up[1], up[2], half + 3], wood); }
      else if (u < 0.7 && fw >= 8) { let cx = x0 + r.int(2, fw - 3), cy = y0 + 2; for (let n = r.int(5, 10); n > 0 && cy < y0 + fh - 1; n--, cy++) { p(cx, cy, 1, 1, step(PLASTER, k + 2)); if (r.chance(0.45)) cx += r.sign(); cx = Math.max(x0 + 1, Math.min(x1 - 1, cx)); } }
      else if (u < 0.8) { const px = x0 + r.int(1, Math.max(1, fw - 3)); p(px, y0 + 1, 1, r.int(3, 9), step(PLASTER, k + 1)); }
      p(x0, y0, 1, fh, step(PLASTER, k + 1));                                      // in the shade right of its post
    }
    rail(t, y);
    for (const q of POSTS) { p(q.x, y0, q.w, fh, BEAM[q.plane]); if (q.w >= 3) p(q.x, y0, 1, fh, step(BEAM, q.plane - 1)); }
    p(0, y, 1, h, BEAM[2]); p(A - 2, y, 2, h, BEAM[4]);                            // the corner posts
  }
  function drawTimber(t, j) {
    const { p } = t, r = new RNG(7300 + seedOf(j) * 19);
    if (typeof j === 'number') { fieldRow(t, r, 0, 24); fieldRow(t, r, 24, 24); return; }
    layWall(t, r);
    if (j === 'enter') {
      // the area's lower end: its sill beam on the bricks, the ends of the floor's beams under it, their shadow
      fieldRow(t, r, 0, 24); rail(t, 24, 5);
      p(0, 29, A, 2, CAST);
      for (const q of POSTS) { p(q.x, 29, q.w + 1, 3, step(BEAM, q.plane + 1)); p(q.x, 29, q.w + 1, 1, BEAM[q.plane]); p(q.x, 32, q.w + 1, 1, CAST); }
    } else {
      // its upper end: the plate on top of the posts, and the bricks begin on it
      fieldRow(t, r, 24, 24); rail(t, 21, 4);
    }
  }
  // The string course where the wall is timber: a beam, and the ends of the floor's beams looking out under it.
  function drawTimberBand(t) {
    const { p } = t;
    for (let x = 0; x < A; x++) { const k = planeX[x]; p(x, 0, 1, 1, step(BEAM, k - 1)); p(x, 1, 1, 2, BEAM[k]); p(x, 3, 1, 1, step(BEAM, k + 1)); p(x, 4, 1, 2, CAST); }
    for (let k = -13; k <= 13; k++) {
      const a = k * brick; if (Math.abs(a) > E * 0.97) continue;
      const x = Math.round(xOf(a)), w = Math.max(1, Math.round(4 * Math.cos(a))), q = planeAt(a);
      p(x, 3, w, 3, step(BEAM, q + 1)); p(x, 3, w, 1, BEAM[q]); if (w >= 3) p(x + 1, 4, 1, 1, BEAM_DEEP);
    }
    p(A - 1, 0, 1, 4, BEAM_DEEP);
  }

  // --- wisteria ------------------------------------------------------------------------
  // Three stems wind up the wall, each along its own line round the tower
  // (the same from tile to tile, so the loop has no seam). Twigs go out from
  // them to either side, leaves in pairs along each twig, and under it the
  // flowers hang in tails that are thick at the top and end in a point.
  const WIST = { stems: [{ a: -0.52, amp: 0.1, m: 1, ph: 0.4 }, { a: -0.4, amp: 0.13, m: 2, ph: 2.2 }, { a: 0.42, amp: 0.11, m: 1, ph: 3.6 }] };
  const WIST_P = CLADDING_AREAS.wisteria.loop * H;
  const stemA = (s, u) => (s.a + s.amp * Math.sin(TAU * u * s.m / WIST_P + s.ph) + 0.03 * Math.sin(TAU * u * 5 / WIST_P + s.ph * 2)) * E;
  const light = (a) => Math.min(2, Math.max(0, planeAt(a) - 1));
  function tail(t, r, x, y, len, a) {
    const { p } = t, B = BLOOM[light(a)];
    for (let i = 0; i < len; i++) {
      const f = i / len, w = f < 0.45 ? 3 : f < 0.8 ? 2 : 1, xx = x - (w >> 1) + (w === 3 ? 0 : i % 2);
      p(xx, y + i, w, 1, i % 3 === 2 ? B.shade : B.base);
      if (w >= 2) p(xx, y + i, 1, 1, i % 2 ? B.base : B.hi);
      if (w === 3) p(xx + 2, y + i, 1, 1, B.shade);
    }
    p(x, y + len, 1, 1, B.dark);
    if (r.chance(0.5)) p(x + (r.chance(0.5) ? 2 : -2), y + r.int(1, 3), 1, 1, B.hi);          // a floret beside it
  }
  function leaves(t, r, x, y, a) {
    const { p } = t, G = LEAF[light(a)];
    p(x, y - 1, 2, 1, G.base); p(x, y - 2, 1, 1, r.chance(0.6) ? G.hi : G.base); if (r.chance(0.5)) p(x + 1, y + 1, 1, 1, G.dark);
  }
  function drawWisteria(t, j) {
    const { p } = t, r = new RNG(7500 + seedOf(j) * 23);
    const u0 = typeof j === 'number' ? j * H : j === 'enter' ? -H : 0;             // how far up its loop the tile's foot is
    // where it thins out: at the area's lower end its stems hang down so far and end, at its upper end they begin so far up
    const from = (n) => (j === 'leave' ? [20, 30, 12][n] : 0), to = (n) => (j === 'enter' ? [34, 22, 40][n] : H);
    const twigs = [];
    WIST.stems.forEach((s, n) => {
      for (let y = from(n); y < to(n); y++) {
        const u = u0 + (H - 1 - y), a = stemA(s, u), x = Math.round(xOf(a)), S = STEM[light(a)], thin = n === 1 || y < from(n) + 5 || y > to(n) - 5;
        p(x, y, thin ? 1 : 2, 1, S.base); if (!thin) p(x, y, 1, 1, S.hi);
        if (r.chance(0.05)) p(x + (thin ? 0 : 1), y, 1, 1, S.dark);
      }
      // its twigs, to either side in turn, none so low in the tile that its flowers would be cut off
      for (let y = Math.max(4, from(n) + 2) + r.int(0, 3), side = r.sign(); y < Math.min(36, to(n) - 3); y += r.int(4, 8), side = -side) {
        const a = stemA(s, u0 + (H - 1 - y));
        twigs.push({ a, y, side, len: r.range(0.1, 0.24) * E, n });
      }
    });
    for (const w of twigs) {
      const x0 = Math.round(xOf(w.a)), a1 = Math.max(-0.95 * E, Math.min(0.95 * E, w.a + w.side * w.len)), x1 = Math.round(xOf(a1)), S = STEM[light(w.a)];
      const n = Math.abs(x1 - x0);
      if (n < 3) continue;
      for (let i = 1; i <= n; i++) {
        const x = x0 + Math.sign(x1 - x0) * i, y = w.y + Math.round(2.2 * (i / n) ** 2), a = w.a + (a1 - w.a) * (i / n);
        p(x, y, 1, 1, S.dark);
        if (i % 3 === 1) leaves(t, r, x, y, a);
        if ((i % 5 === 2 || i === n) && y + 3 < H) tail(t, r, x, y + 1, Math.min(H - y - 3, r.int(6, 11)), a);
      }
    }
    // a tail or two from the stems themselves, and leaves along them
    WIST.stems.forEach((s, n) => {
      for (let y = from(n) + 3; y < to(n) - 2; y += r.int(5, 9)) { const a = stemA(s, u0 + (H - 1 - y)), x = Math.round(xOf(a)); leaves(t, r, x + r.pick([-2, 2]), y, a); if (r.chance(0.35) && y < 36) tail(t, r, x + r.pick([-2, 3]), y + 1, r.int(5, 8), a); }
      if (j === 'enter') { const y = to(n), a = stemA(s, u0 + (H - 1 - y)); tail(t, r, Math.round(xOf(a)), y, 7, a); }      // each hanging end in flower
    });
  }

  // --- friezes -------------------------------------------------------------------------
  const STONE = wall.stone;
  // Whatever is laid round the tower in pieces `da` wide: fn(x0, x1, plane, n) for each, left to right.
  const round = (da, fn) => { for (let a = -E, n = 0; a < E - 1e-6; a += da, n++) { const a1 = Math.min(a + da, E), x0 = Math.round(xOf(a)), x1 = Math.round(xOf(a1)); if (x1 > x0) fn(x0, x1, planeAt((a + a1) / 2), n); } };
  // Round arches side by side, a blind arcade: two rows of stone they are cut from, each arch a recess in the wall's
  // shade with a round head, a pier between two of them, and under every pier a corbel that steps back to the wall.
  function drawArches(t) {
    const { p } = t, deep = CAST, dim = 'rgba(16, 26, 31, 0.28)';
    for (let x = 0; x < A; x++) { const k = planeX[x]; p(x, 0, 1, 1, STONE[k]); p(x, 1, 1, 1, step(STONE, k + 1)); }
    round(brick * 0.95, (x0, x1, k) => {
      const w = x1 - x0, pier = w >= 9 ? 3 : w >= 5 ? 2 : 1, in0 = x0 + pier, iw = w - pier, st = STONE[k], sh = step(STONE, k + 1);
      p(in0, 2, iw, 4, deep); p(in0, 6, iw, 4, dim);                                                  // the recess: the wall behind, in shade
      if (iw >= 4) { p(in0, 2, 1, 2, st); p(in0 + iw - 1, 2, 1, 2, sh); p(in0 + 1, 2, 1, 1, st); p(in0 + iw - 2, 2, 1, 1, sh); }      // the round of its head
      p(x0, 2, pier, 8, st); if (pier > 1) p(x0 + pier - 1, 2, 1, 8, sh); if (pier > 2) p(x0, 2, 1, 8, step(STONE, k - 1));
      p(x0, 10, pier, 1, sh); p(x0, 11, Math.max(1, pier - 1), 1, step(STONE, k + 2));               // its corbel
    });
  }
  // Teeth: small blocks under the course with the dark between them.
  function drawDentils(t) {
    const { p } = t;
    p(0, 0, A, 2, CAST);
    round(brick * 0.3, (x0, x1, k) => { const w = Math.max(1, Math.ceil((x1 - x0) * 0.6)); p(x0, 0, w, 3, step(STONE, k + 1)); p(x0, 0, w, 1, STONE[k]); p(x0, 3, w, 1, CAST); });
  }
  // A chequer: two rows of small squares, light and dark stone in turn.
  function drawChecker(t) {
    const { p } = t;
    round(brick * 0.22, (x0, x1, k, n) => { const w = x1 - x0, a = step(STONE, k - 1), b = step(STONE, k + 2); p(x0, 0, w, 3, n % 2 ? a : b); p(x0, 3, w, 2, n % 2 ? b : a); });
    p(0, 5, A, 1, CAST);
  }
  // Glazed tiles: blue and gold in turn, each with a small flower of the other colour, between two lines of stone.
  function drawTiles(t) {
    const { p } = t, G = wall.glaze;
    for (let x = 0; x < A; x++) { const k = planeX[x]; p(x, 0, 1, 1, step(STONE, k + 1)); p(x, 6, 1, 1, step(STONE, k + 2)); }
    round(brick * 0.43, (x0, x1, k, n) => {
      const w = x1 - x0, l = Math.min(2, Math.max(0, k - 1)), own = (n % 2 ? G.gold : G.blue)[l], other = (n % 2 ? G.blue : G.gold)[l], xc = x0 + (w >> 1);
      p(x0, 1, w, 5, own); p(x0, 1, 1, 5, wall.joint);
      if (w >= 3) p(xc, 3, 1, 1, other);
      if (w >= 5) { p(xc - 1, 3, 3, 1, other); p(xc, 2, 1, 3, other); p(xc, 3, 1, 1, (n % 2 ? G.gold : G.blue)[0]); }
      if (w >= 3) p(x0 + 1, 1, w - 1, 1, (n % 2 ? G.gold : G.blue)[Math.max(0, l - 1)]);
    });
  }

  return {
    areas: { slate: drawSlate, timber: drawTimber, wisteria: drawWisteria }, bands: { timber: drawTimberBand },
    friezes: { arches: drawArches, dentils: drawDentils, checker: drawChecker, tiles: drawTiles },
  };
}
