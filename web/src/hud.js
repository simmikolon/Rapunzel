import { W, H, BOOST_CHARGES, MAX_HEARTS } from './config.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';
import { drawSign, signHeight, drawPlankTag, drawRibbon, drawPlaque, paint, INK_RED } from './sign.js';
import { drawWord } from './art/logo.js';

// Heads-up display and screens, drawn through the renderer facade `g`
// (see gfx/renderer.js). Everything is in logical 768 x 1364 coordinates.

export function button(g, zone, label, opts = {}) {
  const { x, y, w, h } = zone;
  g.roundRect(x, y, w, h, 14, { fill: opts.fill || 'rgba(16,32,36,0.72)', stroke: opts.stroke || C.uiLine, width: 4, alpha: opts.alpha });
  if (label) g.text(label, x + w / 2, y + h / 2 + 2, opts.size || 22, opts.color || '#fff', 'center', false, { alpha: opts.alpha });
  if (opts.glyph) opts.glyph(g, x + w / 2, y + h / 2);
}

// A small button on a sign: a light board nailed on, the label painted in
// ink, a symbol left of it when opts.icon(g, x, y, alpha) is given.
// opts: alpha, on, size, icon
export function tagButton(g, zone, label, opts = {}) {
  const { x, y, w, h } = zone;
  const a = opts.alpha == null ? 1 : opts.alpha;
  drawPlankTag(g, x, y, w, h, { alpha: a, on: opts.on });
  const cx = x + w / 2, cy = y + h / 2;
  if (opts.icon) opts.icon(g, label ? x + 40 : cx, cy, a);
  if (label) paint(g, label, opts.icon ? x + 68 : cx, cy + 1, opts.size || 14, opts.icon ? 'left' : 'center', { alpha: a });
}

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

// The signs the menus hang on (src/sign.js): the title's, the pause's, the game over's.
export const SIGNS = {
  title: { x: 24, y: 108, w: 720, h: signHeight(9) },     // down to 792; the prince hops under it
  pause: { x: 124, y: H / 2 - signHeight(4) / 2, w: 520, h: signHeight(4) },
  over: { x: 84, y: 280, w: 600, h: signHeight(8) },
};
// How far a sign moves to be lowered in from above the screen, or pulled up out of it.
export const signTravel = (S) => S.y + S.h + 24;

export const ZONES = {
  pause: { id: 'pause', x: W - 84, y: 112, w: 64, h: 64 },
  sound: { id: 'sound', x: W - 164, y: 112, w: 64, h: 64 },
  boost: { id: 'boost', x: W - 190, y: H - 200, w: 160, h: 160 },
  // on the title's sign: PLAY in the middle, the settings in the bottom row
  play: { id: 'play', x: W / 2 - 248, y: 468, w: 496, h: 96 },     // a ribbon: its tails take the outer 48 px
  fx: { id: 'fx', x: 72, y: 688, w: 240, h: 56 },
  titleSound: { id: 'sound', x: W / 2 - 28, y: 688, w: 56, h: 56 },
  tilt: { id: 'tilt', x: W - 312, y: 688, w: 240, h: 56 },
  // on the game over's and the pause's sign
  again: { id: 'again', x: W / 2 - 272, y: 636, w: 544, h: 88 },
  menu: { id: 'menu', x: W / 2 - 112, y: 764, w: 224, h: 60 },
  pauseMenu: { id: 'menu', x: W / 2 - 112, y: 720, w: 224, h: 60 },
};

export function drawSpeaker(g, cx, cy, muted, color = '#fff') {
  g.path((p) => {
    p.moveTo(cx - 16, cy - 7); p.lineTo(cx - 6, cy - 7); p.lineTo(cx + 6, cy - 17); p.lineTo(cx + 6, cy + 17);
    p.lineTo(cx - 6, cy + 7); p.lineTo(cx - 16, cy + 7); p.closePath();
  }, { fill: color });
  if (muted) {
    g.path((p) => { p.moveTo(cx + 10, cy - 10); p.lineTo(cx + 22, cy + 10); p.moveTo(cx + 22, cy - 10); p.lineTo(cx + 10, cy + 10); }, { stroke: '#ff6b6b', width: 4 });
  } else {
    g.path((p) => p.arc(cx + 8, cy, 12, -0.9, 0.9), { stroke: color, width: 4 });
    g.path((p) => p.arc(cx + 8, cy, 20, -0.9, 0.9), { stroke: color, width: 4 });
  }
}

