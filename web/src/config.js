// All gameplay tunables in one place. Units: logical pixels and seconds.
// The logical canvas is 768 wide like the original SpriteKit scene. Its
// height follows the screen: 1364 (9:16, the scene's size) in a desktop
// window and in the simulator, taller on a phone so the picture fills the
// screen without bars (an iPhone's 9:19.5 gives 1664). Gameplay reads H live;
// the HUD keeps out of the safe area and the sign screens, laid out for
// 768 x 1364, sit centred (see hud.js signShift).

export const W = 768;
export let H = 1364;
export const H_MIN = 1364;
export const H_MAX = 1920;            // taller windows are letterboxed (style.css caps the canvas the same way)
// Safe area in logical px: the notch / Dynamic Island and the home indicator.
export const SAFE = { top: 0, bottom: 0, left: 0, right: 0 };
export function setViewport(height, safe) {
  H = Math.round(Math.max(H_MIN, Math.min(H_MAX, height || H_MIN)));
  if (safe) Object.assign(SAFE, safe);
  return H;
}

// Size of one "art pixel". bg.png from the prototype uses 4-px blocks.
export const PX = 4;
// The drawing resolution: pixels of the backing store per logical pixel,
// whatever the screen has; the screen scales the picture up to its own. A
// phone has 1.5 to 1.7 screen pixels to a logical one, which is two and a
// half times the pixels to fill for a picture that looked no different on
// the iPhone Air and ran less smoothly (docs/plans/performance.md). A
// window with fewer pixels than this is drawn at its own. ?res=screen draws
// at the screen's own resolution, ?res=0.5 at another.
export const RESOLUTION = 1;

// --- Physics (ported from the SpriteKit prototype, then tuned) ---
// SpriteKit used g = 9.8 m/s^2 * 150 pt/m = 1470 and a jump of 1500 pt/s,
// which felt floaty. These values give a snappier arc of ~650 px per bounce.
export const GRAVITY = 2100;
export const JUMP_VY = 1650;          // bounce off a normal platform
export const WEAK_JUMP_VY = 1550;     // bounce off a crumbling branch (still clears the max row gap)
export const SPRING_VY = 2650;        // bounce off a ribbon bow
export const STOMP_VY = 1500;         // bounce off an enemy's head
export const BOOST_VY = 1500;         // added by a tap (pogo boost)
export const MAX_FALL_SPEED = 2000;
export const BONK_VY = -250;          // after hitting a plank swing from below
export const HURT_VY = 900;           // small hop when hit so you can recover
// Title hops: bounce off the lawn by countdown value (apex 160 / 193 / 229 px).
// Keep every value under 1120 (apex below the first row at 300 px) and 1320
// (the camera would start climbing).
export const HOP_VY = { 3: 820, 2: 900, 1: 980 };
export const SHOWOFF_VY = 960;        // every 4th to 6th idle hop: apex 219 px with a flip, his head under the title's sign
export const COUNT_MIN_T = 0.3;       // a landing this soon after a count shows no new number
// The ride down when the game loads: the camera is drawn this far above the
// lawn and eases down over INTRO_T seconds before the title's sign drops in.
export const INTRO_FROM = 4000;
export const INTRO_T = 2.6;

// Horizontal movement
export const MOVE_SPEED = 560;        // keyboard / touch-steer top speed
export const MOVE_ACCEL = 5200;
export const MOVE_DECEL = 3800;
export const TILT_SPEED = 820;        // full tilt top speed
export const TILT_DEAD_ZONE = 2;      // degrees
export const TILT_FULL = 22;          // degrees for full speed
// ... by the setting SENSITIVITY (settings.js): how far the phone is leaned
// for full speed. `low` is TILT_FULL, the lean the game has always had; the
// other two ask for less.
export const TILT_FEEL = { low: TILT_FULL, mid: 16, high: 12 };
// Steering by sliding a finger (the setting "swipe"): where the finger is set
// down is the middle, `full` px to either side is full speed, the first
// `dead` px do nothing; past `full` the middle comes along, so that turning
// back takes hold at once. A touch shorter than `tapTime` s that moved less
// than `tapMove` px is a tap: a boost.
export const SWIPE = { full: 110, dead: 8, tapTime: 0.22, tapMove: 14 };

// Player body
export const PLAYER_W = 104;
export const PLAYER_H = 232;
export const PLAYER_BODY_W = 40;      // narrow collision box like the original (30 pt)
export const PLAYER_FOOT_INSET = 0;   // pogo tip is the sprite bottom

// Boost meter: 3 charges, refilled by landing on platforms and lanterns.
// While boosting the prince is shielded: enemies he touches are knocked
// away instead of hurting him (boost is the game's "go through" verb).
export const BOOST_SHIELD_TIME = 0.5;
export const PUNCH_SUNS = 3;          // suns awarded for boosting through an enemy
export const BOOST_CHARGES = 3;
export const BOOST_REFILL_PER_LANDING = 0.5; // half a charge per landing
export const BOOST_COOLDOWN = 0.18;

