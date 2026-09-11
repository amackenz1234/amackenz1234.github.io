#!/usr/bin/env bash
# Upload a built IPA to App Store Connect. Every uploaded build appears in
# TestFlight after processing. Uses an App Store Connect API key.
#
# Required env:
#   IPA_PATH        - path to the signed, app-store IPA (set by package-ipa.sh)
#   ASC_KEY_ID      - App Store Connect API Key ID
#   ASC_ISSUER_ID   - App Store Connect API Issuer ID
#   ASC_API_KEY_P8  - full contents of the AuthKey_XXXX.p8 file
set -euo pipefail

IPA="${IPA_PATH:?IPA_PATH not set (run package-ipa.sh with EXPORT_METHOD=app-store first)}"
: "${ASC_KEY_ID:?ASC_KEY_ID not set}"
: "${ASC_ISSUER_ID:?ASC_ISSUER_ID not set}"
: "${ASC_API_KEY_P8:?ASC_API_KEY_P8 not set}"

test -f "${IPA}"

KEYDIR="${HOME}/private_keys"
KEYFILE="${KEYDIR}/AuthKey_${ASC_KEY_ID}.p8"
mkdir -p "${KEYDIR}"
printf '%s' "${ASC_API_KEY_P8}" > "${KEYFILE}"
chmod 600 "${KEYFILE}"
trap 'rm -f "${KEYFILE}"' EXIT

echo "Validating ${IPA} for App Store Connect…"
xcrun altool --validate-app \
  -f "${IPA}" \
  -t ios \
  --apiKey "${ASC_KEY_ID}" \
  --apiIssuer "${ASC_ISSUER_ID}"

echo "Uploading to App Store Connect (build will appear in TestFlight)…"
xcrun altool --upload-app \
  -f "${IPA}" \
  -t ios \
  --apiKey "${ASC_KEY_ID}" \
  --apiIssuer "${ASC_ISSUER_ID}"

echo "Upload complete. The build is added to TestFlight once Apple finishes processing."
