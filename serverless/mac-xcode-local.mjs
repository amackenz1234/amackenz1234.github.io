#!/usr/bin/env node
// Local stand-in for appcompiler.ai Cloud Mac (no GitHub dispatch).
// Usage:
//   MOCK_MAC=1 node serverless/mac-xcode-local.mjs

import http from "node:http";
import worker, { handleCompile, handleHealth, handleStartVm } from "./mac-xcode-worker.mjs";

const port = parseInt(process.env.PORT || "8788", 10);
const env = {
  MOCK_MAC: process.env.MOCK_MAC || "1",
  MAC_NAME: process.env.MAC_NAME || "appcompiler.ai Cloud Mac",
  XCODE_VERSION: process.env.XCODE_VERSION || "Xcode 27",
  NATIV_MAC_TOKEN: process.env.NATIV_MAC_TOKEN || "",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "*",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GITHUB_OWNER: process.env.GITHUB_OWNER || "",
  GITHUB_REPO: process.env.GITHUB_REPO || "",
  GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW || "ios.yml",
  GITHUB_REF: process.env.GITHUB_REF || "main",
};

const server = http.createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": env.ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Nativ-Mac-Token",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  const url = new URL(req.url, "http://127.0.0.1");
  const route = url.pathname.replace(/\/$/, "") || "/";
  try {
    if (req.method === "GET" && (route === "/" || route === "/health")) {
      const host = await handleHealth(env);
      res.writeHead(host.ok ? 200 : 400, headers);
      res.end(JSON.stringify(host));
      return;
    }
    if (req.method === "POST" && route === "/compile") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const out = await handleCompile(env, body);
      res.writeHead(out.ok ? 200 : 400, headers);
      res.end(JSON.stringify(out));
      return;
    }
    if (req.method === "POST" && (route === "/vm" || route === "/start")) {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const out = await handleStartVm(env, body);
      res.writeHead(out.ok ? 200 : 400, headers);
      res.end(JSON.stringify(out));
      return;
    }
    res.writeHead(404, headers);
    res.end(JSON.stringify({ ok: false, error: "Not found" }));
  } catch (err) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ ok: false, error: err.message || "Server error" }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log("[mac-xcode-local] Cloud Mac on http://127.0.0.1:" + port + " mock=" + env.MOCK_MAC);
});

void worker;
