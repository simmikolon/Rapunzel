#!/bin/sh
# Build the Debug app, install it on a paired iPhone and launch it there.
# The phone must be unlocked and on the same network or cable.
#
#   tools/ios_run.sh                                   -> Simmi
#   tools/ios_run.sh "My iPhone"                       -> another paired phone
#   tools/ios_run.sh Simmi -gameQuery "at=150&dev=1"   -> with launch arguments
#
# The device name is what `xcrun devicectl list devices` shows. Build products
# go to ios/DerivedData (ignored by git). Signing is automatic with the team in
# ios/project.yml; the first run on a new phone may ask Xcode to trust it.
set -e
cd "$(dirname "$0")/.."
DEVICE="${1:-Simmi}"
[ $# -gt 0 ] && shift
xcodebuild -project ios/SirBouncealot.xcodeproj -scheme SirBouncealot -configuration Debug \
  -destination "platform=iOS,name=$DEVICE" -derivedDataPath ios/DerivedData \
  -allowProvisioningUpdates -quiet build
xcrun devicectl device install app --device "$DEVICE" \
  ios/DerivedData/Build/Products/Debug-iphoneos/SirBouncealot.app
xcrun devicectl device process launch --terminate-existing --device "$DEVICE" \
  com.simonkemper.sirbouncealot -- "$@"
