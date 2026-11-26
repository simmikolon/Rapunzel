import CoreMotion

/// Tilt steering from CoreMotion. Reports how far the screen's right edge is
/// dipped below its left, in degrees (right edge down is positive), the same
/// angle web/src/input.js works out in Safari (leanDegrees), so the dead zone
/// and the full-tilt angle are the same.
/// CMMotionManager needs no usage description and shows no prompt.
final class TiltSource {
    private let motion = CMMotionManager()
    private var last = Double.nan

    var isAvailable: Bool { motion.isDeviceMotionAvailable }   // false in the Simulator

    func start(_ sample: @escaping (Double) -> Void) {
        guard motion.isDeviceMotionAvailable, !motion.isDeviceMotionActive else { return }
        last = .nan
        motion.deviceMotionUpdateInterval = 1.0 / 60.0
        // No magnetometer in the reference frame, so no calibration prompt either.
        motion.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: .main) { [weak self] data, _ in
            guard let self, let g = data?.gravity else { return }
            // The gravity along the screen's width is the sine of that lean, however the
            // phone is pitched: upright, lying flat or tipped past upright towards the
            // player. (atan2(x, -z), DeviceOrientation's gamma, was used before: held
            // upright z is nearly nothing and the angle ran away at the smallest turn,
            // and past upright it changed its sign.)
            let gamma = asin(min(1, max(-1, g.x))) * 180 / .pi
            // The first sample always goes out (last is NaN, and NaN compares false
            // with everything); after that a still phone costs no round trips.
            guard gamma.isFinite, self.last.isNaN || abs(gamma - self.last) >= 0.05 else { return }
            self.last = gamma
            sample(gamma)
        }
    }

    func stop() {
        motion.stopDeviceMotionUpdates()
        last = .nan
    }
}
