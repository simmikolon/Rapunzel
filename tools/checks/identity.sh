#!/bin/sh
# A change that is only for the eye (art, a painter, sound) must leave the
# simulator's reports on fixed seeds exactly as they are. This runs the five
# reports kept in baseline/ and compares each from its second line on (the
# first is the configuration).
#   tools/checks/identity.sh [sim url]        (needs tools/serve.py running)
# outside_*: the outside without gates, 40 runs each (a good bold run, a
# cautious kid, and the sky from 450 m). inside_*: the inside without gates
# and without treasuries, 120 runs each (a good bold run, a bold kid).
# When a change is meant to move the numbers, measure it, write the new
# numbers into docs/DESIGN.md and replace the baseline with the new report.
U=${1:-http://localhost:8000/dev/sim.html}
D=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
node "$D/../analyze.mjs" "$U" 40 good bold 1500 1 0 outside off > "$T/outside_good.txt" 2>&1 &
node "$D/../analyze.mjs" "$U" 40 kid cautious 1500 1 0 outside off > "$T/outside_kid.txt" 2>&1 &
node "$D/../analyze.mjs" "$U" 40 good bold 1100 100 450 outside off > "$T/outside_sky.txt" 2>&1 &
node "$D/../analyze.mjs" "$U" 120 good bold 1500 1 0 inside off off > "$T/inside_good.txt" 2>&1 &
node "$D/../analyze.mjs" "$U" 120 kid bold 1500 1 0 inside off off > "$T/inside_kid.txt" 2>&1 &
wait
bad=0
for n in outside_good outside_kid outside_sky inside_good inside_kid; do
  tail -n +2 "$T/$n.txt" > "$T/$n.body"
  if tail -n +2 "$D/baseline/$n.txt" | diff -q - "$T/$n.body" > /dev/null; then echo "same       $n"; else echo "DIFFERENT  $n   (new report: $T/$n.txt)"; bad=1; fi
done
[ $bad = 0 ] && rm -rf "$T"
exit $bad
