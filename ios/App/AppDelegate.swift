import AVFoundation
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        // Ambient: the ring/silent switch mutes the game and another app's music keeps
        // playing. WebKit sets the category itself once Web Audio starts (ambient as
        // long as no <audio> element plays, which web/src/audio.js makes sure of in
        // the shell); this is the baseline it starts from.
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
