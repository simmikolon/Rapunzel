import AVFoundation
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        // Ambient: the ring/silent switch mutes the game and another app's music keeps
        // playing. This is only the baseline: WebKit sets the category itself once the
        // page plays (ambient for Web Audio alone, playback once an <audio> element
        // plays or the page asks for it), and web/src/audio.js picks by the player's
        // setting "sound in silent mode" (setThroughSilent).
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        // Tilt steering produces no touches, so the screen must not dim mid-climb.
        application.isIdleTimerDisabled = true
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
    }
}
