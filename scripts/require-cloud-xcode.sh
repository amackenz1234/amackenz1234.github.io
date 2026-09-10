#!/usr/bin/env bash
# Fail the cloud Mac job unless this is Apple Silicon, macOS 27 RC, and Xcode 27.
set -euo pipefail

ARCH="$(uname -m)"
echo "Cloud Mac hardware: ${ARCH}"
if [[ "${ARCH}" != "arm64" ]]; then
  echo "::error::Cloud Mac must be Apple Silicon (arm64), got ${ARCH}"
  exit 1
fi

OS_VER="$(sw_vers -productVersion 2>/dev/null || true)"
OS_BUILD="$(sw_vers -buildVersion 2>/dev/null || true)"
echo "macOS ${OS_VER} (${OS_BUILD})"
if [[ ! "${OS_VER}" =~ ^27(\.|$) ]]; then
  echo "::error::Expected macOS 27 RC (ProductVersion 27.x), got ${OS_VER:-unknown}"
  exit 1
fi

XCODE_APP=""
for candidate in \
  /Applications/Xcode_27_Release_Candidate.app \
  /Applications/Xcode_27_RC.app \
  /Applications/Xcode_27.0_RC.app \
  /Applications/Xcode_27.app \
  /Applications/Xcode_27.0.app \
  /Applications/Xcode_27.0.0.app \
  /Applications/Xcode_27_beta_6.app \
  /Applications/Xcode_27_beta.app \
  /Applications/Xcode.app \
  /Applications/Xcode-beta.app
do
  if [[ -d "${candidate}" ]]; then
    XCODE_APP="${candidate}"
    break
  fi
done

if [[ -n "${XCODE_APP}" ]]; then
  sudo xcode-select -s "${XCODE_APP}/Contents/Developer"
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "::error::Xcode 27 is not installed on this cloud Mac"
  exit 1
fi

VERSION="$(xcodebuild -version | head -n1 || true)"
echo "xcode-select: $(xcode-select -p)"
echo "${VERSION}"
xcodebuild -version
xcrun --find swiftc
xcrun --sdk iphonesimulator --show-sdk-path

if [[ ! "${VERSION}" =~ ^Xcode[[:space:]]+27 ]]; then
  echo "::error::Expected Xcode 27 on this cloud Mac, got ${VERSION:-unknown}"
  exit 1
fi

echo "macOS 27 RC + Xcode 27 are installed on the Apple Silicon cloud Mac"
