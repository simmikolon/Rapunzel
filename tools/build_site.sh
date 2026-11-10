#!/bin/sh
# Puts the deployed site together in dist/ for Vercel (vercel.json runs this):
# the landing page (site/) at the root and the game (web/) under /play/.
# Nothing is compiled; both folders are copied as they are, so web/ stays the
# one folder the iOS shell, the simulator and `tools/serve.py` use.
#
#     sh tools/build_site.sh && python3 -m http.server -d dist 8000
#
# (`python3 tools/serve.py --site` serves the same layout without copying.)
set -eu
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/play
cp -R site/. dist/
cp -R web/. dist/play/
find dist -name .DS_Store -delete
echo "dist/: landing at /, game at /play/"
