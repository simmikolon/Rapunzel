export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (a === b ? 0 : clamp((v - a) / (b - a), 0, 1));
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
export const TAU = Math.PI * 2;

// Frame-rate independent exponential approach: moves `cur` toward `target`
// with `rate` per second.
export const approach = (cur, target, rate, dt) => lerp(cur, target, 1 - Math.exp(-rate * dt));

export const moveToward = (cur, target, maxDelta) => {
  if (Math.abs(target - cur) <= maxDelta) return target;
  return cur + sign(target - cur) * maxDelta;
};

// Deterministic PRNG (mulberry32) so a run can be reproduced from a seed.
export class RNG {
  constructor(seed = (Math.random() * 0xffffffff) >>> 0) { this.s = seed >>> 0; }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(lo, hi) { return lo + (hi - lo) * this.next(); }
  int(lo, hi) { return Math.floor(this.range(lo, hi + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  sign() { return this.next() < 0.5 ? -1 : 1; }
  // Weighted pick: items are [value, weight]
  weighted(items) {
    let total = 0;
    for (const it of items) total += it[1];
    let r = this.next() * total;
    for (const it of items) { r -= it[1]; if (r <= 0) return it[0]; }
    return items[items.length - 1][0];
  }
}

// Mix two css hex colors (#rrggbb) by t.
export function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

export function hexToRgb(hex) {
  const p = parseInt(hex.slice(1), 16);
  return [p >> 16, (p >> 8) & 255, p & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// Axis-aligned rectangle overlap. Rects: {x, y, w, h} with (x, y) = bottom-left in world space.
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
