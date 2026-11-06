import CoreHaptics
import UIKit
import os

/// Game events on the Taptic Engine. The kinds are the strings web/src/platform.js
/// sends; each is a short Core Haptics pattern from `events(for:)`, where a tap is a
/// transient and a buzz a continuous event (intensity and sharpness 0...1). Where
/// Core Haptics is missing (the Simulator) UIKit's feedback generators stand in.
/// `strength` scales a pattern's intensity, so a bounce can firm up with the combo.
final class Haptics {
    private let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "SirBouncealot", category: "haptics")
    private var engine: CHHapticEngine?
    private var engineRunning = false
    private var patterns: [String: CHHapticPattern] = [:]
    private var impacts: [UIImpactFeedbackGenerator.FeedbackStyle: UIImpactFeedbackGenerator] = [:]
    private let notification = UINotificationFeedbackGenerator()

    init() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        do {
            let engine = try CHHapticEngine()
            engine.playsHapticsOnly = true
            // The system stops the engine when the app goes to the background; the next
            // event starts it again. After a reset the engine is fresh, patterns stay valid.
            engine.stoppedHandler = { [weak self] _ in DispatchQueue.main.async { self?.engineRunning = false } }
            engine.resetHandler = { [weak self] in DispatchQueue.main.async { self?.engineRunning = false } }
            self.engine = engine
        } catch {
            log.error("no haptic engine: \(error.localizedDescription, privacy: .public)")
        }
    }

    func play(_ kind: String, strength: Float = 1) {
        let strength = min(1, max(0, strength))
        guard let engine, let events = Self.events(for: kind) else { fallback(kind, strength: strength); return }
        do {
            if !engineRunning { try engine.start(); engineRunning = true }
            let key = "\(kind)@\(Int((strength * 10).rounded()))"   // eleven steps per kind, built once
            let pattern = try patterns[key] ?? Self.pattern(events, strength: strength)
            patterns[key] = pattern
            // A fresh player per event: short patterns overlap freely and nothing restarts.
            try engine.makePlayer(with: pattern).start(atTime: CHHapticTimeImmediate)
        } catch {
            log.error("haptic \(kind, privacy: .public): \(error.localizedDescription, privacy: .public)")
            fallback(kind, strength: strength)
        }
    }

    // MARK: Patterns

    private struct Event {
        var at: Double, duration: Double, intensity: Float, sharpness: Float, fade: Bool
        // a transient: one tap
        static func tap(_ at: Double, _ intensity: Float, _ sharpness: Float) -> Event { .init(at: at, duration: 0, intensity: intensity, sharpness: sharpness, fade: false) }
        // a continuous event; `fade` runs its intensity down to nothing over the duration
        static func buzz(_ at: Double, _ duration: Double, _ intensity: Float, _ sharpness: Float, fade: Bool = true) -> Event { .init(at: at, duration: duration, intensity: intensity, sharpness: sharpness, fade: fade) }
    }

    /// The feel of each event, in one place for tuning on the phone. Sharpness is
    /// the texture: low is a dull thud, high a crisp click.
    private static func events(for kind: String) -> [Event]? {
        switch kind {
        case "bounce": return [.tap(0, 0.45, 0.3)]                                  // a pogo landing (times strength)
        case "soft":   return [.tap(0, 0.25, 0.1)]                                  // a dry branch, a cloud, a lantern, the stork
        case "spring": return [.tap(0, 0.5, 0.7), .tap(0.07, 0.35, 0.9)]            // the bow and the updraft: a springy double
        case "boost":  return [.tap(0, 0.6, 0.4), .buzz(0.02, 0.3, 0.85, 0.55)]     // a kick, then the rush of the flame
        case "bonk":   return [.tap(0, 0.9, 0.9)]                                   // the head on a branch: hard and crisp
        case "clank":  return [.tap(0, 0.75, 1), .tap(0.05, 0.45, 1)]               // metal: the helmet, the pike on the shield
        case "stomp":  return [.tap(0, 1, 0.5), .buzz(0.01, 0.09, 0.6, 0.3)]        // a squash with a short give
        case "hurt":   return [.tap(0, 1, 0.35), .buzz(0.02, 0.3, 0.9, 0.2)]        // a thud that rumbles out
        case "over":   return [.tap(0, 1, 0.3), .tap(0.16, 0.8, 0.3), .tap(0.34, 0.65, 0.25), .buzz(0.34, 0.45, 0.5, 0.15)]
        default:       return nil
        }
    }

    private static func pattern(_ events: [Event], strength: Float) throws -> CHHapticPattern {
        var hapticEvents: [CHHapticEvent] = []
        var curves: [CHHapticParameterCurve] = []
        for e in events {
            let params = [CHHapticEventParameter(parameterID: .hapticIntensity, value: e.intensity * strength),
                          CHHapticEventParameter(parameterID: .hapticSharpness, value: e.sharpness)]
            if e.duration > 0 {
                hapticEvents.append(CHHapticEvent(eventType: .hapticContinuous, parameters: params, relativeTime: e.at, duration: e.duration))
                if e.fade {
                    // The curve scales every event in the pattern, so it holds at full until
                    // this buzz begins and only then runs down.
                    let points = [CHHapticParameterCurve.ControlPoint(relativeTime: 0, value: 1),
                                  CHHapticParameterCurve.ControlPoint(relativeTime: e.at, value: 1),
                                  CHHapticParameterCurve.ControlPoint(relativeTime: e.at + e.duration, value: 0)]
                    curves.append(CHHapticParameterCurve(parameterID: .hapticIntensityControl, controlPoints: points, relativeTime: 0))
                }
            } else {
                hapticEvents.append(CHHapticEvent(eventType: .hapticTransient, parameters: params, relativeTime: e.at))
            }
        }
        return try CHHapticPattern(events: hapticEvents, parameterCurves: curves)
    }

    // MARK: UIKit fallback

    private func fallback(_ kind: String, strength: Float) {
        switch kind {
        case "bounce", "soft": impact(.soft, strength)
        case "spring": impact(.light, strength)
        case "boost", "stomp": impact(.medium, strength)
        case "bonk", "clank": impact(.rigid, strength)
        case "hurt": impact(.heavy, strength)
        case "over": notification.notificationOccurred(.error)
        default: break
        }
    }

    private func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle, _ strength: Float) {
        let generator: UIImpactFeedbackGenerator
        if let cached = impacts[style] {
            generator = cached
        } else {
            generator = UIImpactFeedbackGenerator(style: style)
            impacts[style] = generator
        }
        generator.impactOccurred(intensity: CGFloat(strength))
    }
}
