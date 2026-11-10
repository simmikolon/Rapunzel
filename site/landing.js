// The landing page around the game. The HTML reads fine on its own; this
// script draws the game's own art over it with the game's own code: the
// sprites from /play/src/art/, the wooden signs, ribbons, tags and brass
// plates from /play/src/sign.js, the lettering from art/logo.js. Nothing is
// copied, so the page keeps looking like the game when the art changes. If
// the game's modules cannot be loaded the page stays as the HTML and CSS
// draw it (landing.css has a plain fallback for every piece).
//
// Every canvas here holds one pixel per art pixel and is shown at --art CSS
// px per art pixel with image-rendering: pixelated, so the pixels stay
// square at any size. Positions are the game's logical px (4 per art pixel).

const GAME = '/play/src/';
const A = 4;                                   // logical px per art pixel (config.js PX)
const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const artPx = () => parseFloat(getComputedStyle(root).getPropertyValue('--art')) || 2;

// ------------------------------------------------------------------ drawing
function canvas(cls) {
  const c = document.createElement('canvas');
  c.className = cls;
  c.setAttribute('aria-hidden', 'true');
  return c;
}

// The game's renderer facade (gfx/renderer.js), reduced to the two calls
// sign.js and logo.js make, drawing into `c` at one pixel per art pixel.
function painter(c, wLog, hLog) {
  c.width = Math.max(1, Math.ceil(wLog / A));
  c.height = Math.max(1, Math.ceil(hLog / A));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const q = (v) => Math.round(v / A);
  return {
    ctx,
    clear() { ctx.clearRect(0, 0, c.width, c.height); },
    rect(x, y, w, h, color, alpha = 1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(q(x), q(y), q(w), q(h));
    },
    // A sprite with its anchor at (x, y); o: alpha, sx, sy (about the anchor), rot
    blit(s, x, y, o) {
      const sx = o && o.sx != null ? o.sx : 1, sy = o && o.sy != null ? o.sy : 1;
      ctx.globalAlpha = o && o.alpha != null ? o.alpha : 1;
      if (o && o.rot) {
        ctx.save();
        ctx.translate(q(x), q(y));
        ctx.rotate(o.rot);
        ctx.drawImage(s.canvas, -s.ax * sx / A, -s.ay * sy / A, s.w * sx / A, s.h * sy / A);
        ctx.restore();
        return;
      }
      ctx.drawImage(s.canvas, q(x - s.ax * sx), q(y - s.ay * sy), q(s.w * sx), q(s.h * sy));
    },
  };
}

// A sprite (or a few) baked into one small image at one pixel per art pixel,
// for CSS backgrounds.
function bake(wArt, hArt, draw) {
  const c = document.createElement('canvas');
  const g = painter(c, wArt * A, hArt * A);
  draw(g);
  return `url(${c.toDataURL()})`;
}

// A tiny deterministic random source, so the scene is the same on every visit.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------- the clock
// One requestAnimationFrame loop for everything that moves; a piece only
// redraws while it is on screen, and nothing moves with reduced motion.
const movers = new Set();
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.target.__mover) e.target.__mover.visible = e.isIntersecting;
}, { rootMargin: '80px' });
function moving(el, frame) {
  const m = { visible: true, frame };
  el.__mover = m;
  seen.observe(el);
  movers.add(m);
  return m;
}
function loop(ms) {
  const t = ms / 1000;
  for (const m of movers) if (m.visible) m.frame(t);
  requestAnimationFrame(loop);
}

