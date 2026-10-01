import assert from "node:assert/strict";
import nodeTest from "node:test";

let createSupabaseTokenResponse;
let importError;
try {
  ({ createSupabaseTokenResponse } = await import("../../src/lib/server/supabaseTokenResponse.mjs"));
} catch (error) {
  importError = error;
}
const helperMissing = importError?.code === "ERR_MODULE_NOT_FOUND"
  && importError.message.includes("src/lib/server/supabaseTokenResponse.mjs");
nodeTest("production response helper exposes the endpoint boundary", () => {
  assert.ifError(importError);
  assert.equal(typeof createSupabaseTokenResponse, "function");
});
const test = (name, run) => nodeTest(name, { skip: helperMissing }, run);

const subject = "auth0|endpoint-test";
const now = 2_000_000_000;
class TestActorError extends Error {
  constructor(status) { super("provider-secret"); this.status = status; }
}
const claims = { sub: subject, exp: now + 300, role: "authenticated" };
// Unsigned fixture data is test-only; the production boundary consumes SDK sessions.
const tokenFor = (payload) => ["eyJhbGciOiJSUzI1NiJ9", Buffer.from(JSON.stringify(payload)).toString("base64url"), "signature"].join(".");
const validToken = tokenFor(claims);
const sessionFor = (idToken = validToken) => ({
  user: { sub: subject },
  tokenSet: { idToken, accessToken: "distinct-access-token", expiresAt: now - 20 },
  internal: { sid: "test-session", createdAt: now - 100 },
});
const actor = { userId: "11111111-1111-4111-8111-111111111111", auth0Subject: subject, globalRole: "user" };
const requestFor = (headers = {}, query = "") => new Request("https://app.example/api/auth/supabase-token" + query, { headers });
async function respond(overrides = {}, request = requestFor()) {
  return createSupabaseTokenResponse(request, {
    appBaseUrl: "https://app.example",
    getSession: async () => sessionFor(),
    requireActor: async () => actor,
    now: () => now * 1000,
    ActorError: TestActorError,
    ...overrides,
  });
}
async function expectError(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  const body = await response.json();
  assert.equal(typeof body.error, "string");
  assert.equal(Object.hasOwn(body, "token"), false);
  assert.doesNotMatch(JSON.stringify(body), /provider-secret|distinct-access-token|signature|postgres/);
}

test("returns SDK ID token and its own expiry, not access-token data", async () => {
  const response = await respond({}, requestFor({ Origin: "https://app.example", "Sec-Fetch-Site": "same-origin" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await response.json(), { token: validToken, expiresAt: 2_000_000_300 });
});

for (const [name, session] of [
  ["absent session", null],
  ["missing ID token", sessionFor(undefined)],
  ["blank ID token", sessionFor("")],
  ["blank SDK subject", { ...sessionFor(), user: { sub: " " } }],
  ["non-string SDK subject", { ...sessionFor(), user: { sub: 123 } }],
]) {
  test("rejects " + name, async () => {
    if (name === "missing ID token") delete session.tokenSet.idToken;
    await expectError(await respond({ getSession: async () => session }), 401);
  });
}

const invalidTokens = [
  ["wrong segment count", "not-a-jwt"],
  ["empty payload", "header..signature"],
  ["non-JSON payload", "header.bm90LWpzb24.signature"],
  ["null payload", tokenFor(null)],
  ["missing expiry", tokenFor({ sub: subject, role: "authenticated" })],
  ["string expiry", tokenFor({ ...claims, exp: String(now + 300) })],
  ["nonfinite expiry", "header." + Buffer.from('{"sub":"auth0|endpoint-test","role":"authenticated","exp":1e999}').toString("base64url") + ".signature"],
  ["expired token", tokenFor({ ...claims, exp: now - 1 })],
  ["exact expiry boundary", tokenFor({ ...claims, exp: now })],
  ["different token subject", tokenFor({ ...claims, sub: "auth0|other" })],
  ["missing literal role", tokenFor({ sub: subject, exp: now + 300 })],
  ["admin literal role", tokenFor({ ...claims, role: "admin" })],
  ["empty signature", validToken.slice(0, validToken.lastIndexOf(".") + 1)],
];
for (const [name, token] of invalidTokens) {
  test("rejects " + name, async () => {
    await expectError(await respond({ getSession: async () => sessionFor(token) }), 401);
  });
}

test("allows valid token with less than sixty seconds remaining", async () => {
  const token = tokenFor({ ...claims, exp: now + 1 });
  const response = await respond({ getSession: async () => sessionFor(token) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { token, expiresAt: 2_000_000_001 });
});

for (const elapsedMilliseconds of [1000, 2000]) {
  test("rejects token expired during actor lookup after " + elapsedMilliseconds + "ms", async () => {
    let currentTime = now * 1000;
    const token = tokenFor({ ...claims, exp: now + 1 });
    await expectError(await respond({
      getSession: async () => sessionFor(token),
      now: () => currentTime,
      requireActor: async () => {
        currentTime += elapsedMilliseconds;
        return actor;
      },
    }), 401);
  });
}

for (const headers of [
  { Origin: "https://evil.example" },
  { Origin: "null" },
  { Origin: "https://app.example.evil.example" },
  { Origin: "https://app.example", "Sec-Fetch-Site": "cross-site" },
  { "Sec-Fetch-Site": "cross-site" },
]) {
  test("rejects conflicting origin metadata " + JSON.stringify(headers), async () => {
    await expectError(await respond({}, requestFor(headers)), 403);
  });
}
for (const appBaseUrl of [undefined, "", "invalid", "file:///tmp/app"]) {
  test("fails closed for invalid application URL " + String(appBaseUrl), async () => {
    await expectError(await respond({ appBaseUrl }), 503);
  });
}
test("native GET without Origin succeeds", async () => {
  assert.equal((await respond()).status, 200);
});
test("actor subject mismatch rejects caller identity even with forged query", async () => {
  await expectError(await respond({
    requireActor: async () => ({ ...actor, auth0Subject: "auth0|other" }),
  }, requestFor({}, "?auth0Subject=auth0%7Cendpoint-test&role=admin")), 401);
});
test("fresh archived actor denial cannot be overridden by request actor data", async () => {
  await expectError(await respond({
    requireActor: async () => { throw new TestActorError(403); },
  }, requestFor({}, "?actor=active&role=admin")), 403);
});
test("actor session loss returns unauthorized", async () => {
  await expectError(await respond({
    requireActor: async () => { throw new TestActorError(401); },
  }), 401);
});
for (const dependency of ["getSession", "requireActor"]) {
  test("sanitizes " + dependency + " failure", async () => {
    await expectError(await respond({
      [dependency]: async () => { throw new Error("postgres provider-secret"); },
    }), 503);
  });
}
for (const status of [401, 403]) {
  test("generic provider status cannot impersonate actor denial " + status, async () => {
    await expectError(await respond({
      requireActor: async () => { throw Object.assign(new Error("provider-secret"), { status }); },
    }), 503);
  });
}
test("request URL origin must match configured application", async () => {
  await expectError(await respond({}, new Request("https://other.example/api/auth/supabase-token")), 403);
});
