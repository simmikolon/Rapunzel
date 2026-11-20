import { W, H, CAMERA_PLAYER_OFFSET, CAMERA_SMOOTH, CAMERA_START_Y, PLAYER_H } from './config.js';
import { approach, clamp } from './util.js';

// In a room (the treasury) the camera shows what he stands on this far above
// the picture's bottom edge, and a prince who is falling this far above it.
const ROOM_STAND = 300, ROOM_FALL = 400;

// The camera only ever climbs (like Doodle Jump). `y` is the world height of
// the bottom edge of the view; world y goes up, screen y goes down.
// A room with a floor and a ceiling is the exception (`room`, set by the
// world): there it rests on the platform he bounces on, goes up with him
// from one to the next and down with him when he drops, between the room's
// floor (`lo`) and its ceiling (`hi`), so nobody can fall out of the picture.
export class Camera {
  constructor() {
    this.reset();
  }

  reset() { this.y = CAMERA_START_Y; this.target = CAMERA_START_Y; this.shakeT = 0; this.shakeMag = 0; this.maxY = CAMERA_START_Y; this.ox = this.oy = 0; this.room = null; }

  // Into a room: { lo, hi } are the lowest and the highest view bottom, `stand`
  // the height of what he stands on (the world keeps it up to date). The
  // picture is shut while this happens (the gate's iris), so the camera is
  // simply there. Out of it (null): it climbs on from where it is.
  setRoom(room) {
    this.room = room;
    if (room) { this.y = this.target = clamp(room.stand - ROOM_STAND, room.lo, Math.max(room.lo, room.hi)); }
    else this.target = this.y;
  }

  // View bottom of a parallax layer with factor f, anchored so every layer
  // lines up with the lawn at the start.
  layerY(f) { return CAMERA_START_Y + (this.y - CAMERA_START_Y) * f; }

  follow(player, dt) {
    const want = player.y - CAMERA_PLAYER_OFFSET;
    if (this.room) {
      const r = this.room, falling = player.y < r.stand - 40;        // below what he stood on: he missed, or stepped off
      this.target = clamp(falling ? player.y - ROOM_FALL : r.stand - ROOM_STAND, r.lo, Math.max(r.lo, r.hi));
    } else if (want > this.target) this.target = want;
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
