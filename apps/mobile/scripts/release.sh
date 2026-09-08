#!/usr/bin/env bash
# Build and (optionally) publish the Thulo Bazaar app to both stores.
#
#   scripts/release.sh              build + validate only, uploads nothing
#   scripts/release.sh --upload     also upload to App Store Connect + Play internal
#   scripts/release.sh --skip-build reuse the artifacts already in build/release-<v>/
#   scripts/release.sh --allow-dirty  build even with uncommitted changes (avoid)
#
# Credentials live OUTSIDE the repo, per company (Build Stack Solutions has its
# own set — never mix them):
#   ~/.config/thulobazaar/asc.env                  ASC_KEY_ID / ASC_ISSUER_ID
#   ~/.appstoreconnect/private_keys/AuthKey_*.p8   Apple private key
#   ~/.config/thulobazaar/play-service-account.json  Play service account
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLAY_KEY="${PLAY_JSON_KEY_FILE:-$HOME/.config/thulobazaar/play-service-account.json}"
ASC_ENV="$HOME/.config/thulobazaar/asc.env"
PACKAGE_ID="com.thulobazaar.mobile"
PLAY_TRACK="${PLAY_TRACK:-internal}"

upload=false; skip_build=false; allow_dirty=false
for arg in "$@"; do
  case "$arg" in
    --upload) upload=true ;;
    --skip-build) skip_build=true ;;
    --allow-dirty) allow_dirty=true ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

cd "$MOBILE_DIR"
version="$(grep -E '^version:' pubspec.yaml | sed -E 's/^version:[[:space:]]*//')"
name="${version%%+*}"; build="${version##*+}"
out="$MOBILE_DIR/build/release-${version}"
stamp="$(date +%Y%m%d)"
apk="$out/ThuloBazaar-${version}-${stamp}.apk"
aab="$out/ThuloBazaar-${version}-${stamp}.aab"
ipa="$out/ThuloBazaar-${version}-${stamp}.ipa"

echo "==> Thulo Bazaar ${name} (build ${build})"

# 1. The stores decide whether this version may be built at all.
"$MOBILE_DIR/scripts/check_store_version.sh"

# 2. Never ship uncommitted work by accident.
if ! $allow_dirty && [ -n "$(git -C "$MOBILE_DIR" status --porcelain -- "$MOBILE_DIR")" ]; then
  echo "FAIL: apps/mobile has uncommitted changes. Commit them, or pass --allow-dirty."
  git -C "$MOBILE_DIR" status --short -- "$MOBILE_DIR"
  exit 1
fi

# 3. Build all three artifacts in one sequence (parallel Flutter builds fail).
if ! $skip_build; then
  mkdir -p "$out"
  echo "==> flutter pub get"; flutter pub get >/dev/null
  echo "==> APK";       flutter build apk --release >/dev/null
  echo "==> Play AAB";  flutter build appbundle --release >/dev/null
  echo "==> iOS IPA";   flutter build ipa --release --export-options-plist=ios/ExportOptions.plist >/dev/null
  cp build/app/outputs/flutter-apk/app-release.apk "$apk"
  cp build/app/outputs/bundle/release/app-release.aab "$aab"
  cp build/ios/ipa/*.ipa "$ipa"
fi
for f in "$apk" "$aab" "$ipa"; do
  [ -f "$f" ] || { echo "FAIL: missing $f (drop --skip-build?)"; exit 1; }
done
echo "==> artifacts in $out"

# 4. Ask Apple whether it would accept this build, before spending an upload.
# shellcheck source=/dev/null
[ -f "$ASC_ENV" ] && source "$ASC_ENV"
: "${ASC_KEY_ID:?set ASC_KEY_ID in $ASC_ENV}"
: "${ASC_ISSUER_ID:?set ASC_ISSUER_ID in $ASC_ENV}"
echo "==> validating IPA with App Store Connect"
xcrun altool --validate-app --type ios -f "$ipa" \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" 2>&1 | grep -E "VERIFY|ERROR|WARN" || true

if ! $upload; then
  echo "==> done (nothing uploaded). Re-run with --upload to publish."
  exit 0
fi

# 5. Publish. A build number can only ever be used once per store.
echo "==> uploading IPA to App Store Connect"
xcrun altool --upload-app --type ios -f "$ipa" \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"

echo "==> uploading AAB to Play '$PLAY_TRACK' track (draft)"
fastlane run upload_to_play_store \
  package_name:"$PACKAGE_ID" \
  json_key:"$PLAY_KEY" \
  aab:"$aab" \
  track:"$PLAY_TRACK" \
  release_status:draft \
  skip_upload_metadata:true \
  skip_upload_images:true \
  skip_upload_screenshots:true

echo "==> uploaded. Both land as drafts: submit for review in App Store Connect,"
echo "    and promote the Play draft to the track you want in Play Console."