// ------------------------------------------------------------ drawn boxes
// A canvas behind an element, sized to it on the art grid. measure(s) gives
// the element's size and the margin around it in logical px ({ w, h, m: [left,
// top, right, bottom] }); draw(g, box, t) paints it. Relaid out whenever the
// watched element changes size.
const boxes = [];
const resized = new ResizeObserver((entries) => {
  for (const e of entries) if (e.target.__box) e.target.__box.layout();
});
function drawnBox(el, { measure, draw, live = false, watch = el }) {
  const c = canvas('backdrop');
  el.prepend(c);
  el.classList.add('drawn');
  let g = null, box = null, last = 1;   // not 0: Rapunzel blinks at the start of every 4.3 s
  const item = {
    layout() {
      const s = artPx();
      const r = measure(s);
      if (!r || r.w <= 0 || r.h <= 0) return;
      const m = r.m || [0, 0, 0, 0];
      box = { s, w: r.w, h: r.h, x: m[0], y: m[1] };
      g = painter(c, m[0] + r.w + m[2], m[1] + r.h + m[3]);
      Object.assign(c.style, {
        left: `${(-m[0] / A) * s}px`, top: `${(-m[1] / A) * s}px`,
        width: `${c.width * s}px`, height: `${c.height * s}px`,
      });
      item.paint(last);
    },
    paint(t) {
      last = t;
      if (!g) return;
      g.clear();
      draw(g, box, t);
    },
  };
  watch.__box = item;
  resized.observe(watch);
  boxes.push(item);
  if (live && !STILL) moving(el, (t) => item.paint(t));
  return item;
}
const snapW = (el, s) => Math.floor(el.offsetWidth / s) * A;
const snapH = (el, s) => Math.round(el.offsetHeight / s) * A;

// ------------------------------------------------------------------- main
async function main() {
  const load = (p) => import(GAME + p);
  const [
    { buildPrince }, { buildCreatures }, { buildSign }, { buildLogo, drawWord, wordWidth, WORD_ADVANCE },
    { buildTiles }, { buildLanterns }, { buildWindows }, { buildPlatforms }, { buildClouds },
    sign,
  ] = await Promise.all([
    load('art/prince.js'), load('art/creatures.js'), load('art/sign.js'), load('art/logo.js'),
    load('art/tiles.js'), load('art/lanterns.js'), load('art/windows.js'), load('art/platforms.js'), load('art/clouds.js'),
    load('sign.js'),
  ]);
  const art = {
    prince: buildPrince(), creatures: buildCreatures(), sign: buildSign(), logo: buildLogo(),
    tiles: buildTiles(), lanterns: buildLanterns(), windows: buildWindows(), platforms: buildPlatforms(),
    clouds: buildClouds(),
  };
  const ctx = { art, sign, drawWord, wordWidth, WORD_ADVANCE };

  // What sits on the signs first, so a sign measures its text at its final size.
  scene(ctx);
  wordmark(document.querySelector('.wordmark'), ctx);
  document.querySelectorAll('.letters').forEach((el) => letters(el, ctx));
  document.querySelectorAll('.play').forEach((el) => ribbon(el, ctx));
  best(document.querySelector('.best'), ctx);
  document.querySelectorAll('.card, .way, .panel').forEach((el) => drawnBox(el, {
    measure: (s) => ({ w: snapW(el, s), h: snapH(el, s), m: [0, 0, 4, 4] }),
    draw: (g, b) => sign.drawPlankTag(g, b.x, b.y, b.w, b.h),
  }));
  document.querySelectorAll('.card').forEach((el) => cast(el, ctx));
  // the letter: a bow before the dedication, the game's heart after "Love, Dad."
  document.querySelectorAll('.letter__bow').forEach((el) => el.append(sprite(art.sign.bow, 'bow')));
  document.querySelectorAll('.pixel-heart').forEach((el) => { el.textContent = ''; el.append(sprite(art.creatures.heart, 'heart')); });
  lawn(document.querySelector('.lawn'), ctx);
  const signs = [...document.querySelectorAll('[data-sign]')];
  signs.forEach((el, i) => woodenSign(el, signs[i - 1] || null, ctx));
  // after the signs: he stands where the first sign ends
  const prince = stage(document.querySelector('.stage'), ctx);
  const planes = parallax();

  root.classList.add('art');
  const relayout = () => boxes.forEach((b) => b.layout());
  relayout();
  // Whenever the page changes height (signs growing a board, the pixel font
  // arriving) the prince moves with his place and the planes get new lengths.
  const settle = () => { if (prince) prince.place(); if (planes) planes.size(); placeCreatures(); };
  new ResizeObserver(settle).observe(document.body);
  if (document.fonts) document.fonts.ready.then(relayout);
  let pending = 0;
  addEventListener('resize', () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(() => { relayout(); settle(); }); });
  settle();
  if (!STILL) requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- parallax
