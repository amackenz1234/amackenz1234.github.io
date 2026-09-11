# Uploading Faraday to TestFlight

The [`iOS Upload to TestFlight`](../../.github/workflows/ios-release.yml) workflow signs
Faraday for the App Store and uploads it to App Store Connect on the cloud Mac. Every
uploaded build appears in **TestFlight** after Apple finishes processing. It runs
**manually** (Actions → run workflow) because it submits a real build to your Apple account.

Faraday declares `ITSAppUsesNonExemptEncryption = false` in its `Info.plist`, so uploaded
builds skip the "Missing Compliance" step and are immediately available to internal
TestFlight testers. (External testers still require Beta App Review, as Apple requires.)

## One-time prerequisites (your Apple account)

1. **Apple Developer Program** membership.
2. **Register the bundle ID** `ca.faraday.rides` and **create the app record** in
   App Store Connect.
3. **Distribution signing:** an Apple Distribution certificate (`.p12`) and an
   **App Store** provisioning profile for `ca.faraday.rides`.
4. **App Store Connect API key** (App Manager role): note the **Key ID** and
   **Issuer ID**, download the `.p8` (offered once).

## Repository secrets

Add these under **Settings → Secrets and variables → Actions** (encrypted; never commit):

| Secret | Value |
| --- | --- |
| `IOS_CERTIFICATE_BASE64` | base64 of your distribution `.p12` |
| `IOS_CERTIFICATE_PASSWORD` | password for the `.p12` |
| `IOS_PROVISION_PROFILE_BASE64` | base64 of the App Store `.mobileprovision` |
| `IOS_TEAM_ID` | your 10-character Apple Team ID |
| `IOS_BUNDLE_ID` | `ca.faraday.rides` (optional; defaults to this) |
| `IOS_CODE_SIGN_IDENTITY` | e.g. `Apple Distribution` (optional) |
| `ASC_KEY_ID` | App Store Connect API Key ID |
| `ASC_ISSUER_ID` | App Store Connect API Issuer ID |
| `ASC_API_KEY_P8` | full contents of `AuthKey_XXXX.p8` |

## Run it

Actions → **iOS Upload to TestFlight** → **Run workflow**. Optionally set a `build_number`
(must be higher than the last uploaded build). After processing, the build shows up in
App Store Connect → Faraday → TestFlight for your internal testers.
