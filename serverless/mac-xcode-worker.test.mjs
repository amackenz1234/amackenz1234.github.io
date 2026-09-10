import assert from "node:assert/strict";
import test from "node:test";
import {
  authorize,
  requireXcode,
  requireMacOS27,
  requireFullMacOS,
  requireOsRunning,
  requireMonthlyPlan,
  inspectHost,
  cloudMacInfo,
  buildWorkflowDispatchUrl,
  buildDispatchBody,
  mockCompileLogs,
  dispatchCloudCompile,
  handleHealth,
  handleCompile,
} from "./mac-xcode-worker.mjs";

test("authorize accepts matching bearer token", () => {
  assert.equal(authorize("secret", "Bearer secret"), true);
  assert.equal(authorize("secret", "secret"), true);
  assert.equal(authorize("secret", "nope"), false);
  assert.equal(authorize("", "anything"), true);
});

test("requireXcode fails when Xcode is missing", () => {
  assert.equal(requireXcode({ xcodeInstalled: false }).ok, false);
  assert.equal(requireXcode({ xcode: "" }).ok, false);
  assert.equal(requireXcode({ xcode: "Xcode 27" }).ok, true);
});

test("requireMacOS27 accepts 27 RC and rejects older OS", () => {
  assert.equal(requireMacOS27({ os: "macOS 27 RC" }).ok, true);
  assert.equal(requireMacOS27({ os: "Full macOS 27 RC" }).ok, true);
  assert.equal(requireMacOS27({ osVersion: "27.0" }).ok, true);
  assert.equal(requireMacOS27({ os: "macOS 26.5.2" }).ok, false);
  assert.equal(requireMacOS27({ osInstalled: false }).ok, false);
});

test("requireFullMacOS requires the complete macOS product, not iOS", () => {
  assert.equal(requireFullMacOS({ os: "Full macOS 27 RC", productName: "macOS" }).ok, true);
  assert.equal(requireFullMacOS({ os: "macOS 27 RC", productName: "iOS" }).ok, false);
  assert.equal(requireFullMacOS({ os: "macOS 27 RC", fullOs: false }).ok, false);
});

test("requireOsRunning requires launchd as pid 1", () => {
  assert.equal(requireOsRunning({ os: "Full macOS 27 RC", productName: "macOS", pid1: "launchd" }).ok, true);
  assert.equal(requireOsRunning({ os: "Full macOS 27 RC", productName: "macOS", osRunning: false }).ok, false);
  assert.equal(requireOsRunning({ os: "Full macOS 27 RC", productName: "macOS", pid1: "init" }).ok, false);
});

test("inspectHost describes a cloud Apple Silicon Mac with Xcode", () => {
  const host = inspectHost({
    cloud: true,
    mock: true,
    name: "appcompiler.ai Cloud Mac",
    xcode: "Xcode 27",
    xcodeInstalled: true,
  });
  assert.equal(host.ok, true);
  assert.equal(host.cloud, true);
  assert.equal(host.arch, "arm64");
  assert.equal(host.silicon, true);
  assert.match(host.xcode, /Xcode/);
});

test("inspectHost refuses a Mac without Xcode", () => {
  const host = inspectHost({ xcode: "", xcodeInstalled: false });
  assert.equal(host.ok, false);
  assert.match(host.error, /Xcode is not installed/);
});

test("cloudMacInfo is always cloud + Apple Silicon + Xcode", async () => {
  const host = cloudMacInfo({ MOCK_MAC: "1", MAC_NAME: "Studio Mac" });
  assert.equal(host.ok, true);
  assert.equal(host.cloud, true);
  assert.equal(host.silicon, true);
  assert.equal(host.name, "Studio Mac");
  assert.match(host.xcode, /Xcode/);
  assert.match(host.provider, /xcode-27/);
  assert.match(host.xcode, /Xcode 27/);
  assert.match(host.os, /Full macOS 27 RC/);
  assert.equal(host.fullOs, true);
  assert.equal(host.productName, "macOS");
  assert.equal(host.osRunning, true);
  assert.equal(host.pid1, "launchd");
});