// The scene's two planes follow the scroll more slowly than the page: the
// far one (sky, forest) at FAR, the middle one (tower, braid, the prince and
// the creatures) at MID of it, so the signs pass in front of the tower and
// the tower in front of the sky. A plane is long enough to reach the
// bottom of the page at the last scroll position, plus what the page itself
// would still move over it when scrolling back (so the tower never lifts
// off the lawn). Nothing moves with reduced motion; the planes then span
// the page as they do without this script.
const FAR = 0.3, MID = 0.7;
function parallax() {
  if (STILL) return null;
  const far = document.querySelector('.layer--far'), mid = document.querySelector('.layer--mid');
  if (!far || !mid) return null;
  root.classList.add('parallax');
  const place = () => {
    const y = scrollY;
    far.style.transform = `translate3d(0, ${(-y * FAR).toFixed(1)}px, 0)`;
    mid.style.transform = `translate3d(0, ${(-y * MID).toFixed(1)}px, 0)`;
  };
  const size = () => {
    const vh = innerHeight, max = Math.max(0, root.scrollHeight - vh);
    far.style.height = `${Math.ceil(max * FAR + vh * (2 - FAR))}px`;
    mid.style.height = `${Math.ceil(max * MID + vh * (2 - MID))}px`;
    place();
  };
  addEventListener('scroll', place, { passive: true });
  return { size };
}

