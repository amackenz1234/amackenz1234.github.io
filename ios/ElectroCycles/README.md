# Electro Cycles iOS

Native SwiftUI catalog app for the Electro Cycles Ontario shop.

## Requirements

- macOS 27 RC with Xcode 27+
- iOS 17.0+ simulator or device

## Open & run

1. Open `ElectroCycles.xcodeproj` in Xcode.
2. Select an iPhone simulator (or your device).
3. Set your Development Team under **Signing & Capabilities** if needed.
4. Press Run (⌘R).

## Features

- **Shop** tab with full-bleed hero, category filters, and search
- Product grid with in-stock / special-order badges
- Push navigation to product detail with ask/email, call, and share
- **Contact** tab with phone, email, and GST/HST details
- Same inventory as the website (`products.js` → `Catalog.swift`)

## Bundle ID

`ca.electrocycles.app`

## Continuous integration

Every push and pull request that touches `ios/` builds the app on a cloud
full macOS 27 RC Apple Silicon Mac (GitHub-hosted `xcode-27` with Xcode 27) via
[`.github/workflows/ios.yml`](../../.github/workflows/ios.yml).
The workflow runs `xcodebuild` against the shared `ElectroCycles` scheme for an iOS
Simulator destination with code signing disabled, so it needs no Apple developer account.

It also archives the app for a device (unsigned) and packages it into an
`ElectroCycles-unsigned.ipa`, uploaded as the `ElectroCycles-unsigned-ipa` workflow
artifact. Because it is unsigned, it is meant for inspection or re-signing — installing
on a physical device still requires signing with your own Apple account.
