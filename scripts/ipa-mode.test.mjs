import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "ipa-mode.sh");

function mode(env) {
  return execFileSync("bash", [script], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  }).trim();
}

test("ipa-mode is unsigned without signing secrets", () => {
  assert.equal(
    mode({
      WANT_SIGNED: "true",
      IOS_CERTIFICATE_BASE64: "",
      IOS_PROVISION_PROFILE_BASE64: "",
      IOS_TEAM_ID: "",
    }),
    "unsigned"
  );
});

test("ipa-mode is unsigned when signing is disabled", () => {
  assert.equal(
    mode({
      WANT_SIGNED: "false",
      IOS_CERTIFICATE_BASE64: "Y2VydA==",
      IOS_PROVISION_PROFILE_BASE64: "cHJvZg==",
      IOS_TEAM_ID: "ABCDE12345",
    }),
    "unsigned"
  );
});

test("ipa-mode is signed when cert, profile, and team are present", () => {
  assert.equal(
    mode({
      WANT_SIGNED: "true",
      IOS_CERTIFICATE_BASE64: "Y2VydA==",
      IOS_PROVISION_PROFILE_BASE64: "cHJvZg==",
      IOS_TEAM_ID: "ABCDE12345",
    }),
    "signed"
  );
});