export function drawPauseGlyph(g, cx, cy) {
  g.rect(cx - 14, cy - 16, 10, 32, '#fff');
  g.rect(cx + 4, cy - 16, 10, 32, '#fff');
}

export function drawFlame(g, cx, cy, s = 1, alpha = 1, glow = 0.8) {
  g.path((p) => {
    p.moveTo(cx, cy - 30 * s);
    p.quadraticCurveTo(cx + 26 * s, cy - 4 * s, cx + 14 * s, cy + 22 * s);
    p.quadraticCurveTo(cx, cy + 34 * s, cx - 14 * s, cy + 22 * s);
    p.quadraticCurveTo(cx - 26 * s, cy - 4 * s, cx, cy - 30 * s);
  }, { fill: C.flame3, alpha, glow });
  g.path((p) => {
    p.moveTo(cx, cy - 12 * s);
    p.quadraticCurveTo(cx + 14 * s, cy + 4 * s, cx + 8 * s, cy + 20 * s);
    p.quadraticCurveTo(cx, cy + 28 * s, cx - 8 * s, cy + 20 * s);
    p.quadraticCurveTo(cx - 14 * s, cy + 4 * s, cx, cy - 12 * s);
  }, { fill: C.flame2, alpha, glow });
  g.circle(cx, cy + 14 * s, 6 * s, { fill: C.flame1, alpha, glow });
}

export class HUD {
  constructor(game) { this.game = game; }

  // Register touch zones for this frame.
  layout(mode) {
    const input = this.game.input;
    const zones = [];
    if (mode === 'playing') { zones.push(ZONES.pause, ZONES.sound); if (input.isTouch) zones.push(ZONES.boost); }
    if (mode === 'paused') zones.push(ZONES.pause, ZONES.sound, ZONES.pauseMenu);
    if (mode === 'title') {
      zones.push(ZONES.play, ZONES.titleSound, ZONES.fx);
      if (input.tiltSupported && (input.isTouch || input.tiltNeedsPermission)) zones.push(ZONES.tilt);
    }
    if (mode === 'gameover') zones.push(ZONES.sound, ZONES.again, ZONES.menu);
    input.buttonZones = zones;
  }