// ------------------------------------------------------------------ scene
// The page is the tower: night sky with the moon and rising lanterns at the
// top, the tower with its windows and Rapunzel's braid all the way down,
// the forest closing in toward the bottom and the lawn at the very end.
function scene({ art }) {
  const { tiles, windows, platforms } = art;
  const r = rng(7);
  const set = (name, value) => root.style.setProperty(name, value);

  // stars: single art pixels and a few small crosses on a 160 x 160 tile
  set('--stars', bake(160, 160, (g) => {
    const colors = ['#ffffff', '#fff1a8', '#a5cbbb', '#ffd1e3'];
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(r() * 160) * A, y = Math.floor(r() * 160) * A, c = colors[i % 4];
      g.rect(x, y, A, A, c, 0.35 + r() * 0.55);
      if (i % 9 === 0) { g.rect(x - A, y, A, A, c, 0.4); g.rect(x + A, y, A, A, c, 0.4); g.rect(x, y - A, A, A, c, 0.4); g.rect(x, y + A, A, A, c, 0.4); }
    }
  }));

  // the tower: twelve courses of bricks, windows left and right of the braid
  const COURSES = 12, TW = 95, TH = 48;
  set('--tower', bake(TW, TH * COURSES, (g) => {
    for (let i = 0; i < COURSES; i++) {
      const s = tiles.tower[Math.floor(r() * tiles.tower.length)];
      g.blit(s, s.ax, (i + 1) * TH * A);
    }
    const slots = [[1, -1, 0], [3, 1, 3], [5, -1, 4], [7, 1, 1], [9, -1, 3], [11, 1, 0]];
    for (const [course, side, v] of slots) {
      const w = (side < 0 ? windows.L : windows.R)[v];
      g.blit(w, (TW / 2 + side * 27) * A, (course * TH + 36) * A);
    }
  }));

  // the braid with a ribbon and a bow tied to it now and then
  const BW = 44, STEP = 10, SEGS = 64;
  set('--braid', bake(BW, STEP * SEGS, (g) => {
    for (let i = -1; i < SEGS; i++) g.blit(tiles.braid, (BW / 2) * A, i * STEP * A);
    g.blit(platforms.ribbon, (BW / 2) * A, 150 * A);
    g.blit(platforms.bow, (BW / 2) * A, 420 * A);
  }));

  set('--forest', bake(192, 48, (g) => g.blit(tiles.forest[0], 0 + tiles.forest[0].ax, 48 * A)));
  set('--ground', bake(192, 36, (g) => g.blit(tiles.ground, tiles.ground.ax, tiles.ground.ay)));

  const sky = document.querySelector('.scene__sky');
  if (!sky) return;
  // the moon, a few clouds drifting by and lanterns rising into the night
  const moon = sprite(tiles.moon, 'moon');
  sky.append(moon);
  tiles.clouds.forEach((s, i) => {
    const c = sprite(s, 'cloud');
    c.style.setProperty('--y', `${[18, 52, 86][i]}vh`);
    c.style.setProperty('--d', `${[95, 70, 120][i]}s`);
    c.style.setProperty('--delay', `${[-20, -55, -90][i]}s`);
    sky.append(c);
  });
  // the creatures on the tower's plane: the witch over the first sign, the
  // others each in a gap between two signs (placed by placeCreatures)
  const mid = document.querySelector('.layer--mid');
  if (mid && !STILL) {
    const c = art.creatures;
    flyer(mid, c.witchR, 'witch', 4);
    // only where the page has those signs (not on the Impressum)
    const has = (a, b) => document.querySelector(a) && document.querySelector(b);
    if (has('#story', '#cast')) gapped.push([spider(mid, c.spider), '#story', '#cast']);
    if (has('#cast', '#controls')) gapped.push([flyer(mid, c.storkR, 'stork', 3), '#cast', '#controls']);
    if (has('#controls', '#iphone')) gapped.push([flyer(mid, c.crowR, 'crow', 8), '#controls', '#iphone']);
  }

  const spots = [[6, 0.9, 30, -4], [17, 0.5, 24, -14], [83, 0.75, 34, -9], [93, 0.5, 27, -20], [72, 0.4, 22, -2], [28, 0.4, 38, -25]];
  spots.forEach(([x, z, d, delay], i) => {
    const c = sprite(art.lanterns.big[i % 2], 'lantern');
    c.style.setProperty('--x', `${x}%`);
    c.style.setProperty('--z', z);
    c.style.setProperty('--d', `${d}s`);
    c.style.setProperty('--delay', `${delay}s`);
    sky.append(c);
  });
}

// A creature in the gap between two signs, where the tower shows: on the
// tower's plane, so it sits at the height where the gap is when that gap
// is in the middle of the window (with parallax the plane has fallen
// behind the page by then).
const gapped = [];
function placeCreatures() {
  const k = root.classList.contains('parallax') ? 1 - MID : 0;
  const vh = innerHeight, max = Math.max(0, root.scrollHeight - vh);
  for (const [el, a, b] of gapped) {
    const above = document.querySelector(a), below = document.querySelector(b);
    if (!above || !below) continue;
    const center = (above.getBoundingClientRect().bottom + below.getBoundingClientRect().top) / 2 + scrollY;
    const s = Math.min(max, Math.max(0, center - vh / 2));
    el.style.top = `${Math.round(center - k * s - el.offsetHeight / 2)}px`;
  }
}

// A creature crossing the plane (the path is CSS, .flyer), its frames
// flipping at `fps` while it is on screen.
function flyer(plane, frames, cls, fps) {
  const c = canvas(`sprite flyer ${cls}`);
  const g = painter(c, frames[0].w, frames[0].h);
  c.style.setProperty('--w', c.width);
  c.style.setProperty('--h', c.height);
  plane.append(c);
  let shown = -1;
  moving(c, (t) => {
    const f = step(t, fps, frames.length);
    if (f === shown) return;
    shown = f;
    g.clear();
    g.blit(frames[f], frames[f].ax, frames[f].ay);
  });
  return c;
}

