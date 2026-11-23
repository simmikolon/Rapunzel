// Gameplay analysis runner. Serves nothing itself: start a static server for
// web/ first (e.g. `python3 -m http.server 8000 --directory web`), then:
//   node tools/analyze.mjs [url] [runs] [skill=kid|good] [policy=bold|cautious] [cap] [seedBase] [startM] [place=outside|inside] [gates=on|off] [vaults=on|off] [stages=off|on|<lives>|inf]
// (stages: the tower in stages, stages.js; `on` with the game's number of lives, a number with that many, `inf` going on for ever)
// Needs playwright (npm i -g playwright, or set NODE_PATH to a node_modules that has it).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const [,, url = 'http://localhost:8000/dev/sim.html', runsArg = '30', skill = 'good', policy = 'bold', capArg = '1500', seedArg = '1', startArg = '0', place = 'outside', gatesArg = 'on', vaultsArg = 'on', stagesArg = 'off'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__simReady, null, { timeout: 15000 });
const report = await page.evaluate(({ runs, skill, policy, cap, seedBase, startM, place, gates, vaults, stages, lives }) => {
  const r = window.runSims({ runs, skill, policy, cap, seedBase, startM, place, gates, vaults, stages, lives: lives === 'inf' ? Infinity : lives });
  return { text: window.formatReport(r), r };
}, { runs: +runsArg, skill, policy, cap: +capArg, seedBase: +seedArg, startM: +startArg, place, gates: gatesArg !== 'off', vaults: vaultsArg !== 'off', stages: stagesArg !== 'off', lives: stagesArg === 'inf' ? 'inf' : /^\d+$/.test(stagesArg) ? +stagesArg : null });
console.log(report.text);
if (process.env.DETAIL) console.log(JSON.stringify(report.r.runsDetail));
if (errors.length) console.log('ERRORS:', errors.join(' | '));
await browser.close();
