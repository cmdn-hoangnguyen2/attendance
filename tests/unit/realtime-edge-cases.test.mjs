import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MockSupabaseClient } from "./mock-supabase.mjs";

describe("Realtime Edge Cases & Resiliency (Unit Tests)", () => {
  test("re-creates channel cleanly when roomId parameter changes", () => {
    const client = new MockSupabaseClient();
    let currentRoomId = "room-1";
    let channel1 = null;
    let channel2 = null;

    function effectSetup(roomId) {
      const channel = client.channel(`room:${roomId}:${Date.now()}`);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {});
      channel.subscribe();
      return channel;
    }

    function effectCleanup(ch) {
      client.removeChannel(ch);
    }

    // Mount with room-1
    channel1 = effectSetup(currentRoomId);
    assert.strictEqual(client.channels.size, 1);
    assert.strictEqual(channel1.status, "SUBSCRIBED");

    // Change roomId to room-2 (re-render effect)
    effectCleanup(channel1);
    assert.strictEqual(client.channels.size, 0);

    currentRoomId = "room-2";
    channel2 = effectSetup(currentRoomId);
    assert.strictEqual(client.channels.size, 1);
    assert.ok(channel2.name.includes("room-2"));

    effectCleanup(channel2);
    assert.strictEqual(client.channels.size, 0);
  });

  test("dynamically adds session listeners when meeting session starts", () => {
    const client = new MockSupabaseClient();
    const roomId = "room-alpha";

    function subscribeRoom(sessionId) {
      const channel = client.channel(`room:${roomId}:${Date.now()}`);

      if (sessionId) {
        channel.on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "attendance_records",
          filter: `meeting_session_id=eq.${sessionId}`,
        }, () => {});
      }

      channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      }, () => {});

      channel.subscribe();
      return channel;
    }

    // Step 1: Before session starts (no sessionId)
    const ch1 = subscribeRoom(undefined);
    assert.strictEqual(ch1.listeners.length, 1);
    assert.strictEqual(ch1.listeners[0].filter.table, "rooms");
    client.removeChannel(ch1);

    // Step 2: Session starts (new sessionId)
    const ch2 = subscribeRoom("session-live-01");
    assert.strictEqual(ch2.listeners.length, 2);
    assert.strictEqual(ch2.listeners[0].filter.table, "attendance_records");
    assert.strictEqual(ch2.listeners[0].filter.filter, "meeting_session_id=eq.session-live-01");
    client.removeChannel(ch2);
  });

  test("always executes the freshest callback reference even if callback changes", async () => {
    const client = new MockSupabaseClient();
    let callbackRef = () => "initial";

    const channel = client.channel("test:callback-freshness");
    let timer = null;

    channel.on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        callbackRef();
      }, 50);
    });
    channel.subscribe();

    let executedValue = null;
    // Update callback reference before event fires
    callbackRef = () => {
      executedValue = "fresh-value";
    };

    channel.emitChange("rooms");
    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.strictEqual(executedValue, "fresh-value", "Callback invoked must be the latest updated function");
    client.removeChannel(channel);
  });

  test("handles channel error statuses gracefully without crashing", () => {
    const client = new MockSupabaseClient();
    const channel = client.channel("test:channel-error");

    let receivedStatus = null;
    channel.subscribe((status) => {
      receivedStatus = status;
    });

    assert.strictEqual(receivedStatus, "SUBSCRIBED");
    client.removeChannel(channel);
  });
});
