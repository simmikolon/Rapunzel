import { clamp } from './util.js';

// The tower in stages (a trial, docs/DESIGN.md): the climb is not one endless
// stretch in one place but a row of stretches with a start and an end. A
// stage is climbed in one place (places.js); it ends at a floor across the
// whole width with a door above it and nothing above that, so the only way
// on is through the door, which leads to the next stage in the other place.
// Between its start and its end a stage is the generator's rows as ever
// (level.js).
//
// This file is where the stages are written down: THEMES says what each kind
// of stage is, STAGES.route and STAGES.loop in which order they come.
//
// A theme is a piece of the tower we have, given a face of its own:
//   name    what the stage is called when he comes into it
//   place   'outside' or 'inside'
//   at      the height (m) of the endless tower it is taken from. Everything
//           that depends on the height there comes with it: the zone and so
//           who lives in it (level.js ZONES), the trees, the forest behind,
//           the sky and its light, the floor of the tower inside. A stage is
//           built at that height in the world; the score is counted apart.
//   len     how long it is (m)
//   wall    (outside) what the tower's wall is built of for the whole stage:
//           'stone' (old big stones), 'worn' (crumbling), 'mended' (the
//           masons' site), 'foot' (plain wall over the tower's foot of old
//           stone) or none (the plain bricks)
//   growth  (outside) what grows on it: 'ivy', 'moss', 'briar' or none.
//           The two make the stage's recipe (towerwall.js): what grows comes
//           and goes over what is built. The first time a theme is climbed
//           it is as written here; when it comes round again (`loop`) the
//           part it leaves open is rolled from the round's seed.
//   roses   (with growth 'briar') the roses' colour: 0 red, 1 white, 2 old rose
//   hung    (outside) what hangs on the wall at every storey, on the side
//           that has no window: 'lanterns' (lit when it is dark) or
//           'banners' (the witch's and the guards', which blow in the wind)
//   edge    (outside) what stands out at the wall's edges: 'gargoyles' (a
//           pair at every second string course, which spout when it rains)
//   dark    (inside) the lights are out for the whole stage; in the others
//           they stay on
//   vault   (inside) a golden door to the treasury stands in it
//   weather (outside) the stage's weather (weather.js): 'rain', 'snow' or
//           'golden' (the golden hour); none: clear. 'storm': a storm
//           always comes over this stage (over the others now and then),
//           drawing up after its first part and gone before its end
// How hard a stage is does not come from `at` but from how far he has come
// (level.js tierOf), so a theme can come again later and be harder then.
export const THEMES = {
  // outside
  lawn:      { name: 'the forest floor', place: 'outside', at: 0, len: 60, wall: 'foot' },
  roses:     { name: 'the rose wall', place: 'outside', at: 18, len: 95, growth: 'briar', roses: 0, weather: 'golden' },
  ivy:       { name: 'the ivy wall', place: 'outside', at: 24, len: 95, growth: 'ivy', weather: 'rain' },
  deep:      { name: 'the deep forest', place: 'outside', at: 128, len: 105, wall: 'stone', growth: 'moss', edge: 'gargoyles', weather: 'rain' },
  site:      { name: "the masons' site", place: 'outside', at: 256, len: 100, wall: 'mended', weather: 'snow' },
  crumbling: { name: 'the crumbling tower', place: 'outside', at: 262, len: 100, wall: 'worn', hung: 'banners', edge: 'gargoyles', weather: 'storm' },
  sky:       { name: 'above the trees', place: 'outside', at: 468, len: 105, wall: 'stone', hung: 'banners', edge: 'gargoyles' },
  night:     { name: 'the night sky', place: 'outside', at: 705, len: 105, wall: 'stone', growth: 'briar', roses: 1, hung: 'lanterns', weather: 'snow' },
  // inside
  // (a stage stays inside one band of the tower's floors, 0, 120, 250 and 400 m: the floor is its furniture)
  hall:      { name: 'the hall', place: 'inside', at: 4, len: 114, vault: true },
  guards:    { name: 'the guard rooms', place: 'inside', at: 124, len: 100 },
  dark:      { name: 'the dark rooms', place: 'inside', at: 136, len: 95, dark: true },
  library:   { name: 'the library', place: 'inside', at: 254, len: 130, vault: true },
  belfry:    { name: 'the belfry', place: 'inside', at: 404, len: 105 },
};

export const STAGES = {
  // the stages of a round, first to last (the places take turns) ...
  route: ['lawn', 'hall', 'roses', 'guards', 'deep', 'dark', 'site', 'library', 'sky', 'belfry'],
  // ... and after the last of them these, round and round, for as long as he lasts
  loop: ['crumbling', 'hall', 'deep', 'dark', 'night', 'guards', 'ivy', 'library', 'sky', 'belfry', 'roses', 'dark', 'site', 'guards'],
  calmAfter: 500,         // nobody waits right behind a door: no creatures for this far into a stage
  calmBefore: 1200,       // and its last stretch is a breather before the door
  doorGap: 270,           // the door's landing this far above the floor at a stage's end: an easy jump
  floorShown: 110,        // the camera stops with that floor this far above the picture's lower edge
  // Hearts are his health inside a stage; lives are how often he may lose
  // them all (or fall) in a round. With a life left he goes on from the last
  // door he came through, with all his hearts; with the last one gone the
  // round is over. Infinity: he goes on for ever.
  lives: 3,
};

// Stage n of a route (0 is the first): its theme's fields and { n, key, lap,
// from, to } with `from` and `to` the heights in the world it is built
// between and `lap` 0 for the stages of `route`, 1 the first time round
// `loop`, 2 the second.
export function stageAt(route, n) {
  const R = route.route.length, key = n < R ? route.route[n] : route.loop[(n - R) % route.loop.length];
  const T = THEMES[key], from = T.at * 100;
  return { ...T, n, key, lap: n < R ? 0 : 1 + Math.floor((n - R) / route.loop.length), from, to: from + T.len * 100 };
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
