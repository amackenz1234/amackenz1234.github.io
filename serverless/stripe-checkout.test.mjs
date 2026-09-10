import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionParams } from "./stripe-checkout.mjs";

const PRICE_MAP = { "EC-BANDIT": "price_bandit", "EC-HELMET": "price_helmet" };
const OPTS = {
  successUrl: "https://example.com/shop/?checkout=success",
  cancelUrl: "https://example.com/shop/?checkout=cancel",
};

test("builds line items from cart with server-side prices", () => {
  const p = buildSessionParams(
    [{ sku: "EC-BANDIT", qty: 2 }, { sku: "EC-HELMET", qty: 1 }],
    PRICE_MAP,
    OPTS
  );
  assert.equal(p.get("mode"), "payment");
  assert.equal(p.get("success_url"), OPTS.successUrl);
  assert.equal(p.get("line_items[0][price]"), "price_bandit");
  assert.equal(p.get("line_items[0][quantity]"), "2");
  assert.equal(p.get("line_items[1][price]"), "price_helmet");
  assert.equal(p.get("automatic_tax[enabled]"), "true");
});

test("uses a fixed tax rate when provided and disables automatic tax", () => {
  const p = buildSessionParams([{ sku: "EC-BANDIT", qty: 1 }], PRICE_MAP, {
    ...OPTS,
    taxRateId: "txr_123",
  });
  assert.equal(p.get("automatic_tax[enabled]"), "false");
  assert.equal(p.get("line_items[0][tax_rates][0]"), "txr_123");
});

test("clamps quantity to a sane range", () => {
  const p = buildSessionParams([{ sku: "EC-BANDIT", qty: 9999 }], PRICE_MAP, OPTS);
  assert.equal(p.get("line_items[0][quantity]"), "100");
  const p2 = buildSessionParams([{ sku: "EC-BANDIT", qty: 0 }], PRICE_MAP, OPTS);
  assert.equal(p2.get("line_items[0][quantity]"), "1");
});

test("rejects an unknown SKU", () => {
  assert.throws(() => buildSessionParams([{ sku: "NOPE", qty: 1 }], PRICE_MAP, OPTS), /Unknown SKU/);
});

test("rejects an empty cart", () => {
  assert.throws(() => buildSessionParams([], PRICE_MAP, OPTS), /Empty cart/);
});
