import { clamp } from './util.js';
import { hash } from './altitude.js';

// The tower in stages (a trial, docs/DESIGN.md): the climb is not one endless
// stretch in one place but a row of stretches with a start and an end. A
// stage is climbed in one place (places.js); it ends at a floor across the
// whole width with a door above it and nothing above that, so the only way
// on is through the door, which leads to the next stage in the other place.
// Between its start and its end a stage is the generator's rows as ever
// (level.js). Its looks, its creatures and how hard it is still come from
// the height, as in the endless game, so the list below cuts the stages
// along the zones' bands: each stage is one zone of one place, and the
// outside is another one every time he comes out again.
// Whoever falls or is caught goes on from the last door he came through
// (`retry`), as often as `retries` says; the height reached stays the score.
export const STAGES = {
  // where a stage is climbed and the height it ends at (px; it begins where the one before it ended)
  list: [
    { place: 'outside', to: 4000 },    // the forest floor: the first jumps, the lawn below
    { place: 'inside', to: 12000 },    // the hall (and the first golden door)
    { place: 'outside', to: 19000 },   // the deep forest
    { place: 'inside', to: 25000 },    // the guard rooms
    { place: 'outside', to: 32500 },   // the windows
    { place: 'inside', to: 40000 },    // the library
    { place: 'outside', to: 48500 },   // above the trees
    { place: 'inside', to: 57000 },    // the belfry
  ],
  then: [8000, 9500],     // beyond the list the places go on taking turns, each stage this long
  calmAfter: 500,         // nobody waits right behind a door: no creatures for this far into a stage
  calmBefore: 1200,       // and its last stretch is a breather before the door
  doorGap: 270,           // the door's landing this far above the floor at a stage's end: an easy jump
  floorShown: 110,        // the camera stops with that floor this far above the picture's lower edge
  retry: 'door',          // 'door': after a fall or the last heart he goes on from the last door; 'start': the round is over, as in the endless game
  retries: Infinity,      // how often in a round
};

// Stage n of a route (0 is the first): { n, place, from, to }. `from` is where
// the list says it begins; the level puts the real height of its door there.
export function stageAt(route, n) {
  const L = route.list;
  if (n < L.length) return { n, place: L[n].place, from: n ? L[n - 1].to : 0, to: L[n].to };
  let from = L[L.length - 1].to, place = L[L.length - 1].place;
  for (let i = L.length; ; i++) {
    const len = route.then[0] + (hash(i * 53 + 11) % (route.then[1] - route.then[0] + 1));
    place = place === 'outside' ? 'inside' : 'outside';
    if (i === n) return { n, place, from, to: from + len };
    from += len;
  }
}

// The pacing inside a stage (level.js pacingAt gives the endless game's
// waves): calm right behind the door, then the pressure builds toward the
// end, and the last stretch before the door is a breather: closer rows,
// nothing that crumbles, nobody about, more suns.
export function stagePacing(route, st, y) {
  if (y >= st.to - route.calmBefore) return { breather: true, enemy: 0, dry: 0, short: 0, long: 1.6, gap: 0.85, sun: 1.6, lantern: 1.5 };
  const t = clamp((y - st.from) / Math.max(1, st.to - route.calmBefore - st.from), 0, 1);
  return { breather: false, enemy: y < st.from + route.calmAfter ? 0 : 0.75 + 0.45 * t, dry: 0.8 + 0.4 * t, short: 0.8 + 0.4 * t, long: 1, gap: 1, sun: 1, lantern: 1 };
}
