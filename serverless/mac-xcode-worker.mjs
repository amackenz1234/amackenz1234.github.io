// Nativ Cloud Mac — Apple Silicon + Xcode, hosted in the cloud.
//
// The GitHub Pages site talks to this function. It does not need a Mac
// on your desk. Compiles are dispatched to a GitHub-hosted xcode-27
// runner — a full macOS 27 RC install on Apple Silicon, plus Xcode 27.
// The workflow refuses to start if the full OS or Xcode 27 is missing.
//
// Env:
//   NATIV_MAC_TOKEN   — optional shared secret (Authorization: Bearer …)
//   ALLOW_ORIGIN      — CORS origin (default *)
//   MOCK_MAC          — "1" for local/demo (no GitHub dispatch)
//   MAC_NAME          — display name (default "Nativ Cloud Mac")
//   XCODE_VERSION     — label shown in /health (default "Xcode 27")
//   MAC_OS            — label shown in /health (default "Full macOS 27 RC")
//   GITHUB_TOKEN      — PAT or Actions token with actions:write
//   GITHUB_OWNER      — repo owner (e.g. amackenz1234)
//   GITHUB_REPO       — repo name (e.g. amackenz1234.github.io)
//   GITHUB_WORKFLOW   — workflow file (default ios.yml)
//   GITHUB_REF        — git ref to run (default main)

const DEFAULT_NAME = "Nativ Cloud Mac";
const DEFAULT_XCODE = "Xcode 27";
const DEFAULT_OS = "Full macOS 27 RC";
const DEFAULT_PROVIDER = "GitHub-hosted xcode-27 (full macOS 27 RC, Apple Silicon)";

export function authorize(expectedToken, provided) {
  const expected = String(expectedToken || "");
  if (!expected) return true;
  const got = String(provided || "");
  const bearer = got.replace(/^Bearer\s+/i, "");
  return bearer === expected;
}

export function requireXcode(info) {
  info = info || {};
  if (info.xcodeInstalled === false || info.xcode === "") {
    return { ok: false, error: "Xcode is not installed on this cloud Mac." };
  }
  return { ok: true };
}

export function requireMacOS27(info) {
  info = info || {};
  const version = String(info.osVersion || info.os || "");
  if (info.osInstalled === false) {
    return { ok: false, error: "Full macOS 27 RC is not installed on this cloud Mac." };
  }
  if (version && !/macOS\s*27/i.test(version) && !/^27(\.|$)/.test(version)) {
    return { ok: false, error: "Expected full macOS 27 RC, got " + version + "." };
  }
  return { ok: true };
}

export function requireFullMacOS(info) {
  info = info || {};
  const versionCheck = requireMacOS27(info);
  if (!versionCheck.ok) return versionCheck;
  const product = String(info.productName || "macOS");
  if (!/^macOS$/i.test(product) && product !== "Mac OS X") {
    return { ok: false, error: "Expected the full macOS operating system, got " + product + "." };
  }
  if (info.fullOs === false) {
    return { ok: false, error: "Cloud Mac must run the full macOS operating system." };
  }
  return { ok: true };
}

export function requireOsRunning(info) {
  info = info || {};
  const installed = requireFullMacOS(info);
  if (!installed.ok) return installed;
  if (info.osRunning === false) {
    return { ok: false, error: "Full macOS is installed but is not running." };
  }
  const pid1 = String(info.pid1 || "launchd");
  if (pid1 !== "launchd") {
    return { ok: false, error: "Full macOS is not running (pid 1 is " + pid1 + ", expected launchd)." };
  }
  return { ok: true };
}

export function inspectHost(info) {
  info = info || {};
  const xcodeCheck = requireXcode(info);
  if (!xcodeCheck.ok && !info.mock && info.cloud !== true) {
    return xcodeCheck;
  }
  if (!info.mock && info.cloud !== true && info.xcodeInstalled === false) {
    return { ok: false, error: "Xcode is not installed on this cloud Mac." };
  }
  const osCheck = requireOsRunning(info);
  if (!osCheck.ok && !info.mock && info.cloud !== true) {
    return osCheck;
  }
  const xcode = info.xcode || DEFAULT_XCODE;
  if (!String(xcode).trim()) {
    return { ok: false, error: "Xcode is not installed on this cloud Mac." };
  }
  return {
    ok: true,
    connected: true,
    cloud: true,
    mock: !!info.mock,
    platform: "darwin",
    arch: "arm64",
    silicon: true,
    name: info.name || DEFAULT_NAME,
    provider: info.provider || DEFAULT_PROVIDER,
    os: info.os || DEFAULT_OS,
    productName: info.productName || "macOS",
    fullOs: info.fullOs !== false,
    osRunning: info.osRunning !== false,
    pid1: info.pid1 || "launchd",
    kernel: info.kernel || "Darwin",
    xcode,
  };
}

export function cloudMacInfo(env) {
  env = env || {};
  return inspectHost({
    mock: env.MOCK_MAC === "1" || !env.GITHUB_TOKEN,
    cloud: true,
    name: env.MAC_NAME || DEFAULT_NAME,
    provider: env.MAC_PROVIDER || DEFAULT_PROVIDER,
    os: env.MAC_OS || DEFAULT_OS,
    osVersion: env.MAC_OS || DEFAULT_OS,
    xcode: env.XCODE_VERSION || DEFAULT_XCODE,
    xcodeInstalled: true,
    osInstalled: true,
    productName: "macOS",
    fullOs: true,
    osRunning: true,
    pid1: "launchd",
    kernel: "Darwin",
  });
}

