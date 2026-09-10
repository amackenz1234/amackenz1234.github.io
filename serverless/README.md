# Faraday shop checkout + Nativ Cloud Mac plan

GitHub Pages is static, so real (multi-item) purchases use a tiny serverless
function that creates a [Stripe Checkout Session](https://stripe.com/docs/api/checkout/sessions)
and returns its hosted URL. The browser posts only `{ sku, qty }` items; prices
are resolved server-side from `PRICE_MAP`, so amounts can't be tampered with.

## What you provide

- A Stripe account.
- `STRIPE_SECRET_KEY` — your secret key (`sk_live_…` or `sk_test_…`). Keep it secret.
- `PRICE_MAP` — JSON mapping each product SKU to a Stripe Price ID, e.g.
  `{"FD-BANDIT":"price_123","STG25001":"price_456"}`.
- Optional: `TAX_RATE_ID` (a Stripe Tax Rate) — otherwise Stripe Automatic Tax is used.
- Optional: `SUCCESS_URL`, `CANCEL_URL`, `ALLOW_ORIGIN` (defaults to `*`).

## Deploy (Cloudflare Workers — free tier)

```bash
npm i -g wrangler
wrangler init faraday-checkout           # or add to an existing project
# put stripe-checkout.mjs as the worker module entry
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put PRICE_MAP            # paste the JSON map
wrangler deploy
```

Enable **Card**, **Apple Pay**, and **Klarna** in your Stripe Dashboard
(Settings → Payment methods) — they then appear automatically on the Checkout page.

## Wire it up

Set the deployed URL in [`../shop/payments-config.js`](../shop/payments-config.js):

```js
window.PAYMENTS_CONFIG = { checkoutEndpoint: "https://faraday-checkout.<you>.workers.dev" };
```

Once set, the shop's "Checkout" button redirects to Stripe's hosted, PCI-compliant
page and charges real cards. Without it, the built-in demo checkout is used.

## Other runtimes

`buildSessionParams(items, priceMap, opts)` is exported for Vercel/Netlify Node
functions — call it, POST the params to `https://api.stripe.com/v1/checkout/sessions`
with `Authorization: Bearer <STRIPE_SECRET_KEY>`, and return `{ url }`.

## Apple account SMS verification

Nativ’s GitHub Pages site uses a **built-in browser OTP** by default
(`sms-otp.js` + empty `smsEndpoint` in `auth-config.js`), so linking is
always configured without a backend. For real carrier SMS, deploy the worker
below and set `smsEndpoint`.

Nativ can text a real 6-digit code to your phone when linking an Apple Developer
account. The worker is [`apple-sms.mjs`](./apple-sms.mjs).

**SMS is sent over a plain HTTP API — Twilio is not used.** The default provider
shape is [Telnyx](https://developers.telnyx.com/docs/messaging/messages); set
`SMS_PROVIDER=generic` for any webhook that accepts JSON `{ to, from, text/body }`.

### Secrets

- `TRUSTED_PHONE` — your number in E.164 (`+1…`). Codes are only sent here.
- `OTP_SECRET` — random string used to HMAC-sign verification tokens.
- `SMS_API_KEY` — Bearer token for your SMS provider.
- `SMS_FROM` — sender number (E.164) or approved sender id.
- Optional: `SMS_API_URL` (defaults to Telnyx `https://api.telnyx.com/v2/messages`),
  `SMS_PROVIDER` (`telnyx` | `generic`), `ALLOW_ORIGIN`, `MOCK_SMS=1` (skip the
  API and log the code), `INCLUDE_CODE=1` (echo the code in JSON when mocking),
  `ALLOW_REQUEST_PHONE=1` (allow the browser to supply the destination — local/dev).

### Local mock (no SMS provider)

```bash
TRUSTED_PHONE=+15551234567 OTP_SECRET=dev MOCK_SMS=1 INCLUDE_CODE=1 \
  node serverless/apple-sms-local.mjs
```

Point [`../auth-config.js`](../auth-config.js) at it:

```js
window.NATIV_AUTH_CONFIG = {
  smsEndpoint: "http://127.0.0.1:8787",
  phone: "+15551234567"
};
```

### Deploy (Cloudflare Worker) with Telnyx

```bash
wrangler secret put TRUSTED_PHONE
wrangler secret put OTP_SECRET
wrangler secret put SMS_API_KEY
wrangler secret put SMS_FROM
# optional: wrangler secret put SMS_API_URL
# optional: wrangler secret put SMS_PROVIDER   # telnyx | generic
# entry = apple-sms.mjs
wrangler deploy
```

Then set `smsEndpoint` in `auth-config.js` to the worker URL. Leave `phone` empty
when `TRUSTED_PHONE` is configured on the server — the text always goes to your number.

## Nativ Cloud Mac (Apple Silicon + Xcode)

Nativ compiles on a **full cloud Mac** — a GitHub-hosted `xcode-27`
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

## Nativ Cloud Mac monthly plan

Signed IPA compiles are unlocked by a **$29/month** Stripe subscription
(Product `Nativ Cloud Mac`, Price `price_1UDyrEAZ8aLPU3hFOHtMe7zm` on the
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
