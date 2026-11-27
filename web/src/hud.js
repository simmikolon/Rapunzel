import { W, H, H_MIN, SAFE, BOOST_CHARGES, MAX_HEARTS, POWER_WARN } from './config.js';
import { POWERS } from './powerups.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';
import { drawSign, signHeight, drawPlankTag, drawRibbon, drawPlaque, paint, INK_RED, FRAME, BOARD } from './sign.js';
import { drawWord, wordWidth } from './art/logo.js';
import { audio } from './audio.js';

// Heads-up display and screens, drawn through the renderer facade `g`
// (see gfx/renderer.js). Everything is in logical coordinates, 768 wide.
// The screen is 1364 tall on a 9:16 window and taller on a phone (config.js
// H): what hangs from the top or stands on the bottom keeps out of the safe
// area (SAFE), and the sign screens, laid out for 768 x 1364, sit centred.

// A small button on a sign: a light board nailed on, the label painted in
// ink, a symbol left of it when opts.icon(g, x, y, alpha) is given.
// opts: alpha, on, size, icon, nails (false: a board too small for them)
export function tagButton(g, zone, label, opts = {}) {
  const { x, y, w, h } = zone;
  const a = opts.alpha == null ? 1 : opts.alpha;
  drawPlankTag(g, x, y, w, h, { alpha: a, on: opts.on, nails: opts.nails });
  const cx = x + w / 2, cy = y + h / 2;
  if (opts.icon) opts.icon(g, label ? x + 40 : cx, cy, a);
  if (label) paint(g, label, opts.icon ? x + 68 : cx, cy + 1, opts.size || 14, opts.icon ? 'left' : 'center', { alpha: a });
}

// The same board, square and with nothing but a symbol in ink (art/hud.js):
// sound and pause, in a round and on the title.
export function iconButton(g, zone, sprite, alpha = 1) {
  drawPlankTag(g, zone.x, zone.y, zone.w, zone.h, { alpha, nails: false });
  g.blit(sprite, zone.x + zone.w / 2, zone.y + zone.h / 2, { alpha });
}
export const speakerIcon = (game) => (game.muted ? game.art.hud.speakerOff : game.art.hud.speaker);

// The main button: a ribbon banner with the word in gold letters.
// opts: alpha, t (the ribbon's tails flutter)
export function ribbonButton(g, art, zone, word, opts = {}) {
  const { x, y, w, h } = zone;
  const a = opts.alpha == null ? 1 : opts.alpha;
  drawRibbon(g, x, y, w, h, { alpha: a, t: opts.t });
  const set = art.logo.gold2;
  drawWord(g, set, word, x + w / 2, y + h / 2 + set.body / 2 - 2, { alpha: a, glow: 0.3 * a });
}

// The best height on a brass plate with a crown.
export function drawBest(g, art, cx, cy, best, alpha = 1) {
  const label = `BEST ${best} m`;
  const w = Math.ceil((label.length * 14 + 84) / 8) * 8, h = 40;
  drawPlaque(g, cx - w / 2, cy - h / 2, w, h, { alpha });
  g.blit(art.logo.crown, cx - w / 2 + 28, cy, { alpha });
  paint(g, label, cx - w / 2 + 52, cy + 1, 14, 'left', { alpha });
}

// The signs the menus hang on (src/sign.js): the title's, the pause's, the game
// over's, laid out on 768 x 1364 and moved down by signShift() on a taller screen.
export const SIGNS = {
  title: { x: 24, y: 108, w: 720, h: signHeight(9) },     // down to 792; the prince hops under it
  pause: { x: 124, y: H_MIN / 2 - signHeight(4) / 2, w: 520, h: signHeight(4) },
  over: { x: 44, y: 280, w: 680, h: signHeight(8) },   // a row per board: cause, three counts, best, TRY AGAIN, MENU
};
// The sign screens sit centred on a screen taller than 1364: everything keyed
// to a sign (the signs, their buttons, the title's lettering) moves by this.
export const signShift = () => (H - H_MIN) / 2;
export const shiftZone = (z, dy = 0) => { const d = signShift() + dy; return d ? { ...z, y: z.y + d } : z; };
// How far a sign moves to be lowered in from above the screen, or pulled up out of it.
export const signTravel = (S) => S.y + signShift() + S.h + 24;

