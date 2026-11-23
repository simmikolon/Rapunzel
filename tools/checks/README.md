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
| `atlas.mjs` | The size of the sprite atlas (it has to stay under the smallest `MAX_TEXTURE_SIZE` we support, 4096). |
| `shots.mjs` | Pictures of the game frozen at given heights, outside or inside: `node tools/checks/shots.mjs outside 20,180,420`. |
| `treasury_camera.mjs` | Climbs a treasury (`vault1` to `vault6` as its argument), counts the frames in which the camera goes down (there must be none), then drops the prince out of the picture and watches the bubble set him down. |
| `treasury_exit.mjs` | The top of a treasury and the way out by its door. |
| `treasury_room.mjs`, `stitch.py` | A whole treasury in one picture, floor to ceiling. |

For gameplay numbers there is the simulator itself (`tools/analyze.mjs`,
see `CLAUDE.md`). A seed replays exactly, so two builds are compared on
the same seeds; where a change sends runs down other paths (a door in the
hall, say), one set of 120 runs is not enough and three sets (seed bases
1, 1001 and 2001) are.
