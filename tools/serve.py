#!/usr/bin/env python3
"""Serve web/ for development with caching switched off.

A plain `python3 -m http.server` sends no Cache-Control header, so the
browser keeps older modules by heuristic and can pair a fresh title.js
with a stale main.js after a change. This server answers every request
with `Cache-Control: no-store`.

    python3 tools/serve.py          # http://localhost:8000
    python3 tools/serve.py 8080
"""
import functools
import http.server
import os
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.webmanifest': 'application/manifest+json',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):   # one quiet line per request
        sys.stderr.write('%s %s\n' % (self.command, self.path))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web')
    server = http.server.ThreadingHTTPServer(('', port), functools.partial(Handler, directory=root))
    print(f'serving {os.path.abspath(root)} at http://localhost:{port} (no caching)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