// A spider bobbing on her thread beside the braid, short enough for a gap.
function spider(plane, frames) {
  const c = canvas('sprite spider');
  const W = frames[0].w, H = 30 * A;
  const g = painter(c, W, H);
  c.style.setProperty('--w', c.width);
  c.style.setProperty('--h', c.height);
  plane.append(c);
  moving(c, (t) => {
    const y = 24 + (1 - Math.cos(t * 1.1)) * 20;
    g.clear();
    g.rect(W / 2 - 2, 0, 4, y + 4, '#e8e8f0', 0.75);
    g.blit(frames[step(t, 3, 2)], W / 2, y);
  });
  return c;
}

// A sprite on its own little canvas, shown at --art (times --z) per art pixel.
function sprite(s, cls) {
  const c = canvas(`sprite ${cls}`);
  const g = painter(c, s.w, s.h);
  g.blit(s, s.ax, s.ay);
  c.style.setProperty('--w', c.width);
  c.style.setProperty('--h', c.height);
  return c;
}

// ------------------------------------------------------------------- signs
// The game's wooden sign behind a section, as many boards tall as its text
// needs, hanging on two ropes from the sign above it (the first one from the
// top of the page). Rapunzel peeks over the first one like on the title.
const RAP_X = 108;                    // title.js: her head this far in from the sign's right edge
function woodenSign(el, above, { art, sign }) {
  const body = el.querySelector('.sign__body');
  const top = el.dataset.sign === 'top';
  const M = 48;                       // room for the vines and the shadow
  drawnBox(el, {
    watch: body,
    measure(s) {
      const w = snapW(el, s);
      const need = Math.ceil(body.offsetHeight / s) * A;
      const boards = Math.max(2, Math.ceil((need - 2 * sign.FRAME + 4) / sign.BOARD));
      const h = sign.signHeight(boards);
      el.style.height = `${(h / A) * s}px`;
      // the ropes reach up to the sign above, or to the top of the page
      const y = el.getBoundingClientRect().top;
      const from = above ? above.getBoundingClientRect().bottom : -scrollY;
      const rope = Math.max(0, Math.round((y - from) / s) * A);
      return { w, h, m: [M, rope, M, top ? 168 : M] };
    },
    draw(g, b, t) {
      const hx = b.x + b.w - RAP_X, bob = top ? Math.sin(t * 1.7) * 3 : 0;
      if (top) {
        g.blit(art.tiles.braid, hx + 36, b.y - 40 + bob);
        g.blit((t % 4.3) < 0.13 ? art.sign.rapunzelBlink : art.sign.rapunzel, hx, b.y + 4 + bob);
      }
      sign.drawSign(g, art, b.x, b.y, b.w, b.h);
      if (top) {
        g.blit(art.sign.hands, hx, b.y + 8);
        const sway = Math.sin(t * 1.4), bottom = b.y + b.h;
        for (let i = 0; i < 2; i++) g.blit(art.tiles.braid, hx + 36 + sway * (3 + 5 * i), bottom - 12 + i * 40);
        g.blit(art.sign.bow, hx + 36 + sway * 14, bottom + 74);
      }
    },
    live: top,
  });
}

// ---------------------------------------------------------------- lettering
// SIR BOUNCEALOT with its letters hopping in a wave, as on the title screen
// (title.js drawTitle, the same numbers on a 720 x 244 piece of it).
function wordmark(h1, { art, WORD_ADVANCE }) {
  if (!h1) return;
  const c = canvas('wordmark__art');
  h1.append(c);
  h1.classList.add('drawn');
  const W = 720, Y0 = 128, logo = art.logo;
  const g = painter(c, W, 244);
  const frame = (t) => {
    g.clear();
    g.blit(logo.sir, W / 2, 224 - Y0 + Math.sin(t * 2) * 4);
    logo.letters.forEach((s, i) => {
      const wave = Math.sin(t * 3 - i * 0.55);
      const hop = Math.max(0, wave) * 12;
      const squash = wave < -0.6 ? 1 - (-wave - 0.6) * 0.25 : 1;
      g.blit(s, W / 2 + (i - 4.5) * WORD_ADVANCE, 352 - Y0 - hop, { sy: squash, sx: 2 - squash });
    });
  };
  frame(0.4);
  if (!STILL) moving(h1, frame);
}

