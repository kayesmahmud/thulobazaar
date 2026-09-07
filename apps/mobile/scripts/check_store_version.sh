#!/usr/bin/env bash
# Refuse a store build whose version isn't above what the stores already have.
#
# Why: on 2026-09-08 an IPA labelled 1.3.3 was rejected by App Store Connect
# ("train 1.3.3 is closed") because 1.3.3 had already been approved — the
# repo's pubspec was never bumped after that release. The stores, not a
# note or a memory, are the source of truth for the last shipped version,
# so ask them every time.
#
# Usage: apps/mobile/scripts/check_store_version.sh   (exit 1 = do not build)
set -euo pipefail

BUNDLE_ID="com.thulobazaar.mobile"
PUBSPEC="$(cd "$(dirname "$0")/.." && pwd)/pubspec.yaml"

local_version="$(grep -E '^version:' "$PUBSPEC" | sed -E 's/^version:[[:space:]]*//')"
local_name="${local_version%%+*}"
local_build="${local_version##*+}"

# Live App Store version (public lookup, no credentials).
appstore="$(curl -sf "https://itunes.apple.com/lookup?bundleId=${BUNDLE_ID}&country=np" \
  | python3 -c 'import sys,json; r=json.load(sys.stdin)["results"]; print(r[0]["version"] if r else "")' || true)"

# Live Play Store version (public listing; best effort — the page format can change).
play="$(curl -sf -A "Mozilla/5.0" "https://play.google.com/store/apps/details?id=${BUNDLE_ID}&hl=en" \
  | grep -o '\[\[\["[0-9]\+\.[0-9]\+\.[0-9]\+"\]\]' | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || true)"

echo "pubspec:    ${local_name} (build ${local_build})"
echo "App Store:  ${appstore:-unknown}"
echo "Play Store: ${play:-unknown}"

# Returns 0 when $1 > $2 as dotted versions.
version_gt() {
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -1)" = "$1" ] && [ "$1" != "$2" ]
}

status=0
if [ -z "$appstore" ]; then
  echo "WARN: could not read the App Store version — check App Store Connect by hand."
  status=1
elif ! version_gt "$local_name" "$appstore"; then
  echo "FAIL: ${local_name} is not above the live App Store version ${appstore}. Bump pubspec.yaml before building."
  status=1
fi

if [ -z "$play" ]; then
  echo "WARN: could not read the Play Store version — check Play Console by hand."
elif ! version_gt "$local_name" "$play"; then
  echo "FAIL: ${local_name} is not above the live Play Store version ${play}. Bump pubspec.yaml before building."
  status=1
fi

# Neither store lists build numbers publicly; both reject a reused one, so
# the build number must at least move with the version name.
if [ "$status" -eq 0 ]; then
  echo "OK: ${local_version} is newer than both stores — safe to build."
fi
exit "$status"
