// Built-in browser OTP for appcompiler.ai Apple linking (GitHub Pages — no backend required).
// Used when auth-config.js has no smsEndpoint. Same HMAC token shape as serverless/apple-sms.mjs.
(function (global) {
  "use strict";

  var encoder = new TextEncoder();
  var SECRET = "nativ-builtin-otp-v1";

  function normalizePhone(raw) {
    var digits = String(raw || "").replace(/\D/g, "");
    if (digits.length === 10) return "+1" + digits;
    if (digits.length === 11 && digits.charAt(0) === "1") return "+" + digits;
    if (String(raw || "").trim().charAt(0) === "+" && digits.length >= 10) return "+" + digits;
    throw new Error("Enter a valid phone number");
  }

  function phoneLast4(e164) {
    return String(e164 || "").replace(/\D/g, "").slice(-4);
  }

  function generateCode() {
    var bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    var n = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    return String(n % 1000000).padStart(6, "0");
  }

  function hmacHex(secret, message) {
    return crypto.subtle
      .importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
      .then(function (key) {
        return crypto.subtle.sign("HMAC", key, encoder.encode(message));
      })
      .then(function (sig) {
        return Array.prototype.map
          .call(new Uint8Array(sig), function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("");
      });
  }

  function mintToken(code) {
    var exp = Date.now() + 10 * 60 * 1000;
    return hmacHex(SECRET, code + "." + exp).then(function (sig) {
      return exp + "." + sig;
    });
  }

  function verifyToken(code, token) {
    if (!/^\d{6}$/.test(String(code || ""))) {
      return Promise.resolve({ ok: false, error: "Invalid code format" });
    }
    var parts = String(token || "").split(".");
    if (parts.length !== 2) return Promise.resolve({ ok: false, error: "Invalid token" });
    var exp = parseInt(parts[0], 10);
    var sig = parts[1];
    if (!exp || !sig) return Promise.resolve({ ok: false, error: "Invalid token" });
    if (Date.now() > exp) return Promise.resolve({ ok: false, error: "Code expired" });
    return hmacHex(SECRET, code + "." + exp).then(function (expected) {
      if (expected !== sig) return { ok: false, error: "Incorrect code" };
      return { ok: true };
    });
  }

  function send(phone) {
    var to;
    try {
      to = normalizePhone(phone);
    } catch (e) {
      return Promise.reject(e);
    }
    var code = generateCode();
    return mintToken(code).then(function (token) {
      // Preview delivery: no carrier SMS without a deployed worker + SMS_API_KEY.
      // The code is returned so the UI can complete verification on static hosting.
      return {
        ok: true,
        token: token,
        last4: phoneLast4(to),
        code: code,
        preview: true
      };
    });
  }

  function verify(code, token) {
    return verifyToken(code, token);
  }

  global.NATIV_BUILTIN_SMS = { send: send, verify: verify, normalizePhone: normalizePhone };
})(typeof window !== "undefined" ? window : globalThis);
