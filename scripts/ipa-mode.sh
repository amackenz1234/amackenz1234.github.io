#!/usr/bin/env bash
# Decide whether the Cloud Mac can emit a signed IPA.
# Prints "signed" or "unsigned" to stdout. Safe to run on Linux (CI unit tests).
set -euo pipefail

want="${WANT_SIGNED:-true}"
if [[ "${want}" == "false" || "${want}" == "0" ]]; then
  echo unsigned
  exit 0
fi

if [[ -n "${IOS_CERTIFICATE_BASE64:-}" && -n "${IOS_PROVISION_PROFILE_BASE64:-}" && -n "${IOS_TEAM_ID:-}" ]]; then
  echo signed
  exit 0
fi

echo unsigned
