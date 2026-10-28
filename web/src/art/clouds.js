import { makeSprite } from './sprite.js';
import { RNG } from '../util.js';
import { CLOUD_SIZE } from '../platforms.js';

// Cloud platforms: three sizes, two drawings each, in three looks. The
// landing surface is 4 art px below the sprite top, so the prince's feet
// sink a little into the top lobes. Same pixel grid and value structure as
// the rest: a lit rim on top of every lobe, a shaded rim below.
const LOOKS = {
  thick: { body: '#f6f4ee', shade: '#cfd9df', deep: '#a9b9c3', top: '#ffffff' },
  wispy: { body: '#e6eff5', shade: '#c2d3de', deep: '#a3b8c6', top: '#f8fbfd' },
  storm: { body: '#5c5a78', shade: '#423f5a', deep: '#2d2b42', top: '#8f8db0' },
};

function drawCloud(t, Wa, Ha, look, variant) {
  const { ellipse, disc, p, line, ctx } = t;
  const c = LOOKS[look];
  const r = new RNG(Wa * 131 + variant * 17 + Ha * 3 + (look === 'storm' ? 5 : look === 'wispy' ? 3 : 0));
  const lobe = (cx, cy, rr) => { disc(cx, cy + 1, rr, c.shade); disc(cx, cy - 1, rr, c.top); disc(cx, cy, rr, c.body); };
  // body: a wide low ellipse from the surface down
  ellipse(Wa / 2, (Ha + 4) / 2, Wa / 2 - 1, (Ha - 4) / 2 - 0.5, c.body);
  ellipse(Wa / 2, Ha - 3, Wa / 2 - 3, 2.5, c.shade);
  p(4, Ha - 2, Wa - 8, 1, c.deep);
  p(6, Ha - 1, Wa - 12, 1, c.deep);
  // bottom lobes, shaded
  const nb = Math.max(2, Math.round(Wa / 16));
  for (let i = 0; i < nb; i++) { const cx = Math.round(5 + (Wa - 10) * (i + 0.5) / nb + r.range(-2, 2)); const rr = r.int(2, 3); disc(cx, Ha - 3, rr, c.shade); p(cx - rr + 1, Ha - 1, rr * 2 - 2, 1, c.deep); }
  // top lobes, the big one off centre
  const n = Math.max(3, Math.round(Wa / 11));
  const big = r.int(0, n - 1);
  for (let i = 0; i < n; i++) {
    const cx = Math.round(4 + (Wa - 8) * (i + 0.5) / n + r.range(-1.5, 1.5));
    const rr = i === big ? Math.min(7, Math.floor(Ha / 2)) : r.int(3, Math.min(5, Math.floor(Ha / 2.6)));
    lobe(cx, 1 + rr, rr);
  }
  if (look === 'wispy') {
    // ragged: holes punched through, thin wisps trailing off both ends
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3 + variant; i++) ellipse(r.int(6, Wa - 6), r.int(6, Ha - 3), r.int(2, 4), r.int(1, 2), '#000');
    for (let i = 0; i < 4; i++) { const y = r.int(5, Ha - 2); p(r.chance(0.5) ? 0 : Wa - 3, y, 3, 1, '#000'); }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) { const y = r.int(6, Ha - 3); line(0, y, 3, y, c.shade); line(Wa - 4, y + 1, Wa - 1, y + 1, c.shade); }
  }
  if (look === 'storm') {
    // heavy underside, a lighter crest, flecks of lighter grey
    ellipse(Wa / 2, Ha - 3, Wa / 2 - 2, 2.5, c.deep);
    for (let i = 0; i < Wa / 6; i++) p(r.int(3, Wa - 4), r.int(5, Ha - 5), 1, 1, r.chance(0.5) ? c.shade : '#6c6a8a');
  }
}

export function buildClouds() {
  const out = {};
  for (const look of Object.keys(LOOKS)) {
    out[look] = {};
    for (const [size, { art: [w, h] }] of Object.entries(CLOUD_SIZE)) {
      out[look][size] = [0, 1].map((v) => makeSprite(w, h, (t) => drawCloud(t, w, h, look, v), undefined, { axPx: w * 2, ayPx: 4 * 4 }));
    }
  }
  return out;
}
