import assert from "node:assert/strict";
import test from "node:test";
import {
  categories,
  getProduct,
  getShopInfo,
  listProducts,
  searchProducts,
} from "../src/catalog.js";

test("categories include core shop groups", () => {
  const cats = categories();
  assert.ok(cats.includes("E-Bikes"));
  assert.ok(cats.includes("E-Scooters"));
  assert.ok(cats.includes("Mobility"));
  assert.ok(cats.includes("Accessories"));
});

test("list_products can filter in-stock items", () => {
  const items = listProducts({ inStockOnly: true, limit: 50 });
  assert.ok(items.length > 0);
  assert.ok(items.every((p) => p.in_stock));
});

test("search_products finds Bandit", () => {
  const items = searchProducts({ query: "bandit" });
  assert.equal(items[0]?.sku, "EC-BANDIT");
});

test("get_product returns SKU details", () => {
  const product = getProduct("EC-BANDIT");
  assert.equal(product.name, "Evoque Bandit");
  assert.match(product.price_display, /^C\$/);
});

test("get_shop_info has contact fields", () => {
  const info = getShopInfo();
  assert.equal(info.phone_tel, "9053085392");
  assert.equal(info.email, "info@electrocycles.ca");
  assert.ok(info.product_count >= 20);
});
