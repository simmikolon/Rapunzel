import { W, H, TILT_FEEL } from './config.js';
import { platform } from './platform.js';
import { audio } from './audio.js';
import { drawSign, paint } from './sign.js';
import { tagButton, ribbonButton, SIGNS, signShift } from './hud.js';

// The player's settings and the sign they are chosen on. The sign hangs
// where the title's does (SETTINGS on the title opens it, DONE closes it):
// a row per thing, a board per choice, the chosen one with the gold rim.
//
//   steer    how a touch steers: 'tap' (hold a side of the screen), 'swipe'
//            (slide a finger from where it was set down) or 'tilt' (lean the
//            phone; any touch is a boost)
//   tilt     how far the phone is leaned for full speed (config.js TILT_FEEL)
//   glow     the glow around what shines     } the effects, both off unless
//   lines    scan lines over the picture     } the player wants them
//   silent   (the app) sound although the phone's switch says silent
//   haptics  (the app) taps of the Taptic Engine
//
// Sound on or off is the audio's own (audio.js keeps it); it has its board
// here too. What a platform cannot do is not shown: steering only with a
// touch screen, tilt only where the phone can, `silent` and `haptics` only
// in the app.
export const DEFAULTS = { steer: 'tap', tilt: 'normal', glow: false, lines: false, silent: true, haptics: true };
const CHOICES = { steer: ['tap', 'swipe', 'tilt'], tilt: Object.keys(TILT_FEEL) };

// The sign's layout, on the title's sign (768 x 1364, moved with it on a taller screen).
const LAY = { head: 162, first: 238, step: 78, label: 64, left: 252, right: 706, gap: 12, h: 52, one: 232, done: { y: 680, w: 320, h: 80 } };

export class Settings {
  constructor(game) {
    this.game = game;
    this.v = { ...DEFAULTS };
    this.open = false;
    this.note = '';      // a line under the rows (what a choice means, or that tilt was refused)
    this.noteT = 0;
  }

  // From the save (only what differs from the defaults is kept there).
  load(saved) {
    const s = saved && typeof saved === 'object' ? saved : {};
    for (const k of Object.keys(DEFAULTS)) {
      if (CHOICES[k]) { if (CHOICES[k].includes(s[k])) this.v[k] = s[k]; }
      else if (typeof s[k] === 'boolean') this.v[k] = s[k];
    }
  }
  toSave() {
    const out = {};
    for (const k of Object.keys(DEFAULTS)) if (this.v[k] !== DEFAULTS[k]) out[k] = this.v[k];
    return Object.keys(out).length ? out : undefined;
  }

  // Can this device steer by tilt at all?
  get tiltOffered() { const i = this.game.input; return i.tiltSupported && (platform.isNative || i.isTouch || i.tiltNeedsPermission); }

  // The settings take effect: on the input, the renderer, the sound and the shell.
  apply() {
    const game = this.game, v = this.v, input = game.input;
    if (v.steer === 'tilt' && !this.tiltOffered) v.steer = 'tap';
    input.steer = v.steer;
    input.tiltFull = TILT_FEEL[v.tilt];
    input.wantTilt = v.steer === 'tilt';
    if (v.steer === 'tilt') { if (platform.isNative && !input.tiltEnabled) input.requestTilt(); }      // (a browser is asked at the next click: input.js)
    else if (input.tiltEnabled) input.disableTilt();
    if (!game.fxForced) game.gfx.setFx(v.glow, v.lines);
    platform.haptics = v.haptics;
    if (platform.isNative) audio.setThroughSilent(v.silent);
  }
  // Tilt was asked for and refused (a browser's prompt declined, or the phone has none).
  tiltRefused() {
    this.v.steer = 'tap';
    this.apply();
    this.game.save();
    this.say('Tilt is not available here', 3);
  }
  say(text, seconds = 2.6) { this.note = text; this.noteT = seconds; }

  // The rows as they are shown now: { label, boards: [{ id, text, on }] }.
  rows() {
    const v = this.v, game = this.game, input = game.input, app = platform.isNative;
    const rows = [];
    if (input.isTouch || app) {
      const steer = [{ id: 'set.steer.tap', text: 'TAP', on: v.steer === 'tap' }, { id: 'set.steer.swipe', text: 'SWIPE', on: v.steer === 'swipe' }];
      if (this.tiltOffered) steer.push({ id: 'set.steer.tilt', text: 'TILT', on: v.steer === 'tilt' });
      rows.push({ label: 'STEERING', boards: steer });
      if (v.steer === 'tilt') rows.push({ label: 'TILT', boards: CHOICES.tilt.map((k) => ({ id: `set.tilt.${k}`, text: k.toUpperCase(), on: v.tilt === k })) });
    }
    rows.push({ label: 'EFFECTS', boards: [{ id: 'set.glow', text: 'GLOW', on: v.glow }, { id: 'set.lines', text: 'SCANLINES', on: v.lines }] });
    const sound = [{ id: 'set.sound', text: audio.muted ? 'OFF' : 'ON', on: !audio.muted }];
    if (app) sound.push({ id: 'set.silent', text: 'IN SILENT MODE', on: v.silent, size: 11 });
    rows.push({ label: 'SOUND', boards: sound });
    if (app) rows.push({ label: 'HAPTICS', boards: [{ id: 'set.haptics', text: v.haptics ? 'ON' : 'OFF', on: v.haptics }] });
    if (!game.world.place.inside) rows.push({ label: 'STORY', boards: [{ id: 'set.story', text: 'WATCH AGAIN', on: false }] });
    return rows;
  }

