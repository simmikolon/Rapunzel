#!/bin/sh
# Archive the Release app and upload it to App Store Connect (TestFlight).
#
#   tools/ios_upload.sh               -> archive and upload
#   tools/ios_upload.sh --no-upload   -> archive and export the .ipa only
#
# The game in the build is web/ as checked out, so upload from master, with
# everything that goes into the app committed. Bump CURRENT_PROJECT_VERSION in
# ios/Version.xcconfig before each upload: App Store Connect takes every build
# number once. The archive goes to Xcode's archives folder, so it shows in the
# Organizer (and can be distributed again from there). Signing is automatic
# with the team in ios/project.yml and the Apple ID signed in to Xcode
# (Settings > Accounts); the first upload makes the distribution certificate.
#
# If the upload fails with "App Store Connect Credentials Error" (Xcode's
# Apple ID session; seen with Xcode 26.3), sign in with an App Store Connect
# API key instead: App Store Connect > Users and Access > Integrations > Team
# Keys (access App Manager), the downloaded AuthKey_<id>.p8 into
# ~/.appstoreconnect/private_keys/, and ASC_KEY_ID / ASC_ISSUER_ID set in the
# shell. Or upload the archive from Xcode's Organizer.
set -e
cd "$(dirname "$0")/.."
MODE="$1"
set --
if [ -n "$ASC_KEY_ID" ]; then
  set -- -authenticationKeyPath "$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_KEY_ID.p8" \
    -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID"
fi

DIRTY=$(git status --porcelain -- web ios/App ios/SirBouncealot.xcodeproj ios/Version.xcconfig)
if [ -n "$DIRTY" ]; then
  echo "Uncommitted changes in what goes into the app; commit them first:" >&2
  echo "$DIRTY" >&2
  exit 1
fi

VERSION=$(sed -n 's/^MARKETING_VERSION *= *//p' ios/Version.xcconfig)
BUILD=$(sed -n 's/^CURRENT_PROJECT_VERSION *= *//p' ios/Version.xcconfig)
ARCHIVE="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/SirBouncealot $VERSION ($BUILD) $(date +%H.%M).xcarchive"
EXPORT="ios/build/$VERSION-$BUILD"
OPTIONS=ios/ExportOptions.plist
echo "Sir Bouncealot $VERSION ($BUILD) from $(git rev-parse --abbrev-ref HEAD) at $(git rev-parse --short HEAD)"

xcodebuild -project ios/SirBouncealot.xcodeproj -scheme SirBouncealot -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath ios/DerivedData \
  -archivePath "$ARCHIVE" -allowProvisioningUpdates "$@" -quiet archive
echo "Archive: $ARCHIVE"

mkdir -p "$EXPORT"
if [ "$MODE" = "--no-upload" ]; then
  cp "$OPTIONS" "$EXPORT/ExportOptions.plist"
  plutil -replace destination -string export "$EXPORT/ExportOptions.plist"
  OPTIONS="$EXPORT/ExportOptions.plist"
fi
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportOptionsPlist "$OPTIONS" \
  -exportPath "$EXPORT" -allowProvisioningUpdates "$@"

if [ "$MODE" = "--no-upload" ]; then
  echo "Exported to $EXPORT"
else
  echo "Uploaded $VERSION ($BUILD). App Store Connect processes it for a few minutes, then it is in TestFlight."
fi
