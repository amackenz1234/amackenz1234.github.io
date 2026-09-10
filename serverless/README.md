# Electro Cycles — real Stripe Checkout function

GitHub Pages is static, so real (multi-item) purchases use a tiny serverless
function that creates a [Stripe Checkout Session](https://stripe.com/docs/api/checkout/sessions)
and returns its hosted URL. The browser posts only `{ sku, qty }` items; prices
are resolved server-side from `PRICE_MAP`, so amounts can't be tampered with.

## What you provide

- A Stripe account.
- `STRIPE_SECRET_KEY` — your secret key (`sk_live_…` or `sk_test_…`). Keep it secret.
- `PRICE_MAP` — JSON mapping each product SKU to a Stripe Price ID, e.g.
  `{"EC-BANDIT":"price_123","STG25001":"price_456"}`.
- Optional: `TAX_RATE_ID` (a Stripe Tax Rate) — otherwise Stripe Automatic Tax is used.
- Optional: `SUCCESS_URL`, `CANCEL_URL`, `ALLOW_ORIGIN` (defaults to `*`).

## Deploy (Cloudflare Workers — free tier)

```bash
npm i -g wrangler
wrangler init electro-checkout           # or add to an existing project
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
window.PAYMENTS_CONFIG = { checkoutEndpoint: "https://electro-checkout.<you>.workers.dev" };
```

Once set, the shop's "Checkout" button redirects to Stripe's hosted, PCI-compliant
page and charges real cards. Without it, the built-in demo checkout is used.

## Other runtimes

`buildSessionParams(items, priceMap, opts)` is exported for Vercel/Netlify Node
functions — call it, POST the params to `https://api.stripe.com/v1/checkout/sessions`
with `Authorization: Bearer <STRIPE_SECRET_KEY>`, and return `{ url }`.