export const ZONES = {
  pause: { id: 'pause', x: W - 84, get y() { return 112 + SAFE.top; }, w: 64, h: 64 },
  sound: { id: 'sound', x: W - 164, get y() { return 112 + SAFE.top; }, w: 64, h: 64 },
  boost: { id: 'boost', x: W - 190, get y() { return H - 200 - SAFE.bottom; }, w: 160, h: 160 },
  // on the title's sign: PLAY in the middle, the settings in the bottom row
  play: { id: 'play', x: W / 2 - 248, y: 468, w: 496, h: 96 },     // a ribbon: its tails take the outer 48 px
  // the climb: the tower in stages, or the endless one outside or inside, side by side under PLAY
  // Rapunzel, peeking over the title sign's upper right corner: a tap and she tells the opening story again
  story: { id: 'story', x: SIGNS.title.x + SIGNS.title.w - 108 - 48, y: SIGNS.title.y - 88, w: 96, h: 96 },
  placeTour: { id: 'placeTour', x: W / 2 - 268, y: 580, w: 168, h: 52 },
  placeOut: { id: 'placeOut', x: W / 2 - 84, y: 580, w: 168, h: 52 },
  placeIn: { id: 'placeIn', x: W / 2 + 100, y: 580, w: 168, h: 52 },
  // the bottom row: the settings' sign (settings.js), and sound on or off beside it
  settings: { id: 'settings', x: W / 2 - 188, y: 688, w: 300, h: 56 },
  titleSound: { id: 'sound', x: W / 2 + 132, y: 688, w: 56, h: 56 },
  // on the game over's and the pause's sign
  again: { id: 'again', x: W / 2 - 272, y: 684, w: 544, h: 88 },
  menu: { id: 'menu', x: W / 2 - 112, y: 808, w: 224, h: 56 },
  pauseMenu: { id: 'menu', x: W / 2 - 112, y: 720, w: 224, h: 60 },
};

// The game-over summary: once the sign hangs, the height counts up with
// ticks, then the suns (a pickup chime each), then the stomps (a thud
// each), then the best height or NEW BEST!; the buttons wake after that.
// A tap while it runs finishes it at once. Times are seconds of game-over.
export function summaryPlan(world, isNewBest) {
  const h = world.heightM, suns = world.suns, stomps = world.stomps;
  const rows = [];
  let t = 0.9;                                             // the sign hangs
  const add = (key, n, dur) => { rows.push({ key, n, from: t, dur }); t += dur + 0.3; };
  add('climbed', h, Math.min(1.3, 0.3 + h / 250));
  add('suns', suns, Math.min(0.9, suns * 0.09));
  add('stomps', stomps, Math.min(0.9, stomps * 0.11));
  const best = t;
  return { rows, best, ready: best + (isNewBest ? 0.6 : 0.25) };
}
const wordWidthGold = (L, str) => wordWidth(L.gold2, str);
const rowValue = (row, t) => (row.dur > 0 ? row.n * clamp((t - row.from) / row.dur, 0, 1) : t >= row.from ? row.n : 0);

export class HUD {
  constructor(game) {
    this.game = game; this.summary = null;
    // the boost's flames: the round they were last drawn for, its charge then, and when each one was lit
    this.flames = { world: null, last: 0, lit: new Array(BOOST_CHARGES).fill(-9) };
  }

  beginSummary(world, isNewBest) {
    this.summary = { plan: summaryPlan(world, isNewBest), isNewBest, played: { climbed: 0, suns: 0, stomps: 0, best: false }, tickT: -1 };
  }
  summaryDone(t) { return !this.summary || t >= this.summary.plan.ready; }
  // Finish the counting now; returns the time to jump to. Nothing is heard for the skipped part.
  skipSummary() {
    const s = this.summary;
    for (const r of s.plan.rows) s.played[r.key] = r.n;
    s.played.best = true;
    return s.plan.ready;
  }
  // The counting's sounds, from the game-over update.
  updateSummary(t) {
    const s = this.summary;
    if (!s) return;
    for (const r of s.plan.rows) {
      const v = Math.floor(rowValue(r, t));
      if (v <= s.played[r.key]) continue;
      if (r.key === 'climbed') { if (t - s.tickT >= 0.05) { audio.tick(); s.tickT = t; } s.played.climbed = v; }
      else { s.played[r.key]++; if (r.key === 'suns') audio.pickup(false); else audio.stomp(false); }
    }
    if (!s.played.best && t >= s.plan.best) { s.played.best = true; if (s.isNewBest) audio.milestone(); }
  }

