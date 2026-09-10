// Payment configuration for the Electro Cycles storefront.
//
// The checkout works out of the box in DEMO mode (no real charges) using the
// Stripe test card 4242 4242 4242 4242.
//
// === Enable REAL purchases ===
//
// Option A (recommended for a multi-item cart) — server-side Stripe Checkout:
//   1. Deploy the serverless function in ../serverless/ (see serverless/README.md)
//      with your Stripe SECRET key and a SKU -> Price ID map.
//   2. Set checkoutEndpoint below to that function's public URL.
//   When set, "Checkout" redirects to Stripe's hosted, PCI-compliant page and
//   charges real money. Card, Apple Pay, and Klarna are enabled from your
//   Stripe Dashboard and appear automatically there.
//
// Option B (no backend, if your Stripe account supports client-only Checkout):
//   Set stripePublishableKey and a per-SKU `prices` map. Checkout then uses
//   Stripe.js redirectToCheckout directly.
window.PAYMENTS_CONFIG = {
  // Option A: URL of your deployed Checkout Session function (leave empty to disable).
  checkoutEndpoint: "",

  // Option B: client-only Stripe Checkout.
  stripePublishableKey: "",
  prices: {
    // "EC-BANDIT": "price_123",
    // "STG25001": "price_456",
  },
};
