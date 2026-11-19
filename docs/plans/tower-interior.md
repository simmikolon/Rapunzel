# Plan: inside the tower

A second place to climb: the tower's inside, chosen on the title sign
next to the outside we have. Its own picture, its own things to stand on,
its own light, its own creatures. Later, gates in the endless tower lead
from one to the other.

## Why

The long climb needs new places more than new probabilities (design
document, section 5). The outside is full up to about 550 m by now; a
twelfth enemy there adds less than a second place does. The inside also
gives the ideas that do not fit outside a home: spider webs, stairs,
torches, a ghost.

## The picture

Same screen, same lanes, so everything that knows the outside's geometry
keeps working: stone pillars stand where the trunks stand (|x| 284 to
384, the prince's plane), and what he stands on grows from their inner
edge like branches do.

Back to front:

1. **The outside, seen through the windows**: the sky at this height, the
   stars, the moon and the far clouds (0.3), the distant forest (0.55),
   and the braid hanging down the wall outside (0.8, swaying as it does).
   The height inside is the height outside: forest at the bottom, open
   sky, sunset, night at 700 m. That gives the sense of height a room
   would otherwise lose, and makes the gates natural later.
2. **The back wall** (0.9, the tower layer): brick between the pillars,
   and in its centre column a tall arched window every storey, so there
   is always one in view. The window is a hole in the wall tiles; the
   outside is simply drawn first, no masking. Because the layers move at
   different speeds, the forest and the braid slide past the window frame
   as he climbs: the parallax out through the windows.
3. **The pillars** (1.0): stone, with doors, arrow slits and torch
   brackets by hash, like the trunks' overlays.
4. Platforms, pickups, creatures, the prince.
5. **Light** (below).

The round starts in the entrance hall: flagstones, the big door behind
him, a torch on each pillar. On the title the hall replaces the lawn
when INSIDE is chosen.

## What he stands on

| Outside | Inside | How |
|---|---|---|
| branch, four lengths, dry ones crumble | **stone ledge** (corbelled slab), four lengths, cracked ones crumble | the same kinds (`branchL` / `branchR`) with a stone look: a fifth "tree style" and its own cracked drawing. Lengths, rules and the bot stay as they are |
| ribbon on the braid | **chandelier**: a pewter ring with candles on the one long chain that hangs down the middle of the shaft. The chain sways in a slow wave (wider with altitude, as the braid does) and the chandeliers with it | new kind, centre lane, the staple there. One chain for all, not one each: chains of their own crossed each other and everything above |
| bow (spring) | **bell** on the same chain: a pogo on its headstock rings it and throws him up | new kind with the bow's bounce |
| plank swing | **scaffold board** on chains, solid from below | the same kind, chains for ropes |
| balcony | **gallery**: a wooden landing with a railing in front of a door in the pillar | new kind in the prince's plane (the balcony lives on the tower layer), drawn new |
| (none) | **stairs**: a flight of four stone treads built out from a pillar on a half arch, up to a door in the pillar, each a small landing | a group of small platforms the generator treats as one row: reached at its lowest tread, the next row measured from the top one |
| clouds, sky lanterns, storks, updrafts | none | off inside |

## Light

Darker than the forest and warm, so the lamps mean something. Everything
that glows uses what the string lights use: its sprite, a small halo, and
a pool of its colour added in the light layer after the ambient multiply.

- **Torches** on the pillars, about one a storey, left and right in turn.
- **Chandeliers**: the centre platforms are lamps.
- **Windows**: a soft shaft from each slanting down into the room with
  dust in it (the forest's shafts and motes), in the colour of the sky
  outside, so dawn, sunset and night show inside too.
- Rule for play: every platform has a lit top edge, every creature its
  own highlight plane or eyes; checked in screenshots at three heights
  and three times of day before a step counts as done.

## Who lives there

The inside gets its own roster; the outside's creatures stay outside.

From what exists (step 2, so the room is playable and measurable at
once): **bats** under the ledges, at home here; **guards** on the
galleries; **pike guards** in the pillars' doors (the window guard's
logic with the doors as its windows).

New (step 3):

- ✅ **Spider web and its spider** (`element/interior-web`). A quarter
  web in the corner under a ledge at its pillar. Flying into it holds
  the prince: he hangs there wriggling. Every tap tears strands, three
  free him (no boost spent) and toss him up through the ledge, onto it.
  The web's spider comes for him from the hub and bites after 2.2 s (a
  heart, and he is let go all the same). So a web is never a fall and
  never for ever: it costs time, or a heart if ignored. The boost shield
  and the star go through and tear it. Never in a breather; the way
  round is beside the ledge's tip.
