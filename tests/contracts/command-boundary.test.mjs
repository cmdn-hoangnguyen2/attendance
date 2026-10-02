import assert from "node:assert/strict";
import nodeTest from "node:test";

let boundary;
let importError;
try {
  boundary = await import("../../src/lib/server/commandResponse.ts");
} catch (error) {
  importError = error;
}
const helperMissing = importError?.code === "ERR_MODULE_NOT_FOUND"
  && importError.message.includes("src/lib/server/commandResponse.ts");
nodeTest("actual production commandResponse.ts provides the command boundary helpers", () => {
  assert.ifError(importError);
  for (const name of ["CommandError", "commandSuccess", "commandFailure", "commandErrorResponse", "requireSameOrigin", "readCommandInput"]) {
    assert.equal(typeof boundary[name], "function", `${name} is required`);
  }
});
const test = (name, run) => nodeTest(name, { skip: helperMissing }, run);
const origin = "https://diemdanh.example";
const requestId = "11111111-1111-4111-8111-111111111111";
const secret = "SQLSTATE 23505 provider-secret service_role";

function commandRequest(overrides = {}) {
  const { url = `${origin}/api/rooms/example/leave`, headers = {}, body = "{}" } = overrides;
  return new Request(url, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", "Idempotency-Key": requestId, ...headers },
    body,
  });
}
async function assertFailure(response, status, code) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("cache-control"), /(?:^|[,\s])no-store(?:$|[,\s])/);
  const result = await response.json();
  assert.equal(result.success, false);
  assert.equal(result.error.code, code);
  assert.equal(typeof result.error.message, "string");
  assert.match(result.error.message, /[À-ỹ]/);
  assert.doesNotMatch(JSON.stringify(result), /SQLSTATE|provider-secret|service_role/);
  assert.equal(Object.hasOwn(result, "data"), false);
  return result;
}

test("success response exposes data in a no-store HTTP 200 envelope", async () => {
  const response = boundary.commandSuccess({ roomId: "room-a" });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await response.json(), { success: true, data: { roomId: "room-a" } });
});

for (const [code, status] of [
  ["UNAUTHENTICATED", 401], ["FORBIDDEN", 403], ["NOT_FOUND", 404],
  ["CONFLICT", 409], ["VALIDATION_ERROR", 400], ["ARCHIVED", 403],
  ["MEETING_CLOSED", 409], ["PERMISSION_CHANGED", 403],
  ["MEMBERSHIP_INACTIVE", 403], ["INTERNAL_ERROR", 500],
]) {
  test(`${code} returns stable HTTP ${status} without diagnostic messages`, async () => {
    await assertFailure(boundary.commandFailure(code), status, code);
    await assertFailure(boundary.commandErrorResponse(new boundary.CommandError(code)), status, code);
  });
}

test("unexpected errors and forged error-shaped objects are sanitized to HTTP 500", async () => {
  for (const error of [new Error(secret), { code: "FORBIDDEN", message: secret }, null, secret]) {
    const result = await assertFailure(boundary.commandErrorResponse(error), 500, "INTERNAL_ERROR");
    assert.equal(Object.hasOwn(result.error, "fields"), false);
  }
});

test("validation fields preserve safe messages and discard malformed or diagnostic fields", async () => {
  const response = boundary.commandFailure("VALIDATION_ERROR", {
    name: "Tên phòng không được để trống.", password: secret, nested: {}, amount: 123, empty: "",
  });
  const result = await assertFailure(response, 400, "VALIDATION_ERROR");
  assert.deepEqual(result.error.fields, { name: "Tên phòng không được để trống." });
});

test("internal and non-validation errors never expose caller-supplied fields", async () => {
  for (const code of ["INTERNAL_ERROR", "FORBIDDEN", "CONFLICT"]) {
    const result = await boundary.commandFailure(code, { name: secret }).json();
    assert.equal(Object.hasOwn(result.error, "fields"), false);
  }
});

test("explicit same-origin POST is accepted", () => {
  assert.doesNotThrow(() => boundary.requireSameOrigin(commandRequest(), origin));
});

