import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");
const productsPath = join(repoRoot, "shop/products.js");

function loadProducts() {
  const raw = readFileSync(productsPath, "utf8");
  const match = raw.match(/window\.PRODUCTS\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/);
  if (!match) {
    throw new Error(`Could not parse PRODUCTS from ${productsPath}`);
  }
  return JSON.parse(match[1]);
}

const PRODUCTS = loadProducts();

function money(n) {
  return `C$${Number(n).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function summarize(product) {
  return {
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    price_display: money(product.price),
    qty: product.qty,
    in_stock: product.qty > 0,
    description: product.description,
    image: product.image || null,
  };
}

export function categories() {
  return [...new Set(PRODUCTS.map((p) => p.category))].sort();
}

export function listProducts({ category, inStockOnly = false, limit = 25 } = {}) {
  let items = PRODUCTS;
  if (category) {
    const needle = category.toLowerCase();
    items = items.filter((p) => p.category.toLowerCase() === needle);
  }
  if (inStockOnly) {
    items = items.filter((p) => p.qty > 0);
  }
  return items.slice(0, limit).map(summarize);
}

export function searchProducts({
  query,
  category,
  inStockOnly = false,
  limit = 25,
} = {}) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  let items = PRODUCTS;
  if (category) {
    const needle = category.toLowerCase();
    items = items.filter((p) => p.category.toLowerCase() === needle);
  }
  if (inStockOnly) {
    items = items.filter((p) => p.qty > 0);
  }
  if (q) {
    items = items.filter((p) =>
      [p.sku, p.name, p.category, p.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  return items.slice(0, limit).map(summarize);
}

export function getProduct(sku) {
  const needle = String(sku || "")
    .trim()
    .toLowerCase();
  const product = PRODUCTS.find((p) => p.sku.toLowerCase() === needle);
  return product ? summarize(product) : null;
}

export function getShopInfo() {
  return {
    name: "Faraday",
    region: "Ontario",
    phone: "905-308-5392",
    phone_tel: "9053085392",
    email: "hello@faradayrides.ca",
    gst_hst: "729028506TZ0001",
    currency: "CAD",
    product_count: PRODUCTS.length,
    categories: categories(),
  };
}
