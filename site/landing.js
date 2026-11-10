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
  const episodes = fetch('/devlog/episodes.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [
    { buildPrince }, { buildCreatures }, { buildSign }, { buildLogo, drawWord, wordWidth, WORD_ADVANCE },
    { buildTiles }, { buildLanterns }, { buildWindows }, { buildPlatforms }, { buildClouds },
    sign, { PAL },
  ] = await Promise.all([
    load('art/prince.js'), load('art/creatures.js'), load('art/sign.js'), load('art/logo.js'),
    load('art/tiles.js'), load('art/lanterns.js'), load('art/windows.js'), load('art/platforms.js'), load('art/clouds.js'),
    load('sign.js'), load('palette.js'),
  ]);
  const art = {
    prince: buildPrince(), creatures: buildCreatures(), sign: buildSign(), logo: buildLogo(),
    tiles: buildTiles(), lanterns: buildLanterns(), windows: buildWindows(), platforms: buildPlatforms(),
    clouds: buildClouds(),
  };
  const ctx = { art, sign, drawWord, wordWidth, WORD_ADVANCE, C: PAL };

  // What sits on the signs first, so a sign measures its text at its final size.
  scene(ctx);
  wordmark(document.querySelector('.wordmark'), ctx);
  document.querySelectorAll('.letters').forEach((el) => letters(el, ctx));
  document.querySelectorAll('.play').forEach((el) => ribbon(el, ctx));
  best(document.querySelector('.best'), ctx);
  devlog(await episodes);
  document.querySelectorAll('.card, .way, .panel, .episode').forEach((el) => drawnBox(el, {
    measure: (s) => ({ w: snapW(el, s), h: snapH(el, s), m: [0, 0, 4, 4] }),
    draw: (g, b) => sign.drawPlankTag(g, b.x, b.y, b.w, b.h),
  }));
  document.querySelectorAll('.card').forEach((el) => cast(el, ctx));
  // the letter: a bow before the dedication, the game's heart after "Love, Dad."
  document.querySelectorAll('.letter__bow').forEach((el) => el.append(sprite(art.sign.bow, 'bow')));
  document.querySelectorAll('.pixel-heart').forEach((el) => { el.textContent = ''; el.append(sprite(art.creatures.heart, 'heart')); });
  lawn(document.querySelector('.lawn'), ctx);
  const signs = [...document.querySelectorAll('[data-sign]')];
  signs.forEach((el, i) => woodenSign(el, signs[i - 1] || document.querySelector('.summit'), ctx));
  // after the signs: he stands where the first sign ends
  const prince = stage(document.querySelector('.stage'), ctx);
  const planes = parallax();

  root.classList.add('art');
  const relayout = () => boxes.forEach((b) => b.layout());
  relayout();
  // Whenever the page changes height (signs growing a board, the pixel font
  // arriving) the prince moves with his place and the planes get new lengths.
  const settle = () => { if (prince) prince.place(); if (planes) planes.size(); placeCreatures(); };
  summitSeen(document.querySelector('.summit'));
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
//
// Above the first sign is the top of the tower (.summit), found by scrolling
// up from where the page opens. Down to that opening position the middle
// plane moves with the page, so the tower's top, Rapunzel's window and the
// beam the first sign hangs from stay together; the parallax starts below.
const FAR = 0.3, MID = 0.7;
// How far a plane has moved at scroll position s (no parallax: as the page).
let farT = (s) => s, midT = (s) => s;
function parallax() {
  if (STILL) return null;
  const far = document.querySelector('.layer--far'), mid = document.querySelector('.layer--mid');
  if (!far || !mid) return null;
  root.classList.add('parallax');
  const summit = document.querySelector('.summit');
  let s0 = 0;                                    // the page opens here (the summit's height)
  farT = (s) => s * FAR;
  midT = (s) => (s <= s0 ? s : s0 + (s - s0) * MID);
  const place = () => {
    const y = scrollY;
    far.style.transform = `translate3d(0, ${(-farT(y)).toFixed(1)}px, 0)`;
    mid.style.transform = `translate3d(0, ${(-midT(y)).toFixed(1)}px, 0)`;
  };
  const size = () => {
    s0 = summit ? summit.offsetHeight : 0;
    const vh = innerHeight, max = Math.max(0, root.scrollHeight - vh);
    far.style.height = `${Math.ceil(farT(max) + vh * (2 - FAR))}px`;
    mid.style.height = `${Math.ceil(midT(max) + vh * (2 - MID))}px`;
    place();
  };
  addEventListener('scroll', place, { passive: true });
  return { size };
}

