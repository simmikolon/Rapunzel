// All gameplay tunables in one place. Units: logical pixels and seconds.
// The logical canvas keeps the original SpriteKit scene size (768 x 1364),
// which is the portrait phone aspect ratio the game was designed for.

export const W = 768;
export const H = 1364;

// Size of one "art pixel". bg.png from the prototype uses 4-px blocks.
export const PX = 4;

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

// Horizontal movement
export const MOVE_SPEED = 560;        // keyboard / touch-steer top speed
export const MOVE_ACCEL = 5200;
export const MOVE_DECEL = 3800;
export const TILT_SPEED = 820;        // full tilt top speed
export const TILT_DEAD_ZONE = 2;      // degrees
export const TILT_FULL = 22;          // degrees for full speed

// Player body
export const PLAYER_W = 104;
export const PLAYER_H = 232;
export const PLAYER_BODY_W = 40;      // narrow collision box like the original (30 pt)
export const PLAYER_FOOT_INSET = 0;   // pogo tip is the sprite bottom

// Boost meter: 3 charges, refilled by landing on platforms and lanterns.
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
export const PARALLAX_FOREST = 0.55;
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

// Scoring: 100 px == 1 m of tower climbed
export const PX_PER_METER = 100;

export const STORAGE_KEY = 'rapunzel.web.v1';
