import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const lifecycle = await import("../../src/lib/supabase/browserAuthLifecycle.mjs").catch((cause) => {
  if (cause.code !== "ERR_MODULE_NOT_FOUND") throw cause;
  return {};
});

const profile = (id = "user-a", globalRole = "user") => ({
  user: {
    id, auth0Subject: `auth0|${id}`, email: `${id}@example.test`, displayName: id,
    role: "user", status: "active", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
  },
  globalRole,
});
const response = (status, body) => ({
  status, ok: status >= 200 && status < 300, json: async () => body,
});
const flush = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };
function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}
function harness(t, fetchProfile) {
  assert.equal(typeof lifecycle.createBrowserAuthLifecycle, "function", "production lifecycle controller must exist");
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const states = [];
  const eventTarget = new EventTarget();
  const channels = [];
  const removed = [];
  let clears = 0;
  const client = {
    channel(name) {
      const channel = {
        name, listeners: [],
        on(type, filter, callback) { this.listeners.push({ type, filter, callback }); return this; },
        subscribe(callback) { this.statusCallback = callback; return this; },
      };
      channels.push(channel);
      return channel;
    },
    removeChannel(channel) { removed.push(channel); },
  };
  const controller = lifecycle.createBrowserAuthLifecycle({
    fetchProfile, client, eventTarget,
    clearTokenCache: () => { clears++; },
    onStateChange: (state) => states.push(state),
  });
  t.after(() => controller.dispose());
  return { controller, states, eventTarget, channels, removed, get clears() { return clears; } };
}

