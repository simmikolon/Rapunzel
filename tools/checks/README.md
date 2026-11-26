# Checks

What is run before a push. They catch exceptions and regressions, not
feel: whether something is fun is found out by playing it.

All of them need the dev server (`python3 tools/serve.py`, port 8000);
`flow.mjs` also needs the landing page's (`python3 tools/serve.py --site
8002`). Playwright is looked for in `NODE_PATH` and then where this
machine has it (`lib.mjs`). Pictures go to `check-out/` (ignored by git;
`OUT=<dir>` puts them elsewhere).

| Check | What it does |
|---|---|
| `identity.sh` | The simulator's five reports on fixed seeds, compared with `baseline/`. A change that is only for the eye must leave them exactly as they are. About five minutes. |
| `flow.mjs` | The game's flow in the browser: the title's selector, a round inside, a death, again, back outside; the inside's `?spawn` helpers; the landing page still draws with the game's modules. |
| `stages.mjs` | The tower in stages: the title offers it, a stage ends at a floor with a door and nothing above, the camera rests on that floor, the door leads into the next stage in the other place, a fall goes on from that door with the height kept and a life less, and with the last life a fall ends the round. Pictures of each step. |
| `settings.mjs` | The settings' sign (`web/src/settings.js`) and the ways to steer (`web/src/input.js`): SETTINGS opens it and only DONE closes it, a choice takes effect, is kept and is there at the next start, the effects are off whatever an old save chose, `?fx=` is for a visit; a finger slides to steer (by how far, the middle coming along), a second finger or a tap boosts, a held side steers as before; the lean is the same angle flat, upright and past upright; in the app (the shell stood in for) there are the app's rows, tilt starts without asking, and the choices are in the shell's storage. |
| `story.mjs` | The opening story: told from the tower's top to the lawn (a picture of each moment, its clock stepped by hand), the title follows, a tap on Rapunzel tells it again and a tap skips it, and it is told once per device. `FX=full DSF=2` for pictures to show. |
| `atlas.mjs` | The sprite atlas: its size (it has to stay under the smallest `MAX_TEXTURE_SIZE` we support, 4096), and every sprite. The atlas keeps a sprite at art size, so each one has to be on the art grid (every block of 4 x 4 pixels one colour) and the atlas has to hold it as drawn; a sprite that is off the grid without saying `fine: true` is named, and the check fails. |
| `shots.mjs` | Pictures of the game frozen at given heights, outside or inside: `node tools/checks/shots.mjs outside 20,180,420`. |
| `treasury_camera.mjs` | Climbs a treasury (`vault1` to `vault6` as its argument), counts the frames in which the camera goes down (there must be none), then drops the prince out of the picture and watches the bubble set him down. |
| `treasury_exit.mjs` | The top of a treasury and the way out by its door. |
| `treasury_room.mjs`, `stitch.py` | A whole treasury in one picture, floor to ceiling. |

For gameplay numbers there is the simulator itself (`tools/analyze.mjs`,
see `CLAUDE.md`). A seed replays exactly, so two builds are compared on
the same seeds; where a change sends runs down other paths (a door in the
hall, say), one set of 120 runs is not enough and three sets (seed bases
1, 1001 and 2001) are.
