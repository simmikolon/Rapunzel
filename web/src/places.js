// The places a round is climbed in: outside the tower, between the two
// trees, or inside it, between its pillars. A place says what differs:
// whether the sky's platforms and creatures belong to it, which events run.
// What it looks like, what its rows are made of and who lives there sit
// where they act (background.js, level.js) and ask the place.
//
// A round has one place for now. Later a gate will change it at a height,
// so everyone looks it up through the world (`world.place`, `level.place`)
// instead of remembering it.
export const PLACES = {
  outside: { name: 'outside', label: 'OUTSIDE', inside: false, sky: true, witch: true, storks: true },
  inside: { name: 'inside', label: 'INSIDE', inside: true, sky: false, witch: false, storks: false },
};
export const placeOf = (name) => PLACES[name] || PLACES.outside;
