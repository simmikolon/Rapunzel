import { W, H, BOOST_CHARGES, MAX_HEARTS } from './config.js';
import { blit } from './art/sprite.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';

export const FONT = '"Press Start 2P", "Courier New", monospace';

export function text(ctx, str, x, y, size, color = '#fff', align = 'left', outline = true) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size * 0.28);
    ctx.strokeStyle = 'rgba(10,20,24,0.85)';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function button(ctx, zone, label, opts = {}) {
  const { x, y, w, h } = zone;
  ctx.fillStyle = opts.fill || 'rgba(16,32,36,0.72)';
  roundRect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = opts.stroke || C.uiLine; ctx.stroke();
  if (label) text(ctx, label, x + w / 2, y + h / 2 + 2, opts.size || 22, opts.color || '#fff', 'center', false);
  if (opts.glyph) opts.glyph(ctx, x + w / 2, y + h / 2);
}

export const ZONES = {
  pause: { id: 'pause', x: W - 84, y: 112, w: 64, h: 64 },
  sound: { id: 'sound', x: W - 164, y: 112, w: 64, h: 64 },
  boost: { id: 'boost', x: W - 190, y: H - 200, w: 160, h: 160 },
  tilt: { id: 'tilt', x: W / 2 - 220, y: H - 330, w: 440, h: 76 },
};

export function drawSpeaker(ctx, cx, cy, muted) {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(cx - 16, cy - 7); ctx.lineTo(cx - 6, cy - 7); ctx.lineTo(cx + 6, cy - 17); ctx.lineTo(cx + 6, cy + 17); ctx.lineTo(cx - 6, cy + 7); ctx.lineTo(cx - 16, cy + 7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = muted ? '#ff6b6b' : '#fff'; ctx.lineWidth = 4;
  if (muted) { ctx.beginPath(); ctx.moveTo(cx + 10, cy - 10); ctx.lineTo(cx + 22, cy + 10); ctx.moveTo(cx + 22, cy - 10); ctx.lineTo(cx + 10, cy + 10); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(cx + 8, cy, 12, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + 8, cy, 20, -0.9, 0.9); ctx.stroke(); }
}

export function drawPauseGlyph(ctx, cx, cy) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - 14, cy - 16, 10, 32); ctx.fillRect(cx + 4, cy - 16, 10, 32);
}

