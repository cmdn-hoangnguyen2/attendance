import assert from "node:assert/strict";
import nodeTest from "node:test";

let postCommand;
let importError;
try {
  ({ postCommand } = await import("../../src/lib/commandClient.ts"));
} catch (error) {
  importError = error;
}
const helperMissing = importError?.code === "ERR_MODULE_NOT_FOUND"
  && importError.message.includes("src/lib/commandClient.ts");
nodeTest("actual production commandClient.ts exports postCommand", () => {
  assert.ifError(importError);
  assert.equal(typeof postCommand, "function");
});
const test = (name, run) => nodeTest(name, { skip: helperMissing }, run);
const requestId = "11111111-1111-4111-8111-111111111111";
const endpoint = "/api/rooms/example/leave";
const secret = "SQLSTATE 23505 provider-secret service_role";
function assertFailure(result, code) {
  assert.equal(result.success, false);
  assert.equal(result.error.code, code);
  assert.equal(typeof result.error.message, "string");
  assert.ok(result.error.message.length > 0);
  assert.doesNotMatch(JSON.stringify(result), /SQLSTATE|provider-secret|service_role/);
  assert.equal(Object.hasOwn(result, "data"), false);
}

test("posts JSON with the caller UUID, same-origin credentials and no-store", async (context) => {
  const body = { reason: "Rời phòng" };
  const expected = { success: true, data: { roomId: "room-a" } };
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (input, options) => {
    calls += 1;
    assert.equal(input, endpoint);
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error", "Mutation redirects must not escape the same-origin boundary");
    const headers = new Headers(options.headers);
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(headers.get("idempotency-key"), requestId);
    assert.deepEqual(JSON.parse(options.body), body);
    return Response.json(expected);
  });
  assert.deepEqual(await postCommand(endpoint, body, requestId), expected);
  assert.equal(calls, 1);
});

test("an explicit retry preserves the caller key without automatic retry", async (context) => {
  const keys = [];
  context.mock.method(globalThis, "fetch", async (_input, options) => {
    keys.push(new Headers(options.headers).get("idempotency-key"));
    if (keys.length === 1) throw new Error(secret);
    return Response.json({ success: true, data: null });
  });
  assertFailure(await postCommand(endpoint, {}, requestId), "INTERNAL_ERROR");
  assert.deepEqual(keys, [requestId]);
  assert.deepEqual(await postCommand(endpoint, {}, requestId), { success: true, data: null });
  assert.deepEqual(keys, [requestId, requestId]);
});

for (const invalidId of ["", "not-a-uuid", "11111111-1111-4111-8111-11111111111", `${requestId}\r\nX-Actor: forged`, ` ${requestId}`]) {
  test(`rejects malformed request UUID ${JSON.stringify(invalidId)} before fetch`, async (context) => {
    let calls = 0;
    context.mock.method(globalThis, "fetch", async () => { calls += 1; throw new Error("Unexpected fetch"); });
    assertFailure(await postCommand(endpoint, {}, invalidId), "VALIDATION_ERROR");
    assert.equal(calls, 0);
  });
}

for (const url of ["https://evil.example/api/command", "//evil.example/api/command", "/\\evil.example/api/command", "javascript:alert(1)"]) {
  test(`rejects unsafe command destination ${JSON.stringify(url)} before fetch`, async (context) => {
    let calls = 0;
    context.mock.method(globalThis, "fetch", async () => { calls += 1; throw new Error("Unexpected fetch"); });
    assertFailure(await postCommand(url, {}, requestId), "VALIDATION_ERROR");
    assert.equal(calls, 0);
  });
}

for (const [status, code] of [
  [401, "UNAUTHENTICATED"], [403, "FORBIDDEN"], [404, "NOT_FOUND"],
  [409, "CONFLICT"], [400, "VALIDATION_ERROR"], [403, "ARCHIVED"],
  [409, "MEETING_CLOSED"], [403, "PERMISSION_CHANGED"],
  [403, "MEMBERSHIP_INACTIVE"], [500, "INTERNAL_ERROR"],
]) {
  test(`preserves stable ${code} code from an HTTP ${status} command error`, async (context) => {
    context.mock.method(globalThis, "fetch", async () => Response.json({
      success: false, error: { code, message: secret },
    }, { status }));
    const result = await postCommand(endpoint, {}, requestId);
    assertFailure(result, code);
    assert.match(result.error.message, /[À-ỹ]/, "Diagnostics presented to the UI are Vietnamese");
  });
}

test("preserves valid Vietnamese validation fields", async (context) => {
  const fields = { name: "Tên phòng không được để trống." };
  context.mock.method(globalThis, "fetch", async () => Response.json({
    success: false, error: { code: "VALIDATION_ERROR", message: "Dữ liệu không hợp lệ.", fields },
  }, { status: 400 }));
  const result = await postCommand(endpoint, {}, requestId);
  assertFailure(result, "VALIDATION_ERROR");
  assert.deepEqual(result.error.fields, fields);
});

for (const [label, payload] of [
  ["null", null], ["array", []], ["missing discriminator", { data: {} }],
  ["non-boolean discriminator", { success: "true", data: {} }],
  ["success without data", { success: true }],
  ["error without detail", { success: false }],
  ["unknown error code", { success: false, error: { code: "SQL_ERROR", message: secret } }],
  ["non-string error message", { success: false, error: { code: "CONFLICT", message: 1 } }],
  ["invalid field values", { success: false, error: { code: "VALIDATION_ERROR", message: "Lỗi dữ liệu.", fields: { name: 42 } } }],
]) {
  test(`rejects malformed response: ${label}`, async (context) => {
    context.mock.method(globalThis, "fetch", async () => Response.json(payload));
    assertFailure(await postCommand(endpoint, {}, requestId), "INTERNAL_ERROR");
  });
}

test("never accepts a success envelope on a failing HTTP response", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ success: true, data: { changed: true } }, { status: 500 }));
  assertFailure(await postCommand(endpoint, {}, requestId), "INTERNAL_ERROR");
});

test("returns sanitized INTERNAL_ERROR for invalid JSON without retry", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls += 1; return new Response(secret, { status: 502 }); });
  assertFailure(await postCommand(endpoint, {}, requestId), "INTERNAL_ERROR");
  assert.equal(calls, 1);
});

test("returns sanitized validation failure for a non-serializable body before fetch", async (context) => {
  const body = {};
  body.self = body;
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls += 1; throw new Error("Unexpected fetch"); });
  assertFailure(await postCommand(endpoint, body, requestId), "VALIDATION_ERROR");
  assert.equal(calls, 0);
});