// ------------------------------------------------------------------ scene
// The page is the tower: night sky with the moon and rising lanterns at the
// top, the tower with its windows and Rapunzel's braid all the way down,
// the forest closing in toward the bottom and the lawn at the very end.
function scene({ art, C }) {
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

  // stars that twinkle: a small plus that flickers, and a few bigger crosses
  // that flash up now and then; they live in the star field (and its fade)
  set('--twinkle', bake(3, 3, (g) => {
    g.rect(4, 4, 4, 4, '#ffffff');
    for (const [x, y] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.rect(x * A, y * A, A, A, '#cfe3ff', 0.75);
  }));
  set('--sparkle', bake(7, 7, (g) => {
    g.rect(3 * A, 3 * A, A, A, '#ffffff');
    for (const [d, a] of [[1, 0.95], [2, 0.6], [3, 0.3]]) {
      for (const [x, y] of [[3 - d, 3], [3 + d, 3], [3, 3 - d], [3, 3 + d]]) g.rect(x * A, y * A, A, A, d === 1 ? '#ffffff' : '#cfe3ff', a);
    }
    for (const [x, y] of [[2, 2], [4, 2], [2, 4], [4, 4]]) g.rect(x * A, y * A, A, A, '#ffffff', 0.35);
  }));
  const field = document.querySelector('.scene__stars');
  if (field) {
    for (let i = 0; i < 34; i++) {
      const big = i % 4 === 0;
      const star = document.createElement('i');
      star.className = big ? 'twinkle twinkle--big' : 'twinkle';
      star.style.left = `${(2 + r() * 96).toFixed(1)}%`;
      star.style.top = `${(1 + r() * 62).toFixed(1)}%`;
      star.style.setProperty('--d', `${(big ? 5 + r() * 6 : 2.2 + r() * 3).toFixed(2)}s`);
      star.style.setProperty('--delay', `${(-r() * 10).toFixed(2)}s`);
      field.append(star);
    }
  }

  set('--forest', bake(192, 48, (g) => g.blit(tiles.forest[0], 0 + tiles.forest[0].ax, 48 * A)));
  set('--ground', bake(192, 36, (g) => g.blit(tiles.ground, tiles.ground.ax, tiles.ground.ay)));

  const sky = document.querySelector('.scene__sky');
  if (!sky) return;
  // the moon, a few clouds drifting by and lanterns rising into the night
  moon = sprite(tiles.moon, 'moon');
  sky.append(moon);
  tiles.clouds.forEach((s, i) => {
    const c = sprite(s, 'cloud');
    c.style.setProperty('--y', `${[18, 52, 86][i]}vh`);
    c.style.setProperty('--d', `${[95, 70, 120][i]}s`);
    c.style.setProperty('--delay', `${[-20, -55, -90][i]}s`);
    sky.append(c);
  });
  // the top of the tower, on the tower's plane above where the page opens
  if (document.querySelector('.layer--mid') && document.querySelector('.summit')) towerTop(document.querySelector('.layer--mid'), art, C);

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
    if (has('#controls', '#devlog')) gapped.push([flyer(mid, c.crowR, 'crow', 8), '#controls', '#devlog']);
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

// ----------------------------------------------------------------- devlog
// The video devlog from /devlog/episodes.json ({ channel, episodes: [{ id,
// date, title, text }] }, newest first; tools/devlog_add.py adds one). Each
// list marked data-devlog shows the episodes (data-limit: only the newest
// few). Nothing is loaded from YouTube until a video is clicked: the
// picture is the one tools/devlog_add.py saved next to the list, the video
// comes from youtube-nocookie.com after the click (the privacy policy says
// so). Without episodes the page keeps its "coming soon" text.
function devlog(data) {
  const list = data && Array.isArray(data.episodes) ? data.episodes : [];
  if (!list.length) return;
  for (const ul of document.querySelectorAll('[data-devlog]')) {
    const limit = parseInt(ul.dataset.limit, 10) || list.length;
    for (const ep of list.slice(0, limit)) ul.append(episodeCard(ep));
    ul.hidden = false;
  }
  for (const el of document.querySelectorAll('[data-devlog-intro]')) el.textContent = el.dataset.devlogIntro;
  for (const el of document.querySelectorAll('[data-devlog-more]')) el.hidden = list.length <= (parseInt(el.dataset.devlogMore, 10) || 0);
  for (const a of document.querySelectorAll('.devlog__channel')) {
    if (data.channel) { a.href = data.channel; a.hidden = false; }
  }
  // the footer gets its link once there is something to see
  for (const nav of document.querySelectorAll('.links')) {
    if (nav.querySelector('a[href="/devlog/"]')) continue;
    const a = document.createElement('a');
    a.href = '/devlog/';
    a.textContent = 'Devlog';
    nav.insertBefore(a, nav.querySelector('a[href="/impressum/"]'));
  }
}

function episodeCard(ep) {
  const id = String(ep.id || '').replace(/[^A-Za-z0-9_-]/g, '');
  const li = document.createElement('li');
  li.className = 'episode';
  const when = ep.date ? new Date(`${ep.date}T12:00:00`) : null;
  const date = when && !isNaN(when) ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  li.innerHTML = `
    <div class="episode__video">
      <button class="episode__play" type="button">
        <img src="/devlog/thumbs/${id}.jpg" alt="" loading="lazy" decoding="async" width="640" height="360">
        <span class="episode__badge" aria-hidden="true"></span>
        <span class="sr-only"></span>
      </button>
    </div>
    <h3></h3>
    ${date ? `<time datetime="${ep.date}">${date}</time>` : ''}
    <p class="episode__text"></p>
    <p class="episode__note">A click loads the video from YouTube (Google) and sends them your IP address. <a href="/datenschutz/#youtube">Privacy</a> · <a class="episode__out" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Watch on YouTube</a></p>`;
  li.querySelector('h3').textContent = ep.title || '';
  li.querySelector('.episode__text').textContent = ep.text || '';
  li.querySelector('.episode__play .sr-only').textContent = `Play “${ep.title || 'video'}” (loads YouTube)`;
  li.querySelector('.episode__play').addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    frame.title = ep.title || 'Devlog video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    const box = li.querySelector('.episode__video');
    box.replaceChildren(frame);
    frame.focus();
  });
  return li;
}

