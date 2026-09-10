# appcompiler.ai

Build native iOS apps with AI — cloud Xcode compiler and App Store Connect submit demo for GitHub Pages.

## What’s in this repo

- **appcompiler.ai** (this GitHub Pages site): prompt → SwiftUI project → cloud Apple Silicon Mac (Xcode) → signed IPA on a monthly plan → App Store Connect
- Native iOS CI sample: [`ios/Faraday`](ios/Faraday)
- Full Cloud Mac CI: [`.github/workflows/ios.yml`](.github/workflows/ios.yml) runs full macOS 27 RC (`launchd` pid 1) on GitHub-hosted `xcode-27`, then Xcode 27, then packages a signed `.ipa` when Apple signing secrets are present

Apple Developer linking opens [App Store Connect](https://appstoreconnect.apple.com/). The site never collects an Apple password.

## Run the virtual machine from Windows

The Cloud Mac is a GitHub-hosted `xcode-27` VM (full macOS 27 RC on Apple Silicon). Start it from a Windows PC in the browser with **Run virtual machine on Windows**, or:

```powershell
powershell -File scripts/run-cloud-mac.ps1
```

That opens the site with `?client=windows` and, if `NATIV_MAC_ENDPOINT` is set, POSTs `/vm`. macOS does not run in Hyper-V — the VM stays in the cloud.