  // Register touch zones for this frame.
  layout(mode) {
    const input = this.game.input;
    const zones = [];
    if (mode === 'playing') { zones.push(ZONES.pause, ZONES.sound); if (input.isTouch) zones.push(ZONES.boost); }
    if (mode === 'paused') zones.push(ZONES.pause, ZONES.sound, shiftZone(ZONES.pauseMenu));
    if (mode === 'title') {
      // (the settings' sign, while it is open, hangs in the title's place with boards of its own)
      if (this.game.settings.open) zones.push(...this.game.settings.zones());
      else zones.push(shiftZone(ZONES.play), shiftZone(ZONES.titleSound), shiftZone(ZONES.settings), shiftZone(ZONES.placeTour), shiftZone(ZONES.placeOut), shiftZone(ZONES.placeIn), shiftZone(ZONES.story));
    }
    if (mode === 'gameover') zones.push(ZONES.sound, shiftZone(ZONES.again), shiftZone(ZONES.menu));
    input.buttonZones = zones;
  }

  drawPlaying(g, world) {
    const pl = world.player, art = this.game.art;
    g.layer('hud');
    const top = SAFE.top, bottom = SAFE.bottom;
    // Height
    g.text(`${world.heightM} m`, 28, top + 64, 40, '#fff');
    if (this.game.best > 0) g.text(`best ${this.game.best} m`, 28, top + 112, 16, '#cfe8e3');
    if (world.suns) { g.blit(art.creatures.sun[0], 44, top + 152, { glow: 0.5 }); g.text(`${world.suns}`, 76, top + 154, 18, '#ffe9a0'); }
    // in stages: which one he is in
    const stage = world.stageInfo;
    if (stage) {
      g.text(`stage ${stage.n}`, 28, top + 196, 16, '#cfe8e3');
      // and his lives: a little prince for each he still has, this one included
      if (isFinite(world.lives)) for (let i = 0, A = art[world.who === 'lord' ? 'lord' : 'prince'], k = A.lifeScale || 0.5; i < world.lives; i++) g.blit(A.life, 44 + i * 44, top + 258, { sx: k, sy: k });      // (his head, whoever climbs)
    }
    // Hearts
    for (let i = 0; i < MAX_HEARTS; i++) {
      const full = i < pl.hearts;
      g.blit(full ? art.creatures.heart : art.creatures.heartEmpty, W - 48 - i * 50, top + 60, full ? { glow: 0.35 } : undefined);
    }
    // The power-up that runs: its picture and the time left as a bar on a
    // board, top centre, rimmed in its colour; it blinks through its last
    // moments like the effect on the prince.
    if (pl.power && pl.alive) {
      const P = POWERS[pl.power], k = clamp(pl.powerT / pl.powerMax, 0, 1);
      const cx = W / 2, cy = top + 62;
      const on = pl.powerT > POWER_WARN || Math.floor(pl.powerT * 9) % 2 === 0;
      drawPlankTag(g, cx - 84, cy - 34, 168, 68, { nails: false, rim: on ? P.color : null });
      g.blit(art.powerups[pl.power][0], cx - 44, cy, { glow: 0.2, alpha: on ? 1 : 0.5 });
      g.rect(cx - 12, cy - 12, 80, 24, C.barkShadow);
      g.rect(cx - 8, cy - 8, 72, 16, C.plankDark);
      g.rect(cx - 8, cy - 8, Math.round(72 * k / 4) * 4, 16, P.color, on ? 1 : 0.5, { glow: 0.2 });
    }
    this.drawBoost(g, world);
    // Buttons
    iconButton(g, ZONES.pause, art.hud.pause);
    iconButton(g, ZONES.sound, speakerIcon(this.game));
    // Toasts
    let ty = H * 0.3;
    for (const t of world.toasts) {
      const a = clamp(t.life / 0.4, 0, 1);
      const pop = easeOutBack(clamp((t.maxLife - t.life) / 0.25, 0, 1));
      // fit long toasts (the pixel font is ~1 em wide per character)
      const size = Math.min(30, Math.floor((W - 80) / Math.max(1, t.text.length)));
      g.text(t.text, W / 2, ty, size, t.color, 'center', true, { alpha: a, scale: pop, glow: 0.35 });
      ty += 46;
    }
  }

