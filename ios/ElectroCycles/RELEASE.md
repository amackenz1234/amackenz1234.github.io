# Uploading to App Store Connect

The [`iOS Upload to App Store Connect`](../../.github/workflows/ios-release.yml) workflow
archives the app with automatic (cloud) signing and uploads it to App Store Connect on a
free GitHub-hosted macOS runner. It runs **manually** (Actions → run workflow) because it
submits a real build to your Apple account.

## One-time prerequisites (in your Apple account)

1. **Apple Developer Program** membership (paid).
2. **Register the bundle ID** `ca.electrocycles.app` (Certificates, Identifiers & Profiles → Identifiers).
3. **Create the app record** in App Store Connect for that bundle ID (Apps → +).
4. **App Store Connect API key** with the **App Manager** role
   (Users and Access → Integrations → App Store Connect API → generate). Download the
   `.p8` (only offered once) and note the **Key ID** and **Issuer ID**.
5. Note your **Team ID** (Membership).

## Repository secrets

Add these under **Settings → Secrets and variables → Actions → New repository secret**
(encrypted; never commit them):

| Secret | Value |
| --- | --- |
| `ASC_KEY_ID` | App Store Connect API **Key ID** |
| `ASC_ISSUER_ID` | App Store Connect API **Issuer ID** |
| `ASC_API_KEY_P8` | The full contents of the `AuthKey_XXXX.p8` file |
| `APPLE_TEAM_ID` | Your 10-character Apple **Team ID** |

## Run it

Actions → **iOS Upload to App Store Connect** → **Run workflow**. Optionally set a
`build_number` (must be higher than the last uploaded build). The build then appears in
App Store Connect → your app → TestFlight/Builds after processing.

## Notes

- Signing uses `-allowProvisioningUpdates` with the API key, so Xcode manages the
  distribution certificate and provisioning profile automatically — no `.p12` needed.
- The API key `.p8` is written to the runner only for the job and deleted afterward.
- To ship real releases, bump `MARKETING_VERSION` / build number as usual.
