#!/usr/bin/env bash
# Boot-check: the cloud Mac must be a *running* full macOS, not files on disk.
# launchd is pid 1, the system domain is live, and core OS daemons are up.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Identity + Xcode first (Apple Silicon, ProductName macOS, version 27, Xcode 27).
bash "${ROOT}/scripts/require-cloud-xcode.sh"

PID1="$(ps -p 1 -o comm= 2>/dev/null | tr -d '[:space:]')"
echo "pid 1: ${PID1:-unknown}"
if [[ "${PID1}" != "launchd" ]]; then
  echo "::error::Full macOS is not running (pid 1 is ${PID1:-unknown}, expected launchd)"
  exit 1
fi

if ! launchctl print system >/dev/null 2>&1; then
  echo "::error::launchd system domain is not running"
  exit 1
fi

# Bring the user launchd domain up if this session has not kicked it yet.
launchctl kickstart -kp system/com.apple.notifyd >/dev/null 2>&1 || true
launchctl kickstart -kp system/com.apple.configd >/dev/null 2>&1 || true

RUNNING=0
for svc in \
  system/com.apple.notifyd \
  system/com.apple.configd \
  system/com.apple.logd \
  system/com.apple.diskarbitrationd
do
  if launchctl print "${svc}" >/dev/null 2>&1; then
    echo "running: ${svc}"
    RUNNING=$((RUNNING + 1))
  else
    echo "missing: ${svc}"
  fi
done

if [[ "${RUNNING}" -lt 2 ]]; then
  echo "::error::Too few core macOS daemons are running (${RUNNING})"
  exit 1
fi

NPROC="$(ps -ax | wc -l | tr -d '[:space:]')"
echo "process count: ${NPROC}"
if [[ "${NPROC}" -lt 40 ]]; then
  echo "::error::Too few processes (${NPROC}) for a running full macOS"
  exit 1
fi

echo "---- Running full macOS ----"
sw_vers
uname -a
echo "launchd system domain: live"
if command -v system_profiler >/dev/null 2>&1; then
  system_profiler SPSoftwareDataType -detailLevel mini || true
fi
echo "----------------------------"
echo "Full macOS 27 RC is running (launchd pid 1) on the Apple Silicon cloud Mac"
