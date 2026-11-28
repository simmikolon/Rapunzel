# Where we are

A handoff for whoever picks the work up, a new chat mostly: what is on
`master`, what is open, what nobody has tried yet. Short on purpose. The
why of everything is in `docs/DESIGN.md` (the catalogue of elements in
section 7, the numbers in section 10, the decision log in section 12,
newest last). Bring this page up to date with every merge into `master`.

As of 2026-11-28, `master` at "Merge element/tower-foot" (the tower's
foot: a plinth, the witch's gate and her arms, and a foot for each tree).

## The game

Sir Bouncealot, a prince on a pogo stick, climbs Rapunzel's tower by her
braid: he bounces by himself, the player steers and boosts. Three hearts,
enemies to stomp or dodge, power-ups in soap bubbles, suns to collect. Who
climbs is a switch on the title: the prince, or his son Lord Springalot,
who has a rocket for the boost. The
title offers three climbs: TOWER (the tower in stages, in and out through
its doors, with three lives; the default), OUTSIDE and INSIDE (endless, in
one place). Live at <https://www.bouncealot.de> (landing page at `/`, the
game at `/play/`). The iOS shell around the same `web/` folder runs on
Simon's iPhone Air from the checkout; nothing is on TestFlight yet.

## On master, newest first

- **The tower's foot** (`art/tower.js` drawFoot, `art/trees.js`
  drawTreeFoot): the tower stands on a plinth of dressed stone, in its
  middle the witch's gate (a round arch, the portcullis let down, a chain
  with a padlock: nobody goes in, so he climbs), her arms on a shield to
  either side (her hat before the full moon), stepping stones across the
  lawn to its threshold. Each tree has a foot of its own, the trunk
  widening into roots: the left one with a small door, a lit window and
  mushrooms, the right one with a fern. Snowed in, the trees stand in the
  snow. Purely for the eye: nothing in the simulator.
- **Lord Springalot** (`player.js` FIGURES, `art/lord.js`): a second main
  character with the prince's jump and a master ability of his own, a
  rocket that burns while the boost is held, on the boost's three charges
  (the HUD's flames are the tank). The title's switch (two heads in its
  bottom row) chooses who climbs; the choice and each one's best heights
  are kept. In the simulator the two are a match (`tools/analyze.mjs` takes
  who climbs as its twelfth argument). Simon played him and chose his
  looks: sixteen, blond, goggles.
- **The chimney, hidden** (`chimney.js`): a room behind a fireplace inside
  the tower, dark, with a figure that hops short and quick. No spawn rule:
  only `?place=inside&at=50&spawn=chimney` builds one. Played, and found no
  fun as Lord Springalot's part; kept as an extra for somebody else.
- **The round's controls in pixels** (`art/hud.js`, `drawBoost` in
  `hud.js`): the boost's charges as three flames (burning, half, out),
  its button a wooden hoop around a dark glass with the big flame, sound
  and pause on small boards with symbols in ink, the running power-up on
  a board rimmed in its colour. No vector shape is left in the HUD.
- **Weather** (`weather.js`): rain, snow that lies, the golden hour, and
  storms with gusts that carry the prince sideways, a grey mood and
  lightning in black and white. In stages a storm draws up inside a stage
  now and then; in the endless tower storms keep their own time. Around
  Christmas (1 December to 6 January) the lawn, the title and the opening
  story are snowed in.
- **Settings** (`settings.js`): a sign on the title for how a touch steers
  (hold a side, slide a finger, tilt with a sensitivity of three), the two
  effects (glow, scan lines; both off), sound, and in the app sound in
  silent mode and haptics. Tilt is the dip of the screen's right edge.
- **The opening story** (`story.js`): told before the title, once per
  device in a browser, at every launch in the app.
- **Performance** (`docs/plans/performance.md`): letters from sheets, the
  picture drawn at one backing pixel per logical pixel, lines as sprites,
  the atlas at art size (1024 x 1106 now), the sprites' own canvases given
  back once it is packed. On the iPhone Air frames over 20 ms went from
  6.1 % to 1.8 % of a round; `?perf=1` shows a readout.
- **The tower in stages** (`stages.js`): thirteen themes with their own
  wall, weather, length and lives; still called a trial in the design
  document.

## Open

- **Lord Springalot, what is left:** he is free to choose; Simon wants the
  characters unlocked once the game's shape is settled. The rocket has no
  sound of its own (the boost's when it is lit, nothing while it burns).
  A third character is thought of, the mother, Lady Sparkalot; and a good
  fairy who brings a life in stages. The figure in the chimney is drawn as
  the lord and is to be somebody else (a chimney sweep was suggested).
- **`stages.mjs` can fail by chance** (once in five runs here): its prince
  sometimes hops through the stage's door by himself before the check
  looks at the camera. Run it again; the check wants mending.
- **The simulator does not know the wind.** A storm's gust pushes the
  prince in the game's world only (`world.gusts`); the bots are not blown
  about, so the reports in `tools/checks/baseline/` and every hits-per-100 m
  figure leave storms out. To do: switch it on in `web/dev/sim.js`, teach
  the bots to hold against it, measure, and set the baselines anew on
  purpose.
- **Performance, what is left:** the sprites' own canvases (60 MB) are
  given back once the atlas is packed, but are all there while the game
  starts (`tools/checks/atlas.mjs` keeps a budget of 80 MB on that), and
  what the phone gains was not read (Xcode's memory gauge, before and
  after; a headless browser gave back 103 MB; Simon has played it on
  the iPhone Air and all was as before); a whole round's reading to
  300 m and beyond is missing; a storm adds a full-screen pass and some 400 sprites
  (if a phone shows it: paint the rain onto a few scrolling tiles).
- **Weather:** nothing of it inside the tower (it could show through the
  windows), and no snow lies on the tower itself (its plinth, sills and
  string courses: an element of its own).
- **The landing page's tower** still ends in the lawn as it did: it has
  no plinth and no gate (its lawn is a CSS strip).
- **Ideas noted, not asked for:** a life for every 100 suns; a visible
  hint that a tap on Rapunzel tells the story again (the settings' sign has
  WATCH AGAIN); the story's three looks faded in instead of ridden to;
  Instagram highlight covers and post templates.
- **Further out** (the roadmap, `docs/DESIGN.md` section 9): the store,
  scenes, a second tower, an Android shell around the same `web/`.

## Not tried, or only by eye

- The tower's foot and the trees' feet were seen here in still pictures
  of a headless browser only (summer and winter, the title, a round's
  start, the story's end); Simon has seen them and said yes.
- Only the iPhone Air has been played and measured; no older phone.
- Lord Springalot's rocket was played by Simon on the phone and found
  good; its numbers are the simulator's, whose bots are poor pilots. The
  title's switch and his taller build were seen in still pictures only.
- The weather's sounds and the settings were written without a device to
  hear or hold; Simon has played them and found them good, nothing was
  measured.
- With "sound in silent mode" on, another app's music is expected to stop
  when the game sounds. Nobody has said whether it does or whether it
  matters.
