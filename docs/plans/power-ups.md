# Plan: power-ups

Five timed power-ups for the endless tower, next to the three pickups
that stay as they are (suns, lanterns, hearts). Four were asked for
(invincible, invisible, jump power, magnet); the fifth, the feather, is
the answer to what the design document says about the youngest players:
kids die by falling, and nothing so far helped with a fall.

## Rules

- **One at a time.** Collecting a power-up ends the one that runs. They
  are spaced so that this is the exception: one item every 65 to 105 m
  of climb, the first at 15 to 25 m so even a short run meets one.
- **A few seconds each** (`POWER_TIME` in `config.js`): star 6, cloak 8,
  spring 7, magnet 10, feather 7.
- **The end is announced.** In the last 1.5 s the look on the prince
  flickers, the HUD bar blinks and three blips count it out. When the
  star or the cloak ends he is safe for another 0.8 s (the usual hurt
  blink), so losing it inside an enemy is not a trap.
- **Every power-up shows on the prince**, not only in the HUD: a look
  for each (below). The HUD carries the picture and a bar at the top
  centre.
- Falling off the bottom ends the run under every power-up.

## The five

| | Item | What it does | On the prince |
|---|---|---|---|
| **Star** | a smiling shooting star dragging a rainbow | invincible: what he touches is knocked away like under the boost shield (+3 suns each), lightning does nothing | a rainbow rim two pixels wide, each side its own hue, all running through the colours; a wash of colour; a rainbow trail |
| **Cloak** | a hood with nobody in it but two eyes; it fades out and in | invisible: nothing with eyes notices him (no homing, lunge, dash, thrust, pike, wobbling pot), he passes through it, a pogo on a head still counts; the witch does not set out, and one who is crossing flies on with a "?"; birds and butterflies stay put. Lightning does not need to see him | a pale glassy prince with a shimmering rim; squirrels and guards show "?" instead of "!" |
| **Golden spring** | a toy launcher with a red cushion that squashes | every bounce x 1.25 (apex 648 → 1012 px), a boost 1900 instead of 1500, a stomp too; a bow spring only up to 3000 px/s | a somersault with every bounce (0.6 s) and every boost (0.42 s), in the direction he faces; golden after-images and sparks on the way up |
| **Sun magnet** | a red horseshoe with steel tips and sparks | suns, lanterns and hearts within 300 px of his middle fly to him (500 → 1800 px/s); never another power-up; what is on its way keeps coming when the magnet runs out | rings of dots closing in on him from the reach's edge; pulled pickups leave sparks |
| **Feather** | the stork's feather, swinging like a falling leaf | he comes down slowly: 40 % gravity and at most 600 px/s while falling, the way up untouched, so a landing has twice the time | two small wings on his back, beating on the way down; he rocks; feathers drift off |

The items float in a **soap bubble** tinted in their colour: it explains
why they hang in the air, makes the five one family that reads as
"special" against bricks and night sky alike, and gives a bigger thing
to catch (88 px against a sun's 40).

## Where

`level.js`: every `POWER_EVERY` px one item between two rows, x within
± 190 px. The kind is a weighted pick: base weight x the zone's
multiplier (`ZONES`) x pacing, never the same twice in a row.

- Star and cloak follow the enemies' pacing: none in a breather, none
  below 30 m.
- The magnet follows the suns' pacing and likes a breather.
- Forest floor: more feather (1.3), less spring (0.6), little star (0.5)
  and cloak (0.3). Windows: more cloak (1.4). Above the trees: more
  feather (1.5) and star (1.2), less cloak (0.6).

They roll on a stream of their own (`rngPower`), so the tower is the
same with and without them and paired seeds measure only the power-ups.

## Sound, bot, helpers

- A motif per power-up on collecting, three blips and a falling tone at
  the end. Haptics reuse the spring's pattern (no change in the shell).
- Bot: goes for an item it can still get under on the way up; under the
  star it dodges nothing and spends no boost on a punch, under the cloak
  nothing but lightning. The report lists power-ups collected and
  passed, the share of time one was running, deaths by running
  power-up, suns and climb speed.
- `?spawn=star|cloak|spring|magnet|feather` hangs that one right above
  the prince.

## Measure

Paired seeds against the build before, 120 runs each: good bold from
0 m and from 450 m, the kid bot from 0 m. Targets as always (0.8 to 1.5
hits per 100 m per zone, falls not above half the deaths), plus: no
power-up may kill (deaths while it runs against its share of the time).

## Not built, kept as ideas

- An hourglass that slows every enemy for a few seconds.
- A sun shower: suns worth double, or a trail of suns to follow.
- The super jump portal from the catalogue as an instant power-up.
- A bubble that carries him back up once when he falls out of the view.
- Store: longer durations, a wider magnet.
