# Plan: balconies, guards and flowerpots (the windows zone's face)

Branch `element/balconies`, one branch for the three because they share
the balcony: the platform first, then the two things that live on it.

## Why

The windows zone (250 to 400 m) has a tree look and nothing of its own.
The design document sketches it as windows spreading left and right,
guards reaching out, ledges, Rapunzel's cameo. Balconies are the
concrete form of that: a platform on the tower itself, a home for the
zone's enemies, and a lot of character in the variants.

## Balconies

- **Layer.** The tower scrolls at 0.9x, so a balcony lives on the tower
  layer like the ribbons: layer height from the arrival camera, the
  layer gap caps, never a sway. Kind `balcony`, box 120 px, centred at
  x = ±210 (slab from the wall's edge outward, 40 px inside the wall).
  Landing window 160 px.
- **Rows.** New slots `balconyL` and `balconyR` in both the forest and
  the sky layout tables, weighted by tier x zone: alone, with a ribbon,
  with a branch on the other side, or two at one height. Never a balcony
  and a branch on the same side. At most one balcony row in two.
- **Variants.** Stone, wooden, flowered (window boxes), ivy (tendrils
  around the railing and door), dilapidated (broken railing, cracked
  slab, boarded door). The dilapidated one is fragile under the dry
  branch's rules: weak bounce, crumbles after one landing. Mirrored for
  the right side. 36 x 40 art px with the door on the wall side; the
  prince stands in front of the railing.
- **Zones.** Forest floor 0, deep forest 0.3 (the first windows),
  windows 1.0, above the trees 0.3 (the tower keeps a connection to the
  sky without crowding it). Tier chance 0.6 at tier 2, 1.0 from tier 3.

## Guards

A guard patrols a balcony like the squirrel patrols a branch, and
lunges with his halberd when the prince comes near.

- States: stand (looks about), walk (slow patrol inside the railing),
  lunge (0.35 s wind-up with a "!", 0.45 s thrust that reaches 70 px past
  the railing, 1.2 s cooldown), dazed.
- Stompable from above: a pogo on the helmet dazes him and he sinks back
  through the door. He bites like the squirrel if the prince runs into
  him on the balcony.
- One thing per balcony; never on a dilapidated one. Chance per balcony:
  tier 0.25 to 0.5 x pacing x zone (deep forest 0.5, windows 1, sky 0.6).
- Look: 14 x 18 art px, helmet, red tunic with gold trim, halberd; two
  walk frames, a lunge frame, a dazed frame; mirrored.
- Bot: the squirrel's rule generalised to any enemy bound to the target
  platform (bold stomps, cautious lands on the far end).

## Flowerpots

A clay pot with a flower on the railing's outer end. When the prince is
below it (120 to 620 px, within 90 px sideways) it wobbles for 0.7 s
with a rattle, then falls; hurtful only while falling; shatters on the
prince, on a platform or below the view. One shot. The shield smashes it
(a punch, like any enemy). Never with a guard, never on a dilapidated
balcony. Chance per balcony: tier 0.25 to 0.45 x pacing x zone (deep
forest 0.3, windows 1, sky 0.5). Bot: a falling pot above within 60 px
is a threat to step away from.

## Sounds

Stone landing uses the normal bounce; the dilapidated balcony the weak
bounce and crumble. Guard: a short grunt on the lunge, a clank when
stomped. Pot: rattle ticks, a shatter.

## Steps

1. Platform kind, art, layouts and zone rules; `?at=300` to see them.
2. Guard with bot support; `?spawn=guard` on the next balcony.
3. Flowerpot with bot support; `?spawn=pot`.
4. Screenshots at 280 / 330 / 380 m, sprite sheet, simulator from 250 m
   (paired with a baseline run on master), docs.

## Targets

From 250 m, 40 good bold runs: 0.8 to 1.5 hits per 100 m in the windows
band, falls not above half the deaths, mean climb not below the baseline
by more than 15 % (the zone gains two enemies, some drop is the point).

## Status

All four steps landed in one pass.

- `KIND.balcony` on the tower layer in `platforms.js` (`side`, x = ±210,
  box 120); `art/balconies.js` (36 x 40, five variants, mirrored);
  layout slots `balconyL/R` in both tables weighted by tier x zone with
  the one-in-two rule; `front` and the layer gap caps treat balconies as
  tower-layer rows; the dilapidated variant takes the dry flag.
- `Guard` and `Flowerpot` in `enemies.js`, art in `art/creatures.js`,
  `particles.shards`, sounds `grunt`, `clank`, `rattle`, `shatter`; the
  world calls an enemy's `onHit` after a hit (the pot shatters); spawned
  per balcony in `makeRow` (guard first, else pot, never on a fragile
  one); `?spawn=guard|pot` (a balcony is made if none is in view).
- Bot: the squirrel rule covers any enemy bound to the target platform;
  a falling pot above within 70 px is a threat.

Paired seeds, 40 good bold runs from 250 m (cap 700):

| | master | with balconies |
|---|---|---|
| hits per 100 m (300 m band) | 0.85 (0.62) | 1.15 (1.26) |
| falls, share of deaths | 61 % | 55 % |
| mean climb | 313 m | 281 m |

The zone was too light before and is now in the middle of the target;
the climb dropped 10 %, inside the 15 % allowed for a zone that gains
two enemies. A first guard chance of 0.4 at tier 3 put the band at
1.49 and was trimmed to 0.35.

Rework after playing (2026-10-29). Three complaints: the balconies
looked attached rather than built, stone dipped on a landing, and they
stood between trees. Changes: `art/balconies.js` redrawn in the tower's
brick palette (a doorway cut like the tiles' windows with the candle, a
stone slab course with corbelled bricks, stone or wooden railing on
top); no landing dip for balconies in `drawPlatform`; the layout slots
moved into the sky table only, gated on `cloudAmount >= 1`, zone 0 below
the treeline. The windows zone's own face is open again. Paired seeds,
40 good bold runs from 450 m: master 1.1 hits per 100 m, 42 % falls,
361 m mean climb; first sky placement (balconies 0.7, guards 1.0): 1.59,
46 %, 200 m; final (balconies 0.4, guards 0.5, pots 0.8, 140 px slab):
1.24, 50 %, 312 m.

Scale pass (2026-10-29): the guard was 18 art px tall against the
prince's 58. Repainted at 34 x 48 art px (anchor at the feet below the
body's centre, the halberd to his right; thrust reach 90 px), the balcony
at 44 x 72 with a doorway tall enough for him (160 px slab), the pot at
12 x 13 standing on the railing's top. From 450 m, 40 good bold runs:
1.28 hits per 100 m, 44 % falls, 337 m mean climb.