export function drawFlame(ctx, cx, cy, s = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = C.flame3;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(26, -4, 14, 22); ctx.quadraticCurveTo(0, 34, -14, 22); ctx.quadraticCurveTo(-26, -4, 0, -30); ctx.fill();
  ctx.fillStyle = C.flame2;
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(14, 4, 8, 20); ctx.quadraticCurveTo(0, 28, -8, 20); ctx.quadraticCurveTo(-14, 4, 0, -12); ctx.fill();
  ctx.fillStyle = C.flame1;
  ctx.beginPath(); ctx.arc(0, 14, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export class HUD {
  constructor(game) { this.game = game; }

  // Register touch zones for this frame.
  layout(mode) {
    const input = this.game.input;
    const zones = [];
    if (mode === 'playing' || mode === 'paused') { zones.push(ZONES.pause, ZONES.sound); if (input.isTouch) zones.push(ZONES.boost); }
    if (mode === 'title') { zones.push(ZONES.sound); if (input.tiltSupported && (input.isTouch || input.tiltNeedsPermission)) zones.push(ZONES.tilt); }
    if (mode === 'gameover') zones.push(ZONES.sound);
    input.buttonZones = zones;
  }

  drawPlaying(ctx, world) {
    const pl = world.player, art = this.game.art;
    // Height
    text(ctx, `${world.heightM} m`, 28, 64, 40, '#fff');
    if (this.game.best > 0) text(ctx, `best ${this.game.best} m`, 28, 112, 16, '#cfe8e3');
    if (world.suns) { blit(ctx, art.creatures.sun[0], 44, 152); text(ctx, `${world.suns}`, 76, 154, 18, '#ffe9a0'); }
    // Hearts
    for (let i = 0; i < MAX_HEARTS; i++) {
      const s = i < pl.hearts ? art.creatures.heart : art.creatures.heartEmpty;
      blit(ctx, s, W - 48 - i * 50, 60);
    }
    // Boost charges
    const bx = 28, by = H - 78;
    text(ctx, 'boost', bx, by - 36, 14, '#cfe8e3');
    for (let i = 0; i < BOOST_CHARGES; i++) {
      const full = pl.boost >= i + 1;
      const part = clamp(pl.boost - i, 0, 1);
      const x = bx + i * 56;
      ctx.fillStyle = 'rgba(16,32,36,0.6)'; roundRect(ctx, x, by - 20, 44, 44, 8); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = full ? C.gold : C.uiLine; ctx.stroke();
      if (part > 0) drawFlame(ctx, x + 22, by + 2, 0.55 * (0.5 + 0.5 * part), full ? 1 : 0.5);
    }
    // Buttons
    button(ctx, ZONES.pause, null, { glyph: drawPauseGlyph });
    button(ctx, ZONES.sound, null, { glyph: (c, x, y) => drawSpeaker(c, x, y, this.game.muted) });
    if (this.game.input.isTouch) {
      const z = ZONES.boost;
      const can = pl.boost >= 1;
      ctx.fillStyle = can ? 'rgba(255,170,60,0.28)' : 'rgba(16,32,36,0.5)';
      ctx.beginPath(); ctx.arc(z.x + z.w / 2, z.y + z.h / 2, z.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = can ? C.gold : C.uiLine; ctx.stroke();
      drawFlame(ctx, z.x + z.w / 2, z.y + z.h / 2, 1.3, can ? 1 : 0.4);
    }
    // Toasts
    let ty = H * 0.3;
    for (const t of world.toasts) {
      const a = clamp(t.life / 0.4, 0, 1);
      const pop = easeOutBack(clamp((t.maxLife - t.life) / 0.25, 0, 1));
      ctx.globalAlpha = a;
      text(ctx, t.text, W / 2, ty, 30 * pop, t.color, 'center');
      ctx.globalAlpha = 1;
      ty += 46;
    }
  }

  drawTitle(ctx, world, t) {
    const input = this.game.input;
    const bob = Math.sin(t * 2) * 6;
    // Title
    text(ctx, 'RAPUNZEL', W / 2, 250 + bob, 62, C.braid, 'center');
    text(ctx, 'a pogo climb', W / 2, 322 + bob, 20, '#ffd1e3', 'center');
    const blink = Math.floor(t * 1.6) % 2 === 0;
    if (blink) text(ctx, input.isTouch ? 'TAP TO START' : 'PRESS SPACE TO START', W / 2, 560, 22, '#fff', 'center');
    // Controls
    const lines = input.isTouch
      ? ['hold left / right side to steer', 'tap the flame to boost', 'or enable tilt and tap anywhere']
      : ['arrows / A D to steer', 'space or click to boost', 'bounce on branches and ribbons'];
    lines.forEach((l, i) => text(ctx, l, W / 2, 640 + i * 34, 14, '#cfe8e3', 'center'));
    if (this.game.best > 0) text(ctx, `best  ${this.game.best} m`, W / 2, 760, 18, '#ffe9a0', 'center');
    if (input.buttonZones.includes(ZONES.tilt)) {
      button(ctx, ZONES.tilt, input.tiltEnabled ? 'TILT: ON  (tap to turn off)' : 'ENABLE TILT STEERING', { size: 15, stroke: input.tiltEnabled ? C.gold : C.uiLine });
    }
    if (input.tiltMessageT > 0) text(ctx, input.tiltMessage, W / 2, ZONES.tilt.y - 30, 14, '#ffe9a0', 'center');
    button(ctx, ZONES.sound, null, { glyph: (c, x, y) => drawSpeaker(c, x, y, this.game.muted) });
  }

  // One-line message at the top, used for device hints (e.g. iOS silent switch).
  drawNotice(ctx, str, t) {
    const a = clamp(t / 0.4, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(16,32,36,0.8)';
    roundRect(ctx, 24, 196, W - 48, 64, 12); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.uiLine; ctx.stroke();
    // wrap into two lines if needed
    ctx.font = `13px ${FONT}`;
    const words = str.split(' '); const lines = []; let cur = '';
    for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > W - 100 && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur);
    lines.slice(0, 2).forEach((l, i) => text(ctx, l, W / 2, 228 + (i - (lines.length - 1) / 2) * 20, 13, '#ffe9a0', 'center', false));
    ctx.globalAlpha = 1;
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(8,16,20,0.55)'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', W / 2, H / 2 - 30, 44, '#fff', 'center');
    text(ctx, 'tap or press P to continue', W / 2, H / 2 + 40, 16, '#cfe8e3', 'center');
    button(ctx, ZONES.pause, null, { glyph: drawPauseGlyph });
    button(ctx, ZONES.sound, null, { glyph: (c, x, y) => drawSpeaker(c, x, y, this.game.muted) });
  }

  drawGameOver(ctx, world, t, isNewBest) {
    const a = clamp(t / 0.5, 0, 1);
    ctx.fillStyle = `rgba(8,16,20,${0.6 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    const cause = world.player.deathCause === 'caught' ? 'The witch got him!' : 'The prince fell...';
    text(ctx, cause, W / 2, H * 0.3, 26, '#ff9a9a', 'center');
    text(ctx, `${world.heightM} m`, W / 2, H * 0.3 + 90, 64, C.braid, 'center');
    text(ctx, 'climbed', W / 2, H * 0.3 + 150, 16, '#cfe8e3', 'center');
    if (isNewBest) text(ctx, 'NEW BEST!', W / 2, H * 0.3 + 200, 24, '#ffe9a0', 'center');
    else text(ctx, `best  ${this.game.best} m`, W / 2, H * 0.3 + 200, 18, '#cfe8e3', 'center');
    text(ctx, `suns ${world.suns}   stomps ${world.stomps}`, W / 2, H * 0.3 + 250, 14, '#cfe8e3', 'center');
    if (t > 0.8 && Math.floor(t * 1.6) % 2 === 0) text(ctx, this.game.input.isTouch ? 'TAP TO TRY AGAIN' : 'SPACE TO TRY AGAIN', W / 2, H * 0.62, 20, '#fff', 'center');
    ctx.globalAlpha = 1;
    button(ctx, ZONES.sound, null, { glyph: (c, x, y) => drawSpeaker(c, x, y, this.game.muted) });
  }
}
