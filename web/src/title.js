import { W, H } from './config.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';
import { button, ZONES } from './hud.js';
import { WORD_ADVANCE } from './art/logo.js';

// The title screen, drawn over the idle world where the prince hops on the
// lawn, and the countdown that follows PLAY. `t` is a running clock (the
// world's time, so the wave does not jump between modes); `alpha` fades the
// screen out while the countdown runs. Logical 768 x 1364 coordinates.

export function drawTitle(g, game, t, alpha = 1) {
  if (alpha <= 0) return;
  const input = game.input, logo = game.art.logo;
  const rise = (1 - alpha) * 40;           // the wordmark drifts up as it fades
  g.layer('hud');
  // SIR with its crown, then the letters hopping one after the other
  g.blit(logo.sir, W / 2, 200 - rise + Math.sin(t * 2) * 4, { alpha, glow: 0.3 * alpha });
  logo.letters.forEach((s, i) => {
    const wave = Math.sin(t * 3 - i * 0.55);
    const hop = Math.max(0, wave) * 12;                       // only up, like a hop
    const squash = wave < -0.6 ? 1 - (-wave - 0.6) * 0.25 : 1; // a little squash at the bottom
    g.blit(s, W / 2 + (i - 4.5) * WORD_ADVANCE, 336 - rise - hop, { alpha, sy: squash, sx: 2 - squash, glow: 0.4 * alpha });
  });
  g.text('a pogo climb', W / 2, 394 - rise, 16, '#ffd1e3', 'center', true, { alpha });
  if (game.best > 0) g.text(`best  ${game.best} m`, W / 2, 448 - rise, 18, '#ffe9a0', 'center', true, { alpha });
  // PLAY
  const z = ZONES.play;
  button(g, z, null, { stroke: C.gold, fill: 'rgba(16,32,36,0.78)', alpha });
  g.text('PLAY', z.x + z.w / 2, z.y + z.h / 2 + 2, 30, '#fff', 'center', true, { alpha, scale: 1 + 0.03 * Math.sin(t * 4), glow: 0.3 * alpha });
  if (!input.isTouch) g.text('space', z.x + z.w / 2, z.y + z.h + 22, 12, '#cfe8e3', 'center', true, { alpha });
  // controls
  const lines = input.isTouch
    ? ['hold left / right side to steer', 'tap the flame to boost']
    : ['arrows / A D to steer', 'space or click to boost'];
  lines.forEach((l, i) => g.text(l, W / 2, 672 + i * 30, 14, '#cfe8e3', 'center', true, { alpha }));
  // settings on the lawn: effects left, tilt right (the sound button is the HUD's)
  button(g, ZONES.fx, `FX: ${game.fxPreset.toUpperCase()}${input.isTouch ? '' : '  [F]'}`, { size: 13, color: '#ffe9a0', alpha });
  if (input.buttonZones.includes(ZONES.tilt)) {
    button(g, ZONES.tilt, input.tiltEnabled ? 'TILT: ON' : 'TILT: OFF', { size: 13, stroke: input.tiltEnabled ? C.gold : C.uiLine, alpha });
  }
  if (input.tiltMessageT > 0) g.text(input.tiltMessage, W / 2, ZONES.tilt.y - 26, 13, '#ffe9a0', 'center', true, { alpha });
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
