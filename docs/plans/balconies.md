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

Filled in as steps land.