// Camera (original: follow when player climbs 500 px above the camera anchor)
export const CAMERA_PLAYER_OFFSET = 520;  // player's foot height above view bottom
export const CAMERA_SMOOTH = 10;          // exponential follow rate (per second)
export const CAMERA_START_Y = -100;       // view bottom at the start (shows the lawn)

// Parallax factors relative to the prince's plane (1.0). Like the original
// SpriteKit layers: the tower with its windows and Rapunzel's hair (and the
// ribbons tied to it) scroll slower, the trees with their branches and
// swings are in front and share the prince's plane.
export const PARALLAX_FAR = 0.3;
// (the forest behind the tower has two layers of its own, 0.42 and 0.62: background.js FOREST)
export const PARALLAX_TOWER = 0.9;
// A ribbon on the tower layer drifts upward relative to the prince as the
// camera climbs, so a gap from a front-plane platform up to a row with only
// ribbons is capped to stay reachable even after two boosts in a row
// (camera up to ~1700 px above the modelled height -> ~170 px of drift).
export const LAYER_GAP_CAP = 430;      // take-off from a healthy branch / swing
export const LAYER_GAP_CAP_DRY = 370;  // take-off from a crumbling branch (weaker bounce)

// Level structure (original beat length)
export const BEAT = 300;
export const SAFE_GAP = 520;          // max vertical distance between two non-crumbling platforms
export const GROUND_Y = 0;

// Lives
export const MAX_HEARTS = 3;
export const INVULNERABLE_TIME = 1.6;

// --- Power-ups (src/powerups.js, spawn rule in level.js) ---
// One at a time: collecting one ends the one that runs. Each lasts a few
// seconds; in the last POWER_WARN seconds its effect on the prince flickers
// and three blips count it out.
export const POWER_TIME = { star: 12, cloak: 10, spring: 8.75, magnet: 12.5, feather: 8.75 };
export const POWER_WARN = 1.5;
export const POWER_GRACE = 0.8;        // after the star or the cloak ends: this long still safe (the hurt blink shows it)
export const POWER_FIRST = [1500, 2500];  // the first one waits at 15 to 25 m, so every run meets one
export const POWER_EVERY = [6500, 10500]; // then one every 65 to 105 m of climb
// Golden spring: every bounce and every boost is stronger, with a somersault.
export const SUPER_JUMP_MUL = 1.25;    // bounce 1650 -> 2062 px/s (apex 648 -> 1012 px)
export const SUPER_BOOST_VY = 1900;    // instead of BOOST_VY
export const SUPER_MAX_VY = 3000;      // a bow spring under the golden spring stops here (apex ~21 m)
export const SALTO_TIME = 0.6;         // one somersault per bounce, a quicker one per boost
// Sun magnet: suns, lanterns and hearts this near the prince's body fly to him.
export const MAGNET_RADIUS = 380;
export const MAGNET_SPEED = [500, 1800];  // a pulled pickup starts at the first and speeds up to the second
export const MAGNET_ACCEL = 3600;
// Feather: he comes down slowly, so there is twice the time to steer to a landing.
export const FEATHER_GRAVITY = 0.4;    // of GRAVITY, while falling
export const FEATHER_MAX_FALL = 600;

// The treasury's bubble (World.rescue, Player.carry): it sets a prince who
// dropped out of the picture down from this far above a platform, rising at
// between the two speeds (fast at first, gently at the end) and drifting
// sideways at up to CARRY_VX.
export const CARRY_ABOVE = 130;
export const CARRY_VY = [240, 760];
export const CARRY_VX = 520;

// Scoring: 100 px == 1 m of tower climbed
export const PX_PER_METER = 100;

// --- Post-processing (WebGL renderer, see src/gfx/) ---
// Two effects, each on its own and both off unless the player switches them
// on in the settings (settings.js): the glow and the scan lines. The F key
// goes through the four combinations; ?fx=off|bloom|lines|full forces one
// for a visit.
export const FX = {
  // Selective bloom: glowing things are drawn again into a glow layer that
  // is rendered at `resolution` x the screen, blurred `passes` times with a
  // 9-tap Gaussian `spread` texels wide and added over the scene x `gain`.
  // (The gain was 1.25: everything that glows stood in a white haze. At 0.5
  // a lantern has a soft rim and the picture keeps its colours.)
  bloom: { resolution: 0.5, spread: 1.6, passes: 2, gain: 0.5 },
  // The scan lines: scanline depth (one line per art pixel) and a faint
  // phosphor mask. The pass can also bend the picture like a tube (barrel
  // curvature, chromatic aberration at the edges, shaded corners, flicker):
  // all at nothing, the bent picture did not suit a phone's flat screen.
  crt: { curvature: 0, aberration: 0, scanline: 0.22, mask: 0.06, vignette: 0, flicker: 0 },
};

export const STORAGE_KEY = 'bouncealot.web.v1';
// The game was called Rapunzel until 2026-11-03; saves under the old key are
// read once and written back under the new one.
export const LEGACY_STORAGE_KEY = 'rapunzel.web.v1';
