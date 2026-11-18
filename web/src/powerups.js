// The power-ups: what each is called when it starts and its signal colour
// (toast, HUD bar, sparkles). The rules live where they act: durations and
// strengths in config.js, the spawn rule in level.js, the effect on the
// prince in player.js, on the world in world.js, on the enemies in
// enemies.js (`player.seen`).
//
//   star     invincible: what he touches is knocked away like under the boost shield
//   cloak    invisible: nothing with eyes notices him and he passes through it
//            (a pogo on a head still counts; lightning does not need to see him)
//   spring   stronger bounces and boosts, a somersault with each
//   magnet   suns, lanterns and hearts nearby fly to him
//   feather  he comes down slowly
export const POWERS = {
  star:    { toast: 'Invincible!', color: '#ffe27a' },
  cloak:   { toast: 'Invisible!', color: '#b9c8ff' },
  spring:  { toast: 'Super jump!', color: '#ffb347' },
  magnet:  { toast: 'Sun magnet!', color: '#ff8fa6' },
  feather: { toast: 'Light as a feather!', color: '#f2ece0' },
};
export const POWER_KINDS = Object.keys(POWERS);

// The star's rainbow: 24 steps around the colour wheel, bright enough to be
// added over the prince. `rainbow(t)` runs through it once per unit of t.
const hue = (h) => {
  const f = (n) => { const k = (n + h * 6) % 6; return Math.round(255 * (1 - 0.72 * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return '#' + [f(5), f(3), f(1)].map((v) => v.toString(16).padStart(2, '0')).join('');
};
export const RAINBOW = Array.from({ length: 24 }, (_, i) => hue(i / 24));
export const rainbow = (t) => RAINBOW[((Math.floor(t * 24) % 24) + 24) % 24];

// Looks on the prince that are not the power's signal colour.
export const POWER_FX = {
  cloakTint: '#cfe0ff',      // what is left of him
  cloakGlow: '#8fb0ff',      // the shimmer over it
  ringA: '#ff6f8f', ringB: '#ffd43a',   // the magnet's rings: its red, and the suns' gold
  ghost: '#ffe27a',          // the spring's after-images
};