// --------------------------------------------------------------- the summit
// The top of the tower above where the page opens: a pointed roof with a
// pennant, the eaves, and Rapunzel at her window, waiting, her braid over
// the sill and down the tower (the braid's strip starts at the sill). Drawn
// at one pixel per art pixel on a 150 x 210 piece of the tower's plane; the
// tower's bricks start under the eaves (landing.css: --summit-*).
const SUMMIT = { w: 150, h: 210, eave: 92, sill: 146 };
function towerTop(plane, art, C) {
  const c = canvas('summit-art');
  plane.append(c);
  const g = painter(c, SUMMIT.w * A, SUMMIT.h * A);
  const R = (x, y, w, h, color, a) => g.rect(x * A, y * A, w * A, h * A, color, a);
  const B = (s, x, y, o) => g.blit(s, x * A, y * A, o);
  // an arch: the upper half of a circle on a rectangle down to `bottom`
  const arch = (cx, cy, r, bottom, color, a) => {
    for (let dy = -r; dy < 0; dy++) { const h = Math.round(Math.sqrt(r * r - dy * dy)); R(cx - h, cy + dy, 2 * h, 1, color, a); }
    R(cx - r, cy, 2 * r, bottom - cy, color, a);
  };
  const ROOF = { hi: '#b86aa8', mid: '#8a4a86', lo: '#5e2e62', line: '#4a2350', edge: '#2a1430' };
  const CX = SUMMIT.w / 2, TIP = 24, E = SUMMIT.eave, S = SUMMIT.sill;
  const frame = (t) => {
    g.clear();
    // the pennant on its pole, fluttering
    R(CX - 1, 6, 2, TIP - 6, C.pole); R(CX - 1, 6, 1, TIP - 6, C.poleHi);
    R(CX - 2, 3, 4, 3, C.gold); R(CX - 1, 3, 1, 1, C.braidHi);
    const flag = step(t, 3, 2) ? [12, 13, 12, 10, 8, 6, 3, 1] : [10, 12, 13, 12, 9, 6, 4, 1];
    flag.forEach((len, i) => { R(CX + 1, 7 + i, len, 1, i < 2 ? C.bowHi : C.bow); R(CX + len, 7 + i, 1, 1, C.bowDark); });
    // the roof, row by row: lit on the left, in shade on the right, rows of tiles
    for (let y = TIP; y < E; y++) {
      const hw = Math.round(2 + ((y - TIP) / (E - TIP)) * 60), x0 = CX - hw;
      R(x0, y, 2 * hw, 1, ROOF.mid);
      R(x0, y, Math.max(1, Math.round(hw * 0.4)), 1, ROOF.hi);
      R(CX + Math.round(hw * 0.4), y, hw - Math.round(hw * 0.4), 1, ROOF.lo);
      if ((y - TIP) % 6 === 5) for (let x = x0 + ((y / 6) % 2 ? 0 : 2); x < CX + hw - 1; x += 4) R(x, y, 2, 1, ROOF.line);
      R(x0 - 1, y, 1, 1, ROOF.edge); R(CX + hw, y, 1, 1, ROOF.edge);
    }
    // the eaves: a stone band with corbels under it
    R(9, E, SUMMIT.w - 18, 6, C.stoneDark); R(9, E, SUMMIT.w - 18, 2, C.stoneLight); R(9, E + 4, SUMMIT.w - 18, 2, C.stoneShade);
    for (let x = 16; x < SUMMIT.w - 16; x += 10) { R(x, E + 6, 4, 3, C.stoneDark); R(x, E + 6, 4, 1, C.stone); }
    // Rapunzel's window: warm light, a stone frame, her braid behind her
    arch(CX, S - 22, 26, S + 6, C.lanternGlow, 0.08);
    arch(CX, S - 24, 20, S + 2, C.stoneShade);
    arch(CX, S - 24, 19, S + 1, C.stone);
    arch(CX, S - 24, 16, S, '#221a33');
    arch(CX, S - 20, 12, S, '#3a2a45');
    const bob = Math.round(Math.sin(t * 1.7) * 0.6);
    B(art.tiles.braid, CX, S - 20); B(art.tiles.braid, CX, S - 10);
    B((t % 4.3) < 0.13 ? art.sign.rapunzelBlink : art.sign.rapunzel, CX - 8, S + 1 + bob);
    R(CX - 23, S, 46, 5, C.stone); R(CX - 23, S, 46, 1, C.stoneLight); R(CX - 23, S + 4, 46, 1, C.stoneShade);
    B(art.sign.hands, CX - 8, S + 3);
    for (let y = S; y < SUMMIT.h; y += 10) B(art.tiles.braid, CX, y);
    B(art.creatures.pots[0], CX + 17, S);
  };
  frame(1);
  if (!STILL) moving(c, frame);
}