  // The boost. Bottom left a flame for each charge, as the hearts are: it
  // burns (two frames, each flame in its own time) while the charge is whole,
  // is a small flame at the foot of the unlit one at half a charge (a landing
  // brings half), and is out when spent; a flame that has just caught hops.
  // On a touch screen the button, bottom right: a wooden hoop around a dark
  // glass the game shows through, the big flame in it. With a boost to give
  // it has the gold rim of a chosen board and burns; just used, it is pressed
  // in for the moment the next one has to wait; with none, the flame is out,
  // and a tap all the same shakes what is empty (the label goes red).
  drawBoost(g, world) {
    const pl = world.player, A = this.game.art.hud, t = world.time, f = this.flames;
    if (f.world !== world) { f.world = world; f.last = pl.boost; f.lit.fill(-9); }
    for (let i = 0; i < BOOST_CHARGES; i++) if (pl.boost >= i + 1 && f.last < i + 1) f.lit[i] = t;
    f.last = pl.boost;
    const denied = pl.boostDenied > 0;
    const shake = denied ? (Math.floor(pl.boostDenied * 30) % 2 ? 4 : -4) : 0;
    const bx = 28, by = H - 52 - SAFE.bottom;
    g.text('boost', bx, by - 64, 14, denied ? '#ff9ab8' : '#cfe8e3');
    for (let i = 0; i < BOOST_CHARGES; i++) {
      const part = pl.boost - i, x = bx + 20 + i * 48;
      if (part >= 0.75) {      // (the prince's charges come in halves; the lord's rocket burns them down by degrees)
        const hop = t - f.lit[i] < 0.14;
        g.blit(A.flame[Math.floor(t * 5 + i * 0.7) % 2], x, by - (hop ? 8 : 0), { glow: hop ? 1 : 0.5 });
      } else if (part >= 0.25) g.blit(A.flameHalf, x + shake, by, { glow: 0.2 });
      else g.blit(A.flameOff, x + shake, by);
    }
    if (!this.game.input.isTouch) return;
    const z = ZONES.boost, can = pl.fig.rocket ? pl.boost > 0.02 : pl.boost >= 1;
    const down = pl.boostCooldown > 0;
    const cx = z.x + z.w / 2 + (can ? 0 : shake), cy = z.y + z.h / 2 + (down ? 4 : 0);
    if (!down) g.blit(A.hoop, cx + 4, cy + 8, { tint: '#000000', alpha: 0.25 });
    g.blit(A.lens, cx, cy, { tint: C.uiDark, alpha: 0.6 });
    if (can) g.blit(A.lens, cx, cy, { tint: C.flame3, alpha: 0.22 });
    g.blit(A.hoop, cx, cy);
    if (can) g.blit(A.rim, cx, cy, { glow: 0.4 });
    if (can) g.blit(A.bigFlame[Math.floor(t * (down ? 14 : 5)) % 2], cx, cy + 44, { glow: down ? 1 : 0.6 });
    else g.blit(pl.boost > 0 ? A.bigFlameHalf : A.bigFlameOff, cx, cy + 44, pl.boost > 0 ? { glow: 0.2 } : undefined);
  }

  // One-line message at the top, used for device hints (e.g. iOS silent switch).
  drawNotice(g, str, t) {
    const a = clamp(t / 0.4, 0, 1);
    g.layer('overlay');
    g.roundRect(24, SAFE.top + 196, W - 48, 64, 12, { fill: 'rgba(16,32,36,0.8)', stroke: C.uiLine, width: 3, alpha: a });
    g.text(str, W / 2, SAFE.top + 228, 13, '#ffe9a0', 'center', false, { wrap: W - 100, alpha: a });
  }

  drawPaused(g) {
    const S = SIGNS.pause, art = this.game.art, sy = S.y + signShift();
    g.layer('overlay');
    g.rect(0, 0, W, H, 'rgba(8,16,20,0.5)');
    drawSign(g, art, S.x, sy, S.w, S.h);
    drawWord(g, art.logo.gold2, 'PAUSED', W / 2, sy + 118, { glow: 0.3 });
    paint(g, this.game.input.isTouch ? 'tap to continue' : 'tap or press P to continue', W / 2, sy + 164, 14, 'center');
    tagButton(g, shiftZone(ZONES.pauseMenu), 'MENU');
    iconButton(g, ZONES.pause, art.hud.pause);
    iconButton(g, ZONES.sound, speakerIcon(this.game));
  }

