import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSubscriptionParams,
  planFromSession,
  createPlanCheckout,
  readPlanSession,
} from "./nativ-plan.mjs";

test("builds a subscription Checkout Session without payment_method_types or automatic_tax", () => {
  const p = buildSubscriptionParams({
    priceId: "price_1UDyrEAZ8aLPU3hFOHtMe7zm",
    successUrl: "https://example.com/?plan=success&session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://example.com/?plan=cancel",
    integrationIdentifier: "nativmac_abcdefgh",
  });
  assert.equal(p.get("mode"), "subscription");
  assert.equal(p.get("line_items[0][price]"), "price_1UDyrEAZ8aLPU3hFOHtMe7zm");
  assert.equal(p.get("line_items[0][quantity]"), "1");
  assert.equal(p.get("integration_identifier"), "nativmac_abcdefgh");
  assert.equal(p.get("automatic_tax[enabled]"), null);
  assert.equal(p.get("payment_method_types[0]"), null);
  assert.equal(p.get("metadata[nativ_plan]"), "cloud_mac_monthly");
});

test("rejects a missing price id", () => {
  assert.throws(
    () =>
      buildSubscriptionParams({
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/no",
      }),
    /PLAN_PRICE_ID/
  );
});

test("planFromSession is active only for a completed subscription", () => {
  assert.equal(
    planFromSession({
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      subscription: "sub_123",
      id: "cs_test",
    }).active,
    true
  );
  assert.equal(
    planFromSession({
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      subscription: null,
    }).active,
    false
  );
});

test("createPlanCheckout demos without a Stripe key", async () => {
  const out = await createPlanCheckout(
    { MOCK_PLAN: "1" },
    { origin: "https://example.com" }
  );
  assert.equal(out.ok, true);
  assert.match(out.url, /plan=success/);
});

test("readPlanSession demos without a Stripe key", async () => {
  const out = await readPlanSession({ MOCK_PLAN: "1" }, "cs_test_123");
  assert.equal(out.ok, true);
  assert.equal(out.active, true);
});