test("workflow dispatch URL and body", () => {
  assert.equal(
    buildWorkflowDispatchUrl("acme", "app", "ios.yml"),
    "https://api.github.com/repos/acme/app/actions/workflows/ios.yml/dispatches"
  );
  const body = buildDispatchBody("main", { app_name: "HabitKit", reason: "nativ-cloud-mac" });
  assert.equal(body.ref, "main");
  assert.equal(body.inputs.app_name, "HabitKit");
});

test("requireMonthlyPlan gates signed IPA when REQUIRE_PLAN=1", () => {
  assert.equal(requireMonthlyPlan({ signed: false }, { REQUIRE_PLAN: "1" }).ok, true);
  assert.equal(requireMonthlyPlan({ signed: true, planActive: true }, { REQUIRE_PLAN: "1" }).ok, true);
  assert.equal(requireMonthlyPlan({ signed: true }, { REQUIRE_PLAN: "1" }).ok, false);
  assert.equal(requireMonthlyPlan({ signed: true }, {}).ok, true);
});

test("mock compile logs run on cloud Apple Silicon with Xcode", () => {
  const logs = mockCompileLogs("HabitKit", { "App.swift": "", "Info.plist": "" });
  assert.match(logs[0], /Cloud Mac/);
  assert.match(logs.join("\n"), /full macOS 27 RC/);
  assert.match(logs.join("\n"), /Xcode 27/);
  assert.match(logs.join("\n"), /Apple Silicon/);
  assert.match(logs.join("\n"), /Compile App.swift/);
  assert.match(logs.join("\n"), /BUILD SUCCEEDED/);
  assert.match(logs.join("\n"), /monthly Cloud Mac plan/);
});

test("mock compile logs package a signed IPA when requested", () => {
  const logs = mockCompileLogs("Faraday", { "FaradayApp.swift": "" }, { signed: true });
  assert.match(logs.join("\n"), /Faraday-signed\.ipa/);
  assert.match(logs.join("\n"), /IPA READY/);
});

test("dispatchCloudCompile posts to GitHub Actions", async () => {
  const calls = [];
  const fakeFetch = async (url, opts) => {
    calls.push({ url, opts });
    return { status: 204, text: async () => "" };
  };
  const out = await dispatchCloudCompile(
    {
      GITHUB_TOKEN: "ghs_test",
      GITHUB_OWNER: "acme",
      GITHUB_REPO: "app",
      GITHUB_WORKFLOW: "ios.yml",
    },
    { appName: "HabitKit" },
    fakeFetch
  );
  assert.equal(out.ok, true);
  assert.equal(out.dispatched, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /acme\/app\/actions\/workflows\/ios.yml\/dispatches/);
  const payload = JSON.parse(calls[0].opts.body);
  assert.equal(payload.inputs.app_name, "HabitKit");
});

test("handleHealth and handleCompile work without GitHub (demo cloud Mac)", async () => {
  const env = { MOCK_MAC: "1", MAC_NAME: "appcompiler.ai Cloud Mac" };
  const health = await handleHealth(env);
  assert.equal(health.ok, true);
  assert.equal(health.cloud, true);
  const compiled = await handleCompile(env, {
    appName: "CafeFinder",
    files: { "CafeFinderApp.swift": "import SwiftUI\n" },
  });
  assert.equal(compiled.ok, true);
  assert.equal(compiled.cloud, true);
  assert.match(compiled.logs.join("\n"), /CafeFinderApp.swift/);
});

test("handleCompile with a token dispatches instead of mocking", async () => {
  const fakeFetch = async () => ({ status: 204, text: async () => "" });
  const compiled = await handleCompile(
    {
      GITHUB_TOKEN: "ghs_test",
      GITHUB_OWNER: "acme",
      GITHUB_REPO: "app",
    },
    { appName: "Budgetly" },
    { fetch: fakeFetch }
  );
  assert.equal(compiled.ok, true);
  assert.equal(compiled.dispatched, true);
  assert.match(compiled.logs.join("\n"), /xcodebuild/);
});
