#!/usr/bin/env bash
# Refuse to publish with another company's credentials.
#
# Two companies publish from this Mac (Thulo Bazaar and Build Stack Solutions),
# each with its own Apple team, App Store Connect API key and Play service
# account. A wrong key would either fail slowly with a confusing error or, worse,
# touch the other company's account. So before any upload we prove that the
# credentials in use actually own THIS app.
#
#   scripts/check_store_identity.sh [path/to.ipa] [path/to.apk]
#
# Exit 1 on any mismatch. Read-only: it lists and inspects, never writes.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$DIR/store_identity.env"
ASC_ENV="$HOME/.config/thulobazaar/asc.env"
PLAY_KEY="${PLAY_JSON_KEY_FILE:-$HOME/.config/thulobazaar/play-service-account.json}"

ipa="${1:-}"; apk="${2:-}"
fail=0
say()  { printf '  %-28s %s\n' "$1" "$2"; }
bad()  { printf '  %-28s %s\n' "$1" "MISMATCH — $2"; fail=1; }

echo "==> Publishing as: $COMPANY_NAME (Apple team $APPLE_TEAM_ID, package $BUNDLE_ID)"

# 1. The project itself must build the expected bundle id.
proj_bundle="$(grep -m1 -E 'PRODUCT_BUNDLE_IDENTIFIER = ' "$DIR/../ios/Runner.xcodeproj/project.pbxproj" \
  | sed -E 's/.*= *([^;]*);.*/\1/')"
[ "$proj_bundle" = "$BUNDLE_ID" ] \
  && say "Xcode bundle id" "$proj_bundle" \
  || bad "Xcode bundle id" "project says '$proj_bundle', expected '$BUNDLE_ID'"

# 2. The Apple key must belong to the account that owns this app. Another
#    company's key lists its own apps and simply will not contain ours.
# shellcheck source=/dev/null
[ -f "$ASC_ENV" ] && source "$ASC_ENV"
if [ -z "${ASC_KEY_ID:-}" ] || [ -z "${ASC_ISSUER_ID:-}" ]; then
  bad "App Store Connect key" "ASC_KEY_ID / ASC_ISSUER_ID missing from $ASC_ENV"
else
  apps="$(xcrun altool --list-apps --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" 2>&1 || true)"
  if grep -q "Bundle ID: $BUNDLE_ID" <<<"$apps" && grep -q "ID: $APPLE_APP_ID" <<<"$apps"; then
    say "App Store Connect key" "$ASC_KEY_ID owns $BUNDLE_ID"
  else
    other="$(grep -o 'Bundle ID: [^ ]*' <<<"$apps" | head -3 | tr '\n' ' ')"
    bad "App Store Connect key" "$ASC_KEY_ID does not own $BUNDLE_ID. It sees: ${other:-nothing}"
  fi
fi

# 3. The Play key must be this app's service account.
if [ ! -f "$PLAY_KEY" ]; then
  bad "Play service account" "key file not found at $PLAY_KEY"
else
  sa="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('client_email',''))" "$PLAY_KEY")"
  [ "$sa" = "$PLAY_SERVICE_ACCOUNT" ] \
    && say "Play service account" "$sa" \
    || bad "Play service account" "key is '$sa', expected '$PLAY_SERVICE_ACCOUNT'"
fi

# 4. The artifacts themselves must carry this identity — the last line of
#    defence if a stale build from another project is lying around.
if [ -n "$ipa" ] && [ -f "$ipa" ]; then
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  unzip -q -o "$ipa" 'Payload/*.app/Info.plist' 'Payload/*.app/embedded.mobileprovision' -d "$tmp"
  plist="$(find "$tmp/Payload" -maxdepth 2 -name Info.plist | head -1)"
  ipa_bundle="$(plutil -extract CFBundleIdentifier raw -o - "$plist" 2>/dev/null || echo '?')"
  [ "$ipa_bundle" = "$BUNDLE_ID" ] \
    && say "IPA bundle id" "$ipa_bundle" \
    || bad "IPA bundle id" "IPA is '$ipa_bundle'"

  prof="$(find "$tmp/Payload" -maxdepth 2 -name embedded.mobileprovision | head -1)"
  if [ -n "$prof" ]; then
    team="$(security cms -D -i "$prof" 2>/dev/null | plutil -extract TeamIdentifier.0 raw -o - - 2>/dev/null || echo '?')"
    [ "$team" = "$APPLE_TEAM_ID" ] \
      && say "IPA signing team" "$team" \
      || bad "IPA signing team" "signed by team '$team', expected '$APPLE_TEAM_ID'"
  fi
fi

if [ -n "$apk" ] && [ -f "$apk" ]; then
  analyzer="$HOME/Library/Android/sdk/cmdline-tools/latest/bin/apkanalyzer"
  if [ -x "$analyzer" ]; then
    apk_pkg="$("$analyzer" manifest application-id "$apk" 2>/dev/null | tail -1)"
    [ "$apk_pkg" = "$PLAY_PACKAGE" ] \
      && say "APK application id" "$apk_pkg" \
      || bad "APK application id" "APK is '$apk_pkg'"
  else
    say "APK application id" "skipped (apkanalyzer not installed)"
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo "==> STOP: these credentials or artifacts do not belong to $COMPANY_NAME. Nothing was uploaded."
  exit 1
fi
echo "==> identity OK — safe to publish to $COMPANY_NAME's stores"
