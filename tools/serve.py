#!/usr/bin/env python3
"""Serve web/ for development with caching switched off.

A plain `python3 -m http.server` sends no Cache-Control header, so the
browser keeps older modules by heuristic and can pair a fresh title.js
with a stale main.js after a change. This server answers every request
with `Cache-Control: no-store`.

    python3 tools/serve.py          # http://localhost:8000, the game at /
    python3 tools/serve.py 8080
    python3 tools/serve.py --site   # as deployed: the landing page (site/)
                                    # at /, the game (web/) at /play/
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
    play_dir = None   # with --site: requests under /play/ are answered from web/

    def translate_path(self, path):
        if self.play_dir:
            bare = path.split('?', 1)[0].split('#', 1)[0]
            if bare == '/play' or bare.startswith('/play/'):
                saved, self.directory = self.directory, self.play_dir
                try:
                    return super().translate_path(path[len('/play'):] or '/')
                finally:
                    self.directory = saved
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):   # one quiet line per request
        sys.stderr.write('%s %s\n' % (self.command, self.path))


def main():
    args = [a for a in sys.argv[1:] if a != '--site']
    site = len(args) != len(sys.argv) - 1
    port = int(args[0]) if args else 8000
    here = os.path.dirname(os.path.abspath(__file__))
    web = os.path.abspath(os.path.join(here, '..', 'web'))
    root = os.path.abspath(os.path.join(here, '..', 'site')) if site else web
    if site:
        Handler.play_dir = web
    server = http.server.ThreadingHTTPServer(('', port), functools.partial(Handler, directory=root))
    if site:
        print(f'serving {root} at http://localhost:{port} and {web} at /play/ (no caching)')
    else:
        print(f'serving {root} at http://localhost:{port} (no caching)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
