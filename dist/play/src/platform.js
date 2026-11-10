// The one place the game asks what it runs in. The native iOS shell in ios/
// talks to the page through a WKScriptMessageHandler named 'native' and
// injects `window.__native` before the first script runs; in a browser every
// call below falls back to the plain web API or does nothing, so game code
// calls it unconditionally. Nothing is touched at import time beyond two
// properties on `window`: the simulator imports this through audio.js under
// a bare DOM shim.
const handler = () => (typeof window !== 'undefined' && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.native) || null;
const state = () => (typeof window !== 'undefined' && window.__native) || null;
const post = (msg) => { const h = handler(); if (h) { try { h.postMessage(msg); } catch (_) { /* ignore */ } } };

let onTilt = null;
let onPause = null;

export const platform = {
  get isNative() { return !!handler(); },

  // String in, string out, like localStorage. The shell hands the saved
  // values over at document start, so reads stay synchronous; writes go
  // out as messages and update the in-memory copy, so a read after a write
  // sees the new value.
  storage: {
    get(key) {
      const s = state();
      if (!s) return localStorage.getItem(key);
      const v = s.storage && s.storage[key];
      return v == null ? null : String(v);
    },
    set(key, value) {
      const s = state();
      if (!s) { localStorage.setItem(key, value); return; }
      value = String(value);
      (s.storage || (s.storage = {}))[key] = value;
      post({ type: 'storage.set', key, value });
    },
  },

  // A game event for the Taptic Engine: 'bounce' (strength 0..1 scales it),
  // 'soft', 'spring', 'boost', 'bonk', 'clank', 'stomp', 'hurt', 'over'. The
  // shell owns the patterns (ios/App/Haptics.swift); silently nothing in a browser.
  haptic(kind, strength) {
    if (!handler()) return;
    post(strength == null ? { type: 'haptic', kind } : { type: 'haptic', kind, strength });
  },

  // The shell's safe-area insets in CSS px ({ top, bottom, left, right }), or
  // null in a browser, where style.css exposes env() instead. WebKit hands a
  // WKWebView page its env() values some time after the load, too late for
  // the boot, so the shell sends them along with the saved state.
  get safeArea() { const s = state(); return (s && s.safe) || null; },

  // Tilt from CoreMotion: the shell pushes gamma in degrees (the
  // DeviceOrientation convention, right edge down is positive) through
  // window.__nativeTilt while started.
  tilt: {
    get available() { const s = state(); return !!(s && s.tilt && s.tilt.available); },
    start() { post({ type: 'tilt.start' }); },
    stop() { post({ type: 'tilt.stop' }); },
    onSample(fn) { onTilt = fn; },
  },

  // The shell calls this when the app resigns active (Control Centre, a
  // call, the app switcher, the lock screen); visibilitychange does not
  // cover those in a WKWebView.
  onPause(fn) { onPause = fn; },
};

if (typeof window !== 'undefined') {
  window.__nativeTilt = (gammaDeg) => { if (onTilt) onTilt(gammaDeg); };
  window.__nativePause = () => { if (onPause) onPause(); };
  if (platform.isNative) {
    // Page errors reach the Xcode console; the Web Inspector is only wired in Debug builds.
    window.addEventListener('error', (e) => post({ type: 'log', message: String(e.message) }));
    window.addEventListener('unhandledrejection', (e) => { const r = e.reason; post({ type: 'log', message: String((r && r.message) || r) }); });
  }
}
