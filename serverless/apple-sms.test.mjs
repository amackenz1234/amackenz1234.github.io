import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePhone,
  phoneLast4,
  generateCode,
  mintToken,
  verifyToken,
  buildSmsPayload,
  buildSmsMessage,
  handleSend,
  handleVerify,
} from "./apple-sms.mjs";

test("normalizePhone accepts US/CA forms", () => {
  assert.equal(normalizePhone("9053085392"), "+19053085392");
  assert.equal(normalizePhone("1 (905) 308-5392"), "+19053085392");
  assert.equal(normalizePhone("+1-905-308-5392"), "+19053085392");
});

test("normalizePhone rejects short numbers", () => {
  assert.throws(() => normalizePhone("12345"), /E\.164/);
});

test("phoneLast4 returns last four digits", () => {
  assert.equal(phoneLast4("+19053085392"), "5392");
});

test("generateCode is always 6 digits", () => {
  const code = generateCode(new Uint8Array([0, 0, 0, 42]));
  assert.match(code, /^\d{6}$/);
  assert.equal(code, "000042");
});

test("mint + verify accepts the correct code", async () => {
  const secret = "test-secret";
  const code = "123456";
  const now = 1_000_000;
  const token = await mintToken(code, secret, { now, ttlMs: 60_000 });
  const ok = await verifyToken(code, token, secret, { now: now + 1000 });
  assert.equal(ok.ok, true);
});

test("verify rejects wrong code, expired token, and garbage", async () => {
  const secret = "test-secret";
  const now = 1_000_000;
  const token = await mintToken("123456", secret, { now, ttlMs: 1000 });
  assert.equal((await verifyToken("000000", token, secret, { now })).ok, false);
  assert.equal((await verifyToken("123456", token, secret, { now: now + 5000 })).ok, false);
  assert.equal((await verifyToken("123456", "not-a-token", secret, { now })).ok, false);
  assert.equal((await verifyToken("abc", token, secret, { now })).ok, false);
});

test("buildSmsPayload defaults to Telnyx shape", () => {
  const p = buildSmsPayload("+15551112222", "+15550001111", "hi");
  assert.equal(p.to, "+15551112222");
  assert.equal(p.from, "+15550001111");
  assert.equal(p.text, "hi");
  assert.equal(p.Body, undefined);
});

test("buildSmsPayload generic shape includes body", () => {
  const p = buildSmsPayload("+15551112222", "+15550001111", "hi", "generic");
  assert.equal(p.body, "hi");
  assert.equal(p.text, "hi");
});

test("buildSmsMessage includes the code", () => {
  assert.match(buildSmsMessage("654321"), /654321/);
});

test("handleSend in MOCK_SMS returns token + last4 and optional code", async () => {
  const env = {
    OTP_SECRET: "secret",
    TRUSTED_PHONE: "9053085392",
    MOCK_SMS: "1",
    INCLUDE_CODE: "1",
  };
  const out = await handleSend(env, {});
  assert.equal(out.ok, true);
  assert.equal(out.last4, "5392");
  assert.match(out.token, /^\d+\.[0-9a-f]+$/);
  assert.match(out.code, /^\d{6}$/);

  const verified = await handleVerify(env, { code: out.code, token: out.token });
  assert.equal(verified.ok, true);
});

test("handleSend requires TRUSTED_PHONE and OTP_SECRET", async () => {
  await assert.rejects(() => handleSend({ OTP_SECRET: "x", MOCK_SMS: "1" }, {}), /TRUSTED_PHONE/);
  await assert.rejects(() => handleSend({ TRUSTED_PHONE: "+15551212", MOCK_SMS: "1" }, {}), /OTP_SECRET/);
});
