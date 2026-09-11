# Uploading Faraday to TestFlight

The [`iOS Upload to TestFlight`](../../.github/workflows/ios-release.yml) workflow signs
Faraday and uploads it to App Store Connect on the cloud Mac (macOS 27 / Xcode 27). Every
uploaded build appears in **TestFlight** after Apple finishes processing. It runs
**manually** (Actions → run workflow) because it submits a real build to your Apple account.

Signing and upload both use your **App Store Connect API key** (`-allowProvisioningUpdates`),
so Xcode creates the distribution certificate and provisioning profile automatically — no
`.p12` or `.mobileprovision` to manage.

Faraday declares `ITSAppUsesNonExemptEncryption = false` in its `Info.plist`, so uploaded
builds skip the "Missing Compliance" gate and are immediately available to internal
TestFlight testers. (External testers still require Beta App Review, as Apple requires.)

## One-time prerequisites (your Apple account)

1. **Apple Developer Program** membership.
2. **Register the bundle ID** `ca.faraday.rides` and **create the app record** in
   App Store Connect.
3. **App Store Connect API key** with the **Admin** or **App Manager** role
   (Users and Access → Integrations → App Store Connect API → generate). Download the
   `.p8` (offered once) and note the **Key ID** and **Issuer ID**. Admin/App Manager is
   needed so the key can create signing certificates automatically.
4. Note your **Team ID** (Membership).

## Repository secrets

Add these under **Settings → Secrets and variables → Actions** (encrypted; never commit):

| Secret | Value |
| --- | --- |
| `ASC_KEY_ID` | App Store Connect API **Key ID** |
| `ASC_ISSUER_ID` | App Store Connect API **Issuer ID** |
| `ASC_API_KEY_P8` | full contents of the `AuthKey_XXXX.p8` file |
| `APPLE_TEAM_ID` | your 10-character Apple **Team ID** |

## Run it

Actions → **iOS Upload to TestFlight** → **Run workflow**. Optionally set a `build_number`
(must be higher than the last uploaded build). After processing, the build shows up in
App Store Connect → Faraday → TestFlight for your internal testers.
