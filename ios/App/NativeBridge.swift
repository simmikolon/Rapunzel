import WebKit
import os

/// The page's side of this is web/src/platform.js. Messages arrive as {type, ...}
/// objects on the 'native' handler; the saved values travel the other way as
/// window.__native, injected before the first script of every load, so the game's
/// synchronous loadSave() keeps working.
///
///   storage.set { key, value }   -> UserDefaults (keys with the game's prefix only)
///   haptic { kind }              -> Haptics
///   tilt.start / tilt.stop       -> TiltSource; samples go back as window.__nativeTilt(gammaDeg)
///   log { message }              -> the system log, for page errors
final class NativeBridge: NSObject, WKScriptMessageHandler {
    static let handlerName = "native"
    static let storagePrefix = "bouncealot."   // STORAGE_KEY in web/src/config.js and its '.audio' sibling

    let contentController = WKUserContentController()
    weak var webView: WKWebView?

    private let defaults = UserDefaults.standard
    private let haptics = Haptics()
    private let tilt = TiltSource()
    private let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "SirBouncealot", category: "bridge")

    override init() {
        super.init()
        contentController.add(self, name: Self.handlerName)
    }

    /// Rebuilt before every load: the user script is a snapshot of UserDefaults, and a
    /// reload after the web process died must not hand the page stale values. The
    /// safe-area insets travel with it (in points, like CSS px) because WebKit hands
    /// the page its env() values some time after the load, too late for the game's boot.
    func installStateScript(safeArea: UIEdgeInsets) {
        contentController.removeAllUserScripts()
        var storage: [String: String] = [:]
        for (key, value) in defaults.dictionaryRepresentation() where key.hasPrefix(Self.storagePrefix) {
            if let string = value as? String { storage[key] = string }
        }
        let safe: [String: Double] = ["top": safeArea.top, "bottom": safeArea.bottom, "left": safeArea.left, "right": safeArea.right]
        var state: [String: Any] = ["platform": "ios", "storage": storage, "tilt": ["available": tilt.isAvailable], "safe": safe]
        #if DEBUG
        state["debug"] = true
        #endif
        guard let data = try? JSONSerialization.data(withJSONObject: state), let json = String(data: data, encoding: .utf8) else { return }
        contentController.addUserScript(WKUserScript(source: "window.__native = \(json);", injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "storage.set":
            guard let key = body["key"] as? String, key.hasPrefix(Self.storagePrefix), let value = body["value"] as? String else { return }
            defaults.set(value, forKey: key)
        case "haptic":
            haptics.play(body["kind"] as? String ?? "light")
        case "tilt.start":
            tilt.start { [weak self] gamma in self?.pushTilt(gamma) }
        case "tilt.stop":
            tilt.stop()
        case "log":
            let text = body["message"] as? String ?? ""
            log.error("js: \(text, privacy: .public)")
            #if DEBUG
            print("js: \(text)")   // reaches `devicectl device process launch --console`
            #endif
        default:
            log.error("unknown message \(type, privacy: .public)")
        }
    }

    func pause() {
        // Only the completion-handler form: the async overload traps on an undefined result.
        webView?.evaluateJavaScript("window.__nativePause && window.__nativePause();", completionHandler: nil)
    }

    private func pushTilt(_ gamma: Double) {
        let value = (gamma * 10).rounded() / 10   // one decimal keeps the literal short and never scientific
        webView?.evaluateJavaScript("window.__nativeTilt && window.__nativeTilt(\(value));", completionHandler: nil)
    }
}