  // The sign is lowered in from above with the verdict, then the summary
  // counts up row by row (see summaryPlan); the buttons wake up after it.
  drawGameOver(g, world, t, isNewBest) {
    const S = SIGNS.over, art = this.game.art, L = art.logo;
    const plan = (this.summary && this.summary.plan) || summaryPlan(world, isNewBest);
    const a = clamp(t / 0.4, 0, 1);
    const dy = -signTravel(S) * (1 - easeOutBack(clamp(t / 0.7, 0, 1), 0.8));
    const Y = (y) => S.y + signShift() + y + dy;
    const shift = (z) => shiftZone(z, dy);
    const ix = S.x + FRAME, iw = S.w - 2 * FRAME;
    const boardY = (i) => Y(FRAME + i * BOARD + 34);         // the centre line of board i
    g.layer('overlay');
    g.rect(0, 0, W, H, '#081014', 0.55 * a);
    drawSign(g, art, S.x, Y(0), S.w, S.h);
    const cause = world.player.deathCause === 'caught' ? 'The witch got Sir Bouncealot!' : 'Sir Bouncealot fell...';
    paint(g, cause, W / 2, boardY(0), 18, 'center', { color: INK_RED });
    // the rows: a symbol, the label, a dotted leader, the value counting up
    const icons = { climbed: art.sign.tower, suns: art.creatures.sun[0], stomps: art.sign.star };
    const labels = { climbed: 'CLIMBED', suns: 'SUNS', stomps: 'STOMPS' };
    plan.rows.forEach((row, i) => {
      const k = clamp((t - row.from + 0.15) / 0.2, 0, 1);    // the row slides in just before its count
      if (k <= 0) return;
      const cy = boardY(i + 1), slide = (1 - k) * 24;
      const v = rowValue(row, t), done = t >= row.from + row.dur;
      const pop = done ? 1 + 0.18 * (1 - easeOutBack(clamp((t - row.from - row.dur) / 0.25, 0, 1))) : 1;
      g.blit(icons[row.key], ix + 40 + slide, cy, { alpha: k, glow: row.key === 'suns' ? 0.4 : 0.2 });
      paint(g, labels[row.key], ix + 80 + slide, cy + 1, 16, 'left', { alpha: k });
      const text = row.key === 'climbed' ? `${Math.floor(v)} m` : `${Math.floor(v)}`;
      const vx = ix + iw - 24;
      drawWord(g, L.gold2, text, vx, cy + L.gold2.body / 2 - 2, { align: 'right', alpha: k, glow: 0.3 * k, scale: pop });
      const x0 = ix + 80 + labels[row.key].length * 16 + 20, x1 = vx - wordWidthGold(L, text) - 20;
      for (let x = Math.ceil(x0 / 16) * 16; x < x1; x += 16) g.rect(x, cy - 2, 4, 4, '#3b2a1e', 0.4 * k);
    });
    // the best height, or NEW BEST! with sparkles
    if (t >= plan.best) {
      const k = clamp((t - plan.best) / 0.3, 0, 1), cy = boardY(4);
      if (isNewBest) {
        drawWord(g, L.pink2, 'NEW BEST!', W / 2, cy + L.pink2.body / 2 - 2, { glow: 0.5, scale: easeOutBack(k), dy: (i) => Math.max(0, Math.sin(world.time * 3 - i * 0.5)) * -6 });
        [[-230, -18], [230, -14], [-200, 22], [205, 20]].forEach(([dx, dyy], i) => g.blit(art.sign.sparkle, W / 2 + dx, cy + dyy, { alpha: k * (0.55 + 0.45 * Math.sin(world.time * 7 + i * 1.7)), glow: 0.6 }));
      } else drawBest(g, art, W / 2, cy, this.game.best, k);
    }
    const ready = clamp((t - plan.ready) / 0.3, 0, 1);
    ribbonButton(g, art, shift(ZONES.again), 'TRY AGAIN', { alpha: ready, t: world.time });
    tagButton(g, shift(ZONES.menu), 'MENU', { alpha: ready });
    iconButton(g, ZONES.sound, speakerIcon(this.game));
  }
}
