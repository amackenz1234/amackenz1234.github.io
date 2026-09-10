# Build appcompiler-ai-setup.exe on a Windows machine (or in windows-latest CI).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
bash ./build.sh
if ($LASTEXITCODE -ne 0) { throw "build.sh failed" }
Write-Host "Installer: $PSScriptRoot\appcompiler-ai-setup.exe"
