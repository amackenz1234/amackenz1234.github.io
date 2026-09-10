# Nativ

Build native iOS apps with AI — cloud Xcode compiler and App Store Connect submit demo for GitHub Pages.

## What’s in this repo

- **Nativ** (this GitHub Pages site): prompt → SwiftUI project → cloud Apple Silicon Mac (Xcode) → App Store Connect
- Electro Cycles sample shop: [`shop/`](shop/) (previous live site)
- Native iOS catalog app: [`ios/ElectroCycles`](ios/ElectroCycles)
- Catalog MCP server: [`mcp/electro-cycles`](mcp/electro-cycles)
- Full Cloud Mac CI: [`.github/workflows/ios.yml`](.github/workflows/ios.yml) runs full macOS 27 RC (`launchd` pid 1) on GitHub-hosted `xcode-27`, then Xcode 27
