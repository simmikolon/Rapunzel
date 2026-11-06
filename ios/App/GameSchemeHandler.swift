import WebKit
import os

/// Serves web/ out of the app bundle at app://game/... so the ES modules, the font
/// and the page get a proper origin (file:// has none and trips module loading).
final class GameSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "app"
    static let host = "game"
    static var indexURL: URL { URL(string: "\(scheme)://\(host)/index.html")! }

    private let root = Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true).standardizedFileURL
    private let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "SirBouncealot", category: "scheme")

    // Module scripts need a JavaScript type and UTType does not know .mjs, so the
    // table is explicit.
    private static let mimeTypes: [String: String] = [
        "html": "text/html; charset=utf-8",
        "js": "text/javascript", "mjs": "text/javascript",
        "css": "text/css",
        "json": "application/json", "webmanifest": "application/manifest+json",
        "png": "image/png", "svg": "image/svg+xml", "ico": "image/x-icon",
        "woff2": "font/woff2", "woff": "font/woff",
        "txt": "text/plain", "md": "text/plain",
    ]

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url, url.host == Self.host else {
            respond(urlSchemeTask, status: 404, url: urlSchemeTask.request.url)
            return
        }
        var path = url.path   // percent-decoded, query already stripped
        if path.isEmpty || path.hasSuffix("/") { path += "index.html" }
        let relative = String(path.drop(while: { $0 == "/" }))
        let file = root.appendingPathComponent(relative).standardizedFileURL
        var isDirectory: ObjCBool = false
        guard file.path.hasPrefix(root.path + "/"),   // ".." cannot leave web/
              FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory), !isDirectory.boolValue,
              let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            log.error("404 \(url.absoluteString, privacy: .public)")
            respond(urlSchemeTask, status: 404, url: url)
            return
        }
        let type = Self.mimeTypes[file.pathExtension.lowercased()] ?? "application/octet-stream"
        respond(urlSchemeTask, status: 200, url: url, type: type, body: data)
    }

    // Every task is answered synchronously inside start, so there is nothing to cancel
    // and a task can never be touched after it was stopped.
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func respond(_ task: WKURLSchemeTask, status: Int, url: URL?, type: String = "text/plain", body: Data = Data()) {
        let headers = ["Content-Type": type, "Content-Length": String(body.count), "Cache-Control": "no-store"]
        guard let response = HTTPURLResponse(url: url ?? Self.indexURL, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers) else { return }
        task.didReceive(response)
        if !body.isEmpty { task.didReceive(body) }
        task.didFinish()
    }
}