// A heading in the game's gold (or pink) letters, wrapped onto as many lines
// as the sign is wide. The text stays in the page for screen readers and search.
function letters(el, { art, drawWord, wordWidth }) {
  const text = el.textContent.trim();
  const set = el.classList.contains('letters--pink') ? art.logo.pink2 : art.logo.gold2;
  el.textContent = '';
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;
  const c = canvas('letters__art');
  el.append(label, c);
  el.classList.add('drawn');
  const LINE = set.body + 32;
  const words = text.toUpperCase().replace(/[^A-Z0-9! ]/g, '').split(/\s+/);
  let key = '';
  const item = {
    layout() {
      const s = artPx();
      // its own height follows from the lines; only a new width can change them
      if (key === `${el.clientWidth}/${s}`) return;
      key = `${el.clientWidth}/${s}`;
      const avail = Math.max(set.adv * 4, Math.floor(el.clientWidth / s) * A - 16);
      const lines = [];
      for (const w of words) {
        const cur = lines.length ? `${lines[lines.length - 1]} ${w}` : w;
        if (lines.length && wordWidth(set, cur) <= avail) lines[lines.length - 1] = cur;
        else lines.push(w);
      }
      const wid = Math.max(...lines.map((l) => wordWidth(set, l))) + 24;
      const g = painter(c, wid, lines.length * LINE - 12);
      lines.forEach((l, i) => drawWord(g, set, l, wid / 2, i * LINE + set.body + 4));
      c.style.width = `${c.width * s}px`;
      c.style.height = `${c.height * s}px`;
    },
  };
  el.__box = item;
  resized.observe(el);
  boxes.push(item);
}

// PLAY on the game's ribbon banner with fluttering tails (hud.js ribbonButton).
function ribbon(el, { art, sign, drawWord }) {
  const set = art.logo.gold2;
  // the link's own word (PLAY, HOME, ...), in the letters the set has
  const word = (el.textContent.trim().toUpperCase().replace(/[^A-Z0-9! ]/g, '') || 'PLAY');
  drawnBox(el, {
    measure: (s) => ({ w: snapW(el, s), h: snapH(el, s), m: [0, 8, 12, 20] }),
    draw(g, b, t) {
      sign.drawRibbon(g, b.x, b.y, b.w, b.h, { t });
      drawWord(g, set, word, b.x + b.w / 2, b.y + b.h / 2 + set.body / 2 - 2);
    },
    live: true,
  });
}

// The best height from the game's own save, on its brass plate with a crown.
function best(el, { art, sign }) {
  if (!el) return;
  let m = 0;
  try {
    for (const key of ['bouncealot.web.v1', 'rapunzel.web.v1']) {      // config.js STORAGE_KEY, LEGACY_STORAGE_KEY
      const v = JSON.parse(localStorage.getItem(key) || '{}').best;
      if (v > 0) { m = Math.floor(v); break; }
    }
  } catch (_) { /* no storage, no plate */ }
  if (!m) return;
  el.querySelector('.best__m').textContent = m;
  el.hidden = false;
  drawnBox(el, {
    measure: (s) => ({ w: snapW(el, s), h: snapH(el, s), m: [0, 0, 4, 4] }),
    draw(g, b) {
      sign.drawPlaque(g, b.x, b.y, b.w, b.h);
      g.blit(art.logo.crown, b.x + 28, b.y + b.h / 2);
    },
  });
}

