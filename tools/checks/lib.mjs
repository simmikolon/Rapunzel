// Shared by the checks: Playwright's Chromium with software WebGL, and where things are.
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('/opt/node-tools/node_modules/playwright'); }
export const launch = () => pw.chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
export const GAME = process.env.GAME_URL || 'http://localhost:8000';      // tools/serve.py
export const SITE = process.env.SITE_URL || 'http://localhost:8002';      // tools/serve.py --site 8002
export const OUT = process.env.OUT || 'check-out';                        // where pictures go (ignored by git)
mkdirSync(OUT, { recursive: true });
