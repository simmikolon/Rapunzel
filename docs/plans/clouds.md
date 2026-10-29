# Plan: above the trees, part one: the treeline and cloud platforms

Branch `element/clouds` (on `master` after the tree batch). This gives the
"above the trees" zone its real content: the trees end, and clouds take
over as the climbing support. Three steps, each playable on its own.

## Why

Every height climbs on trees today, which stops making sense above a
few hundred metres. Clouds are the fairy-tale answer, and they bring two
new lessons after geometry (branch lengths): timing (drifting clouds)
and reading a hazard zone (the storm cloud's lightning).

## The treeline

- 400–420 m: bare trees (already there), the last healthy branches.
- 420–460 m: the handover. Branches fade out and clouds fade in by
  `cloudAmount(y)`; the trunks end at 460 m with a crown tile (tapering
  tip with bare twigs). Vines, lianas and owls stop there too.
- 460 m on: clouds only, plus the braid with ribbons and bows, which is
  the one constant of the whole climb. No swings (nothing to hang them
  from), no spiders or squirrels (they need branches).

## Cloud platforms

In the prince's plane like branches, in three lanes so the left, centre,
right rhythm of the climb survives: left (about -190), right (+190),
centre (0, never in a row with a ribbon). Three sizes like the branch
classes: small (120 px box), normal (180), wide (260). Landing window is
the box plus the prince's 40 px body.

Three behaviours, each with its own look, and one hazard carrier:

| Cloud | Look | Behaviour |
|---|---|---|
| thick | white, lit top edge, slow breathing | normal bounce, the staple |
| wispy | translucent, ragged, bluish | weaker bounce (the dry branch's), dissolves into puffs after one bounce |
| drifting | thick or wispy with a streaked tail | moves sideways at 40–90 px/s, wraps around the screen edges |
| storm | dark grey-violet, rain streaks below it | landable and safe on top; flickers and rumbles for 1 s, then one lightning bolt strikes straight down from its middle |

Rules:
1. Wispy clouds follow the dry-branch rules (never the only way up when
   the next safe platform is far; none in breathers).
2. Drifting clouds are slow and steady, never reverse, and never carry
   a storm.
3. A storm cloud is never alone in a row and is normal or wide, so its
   edges are a safe approach; the bolt is a narrow column (about 70 px)
   under the middle, reaching about 420 px down. Rain streaks mark the
   column at all times, the flicker warns, the strike lasts 0.25 s. The
   boost shield protects from it. Storm clouds start around 480 m and
   grow toward the storm zone later; none in breathers.
4. Spawn rule as always: tier chance x pacing x zone multiplier, with
   `cloudAmount` as the handover.

## Art and sound

Pixel clouds on the 4 px grid: three sizes, two drawings each, for
thick, wispy and storm (18 sprites), a crown tile for the trunk tops,
the bolt and rain drawn with the renderer's lines (glow on the bolt),
puffs for the dissolve. Sounds: a soft poof on a cloud landing, an airy
dissolve, a low rumble for the warning and a crack for the strike.

## Steps

1. Treeline, `cloudAmount`, the `cloud` platform kind with lanes and
   sizes, thick clouds in the generator, crown tile, poof sound, the
   simulator can start at an altitude (`startM`).
2. Wispy (dissolve in place, weak bounce) and drifting clouds; the bot
   aims where a drifting cloud will be.
3. Storm clouds with the `Lightning` enemy; the bot keeps out of the
   column while a storm cloud flickers or strikes.
4. Screenshots at 430, 470, 520 m; sprite sheet; simulator: good bold
   40 runs over the whole game and 40 runs starting at 450 m; docs.

## Targets

- Whole game: median height and hits per 100 m within the usual target;
  falls not above half the deaths.
- From 450 m: 0.8 to 1.5 hits per 100 m in the sky, falls not above half
  the deaths; a run that starts in the sky should last a few hundred
  metres with the good bot.

## Status

All four steps landed in one pass.

- `TREELINE_Y` and `cloudAmount(y)` in `altitude.js`; the background
  stops the trunks at a crown tile and ends vines, lianas and owls there;
  the far clouds sit back (thinner, bluer) once platform clouds appear.
- `KIND.cloud` with `CLOUD_SIZE` in `platforms.js`; a cloud carries its
  behaviour (`cloud`), size, breathing phase and, when drifting, a
  `drift` patrol (`baseX + amp * sin`). Wispy clouds reuse the dry flag
  and dissolve in place instead of falling away.
- `art/clouds.js`: thick, wispy and storm looks in three sizes, two
  drawings each; `art/trees.js` gained the crown tile.
- Generator: sky layouts (`cloudL/R/C`, with ribbons and bows) chosen
  with probability `cloudAmount`; tier columns `cloudSmall`, `cloudWide`,
  `drift`, `storm`; the rules from the plan; swings fade with the trees.
- `Lightning` enemy in `enemies.js` (calm, charge, strike), drawn with
  rain streaks, a flicker and a glowing bolt; the world lets the shield
  ignore it (no punch, no suns); sounds `poof`, `dissolve`,
  `thunderWarn`, `thunderCrack`; `?spawn=storm`.
- Simulator: `startM` (a run can start in the sky), climb-based rates,
  the bot aims where a drifting cloud will be and keeps out of a storm
  cloud's column while it charges or strikes.

Numbers, good skill, bold policy, 40 runs, seeds from 100:

| | whole game, before (branch lengths) | whole game, with clouds | from 450 m |
|---|---|---|---|
| median / mean height | 409 m / 405 m | 339 m / 415 m | 735 m / 778 m (mean climb 328 m) |
| hits per 100 m | 0.93 | 0.86 | 1.17 |
| falls, share of deaths | 50 % | 55 % | 39 % |

Two findings on the way. Drifting clouds that wandered across the screen
and wrapped around the edge caused most of the sky's falls (an
experiment switching them off took the fall share from about 70 % to
53 %); they now patrol their lane on a slow sine and stay fully on
screen, which brought the sky to 39 %. And the crows' 1.2 multiplier
above the trees pushed the sky to 1.5 hits per 100 m; at 1.0 it is 1.17.
The whole-game median moved from 409 to 339 m with the mean unchanged,
which is within the spread between runs (the squirrels' and the
lightning's timing use unseeded randomness), but worth watching.

Visible in the renderer: `g.line` takes a plain alpha number, not an
options object, and does not glow; the bolt's bloom comes from halos
along it.

Follow-up (2026-10-29): the clouds were repainted a quarter larger (box
150 / 225 / 325 px, lobes proportional to the sprite height, wide clouds
inset to stay on screen), and the far layer's scroll direction was fixed
(stars and distant clouds rose while climbing). Sky from 450 m, 40 good
bold runs: mean climb 381 m, 1.07 hits per 100 m, falls 48 % of deaths.