  // The rows laid out: every board with its place on the sign (before the sign's own shift).
  layout() {
    const rows = this.rows();
    rows.forEach((row, r) => {
      const n = row.boards.length, y = LAY.first + r * LAY.step - LAY.h / 2;
      const w = n === 1 ? LAY.one : (LAY.right - LAY.left - LAY.gap * (n - 1)) / n;
      row.y = LAY.first + r * LAY.step;
      row.boards.forEach((b, i) => { b.x = LAY.left + i * (w + LAY.gap); b.y = y; b.w = w; b.h = LAY.h; });
    });
    return rows;
  }
  get doneZone() { return { id: 'set.done', x: W / 2 - LAY.done.w / 2, y: LAY.done.y, w: LAY.done.w, h: LAY.done.h }; }

  // The button zones while the sign is open (hud.js layout asks for them).
  zones() {
    const d = signShift(), out = [];
    for (const row of this.layout()) for (const b of row.boards) out.push({ id: b.id, x: b.x, y: b.y + d, w: b.w, h: b.h });
    const z = this.doneZone;
    out.push({ ...z, y: z.y + d });
    return out;
  }

  show() { this.open = true; this.note = ''; this.noteT = 0; }

  // A frame with the sign open: what was tapped. Returns 'story' when the story was asked for.
  update(dt, input) {
    if (this.noteT > 0) this.noteT -= dt;
    const game = this.game, v = this.v;
    let changed = false, result = null;
    for (const id of input.buttonHits.slice()) {
      if (!id.startsWith('set.') || !input.consumeButton(id)) continue;
      const [, key, value] = id.split('.');
      if (key === 'done') { this.open = false; audio.click(); continue; }
      if (key === 'story') { this.open = false; result = 'story'; audio.click(); continue; }
      if (key === 'sound') { audio.unlock(); audio.toggleMute(); audio.click(); continue; }
      if (CHOICES[key]) {
        if (v[key] === value) continue;
        v[key] = value;
        if (key === 'steer') this.say(value === 'tap' ? 'Hold a side of the screen to steer' : value === 'swipe' ? 'Slide a finger to steer, tap to boost' : 'Lean the phone to steer, tap to boost');
      } else {
        v[key] = !v[key];
        if (key === 'silent') this.say(v.silent ? "Sound plays even when the phone is silent" : "The phone's silent switch mutes the game");
      }
      changed = true;
      audio.click();
      if (key === 'haptics' && v.haptics) { platform.haptics = true; platform.haptic('soft'); }
    }
    if (changed) { this.apply(); game.save(); }
    return result;
  }

  // The sign. o: dy (the sign's travel), alpha, dim, like the title's.
  draw(g, t, o = {}) {
    const game = this.game, art = game.art, S = SIGNS.title;
    const alpha = o.alpha == null ? 1 : o.alpha, shift = signShift() + (o.dy || 0);
    const Y = (y) => y + shift;
    g.layer('hud');
    if (o.dim) g.rect(0, 0, W, H, '#081014', 0.34 * o.dim * alpha);
    drawSign(g, art, S.x, Y(S.y), S.w, S.h, { alpha });
    paint(g, 'SETTINGS', W / 2, Y(LAY.head), 24, 'center', { alpha });
    for (const row of this.layout()) {
      paint(g, row.label, LAY.label, Y(row.y) + 1, 14, 'left', { alpha });
      for (const b of row.boards) tagButton(g, { x: b.x, y: Y(b.y), w: b.w, h: b.h }, b.text, { alpha, size: b.size || 13, on: b.on });
    }
    if (this.noteT > 0 && this.note) paint(g, this.note, W / 2, Y(LAY.done.y - 22), 12, 'center', { alpha: alpha * Math.min(1, this.noteT / 0.3) });
    const z = this.doneZone;
    ribbonButton(g, art, { ...z, y: Y(z.y) }, 'DONE', { alpha, t });
  }
}
