// appcompiler.ai Cloud Mac monthly plan — Stripe Checkout in subscription mode.
//
// One Product / one Price (flat monthly). Hosted Checkout collects payment.
// Do not pass payment_method_types (dynamic payment methods).
// Do not enable automatic_tax here unless a Stripe Tax registration is active.
//
// Env:
//   STRIPE_SECRET_KEY — restricted key preferred (rk_…)
//   PLAN_PRICE_ID     — Stripe Price id (recurring monthly)
//   SITE_ORIGIN       — used to build success/cancel URLs
//   SUCCESS_URL / CANCEL_URL — optional overrides
//   ALLOW_ORIGIN      — CORS origin (default *)
//   MOCK_PLAN=1       — return a local success URL (no Stripe call)

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";

function randomSuffix(n) {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < n; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

export function buildSubscriptionParams(opts) {
  opts = opts || {};
  const priceId = String(opts.priceId || "").trim();
  if (!priceId) throw new Error("Missing PLAN_PRICE_ID");
  if (!opts.successUrl) throw new Error("Missing success URL");
  if (!opts.cancelUrl) throw new Error("Missing cancel URL");

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", opts.successUrl);
  params.set("cancel_url", opts.cancelUrl);
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[nativ_plan]", "cloud_mac_monthly");
  params.set("subscription_data[metadata][nativ_plan]", "cloud_mac_monthly");
  params.set(
    "integration_identifier",
    opts.integrationIdentifier || "nativmac_" + randomSuffix(8)
  );
  return params;
}

export function planFromSession(session) {
  session = session || {};
  const status = String(session.status || "");
  const payment = String(session.payment_status || "");
  const mode = String(session.mode || "");
  const subscription = session.subscription;
  const active =
    mode === "subscription" &&
    (status === "complete" || payment === "paid" || payment === "no_payment_required") &&
    !!subscription;
  return {
    ok: true,
    active,
    status,
    payment_status: payment,
    session_id: session.id || "",
    subscription_id: typeof subscription === "string" ? subscription : (subscription && subscription.id) || "",
    customer_id: typeof session.customer === "string" ? session.customer : "",
    plan: "cloud_mac_monthly",
  };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function withCors(resp, origin) {
  resp.headers.set("Access-Control-Allow-Origin", origin || "*");
  resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return resp;
}

export async function createPlanCheckout(env, body, fetchFn) {
  env = env || {};
  body = body || {};
  const origin = String(body.origin || env.SITE_ORIGIN || "").replace(/\/$/, "");
  const successUrl =
    env.SUCCESS_URL ||
    origin + "/?plan=success&session_id={CHECKOUT_SESSION_ID}";
  const cancelUrl = env.CANCEL_URL || origin + "/?plan=cancel";

  if (env.MOCK_PLAN === "1" || !env.STRIPE_SECRET_KEY) {
    return {
      ok: true,
      demo: !env.STRIPE_SECRET_KEY,
      url: origin + "/?plan=success&demo=1",
    };
  }

  const params = buildSubscriptionParams({
    priceId: env.PLAN_PRICE_ID,
    successUrl,
    cancelUrl,
  });

  const res = await (fetchFn || fetch)(STRIPE_API, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      error: session.error ? session.error.message : "Stripe error",
    };
  }
  return { ok: true, id: session.id, url: session.url };
}

export async function readPlanSession(env, sessionId, fetchFn) {
  env = env || {};
  const id = String(sessionId || "").trim();
  if (!id) return { ok: false, error: "Missing session_id" };
  if (env.MOCK_PLAN === "1" || !env.STRIPE_SECRET_KEY) {
    return {
      ok: true,
      active: true,
      demo: true,
      session_id: id,
      plan: "cloud_mac_monthly",
    };
  }
  const res = await (fetchFn || fetch)(STRIPE_API + "/" + encodeURIComponent(id), {
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
  });
  const session = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      error: session.error ? session.error.message : "Stripe error",
    };
  }
  return planFromSession(session);
}

export default {
  async fetch(request, env) {
    const origin = (env && env.ALLOW_ORIGIN) || "*";
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), origin);
    }
    const url = new URL(request.url);
    const route = url.pathname.replace(/\/$/, "") || "/";
    try {
      if (request.method === "GET" && (route === "/" || route === "/health")) {
        return withCors(
          json({
            ok: true,
            plan: "cloud_mac_monthly",
            amount: 2900,
            currency: "usd",
            interval: "month",
          }),
          origin
        );
      }
      if (request.method === "POST" && (route === "/" || route === "/subscribe")) {
        const body = await request.json().catch(() => ({}));
        const out = await createPlanCheckout(env || {}, body);
        return withCors(json(out, out.ok ? 200 : 400), origin);
      }
      if (request.method === "GET" && route === "/session") {
        const out = await readPlanSession(env || {}, url.searchParams.get("session_id"));
        return withCors(json(out, out.ok ? 200 : 400), origin);
      }
      return withCors(json({ ok: false, error: "Not found" }, 404), origin);
    } catch (err) {
      return withCors(json({ ok: false, error: err.message || "Server error" }, 500), origin);
    }
  },
};
