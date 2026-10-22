import { W, H, CAMERA_PLAYER_OFFSET, CAMERA_SMOOTH, PLAYER_H } from './config.js';
import { approach } from './util.js';

// The camera only ever climbs (like Doodle Jump). `y` is the world height of
// the bottom edge of the view; world y goes up, screen y goes down.
export class Camera {
  constructor() {
    this.y = -100;
    this.target = -100;
    this.shakeT = 0;
    this.shakeMag = 0;
    this.ox = 0; this.oy = 0;
    this.maxY = -100; // highest view bottom reached (for scoring)
  }

  reset() { this.y = -100; this.target = -100; this.shakeT = 0; this.maxY = -100; this.ox = this.oy = 0; }

  follow(player, dt) {
    const want = player.y - CAMERA_PLAYER_OFFSET;
    if (want > this.target) this.target = want;
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
