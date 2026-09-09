// Payment configuration for the Electro Cycles storefront.
//
// The checkout works out of the box in DEMO mode (no real charges) using the
// Stripe test card 4242 4242 4242 4242.
//
// To switch to LIVE Stripe Checkout (no backend required, client-only):
//   1. Set stripePublishableKey to your key (pk_live_... or pk_test_...).
//   2. Create a Stripe Price for each product and map its SKU -> price ID below.
// When both are present for every item in the cart, checkout redirects to
// Stripe's hosted, PCI-compliant payment page instead of the demo form.
//
// Klarna: enable Klarna in your Stripe Dashboard (Settings > Payment methods)
// and it appears automatically on the Stripe Checkout page. The built-in demo
// checkout also offers a simulated Klarna "Pay in 4" option.
window.PAYMENTS_CONFIG = {
  stripePublishableKey: "",
  prices: {
    // "EC-BANDIT": "price_123",
    // "STG25001": "price_456",
  },
};