// ------------------------------------------------------------------- cast
// Each card's character, animated with its own frames, at the largest whole
// number of CSS px per art pixel that fits the card's picture area (at most
// 3, so a crow does not come out bigger than the prince).
function cast(card, { art }) {
  const host = card.querySelector('.card__art');
  const spec = CAST[card.dataset.cast] && CAST[card.dataset.cast](art);
  if (!host || !spec) return;
  const c = canvas('card__sprite');
  host.append(c);
  const [wA, hA] = spec.box;
  const g = painter(c, wA * A, hA * A);
  const frame = (t) => { g.clear(); spec.draw(g, t, wA * A, hA * A); };
  const item = {
    layout() {
      const z = Math.max(1, Math.min(3, Math.floor(Math.min(host.clientHeight / hA, host.clientWidth / wA))));
      c.style.width = `${wA * z}px`;
      c.style.height = `${hA * z}px`;
    },
  };
  host.__box = item;
  resized.observe(host);
  boxes.push(item);
  frame(0.3);
  if (!STILL) moving(card, frame);
}

const step = (t, fps, n) => Math.floor(t * fps) % n;
const CAST = {
  prince: (art) => ({
    box: [34, 68],
    draw(g, t, w, h) {
      const p = (t / 0.8) % 1, lift = 4 * p * (1 - p) * 32;
      const s = art.prince.right;
      const f = p < 0.06 || p > 0.97 ? s.bounceDown : p < 0.5 ? s.jumpUp : s.falling;
      g.blit(f, w / 2, h - lift);
    },
  }),
  rapunzel: (art) => ({
    box: [30, 50],
    draw(g, t) {
      // her braid comes out behind her right shoulder, as over the title's sign
      const sway = Math.sin(t * 1.4), hx = 48;
      for (let i = 0; i < 5; i++) g.blit(art.tiles.braid, hx + 36 + sway * i * 1.5, 40 + i * 32);
      g.blit(art.sign.bow, hx + 36 + sway * 7, 184);
      g.blit((t % 4.3) < 0.13 ? art.sign.rapunzelBlink : art.sign.rapunzel, hx, 84 + Math.sin(t * 1.7) * 3);
    },
  }),
  stork: (art) => ({
    box: [46, 26],
    draw(g, t, w) { g.blit(art.creatures.storkR[step(t, 3, 2)], w / 2, 40 + Math.sin(t * 3) * 4); },
  }),
  goodies: (art) => ({
    box: [46, 24],
    draw(g, t) {
      const c = art.creatures;
      g.blit(c.sun[step(t, 4, 2)], 32, 48 + Math.sin(t * 3) * 4);
      g.blit(c.lantern[step(t, 3, 2)], 92, 48 + Math.sin(t * 3 + 1) * 4);
      g.blit(c.heart, 152, 48 + Math.sin(t * 3 + 2) * 4);
    },
  }),
  witch: (art) => ({
    box: [40, 42],
    draw(g, t, w) { g.blit(art.creatures.witchR[step(t, 4, 2)], w / 2, 100 + Math.sin(t * 2) * 4); },
  }),
  squirrel: (art) => ({
    box: [24, 18],
    draw(g, t, w, h) { g.blit(art.creatures.squirrelR[[0, 0, 0, 0, 0, 2, 1, 0][step(t, 5, 8)]], w / 2, h); },
  }),
  crow: (art) => ({
    box: [22, 18],
    draw(g, t, w, h) { g.blit(art.creatures.crowR[step(t, 8, 3)], w / 2, h / 2 + Math.sin(t * 4) * 4); },
  }),
  spider: (art) => ({
    box: [18, 30],
    draw(g, t, w) {
      const y = 40 + Math.sin(t * 1.6) * 12;
      g.rect(w / 2 - 2, 0, 4, y + 4, '#e8e8f0', 0.8);
      g.blit(art.creatures.spider[step(t, 3, 2)], w / 2, y);
    },
  }),
  guard: (art) => ({
    box: [38, 50],
    draw(g, t, w, h) { g.blit(art.creatures.guardR[[0, 1, 0, 2, 0, 1, 0, 2, 3, 3, 0, 0][step(t, 4, 12)]], w / 2 - 8, h); },
  }),
  pot: (art) => ({
    box: [16, 16],
    draw(g, t, w, h) {
      const p = t % 2.4, wob = p > 1.6 ? (step(t, 14, 2) ? 4 : -4) : 0;
      g.blit(art.creatures.pots[Math.floor(t / 2.4) % 3], w / 2 + wob, h);
    },
  }),
};

