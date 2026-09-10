#!/usr/bin/env bash
# Archive Faraday on the cloud Mac (macOS 27 / Xcode 27) and package an IPA.
# Signs when Apple certificate + provisioning profile secrets are present.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="${APP_NAME:-Faraday}"
PROJECT_DIR="${PROJECT_DIR:-${ROOT}/ios/Faraday}"
PROJECT="${PROJECT:-Faraday.xcodeproj}"
SCHEME="${SCHEME:-Faraday}"
BUNDLE_ID="${IOS_BUNDLE_ID:-ca.faraday.rides}"
EXPORT_METHOD="${EXPORT_METHOD:-ad-hoc}"
IDENTITY="${IOS_CODE_SIGN_IDENTITY:-Apple Distribution}"
WORKDIR="${RUNNER_TEMP:-${TMPDIR:-/tmp}/nativ-ipa}"
mkdir -p "${WORKDIR}"

MODE="$(WANT_SIGNED="${WANT_SIGNED:-true}" bash "${ROOT}/scripts/ipa-mode.sh")"
echo "IPA mode: ${MODE}"
echo "APP_NAME=${APP_NAME}"
echo "BUNDLE_ID=${BUNDLE_ID}"
echo "EXPORT_METHOD=${EXPORT_METHOD}"

cd "${PROJECT_DIR}"

if [[ "${MODE}" == "unsigned" ]]; then
  echo "Signing secrets missing or disabled — packaging an unsigned IPA."
  xcodebuild \
    -project "${PROJECT}" \
    -scheme "${SCHEME}" \
    -configuration Release \
    -sdk iphoneos \
    -destination 'generic/platform=iOS' \
    -archivePath "${WORKDIR}/${APP_NAME}.xcarchive" \
    CODE_SIGNING_ALLOWED=NO \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="" \
    clean archive

  APP="${WORKDIR}/${APP_NAME}.xcarchive/Products/Applications/${APP_NAME}.app"
  test -d "${APP}"
  PAYLOAD="${WORKDIR}/ipa"
  rm -rf "${PAYLOAD}"
  mkdir -p "${PAYLOAD}/Payload"
  cp -R "${APP}" "${PAYLOAD}/Payload/"
  ( cd "${PAYLOAD}" && zip -qry "${WORKDIR}/${APP_NAME}-unsigned.ipa" Payload )
  unzip -l "${WORKDIR}/${APP_NAME}-unsigned.ipa"
  echo "IPA_PATH=${WORKDIR}/${APP_NAME}-unsigned.ipa" >> "${GITHUB_ENV:-/dev/null}"
  echo "IPA_NAME=${APP_NAME}-unsigned-ipa" >> "${GITHUB_ENV:-/dev/null}"
  echo "IPA_SIGNED=false" >> "${GITHUB_ENV:-/dev/null}"
  echo "Wrote ${WORKDIR}/${APP_NAME}-unsigned.ipa"
  exit 0
fi

CERT_PATH="${WORKDIR}/signing.p12"
PROFILE_PATH="${WORKDIR}/profile.mobileprovision"
KEYCHAIN="${WORKDIR}/nativ-signing.keychain-db"
KEYCHAIN_PASSWORD="${KEYCHAIN_PASSWORD:-$(openssl rand -base64 24)}"

CERT_PATH="${CERT_PATH}" PROFILE_PATH="${PROFILE_PATH}" \
IOS_CERTIFICATE_BASE64="${IOS_CERTIFICATE_BASE64}" \
IOS_PROVISION_PROFILE_BASE64="${IOS_PROVISION_PROFILE_BASE64}" \
python3 - <<'PY'
import base64, os, pathlib
pathlib.Path(os.environ["CERT_PATH"]).write_bytes(base64.b64decode(os.environ["IOS_CERTIFICATE_BASE64"]))
pathlib.Path(os.environ["PROFILE_PATH"]).write_bytes(base64.b64decode(os.environ["IOS_PROVISION_PROFILE_BASE64"]))
print("decoded certificate and provisioning profile")
PY

security delete-keychain "${KEYCHAIN}" >/dev/null 2>&1 || true
security create-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN}"
security set-keychain-settings -lut 21600 "${KEYCHAIN}"
security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN}"
security import "${CERT_PATH}" \
  -k "${KEYCHAIN}" \
  -P "${IOS_CERTIFICATE_PASSWORD:-}" \
  -T /usr/bin/codesign \
  -T /usr/bin/security \
  -T /usr/bin/xcodebuild
security list-keychain -d user -s "${KEYCHAIN}"
security set-key-partition-list -S apple-tool:,apple: -s -k "${KEYCHAIN_PASSWORD}" "${KEYCHAIN}" >/dev/null

PROFILE_PLIST="${WORKDIR}/profile.plist"
security cms -D -i "${PROFILE_PATH}" > "${PROFILE_PLIST}"
PROFILE_UUID="$(/usr/libexec/PlistBuddy -c 'Print UUID' "${PROFILE_PLIST}")"
PROFILE_NAME="$(/usr/libexec/PlistBuddy -c 'Print Name' "${PROFILE_PLIST}")"
PROFILE_DIR="${HOME}/Library/MobileDevice/Provisioning Profiles"
mkdir -p "${PROFILE_DIR}"
cp "${PROFILE_PATH}" "${PROFILE_DIR}/${PROFILE_UUID}.mobileprovision"
echo "Installed profile ${PROFILE_NAME} (${PROFILE_UUID})"

EXPORT_PLIST="${WORKDIR}/ExportOptions.plist"
cat > "${EXPORT_PLIST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>${EXPORT_METHOD}</string>
  <key>teamID</key>
  <string>${IOS_TEAM_ID}</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>signingCertificate</key>
  <string>${IDENTITY}</string>
  <key>compileBitcode</key>
  <false/>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>provisioningProfiles</key>
  <dict>
    <key>${BUNDLE_ID}</key>
    <string>${PROFILE_NAME}</string>
  </dict>
</dict>
</plist>
EOF

xcodebuild \
  -project "${PROJECT}" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -archivePath "${WORKDIR}/${APP_NAME}.xcarchive" \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM="${IOS_TEAM_ID}" \
  CODE_SIGN_IDENTITY="${IDENTITY}" \
  PROVISIONING_PROFILE="${PROFILE_UUID}" \
  PROVISIONING_PROFILE_SPECIFIER="${PROFILE_NAME}" \
  PRODUCT_BUNDLE_IDENTIFIER="${BUNDLE_ID}" \
  clean archive

xcodebuild -exportArchive \
  -archivePath "${WORKDIR}/${APP_NAME}.xcarchive" \
  -exportOptionsPlist "${EXPORT_PLIST}" \
  -exportPath "${WORKDIR}/export"

IPA="$(find "${WORKDIR}/export" -name '*.ipa' | head -n 1)"
test -f "${IPA}"
SIGNED_PATH="${WORKDIR}/${APP_NAME}-signed.ipa"
cp "${IPA}" "${SIGNED_PATH}"
unzip -l "${SIGNED_PATH}" | head -n 40
echo "IPA_PATH=${SIGNED_PATH}" >> "${GITHUB_ENV:-/dev/null}"
echo "IPA_NAME=${APP_NAME}-signed-ipa" >> "${GITHUB_ENV:-/dev/null}"
echo "IPA_SIGNED=true" >> "${GITHUB_ENV:-/dev/null}"
echo "Wrote signed IPA ${SIGNED_PATH}"
