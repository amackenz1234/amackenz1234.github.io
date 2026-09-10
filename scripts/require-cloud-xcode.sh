#!/usr/bin/env bash
# Fail unless this is a full macOS 27 RC install on Apple Silicon with Xcode 27.
# The xcode-27 runner is a complete macOS VM (not a toolchain-only sandbox).
set -euo pipefail

ARCH="$(uname -m)"
echo "Cloud Mac hardware: ${ARCH}"
if [[ "${ARCH}" != "arm64" ]]; then
  echo "::error::Cloud Mac must be Apple Silicon (arm64), got ${ARCH}"
  exit 1
fi

KERNEL="$(uname -s)"
if [[ "${KERNEL}" != "Darwin" ]]; then
  echo "::error::Full macOS requires a Darwin kernel, got ${KERNEL}"
  exit 1
fi

OS_NAME="$(sw_vers -productName 2>/dev/null || true)"
OS_VER="$(sw_vers -productVersion 2>/dev/null || true)"
OS_BUILD="$(sw_vers -buildVersion 2>/dev/null || true)"
echo "ProductName: ${OS_NAME}"
echo "macOS ${OS_VER} (${OS_BUILD})"

if [[ "${OS_NAME}" != "macOS" && "${OS_NAME}" != "Mac OS X" ]]; then
  echo "::error::Expected the full macOS operating system, got ${OS_NAME:-unknown}"
  exit 1
fi

if [[ ! "${OS_VER}" =~ ^27(\.|$) ]]; then
  echo "::error::Expected full macOS 27 RC (ProductVersion 27.x), got ${OS_VER:-unknown}"
  exit 1
fi

if [[ ! -f /System/Library/CoreServices/SystemVersion.plist ]]; then
  echo "::error::SystemVersion.plist missing — this is not a full macOS install"
  exit 1
fi

if [[ ! -d /System/Library/CoreServices || ! -d /Applications || ! -d /System/Library ]]; then
  echo "::error::Core macOS system directories are missing"
  exit 1
fi

if ! command -v launchctl >/dev/null 2>&1; then
  echo "::error::launchctl missing — this is not a full macOS install"
  exit 1
fi

echo "---- Full macOS identity ----"
sw_vers
uname -a
echo "-----------------------------"

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
  echo "::error::Xcode 27 is not installed on this full macOS cloud Mac"
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

echo "Full macOS 27 RC + Xcode 27 are running on the Apple Silicon cloud Mac"
