import { W, H } from './config.js';
import { PAL as C } from './palette.js';
import { clamp, easeOutBack } from './util.js';
import { tagButton, ribbonButton, drawBest, drawSpeaker, ZONES, SIGNS, signTravel } from './hud.js';
import { drawSign, paint, INK } from './sign.js';
import { WORD_ADVANCE } from './art/logo.js';

// The title screen: a wooden sign over the idle world where the prince hops
// on the lawn, and the countdown that follows PLAY. `t` is a running clock
// (the world's time, so the wave does not jump between modes); `dy` moves
// the sign, which is lowered in on its ropes when the title opens and pulled
// up again while the countdown runs; `alpha` is there for fades. 768 x 1364.

export function drawTitle(g, game, t, alpha = 1, dy = 0) {
  const S = SIGNS.title;
  if (alpha <= 0 || dy <= -signTravel(S)) return;
  const input = game.input, art = game.art, logo = art.logo;
  const Y = (y) => y + dy;
  const zone = (z) => (dy ? { ...z, y: z.y + dy } : z);
  g.layer('hud');
  drawRapunzelBehind(g, art, t, S, Y, alpha);
  drawSign(g, art, S.x, Y(S.y), S.w, S.h, { alpha });
  drawRapunzelFront(g, art, t, S, Y, alpha);
  // SIR with its crown, then the letters hopping one after the other
  g.blit(logo.sir, W / 2, Y(224) + Math.sin(t * 2) * 4, { alpha, glow: 0.3 * alpha });
  logo.letters.forEach((s, i) => {
    const wave = Math.sin(t * 3 - i * 0.55);
    const hop = Math.max(0, wave) * 12;                       // only up, like a hop
    const squash = wave < -0.6 ? 1 - (-wave - 0.6) * 0.25 : 1; // a little squash at the bottom
    g.blit(s, W / 2 + (i - 4.5) * WORD_ADVANCE, Y(352) - hop, { alpha, sy: squash, sx: 2 - squash, glow: 0.4 * alpha });
  });
  paint(g, 'a pogo climb', W / 2, Y(392), 15, 'center', { alpha, color: C.ribbonDark });
  if (game.best > 0) drawBest(g, art, W / 2, Y(436), game.best, alpha);
  // PLAY on a ribbon
  const z = zone(ZONES.play);
  ribbonButton(g, art, z, 'PLAY', { alpha, t });
  if (!input.isTouch) paint(g, 'space', W / 2, Y(588), 12, 'center', { alpha });
  // controls, painted on the boards
  const lines = input.isTouch
    ? ['hold left / right side to steer', 'tap the flame to boost']
    : ['arrows / A D to steer', 'space or click to boost'];
  lines.forEach((l, i) => paint(g, l, W / 2, Y(626 + i * 30), 14, 'center', { alpha }));
  // settings in the bottom row: effects left, sound in the middle, tilt right
  tagButton(g, zone(ZONES.fx), game.fxPreset.toUpperCase(), { alpha, size: 13, icon: (gg, x, y, a) => gg.blit(art.sign.sparkle, x, y, { alpha: a, glow: 0.4 * a }) });
  tagButton(g, zone(ZONES.titleSound), null, { alpha, icon: (gg, x, y, a) => drawSpeaker(gg, x, y, game.muted, INK) });
  if (input.tiltSupported && (input.isTouch || input.tiltNeedsPermission)) {
    const on = input.tiltEnabled;
    tagButton(g, zone(ZONES.tilt), on ? 'TILT ON' : 'TILT OFF', { alpha, size: 13, on, icon: (gg, x, y, a) => gg.blit(on ? art.sign.phoneOn : art.sign.phone, x, y, { alpha: a }) });
  }
  if (input.tiltMessageT > 0) paint(g, input.tiltMessage, W / 2, Y(762), 13, 'center', { alpha });
}

// Rapunzel peeks over the sign's top-right corner, holding on. Her braid
// starts behind her hair, runs down behind the sign and comes out under
// it, swinging, with a bow at its end. The sign is drawn between the two.
const RAP_X = 108;      // her head this far in from the sign's right edge
function drawRapunzelBehind(g, art, t, S, Y, alpha) {
  const hx = S.x + S.w - RAP_X, top = Y(S.y);
  const bob = Math.sin(t * 1.7) * 3;
  const blink = (t % 4.3) < 0.13;
  g.blit(art.tiles.braid, hx + 36, top - 40 + bob, { alpha });
  g.blit(blink ? art.sign.rapunzelBlink : art.sign.rapunzel, hx, top + 4 + bob, { alpha });
}
function drawRapunzelFront(g, art, t, S, Y, alpha) {
  const hx = S.x + S.w - RAP_X, top = Y(S.y), bottom = Y(S.y + S.h);
  g.blit(art.sign.hands, hx, top + 8, { alpha });
  const sway = Math.sin(t * 1.4);
  for (let i = 0; i < 2; i++) g.blit(art.tiles.braid, hx + 36 + sway * (3 + 5 * i), bottom - 12 + i * 40, { alpha });
  g.blit(art.sign.bow, hx + 36 + sway * 14, bottom + 74, { alpha });
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
