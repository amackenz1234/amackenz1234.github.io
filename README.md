# appcompiler.ai

Build native iOS apps with AI — cloud Xcode compiler and App Store Connect submit demo for GitHub Pages.

## What’s in this repo

- **appcompiler.ai** (this GitHub Pages site): prompt → SwiftUI project → cloud Apple Silicon Mac (Xcode) → signed IPA on a monthly plan → App Store Connect
- Native iOS CI sample: [`ios/Faraday`](ios/Faraday)
- Full Cloud Mac CI: [`.github/workflows/ios.yml`](.github/workflows/ios.yml) runs full macOS 27 RC (`launchd` pid 1) on GitHub-hosted `xcode-27`, then Xcode 27, then packages a signed `.ipa` when Apple signing secrets are present

Apple Developer linking opens [App Store Connect](https://appstoreconnect.apple.com/). The site never collects an Apple password.
