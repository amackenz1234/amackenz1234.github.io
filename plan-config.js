// appcompiler.ai Cloud Mac monthly plan.
//
// Leave checkoutEndpoint empty to use the built-in demo subscribe
// (activates the plan in this browser). Point it at serverless/nativ-plan.mjs
// for a real Stripe Checkout Session (mode=subscription).
window.NATIV_PLAN_CONFIG = {
  // Local mock: "http://127.0.0.1:8789"
  // Deployed:  "https://nativ-cloud-plan.<you>.workers.dev"
  checkoutEndpoint: "",
  // Test-mode Price on Andrew's Stripe sandbox (appcompiler.ai Cloud Mac, $29/month).
  priceId: "price_1UDyrEAZ8aLPU3hFOHtMe7zm",
  amount: 2900,
  currency: "usd",
  interval: "month",
  name: "Cloud Mac"
};
