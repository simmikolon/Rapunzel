import { W, H, CAMERA_PLAYER_OFFSET, CAMERA_SMOOTH, CAMERA_START_Y, PLAYER_H } from './config.js';
import { approach } from './util.js';

// The camera only ever climbs (like Doodle Jump). `y` is the world height of
// the bottom edge of the view; world y goes up, screen y goes down.
// In a room with a floor and a ceiling (the treasury; `room`, set by the
// world) it is the same camera: it starts with the room's floor where the
// lawn lies at a round's start (`lo`) and stops under the ceiling (`hi`).
// It was a camera of its own there once, resting on what he stood on and
// going down with a prince who dropped; that was a different game to the
// eye, and it was taken out again (docs/DESIGN.md, the decision log).
export class Camera {
  constructor() {
    this.reset();
  }

  reset() { this.y = CAMERA_START_Y; this.target = CAMERA_START_Y; this.shakeT = 0; this.shakeMag = 0; this.maxY = CAMERA_START_Y; this.ox = this.oy = 0; this.room = null; }

  // Into a room: { lo, hi } are the view bottom he starts with and the
  // highest one. The picture is shut while this happens (the gate's iris),
  // so the camera is simply there. Out of it (null): it climbs on from
  // where it is.
  setRoom(room) {
    this.room = room;
    this.target = room ? room.lo : this.y;
    this.y = this.target;
  }

  // View bottom of a parallax layer with factor f, anchored so every layer
  // lines up with the lawn at the start.
  layerY(f) { return CAMERA_START_Y + (this.y - CAMERA_START_Y) * f; }

  follow(player, dt) {
    const want = player.y - CAMERA_PLAYER_OFFSET;
    if (want > this.target) this.target = want;
    if (this.room && this.target > this.room.hi) this.target = Math.max(this.room.lo, this.room.hi);   // under a room's ceiling it stops
    this.y = approach(this.y, this.target, CAMERA_SMOOTH, dt);
    // Never let the player leave through the top of the screen.
    const ceiling = player.y + PLAYER_H + 30 - H;
    if (this.y < ceiling) this.y = ceiling;
    if (this.y > this.maxY) this.maxY = this.y;
    // shake
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const m = this.shakeMag * Math.max(0, this.shakeT) * 4;
      this.ox = (Math.random() * 2 - 1) * m;
      this.oy = (Math.random() * 2 - 1) * m;
    } else { this.ox = 0; this.oy = 0; }
  }

  shake(mag = 6, time = 0.25) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, time); }

  // World -> screen
  sx(x) { return W / 2 + x + this.ox; }
  sy(y) { return H - (y - this.y) + this.oy; }
  get top() { return this.y + H; }
}
