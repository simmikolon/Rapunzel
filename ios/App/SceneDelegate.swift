import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var game: GameViewController? { window?.rootViewController as? GameViewController }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.backgroundColor = GameViewController.background
        window.rootViewController = GameViewController()
        window.makeKeyAndVisible()
        self.window = window
    }

    // Control Centre, a call banner, the app switcher and the lock screen make the
    // app inactive without the page seeing visibilitychange: pause from here.
    func sceneWillResignActive(_ scene: UIScene) {
        game?.pauseGame()
    }
}