test("lazy browser client imports without public config and fails only on required access", () => {
  const script = `
    import { registerHooks } from "node:module";
    registerHooks({ resolve(specifier, context, nextResolve) {
      if (specifier === "@/lib/supabase/tokenProvider") return nextResolve(new URL("./src/lib/supabase/tokenProvider.ts", import.meta.url).href, context);
      return nextResolve(specifier, context);
    } });
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { supabase, createBrowserSupabaseClient } = await import("./src/lib/supabase/client.ts");
    for (const access of [() => supabase.from("users"), () => createBrowserSupabaseClient()]) {
      try { access(); process.exit(2); } catch (cause) {
        if (!/Supabase.*config|Supabase.*configuration/i.test(cause.message)) throw cause;
      }
    }
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("browser SDK sends cached session ID token and obtains a new token after cache clearing", () => {
  const script = `
    import assert from "node:assert/strict";
    import { registerHooks } from "node:module";
    registerHooks({ resolve(specifier, context, nextResolve) {
      if (specifier === "@/lib/supabase/tokenProvider") return nextResolve(new URL("./src/lib/supabase/tokenProvider.ts", import.meta.url).href, context);
      return nextResolve(specifier, context);
    } });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fixture.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fixture-public-key";
    let calls = 0;
    const headers = [];
    globalThis.fetch = async (url, options) => {
      if (url === "/api/auth/supabase-token") {
        calls++;
        return Response.json({ token: calls === 1 ? "session-a-id-token" : "session-b-id-token", expiresAt: Date.now() / 1000 + 3600 });
      }
      headers.push(new Headers(options.headers).get("authorization"));
      return Response.json([]);
    };
    const { createBrowserSupabaseClient } = await import("./src/lib/supabase/client.ts");
    const { clearSupabaseTokenCache } = await import("./src/lib/supabase/tokenProvider.ts");
    const client = createBrowserSupabaseClient();
    await client.from("users").select("id");
    await client.from("users").select("id");
    assert.deepEqual(headers, ["Bearer session-a-id-token", "Bearer session-a-id-token"]);
    assert.equal(calls, 1);
    clearSupabaseTokenCache();
    await client.from("users").select("id");
    assert.equal(headers.at(-1), "Bearer session-b-id-token");
    assert.equal(calls, 2);
    assert.throws(() => client.auth.getSession(), /accessToken/);
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("authoritative active profile creates only an own users-row lifecycle subscription", async (t) => {
  const calls = [];
  const state = harness(t, async (...args) => { calls.push(args); return response(200, profile()); });
  await state.controller.start();
  assert.equal(state.states.at(-1).currentUser.id, "user-a");
  assert.equal(state.states.at(-1).globalRole, "user");
  assert.equal(state.states.at(-1).isLoading, false);
  assert.equal(calls[0][0], "/api/me");
  assert.equal(calls[0][1].cache, "no-store");
  assert.equal(calls[0][1].credentials, "same-origin");
  assert.equal(state.channels.length, 1);
  assert.deepEqual(state.channels[0].listeners[0].filter, {
    event: "*", schema: "public", table: "users", filter: "id=eq.user-a",
  });
  assert.equal(state.channels[0].listeners.length, 1);
});

test("burst, focus, online and reconnect refresh authoritatively without resubscribing or granting payload roles", async (t) => {
  let calls = 0;
  const state = harness(t, async () => { calls++; return response(200, profile()); });
  await state.controller.start();
  const channel = state.channels[0];
  channel.listeners[0].callback({ new: { id: "intruder", role: "admin", status: "active" } });
  channel.listeners[0].callback({});
  state.eventTarget.dispatchEvent(new Event("focus"));
  state.eventTarget.dispatchEvent(new Event("online"));
  channel.statusCallback("SUBSCRIBED");
  t.mock.timers.tick(300);
  await flush();
  assert.equal(calls, 2);
  assert.equal(state.channels.length, 1);
  assert.equal(state.removed.length, 0);
  assert.equal(state.states.at(-1).globalRole, "user");
  assert.equal(state.states.at(-1).currentUser.id, "user-a");
  assert.ok(state.states.every((snapshot, index) => index === 0 || snapshot.currentUser !== null));
  channel.statusCallback("SUBSCRIBED");
  t.mock.timers.tick(300);
  await flush();
  assert.equal(calls, 3);
  assert.equal(state.channels.length, 1);
});

test("signals arriving during a refresh coalesce into one trailing authoritative request", async (t) => {
  const pending = deferred();
  let calls = 0;
  const state = harness(t, async () => {
    calls++;
    if (calls === 2) return pending.promise;
    return response(200, profile());
  });
  await state.controller.start();
  const refresh = state.controller.refresh();
  for (let index = 0; index < 6; index++) state.eventTarget.dispatchEvent(new Event("focus"));
  t.mock.timers.tick(300);
  assert.equal(calls, 2);
  pending.resolve(response(200, profile()));
  await refresh;
  await flush();
  assert.equal(calls, 3);
  t.mock.timers.tick(30000);
  await flush();
  assert.equal(calls, 3);
});

for (const status of [401, 403]) {
  test(`session ${status} clears identity, token cache and own channel`, async (t) => {
    let calls = 0;
    const state = harness(t, async () => response(++calls === 1 ? 200 : status, profile()));
    await state.controller.start();
    await state.controller.refresh();
    assert.equal(state.states.at(-1).currentUser, null);
    assert.equal(state.states.at(-1).globalRole, "user");
    assert.equal(state.states.at(-1).isLoading, false);
    assert.equal(state.clears, 1);
    assert.deepEqual(state.removed, [state.channels[0]]);
    if (status === 403) assert.match(state.states.at(-1).error, /Tài khoản đã được lưu trữ/);
    if (status === 401) assert.equal(state.states.at(-1).error, null);
  });
}

test("logout prevents a pending response from restoring identity or a subscription", async (t) => {
  const pending = deferred();
  const state = harness(t, () => pending.promise);
  const initial = state.controller.start();
  state.controller.logout();
  pending.resolve(response(200, profile("old-user", "admin")));
  await initial;
  assert.equal(state.states.at(-1).currentUser, null);
  assert.equal(state.states.at(-1).globalRole, "user");
  assert.equal(state.clears, 1);
  assert.equal(state.channels.length, 0);
});

test("account replacement clears token cache and removes previous own subscription", async (t) => {
  let calls = 0;
  const state = harness(t, async () => response(200, profile(++calls === 1 ? "user-a" : "user-b")));
  await state.controller.start();
  await state.controller.refresh();
  assert.equal(state.clears, 1);
  assert.deepEqual(state.removed, [state.channels[0]]);
  assert.equal(state.channels[1].listeners[0].filter.filter, "id=eq.user-b");
  assert.equal(state.states.at(-1).currentUser.id, "user-b");
});

test("finite timeout ends loading even if transport ignores abort; retry ignores the old result", async (t) => {
  const old = deferred();
  let calls = 0;
  const state = harness(t, () => ++calls === 1 ? old.promise : Promise.resolve(response(200, profile("new-user"))));
  const initial = state.controller.start();
  t.mock.timers.tick(15000);
  await initial;
  assert.equal(state.states.at(-1).isLoading, false);
  assert.match(state.states.at(-1).error, /Vui lòng thử lại/);
  await state.controller.refresh();
  old.resolve(response(200, profile("old-user", "admin")));
  await flush();
  assert.equal(state.states.at(-1).currentUser.id, "new-user");
  assert.equal(state.states.at(-1).globalRole, "user");
});

test("dispose aborts pending work and removes listeners, timers and channel without late state changes", async (t) => {
  const pending = deferred();
  let calls = 0;
  const state = harness(t, () => ++calls === 1 ? Promise.resolve(response(200, profile())) : pending.promise);
  await state.controller.start();
  const refresh = state.controller.refresh();
  state.eventTarget.dispatchEvent(new Event("focus"));
  state.controller.dispose();
  const count = state.states.length;
  pending.resolve(response(200, profile("late")));
  await refresh;
  state.eventTarget.dispatchEvent(new Event("online"));
  t.mock.timers.tick(30000);
  await flush();
  assert.equal(state.states.length, count);
  assert.equal(calls, 2);
  assert.deepEqual(state.removed, [state.channels[0]]);
});

test("invalid role or inactive 200 profile cannot retain authenticated identity", async (t) => {
  let calls = 0;
  const state = harness(t, async () => response(200, ++calls === 1 ? profile() : profile("user-a", "superadmin")));
  await state.controller.start();
  await state.controller.refresh();
  assert.equal(state.states.at(-1).currentUser, null);
  assert.equal(state.states.at(-1).globalRole, "user");
  assert.match(state.states.at(-1).error, /không hợp lệ/);
  assert.equal(state.clears, 1);
});
