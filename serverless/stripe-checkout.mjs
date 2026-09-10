// Stripe Checkout Session function for the Electro Cycles storefront.
//
// Deployable as a Cloudflare Worker (default export) — see serverless/README.md.
// The core `buildSessionParams` helper is exported for unit testing and reuse
// in other runtimes (Vercel/Netlify Node functions).
//
// Prices are resolved SERVER-SIDE from PRICE_MAP so the browser can never set
// its own amounts. Real charges require STRIPE_SECRET_KEY.

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";

// Build application/x-www-form-urlencoded params for a Stripe Checkout Session
// from a cart of { sku, qty } items and a server-side sku -> price_id map.
export function buildSessionParams(items, priceMap, opts) {
  opts = opts || {};
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Empty cart");
  }
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", opts.successUrl);
  params.set("cancel_url", opts.cancelUrl);
  // Let Stripe compute tax automatically unless a fixed tax rate is provided.
  params.set("automatic_tax[enabled]", opts.taxRateId ? "false" : "true");

  items.forEach((it, i) => {
    const price = priceMap[it.sku];
    if (!price) throw new Error("Unknown SKU: " + it.sku);
    const qty = Math.max(1, Math.min(100, parseInt(it.qty, 10) || 1));
    params.set(`line_items[${i}][price]`, price);
    params.set(`line_items[${i}][quantity]`, String(qty));
    if (opts.taxRateId) params.set(`line_items[${i}][tax_rates][0]`, opts.taxRateId);
  });

  return params;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(resp, origin) {
  resp.headers.set("Access-Control-Allow-Origin", origin || "*");
  resp.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return resp;
}

// Cloudflare Worker entrypoint.
export default {
  async fetch(request, env) {
    const allowOrigin = env.ALLOW_ORIGIN || "*";
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), allowOrigin);
    if (request.method !== "POST") return withCors(json({ error: "Method not allowed" }, 405), allowOrigin);
    if (!env.STRIPE_SECRET_KEY) return withCors(json({ error: "Server missing STRIPE_SECRET_KEY" }, 500), allowOrigin);

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return withCors(json({ error: "Invalid JSON body" }, 400), allowOrigin);
    }

    let priceMap;
    try {
      priceMap = JSON.parse(env.PRICE_MAP || "{}");
    } catch (e) {
      return withCors(json({ error: "Server PRICE_MAP is not valid JSON" }, 500), allowOrigin);
    }

    const origin = (body && body.origin) || env.SITE_ORIGIN || "";
    let params;
    try {
      params = buildSessionParams(body && body.items, priceMap, {
        successUrl: env.SUCCESS_URL || origin + "/shop/?checkout=success",
        cancelUrl: env.CANCEL_URL || origin + "/shop/?checkout=cancel",
        taxRateId: env.TAX_RATE_ID,
      });
    } catch (e) {
      return withCors(json({ error: e.message }, 400), allowOrigin);
    }

    const res = await fetch(STRIPE_API, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await res.json();
    if (!res.ok) {
      return withCors(json({ error: session.error ? session.error.message : "Stripe error" }, 400), allowOrigin);
    }
    return withCors(json({ id: session.id, url: session.url }), allowOrigin);
  },
};
