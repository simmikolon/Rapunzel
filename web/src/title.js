import { W, H } from './config.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';
import { signButton, drawSpeaker, ZONES, SIGNS, CREAM, signTravel } from './hud.js';
import { drawSign } from './sign.js';
import { WORD_ADVANCE } from './art/logo.js';

// The title screen: a wooden sign over the idle world where the prince hops
// on the lawn, and the countdown that follows PLAY. `t` is a running clock
// (the world's time, so the wave does not jump between modes); `dy` moves
// the sign, which is lowered in on its ropes when the title opens and pulled
// up again while the countdown runs; `alpha` is there for fades. 768 x 1364.

export function drawTitle(g, game, t, alpha = 1, dy = 0) {
  const S = SIGNS.title;
  if (alpha <= 0 || dy <= -signTravel(S)) return;
  const input = game.input, logo = game.art.logo;
  const Y = (y) => y + dy;
  const zone = (z) => (dy ? { ...z, y: z.y + dy } : z);
  g.layer('hud');
  drawSign(g, game.art, S.x, Y(S.y), S.w, S.h, { alpha });
  // SIR with its crown, then the letters hopping one after the other
  g.blit(logo.sir, W / 2, Y(224) + Math.sin(t * 2) * 4, { alpha, glow: 0.3 * alpha });
  logo.letters.forEach((s, i) => {
    const wave = Math.sin(t * 3 - i * 0.55);
    const hop = Math.max(0, wave) * 12;                       // only up, like a hop
    const squash = wave < -0.6 ? 1 - (-wave - 0.6) * 0.25 : 1; // a little squash at the bottom
    g.blit(s, W / 2 + (i - 4.5) * WORD_ADVANCE, Y(352) - hop, { alpha, sy: squash, sx: 2 - squash, glow: 0.4 * alpha });
  });
  g.text('a pogo climb', W / 2, Y(392), 16, '#ffd1e3', 'center', true, { alpha });
  if (game.best > 0) g.text(`best  ${game.best} m`, W / 2, Y(434), 18, '#ffe9a0', 'center', true, { alpha });
  // PLAY
  const z = zone(ZONES.play);
  signButton(g, z, null, { primary: true, alpha });
  g.text('PLAY', z.x + z.w / 2, z.y + z.h / 2 + 2, 30, '#fff', 'center', true, { alpha, scale: 1 + 0.03 * Math.sin(t * 4), glow: 0.3 * alpha });
  if (!input.isTouch) g.text('space', z.x + z.w / 2, z.y + z.h + 22, 12, CREAM, 'center', true, { alpha });
  // controls
  const lines = input.isTouch
    ? ['hold left / right side to steer', 'tap the flame to boost']
    : ['arrows / A D to steer', 'space or click to boost'];
  lines.forEach((l, i) => g.text(l, W / 2, Y(626 + i * 30), 14, CREAM, 'center', true, { alpha }));
  // settings in the bottom row: effects left, sound in the middle, tilt right
  signButton(g, zone(ZONES.fx), `FX: ${game.fxPreset.toUpperCase()}${input.isTouch ? '' : '  [F]'}`, { size: 13, color: '#ffe9a0', alpha });
  signButton(g, zone(ZONES.titleSound), null, { alpha, glyph: (gg, x, y) => drawSpeaker(gg, x, y, game.muted) });
  if (input.tiltSupported && (input.isTouch || input.tiltNeedsPermission)) {
    signButton(g, zone(ZONES.tilt), input.tiltEnabled ? 'TILT: ON' : 'TILT: OFF', { size: 13, primary: input.tiltEnabled, alpha });
  }
  if (input.tiltMessageT > 0) g.text(input.tiltMessage, W / 2, Y(762), 13, '#ffe9a0', 'center', true, { alpha });
}

// "3", "2", "1" while the world counts down, "GO!" for the first moments
// of the round (keyed to the world's clock, so a pause never shows it again).
export function drawCount(g, world) {
  const t = world.countT;
  let label, color, size;
  if (world.phase === 'countdown') { label = `${world.count}`; color = '#fff'; size = 120; }
  else if (world.started && t < 0.7) { label = 'GO!'; color = C.gold; size = 96; }
  else return;
  const pop = easeOutBack(clamp(t / 0.22, 0, 1));
  const a = label === 'GO!' ? clamp(1 - t / 0.7, 0, 1) : 1;
  g.layer('overlay');
  g.text(label, W / 2, H * 0.42, size, color, 'center', true, { scale: pop, alpha: a, glow: 0.5 });
}