  drawPlaying(g, world) {
    const pl = world.player, art = this.game.art;
    g.layer('hud');
    // Height
    g.text(`${world.heightM} m`, 28, 64, 40, '#fff');
    if (this.game.best > 0) g.text(`best ${this.game.best} m`, 28, 112, 16, '#cfe8e3');
    if (world.suns) { g.blit(art.creatures.sun[0], 44, 152, { glow: 0.5 }); g.text(`${world.suns}`, 76, 154, 18, '#ffe9a0'); }
    // Hearts
    for (let i = 0; i < MAX_HEARTS; i++) {
      const full = i < pl.hearts;
      g.blit(full ? art.creatures.heart : art.creatures.heartEmpty, W - 48 - i * 50, 60, full ? { glow: 0.35 } : undefined);
    }
    // Boost charges
    const bx = 28, by = H - 78;
    g.text('boost', bx, by - 36, 14, '#cfe8e3');
    for (let i = 0; i < BOOST_CHARGES; i++) {
      const full = pl.boost >= i + 1;
      const part = clamp(pl.boost - i, 0, 1);
      const x = bx + i * 56;
      g.roundRect(x, by - 20, 44, 44, 8, { fill: 'rgba(16,32,36,0.6)', stroke: full ? C.gold : C.uiLine, width: 3 });
      if (part > 0) drawFlame(g, x + 22, by + 2, 0.55 * (0.5 + 0.5 * part), full ? 1 : 0.5, full ? 0.8 : 0.3);
    }
    // Buttons
    button(g, ZONES.pause, null, { glyph: drawPauseGlyph });
    button(g, ZONES.sound, null, { glyph: (gg, x, y) => drawSpeaker(gg, x, y, this.game.muted) });
    if (this.game.input.isTouch) {
      const z = ZONES.boost;
      const can = pl.boost >= 1;
      g.circle(z.x + z.w / 2, z.y + z.h / 2, z.w / 2, { fill: can ? 'rgba(255,170,60,0.28)' : 'rgba(16,32,36,0.5)', stroke: can ? C.gold : C.uiLine, width: 5 });
      drawFlame(g, z.x + z.w / 2, z.y + z.h / 2, 1.3, can ? 1 : 0.4, can ? 0.8 : 0.2);
    }
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

  // One-line message at the top, used for device hints (e.g. iOS silent switch).
  drawNotice(g, str, t) {
    const a = clamp(t / 0.4, 0, 1);
    g.layer('overlay');
    g.roundRect(24, 196, W - 48, 64, 12, { fill: 'rgba(16,32,36,0.8)', stroke: C.uiLine, width: 3, alpha: a });
    g.text(str, W / 2, 228, 13, '#ffe9a0', 'center', false, { wrap: W - 100, alpha: a });
  }

  drawPaused(g) {
    const S = SIGNS.pause, art = this.game.art;
    g.layer('overlay');
    g.rect(0, 0, W, H, 'rgba(8,16,20,0.5)');
    drawSign(g, art, S.x, S.y, S.w, S.h);
    drawWord(g, art.logo.gold2, 'PAUSED', W / 2, S.y + 118, { glow: 0.3 });
    paint(g, this.game.input.isTouch ? 'tap to continue' : 'tap or press P to continue', W / 2, S.y + 164, 14, 'center');
    tagButton(g, ZONES.pauseMenu, 'MENU');
    button(g, ZONES.pause, null, { glyph: drawPauseGlyph });
    button(g, ZONES.sound, null, { glyph: (gg, x, y) => drawSpeaker(gg, x, y, this.game.muted) });
  }

  // The sign is lowered in from above with the verdict; the buttons wake up once it hangs.
  drawGameOver(g, world, t, isNewBest) {
    const S = SIGNS.over, art = this.game.art, L = art.logo;
    const a = clamp(t / 0.4, 0, 1);
    const dy = -signTravel(S) * (1 - easeOutBack(clamp(t / 0.7, 0, 1), 0.8));
    const Y = (y) => S.y + y + dy;
    const shift = (z) => (dy ? { ...z, y: z.y + dy } : z);
    g.layer('overlay');
    g.rect(0, 0, W, H, '#081014', 0.55 * a);
    drawSign(g, art, S.x, S.y + dy, S.w, S.h);
    const cause = world.player.deathCause === 'caught' ? 'The witch got Sir Bouncealot!' : 'Sir Bouncealot fell...';
    paint(g, cause, W / 2, Y(60), 16, 'center', { color: INK_RED });
    drawWord(g, L.gold3, `${world.heightM} m`, W / 2, Y(180), { glow: 0.4 });
    paint(g, 'climbed', W / 2, Y(206), 14, 'center');
    if (isNewBest) drawWord(g, L.pink2, 'NEW BEST!', W / 2, Y(292), { glow: 0.4, dy: (i) => Math.max(0, Math.sin(world.time * 3 - i * 0.5)) * -6 });
    else drawBest(g, art, W / 2, Y(268), this.game.best);
    // suns and stomps with their symbols
    g.blit(art.creatures.sun[0], W / 2 - 128, Y(326), { glow: 0.4 });
    paint(g, `${world.suns}`, W / 2 - 100, Y(327), 14, 'left');
    g.blit(art.sign.star, W / 2 + 36, Y(326), { glow: 0.3 });
    paint(g, `${world.stomps}`, W / 2 + 60, Y(327), 14, 'left');
    const ready = clamp((t - 0.7) / 0.3, 0, 1);
    ribbonButton(g, art, shift(ZONES.again), 'TRY AGAIN', { alpha: ready, t: world.time });
    if (!this.game.input.isTouch) paint(g, 'space', W / 2, Y(462), 12, 'center', { alpha: ready });
    tagButton(g, shift(ZONES.menu), 'MENU', { alpha: ready });
    button(g, ZONES.sound, null, { glyph: (gg, x, y) => drawSpeaker(gg, x, y, this.game.muted) });
  }
}
