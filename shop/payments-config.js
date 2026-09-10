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
//
// Option C (no backend, no keys shared) — Stripe Payment Links:
//   Create a Payment Link per product in the Stripe Dashboard (Payment Links)
//   and paste each product's URL below under `paymentLinks`. Products with a
//   link get a real "Buy now" button that opens Stripe's hosted checkout.
window.PAYMENTS_CONFIG = {
  // Option A: URL of your deployed Checkout Session function (leave empty to disable).
  checkoutEndpoint: "",

  // Option B: client-only Stripe Checkout.
  stripePublishableKey: "",
  prices: {
    // "EC-BANDIT": "price_123",
    // "STG25001": "price_456",
  },

  // Option C: Stripe Payment Link URL per SKU (https://buy.stripe.com/...).
  paymentLinks: {
    // "EC-BANDIT": "https://buy.stripe.com/xxxxxxxx",
    // "STG25001": "https://buy.stripe.com/xxxxxxxx",
    // "EZN25001": "https://buy.stripe.com/xxxxxxxx",
    // "SRR25001": "https://buy.stripe.com/xxxxxxxx",
    // "VLR24001": "https://buy.stripe.com/xxxxxxxx",
    // "ETR24001": "https://buy.stripe.com/xxxxxxxx",
    // "ATM24001": "https://buy.stripe.com/xxxxxxxx",
    // "ATM25001": "https://buy.stripe.com/xxxxxxxx",
    // "EC-COVER": "https://buy.stripe.com/xxxxxxxx",
    // "EC-CHAIN": "https://buy.stripe.com/xxxxxxxx",
    // "EC-HELMET": "https://buy.stripe.com/xxxxxxxx",
  },
};