- ✅ **Ghost** (`element/interior-ghost`). The inside's patroller in the
  crow's place, from 120 m: drifts across with a candle, fading in and
  out, solid (and biting, and to be pogoed) only while it shows. The
  fade-in is its telegraph, and the candle never fades, so one always
  knows where it is.
- ✅ **Bat swarm** (`element/interior-swarm`). The flock's gate with
  bats, from 160 m: two long ledges as floors, two lanterns, the stream
  between.
- The witch is only seen flying past outside the windows for now.

## Mode and menu

- A round is `{ mode: 'endless', place: 'outside' | 'inside' }`;
  `Game.startRound(config)` is already the one way in.
- The title sign gets one more board with two nailed-on tags, a tree for
  OUTSIDE and a door for INSIDE, the chosen one with the gold rim (as
  TILT ON has). Left / right or O / I on a keyboard. The world behind the
  sign switches at once. The choice is saved.
- A best height per place; the plate shows the chosen place's. TRY AGAIN
  stays in the place.
- `?place=inside` for the dev helpers, and an argument for the simulator.

## How it is built

A **place** bundles what differs between outside and inside: the layout
table for rows, the zone multipliers, which altitude curves apply (no
trees, clouds or sky lanterns inside; sky and night as outside), the
background's painter, the art a platform kind is drawn with, and which
events run (witch, storks, flock). Today's behaviour moves into
`places/outside.js` unchanged; `places/inside.js` is new. Level, world
and background ask the place instead of deciding themselves.

Two things to keep in mind from the start:

- **Gates later.** The place is looked up by height (`placeAt(y)`),
  constant for a round for now. A gate will be a pair of floors across
  the width (the flock's pattern) with a door between, and the place
  changes at that height.
- **The atlas.** It is 2048 x 3810 px today; the inside's tiles would
  take it past 4096, the texture limit of older phones. It goes to 4096
  wide (about 2000 high) in step 1.

## Steps

One branch each, merged when it is fun.

1. ✅ **The switch** (`element/interior-switch`). The place through round,
   level, background, altitude and events; the selector on the sign; the
   saves; `?place=`; the simulator's argument; the wider atlas. Inside is
   a bare wall for now. Done when the outside's simulator report is
   identical on the same seeds before and after, and the selector
   switches worlds.
2. ✅ **The room** (`element/interior-room`). Pillars, back wall, windows
   with the outside behind them, the hall, torches, shafts, the ambient
   light. Ledges, chandeliers, scaffold boards, galleries, the bell.
   Bats, gallery guards, pike guards. Pickups and power-ups as outside.
   Done when it plays from the menu, reads in the screenshots, and a
   good bold run sits at 0.8 to 1.5 hits per 100 m with falls not above
   half the deaths; the kid bot not worse off than outside. Measured
   (120 runs): good bold 1.17 hits per 100 m, falls 6 % of the deaths,
   median 551 m; kid bold median 72 m (outside 71 m). The first 120 m
   became a band of their own, the hall, to get the kid bot there.
3. **Its own things** (a branch each): stairs; the web; the ghost; the
   bat swarm; wall decor (banners, shields, portraits; no suit of
   armour, it reads as a guard); sounds (stone, the bell, chains, the
   web). Done so far: the web, the ghost, the bat swarm, the decor;
   the bell, the chandelier's clink, the web and the ghost have their
   sounds; the stairs. Step 3 is done but for more sounds (stone
   underfoot, chains).
4. **Floors of the tower**: zones inside as outside has them (hall and
   cellar, stairwell, gallery, belfry and roof timbers), each with its
   two or three things.
5. **Gates** between outside and inside in the endless tower.

## Open

- The pillars' hatches all look alike, manned or not. To be played:
  whether that is a fair tell or whether a manned one needs a sign (a
  glint of a helmet).
- With all of step 3 in, a good run inside is longer than outside
  (median 523 m against 424 m) at the same hits per 100 m: the stairs
  and the swarm's floors are wide landings. The floors of step 4 are
  where the difficulty of the upper tower is to be shaped.
- The web's rule (three taps, the spider after 2.2 s) is a first guess
  for kids; to be played. The bots are never bitten, so the simulator
  cannot say.