// ------------------------------------------------------------ the stage
// Sir Bouncealot under the first sign, bouncing on a cloud like at the top
// of a run: hops of the title's height, now and then a higher one with a
// flip and sparkles (title.js / config.js HOP_VY and SHOWOFF_VY).
function stage(el, { art }) {
  if (!el) return null;
  const plane = document.querySelector('.layer--mid');
  const c = canvas('stage__art');
  (plane || el).append(c);
  // his place in the page, in the plane's coordinates (the same as the
  // page's at the top, where both planes start)
  const place = () => {
    const r = el.getBoundingClientRect();
    Object.assign(c.style, {
      left: `${r.left}px`, top: `${r.top + scrollY}px`, width: `${r.width}px`, height: `${r.height}px`,
    });
  };
  const W = 768, H = 616, GROUND = 560, G = 2100;
  const g = painter(c, W, H);
  const cloud = art.clouds.thick.normal[0];
  const P = art.prince;
  let y = 0, vy = 0, last = null, hops = 0, flip = 0, flipT = 0, face = 1, land = 1;
  const spark = [];
  const hop = () => {
    hops++;
    const show = hops % 5 === 0;
    vy = show ? 1120 : [820, 900, 980][hops % 3];
    flipT = show ? (2 * vy) / G : 0;
    flip = 0;
    if (hops % 7 === 0) face = -face;
  };
  const frame = (t) => {
    const dt = last == null ? 0 : Math.min(0.05, t - last);
    last = t;
    if (STILL) { y = 0; }
    else {
      vy -= G * dt;
      y += vy * dt;
      if (flipT) flip = Math.min(1, flip + dt / flipT);
      if (y <= 0 && vy < 0) {
        y = 0; land = 0;
        if (flipT) for (let i = 0; i < 6; i++) spark.push({ x: W / 2 + (i - 2.5) * 34, y: GROUND - 60 - (i % 2) * 40, t: 0 });
        hop();
      }
      land += dt;
    }
    for (const s of spark) s.t += dt;
    while (spark.length && spark[0].t > 0.6) spark.shift();
    g.clear();
    const squish = land < 0.08 ? 0.92 : 1;
    g.blit(cloud, W / 2, GROUND, { sy: squish, sx: 2 - squish });
    const side = face > 0 ? P.right : P.left;
    const f = STILL ? side.standing : land < 0.08 ? side.bounceDown : vy > 300 ? side.jumpUp : vy > -200 ? side.bounceUp : side.falling;
    const feet = GROUND + (land < 0.08 ? 4 : 0) - y;
    // the flip turns him about his middle, not his pogo tip
    if (flipT && flip < 1 && y > 0) g.blit({ ...f, ay: f.h / 2 }, W / 2, feet - f.h / 2, { rot: flip * Math.PI * 2 * face });
    else g.blit(f, W / 2, feet);
    for (const s of spark) g.blit(art.sign.sparkle, s.x, s.y - s.t * 60, { alpha: 1 - s.t / 0.6 });
  };
  hop();
  frame(0);
  if (!STILL) moving(c, frame);
  return { place };
}

// --------------------------------------------------------------- odds and ends
// The lawn at the bottom: the braid's loose end curled up on the grass.
function lawn(el, { art }) {
  if (!el) return;
  const ground = el.querySelector('.lawn__ground');
  if (ground) ground.append(sprite(art.tiles.braidEnd, 'braid-end'));
}

main().catch((e) => {
  // The page works without the art; say why in the console for whoever looks.
  console.warn('landing: drawn without the game art:', e);
});
