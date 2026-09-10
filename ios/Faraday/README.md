# Faraday iOS

Native SwiftUI catalog app for Faraday — Ontario electric rides.

## Requirements

- macOS 27 RC with Xcode 27+
- iOS 17.0+ simulator or device

## Open & run

1. Open `Faraday.xcodeproj` in Xcode.
2. Select an iPhone simulator (or your device).
3. Set your Development Team under **Signing & Capabilities** if needed.
4. Press Run (⌘R).

## Features

- **Shop** tab with full-bleed hero, category filters, and search
- Product grid with in-stock / special-order badges
- Push navigation to product detail with ask/email, call, and share
- **Contact** tab with phone, email, and GST/HST details
- Same inventory as the website (`shop/products.js` → bundled `products.json`)

## Bundle ID

`ca.faraday.rides`

## Continuous integration

Every push and pull request that touches `ios/` builds on a GitHub-hosted
`xcode-27` runner: full macOS 27 RC (`launchd` pid 1) and Xcode 27 via
[`.github/workflows/ios.yml`](../../.github/workflows/ios.yml).

The workflow:

1. Builds Faraday for the iOS Simulator.
2. Archives for device.
3. Packages a **signed** `.ipa` when Apple signing secrets are present
   (`IOS_CERTIFICATE_BASE64`, `IOS_CERTIFICATE_PASSWORD`,
   `IOS_PROVISION_PROFILE_BASE64`, `IOS_TEAM_ID`). The monthly Nativ Cloud Mac
   plan unlocks this path from the studio.
4. Falls back to `Faraday-unsigned.ipa` when those secrets are missing, so CI
   still produces an inspectable package.
