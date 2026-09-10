// Apple-account linking SMS verification for Nativ.
//
// Deployable as a Cloudflare Worker (default export) — see serverless/README.md.
// Helpers are exported for unit tests and reuse in other runtimes.
//
// Secrets (Worker env):
//   TRUSTED_PHONE   — E.164 number that receives codes (e.g. +15551234567)
//   OTP_SECRET      — HMAC secret used to sign verification tokens
//   SMS_API_URL     — HTTP SMS endpoint (default: Telnyx v2 messages)
//   SMS_API_KEY     — Bearer API key for the SMS provider
//   SMS_FROM        — Sender number / alphanumeric sender in E.164 when required
// Optional:
//   SMS_PROVIDER    — "telnyx" (default) or "generic"
//   ALLOW_ORIGIN    — CORS origin (default *)
//   MOCK_SMS        — if "1", skip the SMS API and log the code (local/dev)
//   INCLUDE_CODE    — if "1" (and MOCK_SMS), echo the code in the JSON response
//   ALLOW_REQUEST_PHONE — if "1", allow the browser to supply the destination

const encoder = new TextEncoder();
const DEFAULT_TELNYX_URL = "https://api.telnyx.com/v2/messages";

export function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (String(raw || "").trim().startsWith("+") && digits.length >= 10) return "+" + digits;
  throw new Error("TRUSTED_PHONE must be a valid E.164 phone number");
}

export function phoneLast4(e164) {
  const digits = String(e164 || "").replace(/\D/g, "");
  return digits.slice(-4);
}

export function generateCode(randomBytes) {
  // 000000–999999, always 6 digits.
  const bytes = randomBytes || crypto.getRandomValues(new Uint8Array(4));
  const n = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(n % 1000000).padStart(6, "0");
}

export async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function mintToken(code, secret, opts) {
  opts = opts || {};
  const ttlMs = opts.ttlMs || 10 * 60 * 1000;
  const now = opts.now || Date.now();
  const exp = now + ttlMs;
  const payload = code + "." + exp;
  const sig = await hmacHex(secret, payload);
  // token format: exp.sig  (code never leaves the server in the token)
  return exp + "." + sig;
}

export async function verifyToken(code, token, secret, opts) {
  opts = opts || {};
  const now = opts.now || Date.now();
  if (!/^\d{6}$/.test(String(code || ""))) return { ok: false, error: "Invalid code format" };
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return { ok: false, error: "Invalid token" };
  const exp = parseInt(parts[0], 10);
  const sig = parts[1];
  if (!exp || !sig) return { ok: false, error: "Invalid token" };
  if (now > exp) return { ok: false, error: "Code expired" };
  const expected = await hmacHex(secret, code + "." + exp);
  if (expected !== sig) return { ok: false, error: "Incorrect code" };
  return { ok: true };
}

export function buildSmsMessage(code) {
  return "Your Nativ Apple verification code is " + code + ". It expires in 10 minutes.";
}

/** Build the JSON body for Telnyx or a generic HTTP SMS webhook. */
export function buildSmsPayload(to, from, text, provider) {
  const kind = (provider || "telnyx").toLowerCase();
  if (kind === "generic") {
    return { to: to, from: from, body: text, text: text };
  }
  // Telnyx Messages API shape (default — not Twilio).
  return { from: from, to: to, text: text };
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

export async function sendViaHttpSms(env, to, text) {
  const apiKey = env.SMS_API_KEY;
  const from = env.SMS_FROM;
  const provider = (env.SMS_PROVIDER || "telnyx").toLowerCase();
  const url = env.SMS_API_URL || (provider === "telnyx" ? DEFAULT_TELNYX_URL : "");
  if (!apiKey || !from || !url) {
    throw new Error("Server missing SMS_API_KEY / SMS_FROM / SMS_API_URL");
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(buildSmsPayload(to, from, text, provider)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      (data && data.errors && data.errors[0] && data.errors[0].detail) ||
      (data && data.error && (data.error.message || data.error)) ||
      (data && data.message) ||
      "SMS send failed";
    throw new Error(String(errMsg));
  }
  return data;
}

export async function resolveDestination(env, body) {
  const trusted = env.TRUSTED_PHONE ? normalizePhone(env.TRUSTED_PHONE) : "";
  const requested = body && body.phone ? normalizePhone(body.phone) : "";
  if (trusted && requested && trusted !== requested) {
    throw new Error("Phone does not match the configured trusted number");
  }
  const to = trusted || requested;
  if (!to) throw new Error("Server missing TRUSTED_PHONE");
  if (!trusted && env.ALLOW_REQUEST_PHONE !== "1") {
    throw new Error("Server missing TRUSTED_PHONE");
  }
  return to;
}

export async function handleSend(env, body) {
  if (!env.OTP_SECRET) throw new Error("Server missing OTP_SECRET");
  const to = await resolveDestination(env, body);
  const code = generateCode();
  const token = await mintToken(code, env.OTP_SECRET);
  const message = buildSmsMessage(code);

  if (env.MOCK_SMS === "1") {
    console.log("[apple-sms] MOCK send to", to, "code", code);
  } else {
    await sendViaHttpSms(env, to, message);
  }

  const out = { ok: true, token: token, last4: phoneLast4(to) };
  if (env.MOCK_SMS === "1" && env.INCLUDE_CODE === "1") out.code = code;
  return out;
}

export async function handleVerify(env, body) {
  if (!env.OTP_SECRET) throw new Error("Server missing OTP_SECRET");
  const code = body && body.code;
  const token = body && body.token;
  return verifyToken(code, token, env.OTP_SECRET);
}

// Cloudflare Worker entrypoint.
export default {
  async fetch(request, env) {
    const allowOrigin = env.ALLOW_ORIGIN || "*";
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), allowOrigin);
    if (request.method !== "POST") return withCors(json({ error: "Method not allowed" }, 405), allowOrigin);

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return withCors(json({ error: "Invalid JSON body" }, 400), allowOrigin);
    }

    const action = (body && body.action) || "send";
    try {
      if (action === "send") {
        return withCors(json(await handleSend(env, body)), allowOrigin);
      }
      if (action === "verify") {
        const result = await handleVerify(env, body);
        return withCors(json(result, result.ok ? 200 : 400), allowOrigin);
      }
      return withCors(json({ error: "Unknown action" }, 400), allowOrigin);
    } catch (e) {
      return withCors(json({ error: e.message || "Server error" }, 500), allowOrigin);
    }
  },
};
