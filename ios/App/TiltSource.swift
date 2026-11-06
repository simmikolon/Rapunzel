import CoreMotion

/// Tilt steering from CoreMotion. Reports gamma in degrees the way
/// DeviceOrientationEvent does in portrait (right edge down is positive), so
/// web/src/input.js applies the same dead zone and full-tilt angle as in Safari.
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
            // Gravity in the device frame is (sin g cos b, -sin b, -cos g cos b) for the
            // spec's Z-X'-Y'' angles, so atan2(x, -z) is gamma for any pitch under 90
            // degrees: the same lean steers the same whether the phone is held flat or
            // upright. Near vertical it runs away like Safari's; input.js clamps at 80.
            var gamma = atan2(g.x, -g.z) * 180 / .pi
            gamma = min(80, max(-80, gamma))
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
