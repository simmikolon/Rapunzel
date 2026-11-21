// The places a round is climbed in: outside the tower, between the two
// trees, or inside it, between its pillars. A place says what differs:
// whether the sky's platforms and creatures belong to it, which events run.
// What it looks like, what its rows are made of and who lives there sit
// where they act (background.js, level.js) and ask the place.
//
// A round starts in one place and a gate (a door in the tower's wall, a
// landing under it) leads to the other (`other`; `arrive` is what is said
// on coming through), so everyone looks the place up through the world
// (`world.place`, `level.place`) instead of remembering it.
export const PLACES = {
  outside: { name: 'outside', label: 'OUTSIDE', inside: false, sky: true, witch: true, storks: true, other: 'inside', arrive: 'Out into the forest!' },
  inside: { name: 'inside', label: 'INSIDE', inside: true, sky: false, witch: false, storks: false, other: 'outside', arrive: 'Into the tower!' },
};
// The treasury is a room, not a place a round is climbed in: a golden door
// inside the tower leads into it and another out of it again, a little
// higher (vault.js). So it is not among PLACES (the title's choice,
// ?place=), but while he is in it, it is the world's place: `inside`, so
// the room's painter draws and its things are the tower's, and `vault`, for
// everything that is different in there (no rows, no creatures, a floor).
export const TREASURY = { name: 'vault', label: 'TREASURY', inside: true, vault: true, sky: false, witch: false, storks: false, arrive: 'The treasury!' };
export const placeOf = (name) => PLACES[name] || (name === TREASURY.name ? TREASURY : PLACES.outside);
