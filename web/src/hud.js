import { W, H, BOOST_CHARGES, MAX_HEARTS } from './config.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';

// Heads-up display and screens, drawn through the renderer facade `g`
// (see gfx/renderer.js). Everything is in logical 768 x 1364 coordinates.

export function button(g, zone, label, opts = {}) {
  const { x, y, w, h } = zone;
  g.roundRect(x, y, w, h, 14, { fill: opts.fill || 'rgba(16,32,36,0.72)', stroke: opts.stroke || C.uiLine, width: 4 });
  if (label) g.text(label, x + w / 2, y + h / 2 + 2, opts.size || 22, opts.color || '#fff', 'center', false);
  if (opts.glyph) opts.glyph(g, x + w / 2, y + h / 2);
}

export const ZONES = {
  pause: { id: 'pause', x: W - 84, y: 112, w: 64, h: 64 },
  sound: { id: 'sound', x: W - 164, y: 112, w: 64, h: 64 },
  boost: { id: 'boost', x: W - 190, y: H - 200, w: 160, h: 160 },
  tilt: { id: 'tilt', x: W / 2 - 220, y: H - 330, w: 440, h: 76 },
  fx: { id: 'fx', x: W / 2 - 220, y: H - 236, w: 440, h: 60 },
};

export function drawSpeaker(g, cx, cy, muted) {
  g.path((p) => {
    p.moveTo(cx - 16, cy - 7); p.lineTo(cx - 6, cy - 7); p.lineTo(cx + 6, cy - 17); p.lineTo(cx + 6, cy + 17);
    p.lineTo(cx - 6, cy + 7); p.lineTo(cx - 16, cy + 7); p.closePath();
  }, { fill: '#fff' });
  if (muted) {
    g.path((p) => { p.moveTo(cx + 10, cy - 10); p.lineTo(cx + 22, cy + 10); p.moveTo(cx + 22, cy - 10); p.lineTo(cx + 10, cy + 10); }, { stroke: '#ff6b6b', width: 4 });
  } else {
    g.path((p) => p.arc(cx + 8, cy, 12, -0.9, 0.9), { stroke: '#fff', width: 4 });
    g.path((p) => p.arc(cx + 8, cy, 20, -0.9, 0.9), { stroke: '#fff', width: 4 });
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
    if (mode === 'playing' || mode === 'paused') { zones.push(ZONES.pause, ZONES.sound); if (input.isTouch) zones.push(ZONES.boost); }
    if (mode === 'title') {
      zones.push(ZONES.sound, ZONES.fx);
      if (input.tiltSupported && (input.isTouch || input.tiltNeedsPermission)) zones.push(ZONES.tilt);
    }
    if (mode === 'gameover') zones.push(ZONES.sound);
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

  drawTitle(g, world, t) {
    const input = this.game.input;
    const bob = Math.sin(t * 2) * 6;
    g.layer('hud');
    // Title
    g.text('RAPUNZEL', W / 2, 250 + bob, 62, C.braid, 'center', true, { glow: 0.5 });
    g.text('a pogo climb', W / 2, 322 + bob, 20, '#ffd1e3', 'center');
    const blink = Math.floor(t * 1.6) % 2 === 0;
    if (blink) g.text(input.isTouch ? 'TAP TO START' : 'PRESS SPACE TO START', W / 2, 560, 22, '#fff', 'center');
    // Controls
    const lines = input.isTouch
      ? ['hold left / right side to steer', 'tap the flame to boost', 'or enable tilt and tap anywhere']
      : ['arrows / A D to steer', 'space or click to boost', 'bounce on branches and ribbons'];
    lines.forEach((l, i) => g.text(l, W / 2, 640 + i * 34, 14, '#cfe8e3', 'center'));
    if (this.game.best > 0) g.text(`best  ${this.game.best} m`, W / 2, 760, 18, '#ffe9a0', 'center');
    if (input.buttonZones.includes(ZONES.tilt)) {
      button(g, ZONES.tilt, input.tiltEnabled ? 'TILT: ON  (tap to turn off)' : 'ENABLE TILT STEERING', { size: 15, stroke: input.tiltEnabled ? C.gold : C.uiLine });
    }
    if (input.tiltMessageT > 0) g.text(input.tiltMessage, W / 2, ZONES.tilt.y - 30, 14, '#ffe9a0', 'center');
    button(g, ZONES.fx, `EFFECTS: ${this.game.fxLabel.toUpperCase()}${input.isTouch ? '' : '  [F]'}`, { size: 14, color: '#ffe9a0' });
    button(g, ZONES.sound, null, { glyph: (gg, x, y) => drawSpeaker(gg, x, y, this.game.muted) });
  }

  // One-line message at the top, used for device hints (e.g. iOS silent switch).
  drawNotice(g, str, t) {
    const a = clamp(t / 0.4, 0, 1);
    g.layer('overlay');
    g.roundRect(24, 196, W - 48, 64, 12, { fill: 'rgba(16,32,36,0.8)', stroke: C.uiLine, width: 3, alpha: a });
    g.text(str, W / 2, 228, 13, '#ffe9a0', 'center', false, { wrap: W - 100, alpha: a });
  }

  drawPaused(g) {
    g.layer('overlay');
    g.rect(0, 0, W, H, 'rgba(8,16,20,0.55)');
    g.text('PAUSED', W / 2, H / 2 - 30, 44, '#fff', 'center');
    g.text('tap or press P to continue', W / 2, H / 2 + 40, 16, '#cfe8e3', 'center');
    button(g, ZONES.pause, null, { glyph: drawPauseGlyph });
    button(g, ZONES.sound, null, { glyph: (gg, x, y) => drawSpeaker(gg, x, y, this.game.muted) });
  }

  drawGameOver(g, world, t, isNewBest) {
    const a = clamp(t / 0.5, 0, 1);
    g.layer('overlay');
    g.rect(0, 0, W, H, '#081014', 0.6 * a);
    const o = { alpha: a };
    const cause = world.player.deathCause === 'caught' ? 'The witch got him!' : 'The prince fell...';
    g.text(cause, W / 2, H * 0.3, 26, '#ff9a9a', 'center', true, o);
    g.text(`${world.heightM} m`, W / 2, H * 0.3 + 90, 64, C.braid, 'center', true, { alpha: a, glow: 0.4 });
    g.text('climbed', W / 2, H * 0.3 + 150, 16, '#cfe8e3', 'center', true, o);
    if (isNewBest) g.text('NEW BEST!', W / 2, H * 0.3 + 200, 24, '#ffe9a0', 'center', true, { alpha: a, glow: 0.4 });
    else g.text(`best  ${this.game.best} m`, W / 2, H * 0.3 + 200, 18, '#cfe8e3', 'center', true, o);
    g.text(`suns ${world.suns}   stomps ${world.stomps}`, W / 2, H * 0.3 + 250, 14, '#cfe8e3', 'center', true, o);
    if (t > 0.8 && Math.floor(t * 1.6) % 2 === 0) g.text(this.game.input.isTouch ? 'TAP TO TRY AGAIN' : 'SPACE TO TRY AGAIN', W / 2, H * 0.62, 20, '#fff', 'center', true, o);
    button(g, ZONES.sound, null, { glyph: (gg, x, y) => drawSpeaker(gg, x, y, this.game.muted) });
  }
}