// The speech bubble pops up whenever the summit comes into view.
function summitSeen(el) {
  if (!el) return;
  new IntersectionObserver((entries) => {
    for (const e of entries) el.classList.toggle('seen', e.isIntersecting);
  }, { threshold: 0.35 }).observe(el);
}

// A creature in the gap between two signs, where the tower shows: on the
// tower's plane, so it sits at the height where the gap is when that gap
// is in the middle of the window (with parallax the plane has fallen
// behind the page by then).
const gapped = [];
function placeCreatures() {
  const vh = innerHeight, max = Math.max(0, root.scrollHeight - vh);
  for (const [el, a, b] of gapped) {
    const above = document.querySelector(a), below = document.querySelector(b);
    if (!above || !below) continue;
    const center = (above.getBoundingClientRect().bottom + below.getBoundingClientRect().top) / 2 + scrollY;
    const s = Math.min(max, Math.max(0, center - vh / 2));
    el.style.top = `${Math.round(center - (s - midT(s)) - el.offsetHeight / 2)}px`;
  }
  // the moon at the top right of the window where the page opens, and
  // from there drifting down a little when scrolling up to the summit
  if (moon) {
    const summit = document.querySelector('.summit');
    moon.style.top = `${Math.round(farT(summit ? summit.offsetHeight : 0) + 14 * artPx())}px`;
  }
}
let moon = null;

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
function woodenSign(el, above, { art, sign, C }) {
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
      if (top && b.y >= 24) {
        // the beam across the tower the first sign hangs from, under Rapunzel's window
        const x0 = b.x - 36, x1 = b.x + b.w + 36;
        g.rect(x0 + 8, 8, x1 - x0, 20, '#000', 0.25);
        g.rect(x0, 0, x1 - x0, 20, C.barkDark);
        g.rect(x0, 0, x1 - x0, 4, C.barkLight);
        g.rect(x0, 16, x1 - x0, 4, C.barkShadow);
        g.rect(x0, 0, 4, 20, C.barkShadow); g.rect(x1 - 4, 0, 4, 20, C.barkShadow);
        for (let x = x0 + 40; x < x1 - 40; x += 96) g.rect(x, 8, 24, 4, C.barkMid);
        // iron bands where it lies across the tower's edges (the tower is 95 art px wide)
        for (const ex of [b.x + b.w / 2 - 190, b.x + b.w / 2 + 190]) {
          g.rect(ex - 6, 0, 12, 20, C.grip); g.rect(ex - 6, 0, 12, 4, C.poleHi); g.rect(ex - 2, 8, 4, 4, C.pole);
        }
        for (const rx of [b.x + sign.ROPE_IN, b.x + b.w - sign.ROPE_IN - 8]) {
          g.rect(rx - 4, 0, 16, 24, C.ropeDark);   // the rope wound round the beam
          g.rect(rx, 4, 8, 4, C.rope); g.rect(rx, 12, 8, 4, C.rope);
        }
      }
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
