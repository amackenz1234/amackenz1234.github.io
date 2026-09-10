#!/usr/bin/env node
// Local Apple SMS verification server for appcompiler.ai.
// Usage:
//   TRUSTED_PHONE=+15551234567 OTP_SECRET=dev MOCK_SMS=1 INCLUDE_CODE=1 \
//     node serverless/apple-sms-local.mjs
// With Telnyx (or any HTTP SMS API):
//   TRUSTED_PHONE=... OTP_SECRET=... SMS_API_KEY=... SMS_FROM=... \
//   SMS_API_URL=https://api.telnyx.com/v2/messages \
//   node serverless/apple-sms-local.mjs

import http from "node:http";
import worker, { handleSend, handleVerify } from "./apple-sms.mjs";

const port = parseInt(process.env.PORT || "8787", 10);
const hasSmsApi = !!(process.env.SMS_API_KEY && process.env.SMS_FROM);
const env = {
  OTP_SECRET: process.env.OTP_SECRET || "nativ-dev-otp-secret",
  TRUSTED_PHONE: process.env.TRUSTED_PHONE || "",
  SMS_API_URL: process.env.SMS_API_URL || "",
  SMS_API_KEY: process.env.SMS_API_KEY || "",
  SMS_FROM: process.env.SMS_FROM || "",
  SMS_PROVIDER: process.env.SMS_PROVIDER || "telnyx",
  MOCK_SMS: process.env.MOCK_SMS || (hasSmsApi ? "0" : "1"),
  INCLUDE_CODE:
    process.env.INCLUDE_CODE ||
    (process.env.MOCK_SMS === "1" || !hasSmsApi ? "1" : "0"),
  ALLOW_REQUEST_PHONE: process.env.ALLOW_REQUEST_PHONE || "1",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "*",
};

if (!env.TRUSTED_PHONE && env.ALLOW_REQUEST_PHONE !== "1") {
  console.error("Set TRUSTED_PHONE (E.164) or ALLOW_REQUEST_PHONE=1");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": env.ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, headers);
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch (e) {
    res.writeHead(400, headers);
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }
  const action = body.action || "send";
  try {
    if (action === "send") {
      const out = await handleSend(env, body);
      res.writeHead(200, headers);
      res.end(JSON.stringify(out));
      return;
    }
    if (action === "verify") {
      const out = await handleVerify(env, body);
      res.writeHead(out.ok ? 200 : 400, headers);
      res.end(JSON.stringify(out));
      return;
    }
    res.writeHead(400, headers);
    res.end(JSON.stringify({ error: "Unknown action" }));
  } catch (e) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: e.message || "Server error" }));
  }
});

server.listen(port, () => {
  console.log(
    "[apple-sms-local] listening on http://127.0.0.1:" +
      port +
      " mock=" +
      env.MOCK_SMS +
      " provider=" +
      env.SMS_PROVIDER +
      " phone=" +
      (env.TRUSTED_PHONE || "(from request)")
  );
});

// Keep reference so tree-shaking tools don't drop the worker export.
void worker;
