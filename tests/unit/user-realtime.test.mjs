import { test } from "node:test";
import assert from "node:assert/strict";
import { MockSupabaseClient } from "./mock-supabase.mjs";

const lifecycle = await import("../../src/lib/supabase/browserAuthLifecycle.mjs").catch((cause) => {
  if (cause.code !== "ERR_MODULE_NOT_FOUND") throw cause;
  return {};
});
function subscribe(options) {
  assert.equal(typeof lifecycle.subscribeUserRealtime, "function", "hook must share actual production subscription logic");
  return lifecycle.subscribeUserRealtime(options);
}

test("financial subscription preserves contributions, payments and own notifications", (t) => {
  const client = new MockSupabaseClient();
  const cleanup = subscribe({ userId: "user-789", onDataChange() {}, client });
  t.after(cleanup);
  const channel = [...client.channels.values()][0];
  assert.deepEqual(channel.listeners.map(({ filter }) => filter), [
    { event: "*", schema: "public", table: "fund_contributions", filter: "contributor_id=eq.user-789" },
    { event: "*", schema: "public", table: "payments" },
    { event: "*", schema: "public", table: "app_notifications", filter: "user_id=eq.user-789" },
  ]);
});

test("actual financial callback debounces bursts and cleanup prevents delayed notifications", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const client = new MockSupabaseClient();
  let updates = 0;
  const cleanup = subscribe({ userId: "user-789", onDataChange: () => updates++, client });
  const channel = [...client.channels.values()][0];
  channel.emitChange("fund_contributions");
  channel.emitChange("payments");
  channel.emitChange("app_notifications");
  assert.equal(updates, 0);
  t.mock.timers.tick(300);
  assert.equal(updates, 1);
  channel.emitChange("payments");
  cleanup();
  t.mock.timers.tick(300);
  assert.equal(updates, 1);
  assert.equal(client.channels.size, 0);
  assert.equal(channel.unsubscribed, true);
});

test("simultaneous same-user financial subscriptions have distinct channels", () => {
  const client = new MockSupabaseClient();
  const first = subscribe({ userId: "user-789", onDataChange() {}, client });
  const second = subscribe({ userId: "user-789", onDataChange() {}, client });
  assert.equal(client.channels.size, 2);
  first();
  second();
  assert.equal(client.channels.size, 0);
});

test("disabled or missing-user subscriptions create no channel", () => {
  const client = new MockSupabaseClient();
  subscribe({ userId: "user-a", enabled: false, onDataChange() {}, client })();
  subscribe({ userId: "", onDataChange() {}, client })();
  assert.equal(client.channels.size, 0);
});
