#!/usr/bin/env bash
# Cross-compile the Windows app and installer .exe files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "${ROOT}/.." && pwd)"
WEB="${ROOT}/internal/site/web"
PAYLOAD="${ROOT}/cmd/setup/payload"
DIST="${ROOT}/dist"

mkdir -p "${WEB}" "${PAYLOAD}" "${DIST}"

for f in index.html app.js styles.css icon.svg manifest.webmanifest mac-config.js plan-config.js register-sw.js sw.js; do
  cp "${REPO}/${f}" "${WEB}/${f}"
done

cd "${ROOT}"
go test ./internal/install ./internal/site

echo "Building appcompiler-ai.exe (windows/amd64)"
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags="-s -w -H windowsgui" -o "${DIST}/appcompiler-ai.exe" ./cmd/app
cp "${DIST}/appcompiler-ai.exe" "${PAYLOAD}/appcompiler-ai.exe"

echo "Building appcompiler-ai-setup.exe (windows/amd64)"
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags="-s -w -H windowsgui" -o "${DIST}/appcompiler-ai-setup.exe" ./cmd/setup
cp "${DIST}/appcompiler-ai-setup.exe" "${ROOT}/appcompiler-ai-setup.exe"

python3 - <<'PY'
import pathlib
for name in ("dist/appcompiler-ai.exe", "dist/appcompiler-ai-setup.exe", "appcompiler-ai-setup.exe"):
    p = pathlib.Path(name)
    data = p.read_bytes()[:2]
    if data != b"MZ":
        raise SystemExit(f"{p} is not a Windows PE .exe")
    print(f"PE ok {p} ({p.stat().st_size} bytes)")
PY

echo "Windows installer: ${ROOT}/appcompiler-ai-setup.exe"
