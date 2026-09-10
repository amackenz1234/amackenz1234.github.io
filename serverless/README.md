# appcompiler.ai Cloud Mac workers

GitHub Pages is static. Optional workers dispatch Cloud Mac compiles and start
the monthly plan Checkout session.

Apple Developer linking in the site opens
[App Store Connect](https://appstoreconnect.apple.com/). The browser never
collects an Apple password.

## appcompiler.ai Cloud Mac (Apple Silicon + Xcode)

appcompiler.ai compiles on a **full cloud Mac** — a GitHub-hosted `xcode-27`
VM running the complete **macOS 27 RC** operating system with Xcode 27.
You do not need a Mac on your desk.

The workflow [`.github/workflows/ios.yml`](../.github/workflows/ios.yml) selects
Xcode, then runs [`scripts/run-full-macos.sh`](../scripts/run-full-macos.sh)
(which calls [`scripts/require-cloud-xcode.sh`](../scripts/require-cloud-xcode.sh)).
The job fails unless the VM is a *running* full macOS 27 install: Darwin,
ProductName macOS, `launchd` as pid 1, live system domain, core daemons, arm64,
and Xcode 27.

### Optional dispatcher (real Actions job from the browser)

The site can POST to [`mac-xcode-worker.mjs`](./mac-xcode-worker.mjs), which
dispatches that workflow.

Secrets:

- `GITHUB_TOKEN` — PAT with `actions:write` on this repo
- `GITHUB_OWNER`, `GITHUB_REPO` — e.g. `amackenz1234` / `amackenz1234.github.io`
- Optional: `NATIV_MAC_TOKEN`, `GITHUB_WORKFLOW=ios.yml`, `GITHUB_REF=main`

Local demo (no GitHub call):

```bash
MOCK_MAC=1 node serverless/mac-xcode-local.mjs
```

Point [`../mac-config.js`](../mac-config.js) at `http://127.0.0.1:8788`.
Without an endpoint, the studio still uses the built-in Cloud Mac console.

### Run the VM from Windows

`POST /vm` (also `/start`) boots the Cloud Mac without compiling. The site
sends `{ clientOs: "windows" }` when the browser is on Windows (or
`?client=windows`). The worker dispatches `ios.yml` with `mode=vm`, which
only runs [`scripts/run-full-macos.sh`](../scripts/run-full-macos.sh).

From a Windows PC:

```powershell
$env:NATIV_MAC_ENDPOINT = "http://127.0.0.1:8788"
powershell -File scripts/run-cloud-mac.ps1
```

### Signed IPA

[`scripts/package-ipa.sh`](../scripts/package-ipa.sh) archives Faraday on the
cloud Mac. When these GitHub Actions secrets exist, it signs and exports a
`.ipa`:

- `IOS_CERTIFICATE_BASE64` — base64-encoded signing `.p12`
- `IOS_CERTIFICATE_PASSWORD` — password for that `.p12`
- `IOS_PROVISION_PROFILE_BASE64` — base64-encoded `.mobileprovision`
- `IOS_TEAM_ID` — 10-character Apple team id
- Optional: `IOS_BUNDLE_ID` (default `ca.faraday.rides`), `IOS_CODE_SIGN_IDENTITY`

Without those secrets the job still uploads `Faraday-unsigned.ipa`.

## appcompiler.ai Cloud Mac monthly plan

Signed IPA compiles are unlocked by a **$29/month** Stripe subscription
(Product `appcompiler.ai Cloud Mac`, Price `price_1UDyrEAZ8aLPU3hFOHtMe7zm` on the
test sandbox). The worker is [`nativ-plan.mjs`](./nativ-plan.mjs).

Checkout uses `mode=subscription`. It does **not** send `payment_method_types`
(dynamic payment methods) and does **not** enable `automatic_tax` until a
Stripe Tax registration is active.

Secrets:

- `STRIPE_SECRET_KEY` — restricted key preferred
- `PLAN_PRICE_ID` — `price_1UDyrEAZ8aLPU3hFOHtMe7zm`
- Optional: `SITE_ORIGIN`, `SUCCESS_URL`, `CANCEL_URL`, `ALLOW_ORIGIN`, `MOCK_PLAN=1`

```bash
MOCK_PLAN=1 node serverless/nativ-plan-local.mjs
```

Point [`../plan-config.js`](../plan-config.js) at `http://127.0.0.1:8789`.
Without an endpoint, the studio starts a demo plan in the browser.