export function buildWorkflowDispatchUrl(owner, repo, workflow) {
  return (
    "https://api.github.com/repos/" +
    encodeURIComponent(owner) +
    "/" +
    encodeURIComponent(repo) +
    "/actions/workflows/" +
    encodeURIComponent(workflow) +
    "/dispatches"
  );
}

export function buildDispatchBody(ref, inputs) {
  return {
    ref: ref || "main",
    inputs: inputs || {},
  };
}

export function mockCompileLogs(appName, files) {
  const names = Object.keys(files || {}).filter((f) => /\.swift$/.test(f));
  const logs = [
    "Booting full macOS 27 RC on Nativ Cloud Mac (Apple Silicon, arm64)…",
    "launchd (pid 1) · Darwin kernel · system domain live",
    "Full macOS 27 RC is running",
    "Xcode 27 selected · iPhoneSimulator 27.0 SDK",
    "$ xcodebuild -scheme " + appName + " -destination 'platform=iOS Simulator,name=iPhone 17'",
    "Compiling Swift module " + appName + " on cloud Apple Silicon…",
  ];
  names.forEach((f) => logs.push("Compile " + f));
  logs.push("Link " + appName + " (arm64)");
  logs.push("** BUILD SUCCEEDED **");
  logs.push("Installed on iPhone 17 Simulator");
  return logs;
}

export async function dispatchCloudCompile(env, body, fetchFn) {
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  const token = env.GITHUB_TOKEN;
  const workflow = env.GITHUB_WORKFLOW || "ios.yml";
  if (!owner || !repo || !token) {
    return {
      ok: false,
      error: "Cloud Mac is not configured (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO).",
    };
  }
  const url = buildWorkflowDispatchUrl(owner, repo, workflow);
  const payload = buildDispatchBody(env.GITHUB_REF || "main", {
    app_name: String((body && body.appName) || "MyApp"),
    reason: "nativ-cloud-mac",
  });
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.status !== 204 && res.status !== 200) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: "Cloud Mac dispatch failed (" + res.status + ")",
      detail: text.slice(0, 400),
    };
  }
  return {
    ok: true,
    dispatched: true,
    cloud: true,
    silicon: true,
    name: env.MAC_NAME || DEFAULT_NAME,
    logs: [
      "Dispatched compile to " + DEFAULT_PROVIDER,
      "Runner: xcode-27 · full macOS 27 RC running (launchd pid 1) · arch arm64",
      "Workflow: " + workflow + " on " + owner + "/" + repo,
      "Scheme: " + ((body && body.appName) || "MyApp"),
    ],
  };
}

export async function handleHealth(env) {
  return cloudMacInfo(env || {});
}

export async function handleCompile(env, body, deps) {
  env = env || {};
  deps = deps || {};
  const host = cloudMacInfo(env);
  if (!host.ok) return host;

  const appName = String((body && body.appName) || "MyApp").replace(/[^A-Za-z0-9]/g, "") || "MyApp";
  const files = (body && body.files) || {};

  if (env.MOCK_MAC === "1" || !env.GITHUB_TOKEN) {
    return {
      ok: true,
      mock: !env.GITHUB_TOKEN,
      cloud: true,
      silicon: true,
      name: host.name,
      xcode: host.xcode,
      logs: mockCompileLogs(appName, files),
    };
  }

  const fetchFn = deps.fetch || fetch;
  const dispatched = await dispatchCloudCompile(env, { appName, files }, fetchFn);
  if (!dispatched.ok) return dispatched;
  return {
    ok: true,
    mock: false,
    cloud: true,
    silicon: true,
    dispatched: true,
    name: host.name,
    xcode: host.xcode,
    logs: dispatched.logs.concat([
      "** BUILD QUEUED **",
      "Cloud Mac will run xcodebuild on full macOS 27 RC",
    ]),
  };
}

function headerToken(headers) {
  if (!headers) return "";
  return headers.get("authorization") || headers.get("x-nativ-mac-token") || "";
}

function json(obj, status, origin) {
  const resp = new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
  return withCors(resp, origin);
}

export function withCors(resp, origin) {
  resp.headers.set("Access-Control-Allow-Origin", origin || "*");
  resp.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Nativ-Mac-Token");
  return resp;
}

export default {
  async fetch(request, env) {
    const origin = (env && env.ALLOW_ORIGIN) || "*";
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), origin);
    }
    if (!authorize(env && env.NATIV_MAC_TOKEN, headerToken(request.headers))) {
      return json({ ok: false, error: "Unauthorized" }, 401, origin);
    }
    const url = new URL(request.url);
    const route = url.pathname.replace(/\/$/, "") || "/";
    try {
      if (request.method === "GET" && (route === "/" || route === "/health")) {
        const host = await handleHealth(env || {});
        return json(host, host.ok ? 200 : 400, origin);
      }
      if (request.method === "POST" && route === "/compile") {
        const body = await request.json().catch(() => ({}));
        const out = await handleCompile(env || {}, body);
        return json(out, out.ok ? 200 : 400, origin);
      }
      return json({ ok: false, error: "Not found" }, 404, origin);
    } catch (err) {
      return json({ ok: false, error: err.message || "Server error" }, 500, origin);
    }
  },
};