for (const [label, overrides] of [
  ["foreign Origin", { headers: { Origin: "https://attacker.example" } }],
  ["null Origin", { headers: { Origin: "null" } }],
  ["missing Origin", { headers: { Origin: "" } }],
  ["other scheme", { headers: { Origin: "http://diemdanh.example" } }],
  ["other port", { headers: { Origin: "https://diemdanh.example:8443" } }],
  ["foreign request URL with forged host headers", { url: "https://attacker.example/api/command", headers: { Host: "diemdanh.example", "X-Forwarded-Host": "diemdanh.example" } }],
  ["cross-site metadata", { headers: { "Sec-Fetch-Site": "cross-site" } }],
  ["same-site metadata", { headers: { "Sec-Fetch-Site": "same-site" } }],
]) {
  test(`rejects ${label} as HTTP 403`, async () => {
    try {
      boundary.requireSameOrigin(commandRequest(overrides), origin);
      assert.fail("Unsafe mutation must throw");
    } catch (error) {
      await assertFailure(boundary.commandErrorResponse(error), 403, "FORBIDDEN");
    }
  });
}

test("missing or invalid server origin configuration fails closed as HTTP 500", async () => {
  for (const appBaseUrl of [undefined, "", "invalid", "file:///tmp/app", "https://user:pass@diemdanh.example"]) {
    try {
      boundary.requireSameOrigin(commandRequest(), appBaseUrl);
      assert.fail("Invalid trusted configuration must throw");
    } catch (error) {
      await assertFailure(boundary.commandErrorResponse(error), 500, "INTERNAL_ERROR");
    }
  }
});

test("reads one JSON object and UUID request key without deriving authority from body", async () => {
  const payload = { actorId: "forged", globalRole: "admin", reason: "Rời phòng" };
  const result = await boundary.readCommandInput(commandRequest({ body: JSON.stringify(payload) }));
  assert.deepEqual(result, { payload, requestId });
  assert.equal(Object.hasOwn(result, "actorId"), false);
  assert.equal(Object.hasOwn(result, "globalRole"), false);
});

for (const body of ["{", "null", "[]", "\"hello\"", "123", "true", ""]) {
  test(`malformed or non-object JSON ${JSON.stringify(body)} returns HTTP 400`, async () => {
    await assert.rejects(() => boundary.readCommandInput(commandRequest({ body })), (error) => {
      assert.equal(error.code, "VALIDATION_ERROR");
      return true;
    });
  });
}

for (const invalidKey of ["", "not-a-uuid", "11111111-1111-4111-8111-11111111111", `${requestId},${requestId}`]) {
  test(`rejects malformed Idempotency-Key ${JSON.stringify(invalidKey)} before consuming JSON`, async () => {
    const request = commandRequest({ headers: { "Idempotency-Key": invalidKey } });
    await assert.rejects(() => boundary.readCommandInput(request), { code: "VALIDATION_ERROR" });
    assert.equal(request.bodyUsed, false);
  });
}

test("missing UUID key returns HTTP 400", async () => {
  const request = commandRequest();
  request.headers.delete("idempotency-key");
  try {
    await boundary.readCommandInput(request);
    assert.fail("Missing key must throw");
  } catch (error) {
    await assertFailure(boundary.commandErrorResponse(error), 400, "VALIDATION_ERROR");
  }
});

test("non-JSON content type returns HTTP 400 before consuming the body", async () => {
  const request = commandRequest({ headers: { "Content-Type": "text/plain" } });
  await assert.rejects(() => boundary.readCommandInput(request), { code: "VALIDATION_ERROR" });
  assert.equal(request.bodyUsed, false);
});

test("validation fields cannot leak arbitrary Vietnamese diagnostics or unsafe keys", async () => {
  const fields = JSON.parse('{"name":"Lỗi database: mật khẩu bí mật","__proto__":"Tên phòng không được để trống.","bad key":"Tên phòng không được để trống."}');
  const result = await assertFailure(boundary.commandFailure("VALIDATION_ERROR", fields), 400, "VALIDATION_ERROR");
  assert.equal(Object.hasOwn(result.error, "fields"), false);
});

test("CommandError retains only safe validation fields in its HTTP response", async () => {
  const result = await assertFailure(boundary.commandErrorResponse(new boundary.CommandError("VALIDATION_ERROR", {
    name: "Tên phòng không được để trống.", diagnostic: secret,
  })), 400, "VALIDATION_ERROR");
  assert.deepEqual(result.error.fields, { name: "Tên phòng không được để trống." });
});
