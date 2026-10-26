# Phase 1: the 300 m ceiling, measured

Date: 2026-10-26. Branch `phase-1-ceiling`.

## Method

`web/dev/sim.html` + `web/dev/sim.js` run the real game logic
(`World.update`) without rendering at thousands of steps per second,
driven by a scripted player. `tools/analyze.mjs` drives it from node via
Playwright and prints a report. Two skill presets and two policies:

| | reaction | hesitation | dodge range |
|---|---|---|---|
| `good` (adult who knows the game) | 0.10 s | 5 % | 150 px |
| `kid` (cautious five-year-old) | 0.22 s | 25 % | 110 px |

- `cautious`: steers to the next platform, dodges enemies, boosts only to
  save a fall or reach a far platform.
- `bold`: like cautious, but boosts *into* an enemy above when a charge
  is available (the Phase 1 mechanic).

40 runs per configuration, seeds 1 to 40, cap 1500 m. The bot is weaker
than a human: on the old tuning the `good` bot reached a median 145 m
where the author reaches ~300 m, so read the numbers as relative.

Run it yourself:

```sh
python3 -m http.server 8000 --directory web
node tools/analyze.mjs http://localhost:8000/dev/sim.html 40 good bold
```

## Baseline (master before Phase 1)

| config | median | max | ≥ 300 m | deaths | hits / 100 m | hits by enemy |
|---|---|---|---|---|---|---|
| good / bold | 142 m | 262 m | 0 % | 34 caught, 6 fell | 2.27 | crow 82, witch 30, spider 25 |
| good / cautious | 149 m | 247 m | 0 % | 37 caught, 3 fell | 2.33 | crow 83, witch 31, spider 25 |
| kid / bold | 66 m | 169 m | 0 % | 5 caught, 35 fell | 1.49 | crow 33, spider 7, witch 1 |
| kid / cautious | 59 m | 159 m | 0 % | 7 caught, 33 fell | 1.69 | crow 33, spider 10, witch 3 |

Hits per 100 m by altitude band (good / bold): 0–100 m 1.24, 100–200 m
4.08, 200–300 m 6.72. The pressure triples past 100 m and nearly every
good run ends with exhausted hearts ("caught"). Crows cause most hits.
Kids die by falling, which is platform reading, not the ceiling.

Conclusion: the ceiling is attrition. The ramp peaked at 210 m and stayed
there, and recovery (one heart at a time, only once a heart was lost)
could not keep up.

## Changes

1. **Boost shield**: for 0.5 s after a boost the prince is shielded;
   enemies he touches are knocked away (crows and spiders as if stomped,
   the witch is thrown off course and leaves) and award 3 suns. A
   one-time hint appears when the first enemy comes into view.
2. **Hearts restore all three hearts.**
3. **Stretched ramp**: difficulty keyframes moved from 0 / 25 / 70 / 130 /
   210 m to 0 / 35 / 100 / 220 / 400 m, plus a final step at 700 m.
4. **Pacing waves**: every 90 m the pressure builds from 75 % to 120 % of
   the tier's enemy chance, then a 15 m breather follows: no enemies, no
   crumbling branches, closer platforms, more suns and lanterns.
5. **Witch**: cooldown 75–105 m instead of 45–70 m, never during a
   breather, dive speed 980 → 860 px/s.
6. **Pity heart**: a heart is guaranteed within 8 rows when down to the
   last heart; otherwise a 25 % chance per row after 12 rows once a heart
   is missing.

## After

| config | median | max | ≥ 300 m | ≥ 500 m | deaths | hits / 100 m | hits by enemy |
|---|---|---|---|---|---|---|---|
| good / bold | **434 m** | 1021 m | **83 %** | 43 % | 11 caught, 29 fell | **0.78** | crow 82, witch 48, spider 12 |
| good / cautious | 248 m | 610 m | 40 % | 5 % | 38 caught, 2 fell | 2.00 | crow 121, witch 64, spider 40 |
| kid / bold | 74 m | 500 m | 3 % | 3 % | 4 caught, 36 fell | 0.87 | crow 24, witch 5 |

Hits per 100 m by band (good / bold): 0–100 m 0.05, 100–200 m 0.67,
200–300 m 0.91, 300–400 m 1.25, 500–600 m 1.43, 700–800 m 1.27. The bold
bot made 394 boost-punches in 40 runs (about 10 per run).

## Reading the result

- For a player who uses the boost offensively the ceiling moved from
  ~260 m to ~1000 m, with the median tripling. Deaths are now mostly
  falls, i.e. platforming at 500 m+ (gaps of 375–540 px with a wide braid
  sway), which is the right kind of difficulty for an endless mode.
- A cautious player still bleeds out, roughly where the author's ceiling
  was. That is intended: the boost shield is the answer, hence the hint.
  The witch remains the costliest single enemy for cautious play; the bot
  dodges her poorly, humans see her coming.
- Kids are limited by platform reading, not attrition. The campaign's
  fixed, shorter towers and the store are the planned answer, possibly
  with an easy mode.

## Open follow-ups

- Suns inflate with punches (+3 each); price the store accordingly.
- Consider whether tier 5 (700 m+) should keep growing for Endless Tower.
- Re-measure after the super jump portal (Phase 2) since it changes
  climb speed and camera behaviour.
