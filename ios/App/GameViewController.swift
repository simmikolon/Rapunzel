import UIKit
import WebKit

/// One full-screen WKWebView showing web/ from the bundle. The page keeps its own
/// safe-area handling (style.css uses env()), so the view runs edge to edge.
final class GameViewController: UIViewController, WKNavigationDelegate {
    static let background = UIColor(red: 0x0b / 255.0, green: 0x1a / 255.0, blue: 0x1c / 255.0, alpha: 1)

    private let bridge = NativeBridge()
    private var webView: WKWebView!
    private var loaded = false

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .bottom }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(GameSchemeHandler(), forURLScheme: GameSchemeHandler.scheme)
        config.userContentController = bridge.contentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = Self.background
        webView.scrollView.backgroundColor = Self.background
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.bouncesZoom = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsLinkPreview = false
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }   // Safari > Develop
        #endif
        bridge.webView = webView
        self.webView = webView
        view = webView
    }

    // The page is loaded after the first layout, not in viewDidLoad: the safe-area
    // insets (Dynamic Island, home indicator) reach the page as env() values only
    // once the view sits in the window, and the game reads them when it boots.
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        if !loaded {
            loaded = true
            loadGame()
        }
    }

    func loadGame() {
        var url = GameSchemeHandler.indexURL
        #if DEBUG
        // Launch argument `-gameQuery "at=150&spawn=squirrel&dev=1"`: the helpers from
        // web/src/dev.js and ?fx= work on the device the way they do in the browser.
        if let query = UserDefaults.standard.string(forKey: "gameQuery"), !query.isEmpty,
           let withQuery = URL(string: url.absoluteString + "?" + query) {
            url = withQuery
        }
        #endif
        bridge.installStateScript(safeArea: view.safeAreaInsets)   // a fresh snapshot of the saved values for this load
        webView.load(URLRequest(url: url))
    }

    func pauseGame() {
        bridge.pause()
    }

    // MARK: WKNavigationDelegate

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        loadGame()
    }

    #if DEBUG
    // Launch argument `-gameEval "<js>"`: run a snippet once the page has loaded, for
    // driving the game from a script (the Simulator takes no taps from the shell).
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let script = UserDefaults.standard.string(forKey: "gameEval"), !script.isEmpty {
            webView.evaluateJavaScript(script, completionHandler: nil)
        }
    }
    #endif

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        navigationAction.request.url?.scheme == GameSchemeHandler.scheme ? .allow : .cancel
    }
}
