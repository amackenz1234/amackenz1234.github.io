# Run the appcompiler.ai Cloud Mac virtual machine from Windows.
#
# The Mac VM is hosted in the cloud on Apple Silicon (GitHub-hosted xcode-27).
# This script does not install macOS in Hyper-V, VirtualBox, or WSL.
#
# Usage:
#   powershell -File scripts/run-cloud-mac.ps1
#   powershell -File scripts/run-cloud-mac.ps1 -SiteUrl "https://amackenz1234.github.io/?client=windows"

param(
  [string]$SiteUrl = "http://127.0.0.1:8000/?client=windows",
  [string]$VmEndpoint = $env:NATIV_MAC_ENDPOINT
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Cloud Mac virtual machine from Windows..."
Write-Host "The Mac boots on Apple Silicon in the cloud (not Hyper-V)."
Write-Host "To install the desktop app, run windows\appcompiler-ai-setup.exe"

if ($VmEndpoint) {
  $uri = $VmEndpoint.TrimEnd("/") + "/vm"
  Write-Host "POST $uri"
  $body = @{ clientOs = "windows"; appName = "CloudMac" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body | ConvertTo-Json
}

Write-Host "Opening $SiteUrl"
Start-Process $SiteUrl
