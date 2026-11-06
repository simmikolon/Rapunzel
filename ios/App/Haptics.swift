import UIKit

/// Short taps on game events; the kinds are the strings web/src/platform.js sends.
final class Haptics {
    private var impacts: [UIImpactFeedbackGenerator.FeedbackStyle: UIImpactFeedbackGenerator] = [:]
    private let notification = UINotificationFeedbackGenerator()

    func play(_ kind: String) {
        switch kind {
        case "light": impact(.light)
        case "medium": impact(.medium)
        case "heavy": impact(.heavy)
        case "soft": impact(.soft)
        case "rigid": impact(.rigid)
        case "success": notification.notificationOccurred(.success)
        case "warning": notification.notificationOccurred(.warning)
        case "error": notification.notificationOccurred(.error)
        default: break
        }
    }

    private func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator: UIImpactFeedbackGenerator
        if let cached = impacts[style] {
            generator = cached
        } else {
            generator = UIImpactFeedbackGenerator(style: style)
            impacts[style] = generator
        }
        generator.impactOccurred()
    }
}
