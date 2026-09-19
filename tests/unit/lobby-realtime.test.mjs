import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MockSupabaseClient } from "./mock-supabase.mjs";

describe("Lobby Realtime Flow (Unit Tests)", () => {
  function createLobbyRealtimeController({ onDataChange, enabled = true, client }) {
    let debounceTimer = null;
    let channel = null;

    function start() {
      if (!enabled) return;

      const triggerUpdate = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          onDataChange();
        }, 300);
      };

      const channelName = `lobby:global:${Date.now()}`;
      channel = client.channel(channelName);

      // 1. Rooms changes
      channel.on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, triggerUpdate);

      // 2. Room memberships changes (memberCount calculation)
      channel.on("postgres_changes", { event: "*", schema: "public", table: "room_memberships" }, triggerUpdate);

      // 3. Join requests changes
      channel.on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, triggerUpdate);

      channel.subscribe();
    }

    function cleanup() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (channel) {
        client.removeChannel(channel);
      }
    }

    start();
    return { channel, cleanup, getDebounceTimer: () => debounceTimer };
  }

  test("subscribes to rooms, room_memberships, and join_requests on public schema", () => {
    const client = new MockSupabaseClient();
    let updates = 0;
    const controller = createLobbyRealtimeController({
      onDataChange: () => updates++,
      enabled: true,
      client,
    });

    assert.ok(controller.channel, "Channel should be created");
    assert.strictEqual(controller.channel.status, "SUBSCRIBED");

    const tables = controller.channel.listeners.map((l) => l.filter.table);
    assert.deepStrictEqual(tables, ["rooms", "room_memberships", "join_requests"]);

    controller.cleanup();
  });

  test("does not subscribe or create channel when enabled is false", () => {
    const client = new MockSupabaseClient();
    let updates = 0;
    const controller = createLobbyRealtimeController({
      onDataChange: () => updates++,
      enabled: false,
      client,
    });

    assert.strictEqual(controller.channel, null);
    assert.strictEqual(client.channels.size, 0);
  });

  test("debounces rapid bursts of events into a single onDataChange call", async () => {
    const client = new MockSupabaseClient();
    let updates = 0;
    const controller = createLobbyRealtimeController({
      onDataChange: () => updates++,
      enabled: true,
      client,
    });

    // Simulate 5 rapid events across different tables
    controller.channel.emitChange("rooms", { eventType: "UPDATE" });
    controller.channel.emitChange("room_memberships", { eventType: "INSERT" });
    controller.channel.emitChange("join_requests", { eventType: "INSERT" });
    controller.channel.emitChange("rooms", { eventType: "UPDATE" });
    controller.channel.emitChange("room_memberships", { eventType: "DELETE" });

    assert.strictEqual(updates, 0, "Callback should not fire immediately before 300ms debounce");

    // Wait for 350ms (debounce duration + buffer)
    await new Promise((resolve) => setTimeout(resolve, 350));

    assert.strictEqual(updates, 1, "5 rapid events should be coalesced into exactly 1 update");

    controller.cleanup();
  });

  test("cancels pending timer and removes channel on unmount / cleanup", async () => {
    const client = new MockSupabaseClient();
    let updates = 0;
    const controller = createLobbyRealtimeController({
      onDataChange: () => updates++,
      enabled: true,
      client,
    });

    // Trigger an event
    controller.channel.emitChange("rooms", { eventType: "UPDATE" });
    assert.ok(controller.getDebounceTimer(), "Timer should be active");

    // Cleanup immediately before timer completes
    controller.cleanup();

    // Verify channel is removed and unsubscribed
    assert.strictEqual(client.channels.size, 0);
    assert.strictEqual(controller.channel.status, "CLOSED");

    // Wait past debounce period
    await new Promise((resolve) => setTimeout(resolve, 350));

    assert.strictEqual(updates, 0, "Callback should NOT fire after cleanup");
  });
});
