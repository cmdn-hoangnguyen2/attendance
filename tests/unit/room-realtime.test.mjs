import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MockSupabaseClient } from "./mock-supabase.mjs";

describe("Room Realtime Flow (Unit Tests)", () => {
  function createRoomRealtimeController({
    roomId,
    sessionId,
    onDataChange,
    enabled = true,
    client,
  }) {
    let debounceTimer = null;
    let channel = null;

    function start() {
      if (!enabled || !roomId) return;

      const triggerUpdate = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          onDataChange();
        }, 300);
      };

      const channelName = `room:${roomId}:${Date.now()}`;
      channel = client.channel(channelName);

      // 1. Attendance records (if sessionId present)
      if (sessionId) {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendance_records",
            filter: `meeting_session_id=eq.${sessionId}`,
          },
          triggerUpdate
        );

        // 2. Fund candidates (if sessionId present)
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "fund_candidates",
            filter: `meeting_session_id=eq.${sessionId}`,
          },
          triggerUpdate
        );
      }

      // 3. Meeting session updates
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meeting_sessions",
          filter: `room_id=eq.${roomId}`,
        },
        triggerUpdate
      );

      // 4. Join requests updates
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "join_requests",
          filter: `room_id=eq.${roomId}`,
        },
        triggerUpdate
      );

      // 5. Room membership changes (add/kick)
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_memberships",
          filter: `room_id=eq.${roomId}`,
        },
        triggerUpdate
      );

      // 6. Payment image updates
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_payment_images",
          filter: `room_id=eq.${roomId}`,
        },
        triggerUpdate
      );

      // 7. Room metadata changes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        triggerUpdate
      );

      // 8. Fund contributions changes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fund_contributions",
          filter: `room_id=eq.${roomId}`,
        },
        triggerUpdate
      );

      // 9. Payments changes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        triggerUpdate
      );

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

  test("subscribes to all 9 tables when sessionId is provided", () => {
    const client = new MockSupabaseClient();
    const roomId = "room-123";
    const sessionId = "session-456";

    const controller = createRoomRealtimeController({
      roomId,
      sessionId,
      onDataChange: () => {},
      enabled: true,
      client,
    });

    assert.ok(controller.channel, "Channel should be created");
    assert.strictEqual(controller.channel.listeners.length, 9);

    const listeners = controller.channel.listeners;
    const tableNames = listeners.map((l) => l.filter.table);

    assert.ok(tableNames.includes("attendance_records"));
    assert.ok(tableNames.includes("fund_candidates"));
    assert.ok(tableNames.includes("meeting_sessions"));
    assert.ok(tableNames.includes("join_requests"));
    assert.ok(tableNames.includes("room_memberships"));
    assert.ok(tableNames.includes("room_payment_images"));
    assert.ok(tableNames.includes("rooms"));
    assert.ok(tableNames.includes("fund_contributions"));
    assert.ok(tableNames.includes("payments"));

    // Check specific filters
    const attListener = listeners.find((l) => l.filter.table === "attendance_records");
    assert.strictEqual(attListener.filter.filter, `meeting_session_id=eq.${sessionId}`);

    const memListener = listeners.find((l) => l.filter.table === "room_memberships");
    assert.strictEqual(memListener.filter.filter, `room_id=eq.${roomId}`);

    const fundListener = listeners.find((l) => l.filter.table === "fund_contributions");
    assert.strictEqual(fundListener.filter.filter, `room_id=eq.${roomId}`);

    controller.cleanup();
  });

  test("subscribes to 7 tables when sessionId is omitted", () => {
    const client = new MockSupabaseClient();
    const roomId = "room-123";

    const controller = createRoomRealtimeController({
      roomId,
      sessionId: undefined,
      onDataChange: () => {},
      enabled: true,
      client,
    });

    assert.ok(controller.channel, "Channel should be created");
    assert.strictEqual(controller.channel.listeners.length, 7);

    const tableNames = controller.channel.listeners.map((l) => l.filter.table);
    assert.ok(!tableNames.includes("attendance_records"));
    assert.ok(!tableNames.includes("fund_candidates"));
    assert.ok(tableNames.includes("fund_contributions"));
    assert.ok(tableNames.includes("payments"));

    controller.cleanup();
  });

  test("debounces rapid attendance and fund events into single refresh", async () => {
    const client = new MockSupabaseClient();
    let updates = 0;
    const controller = createRoomRealtimeController({
      roomId: "room-abc",
      sessionId: "session-xyz",
      onDataChange: () => updates++,
      enabled: true,
      client,
    });

    // Simulate simultaneous attendance check-in, fund candidate generation, and payment event
    controller.channel.emitChange("attendance_records", { eventType: "INSERT" });
    controller.channel.emitChange("fund_candidates", { eventType: "INSERT" });
    controller.channel.emitChange("fund_contributions", { eventType: "INSERT" });
    controller.channel.emitChange("payments", { eventType: "INSERT" });

    assert.strictEqual(updates, 0, "No premature update before debounce");

    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.strictEqual(updates, 1, "Expected single batched update");

    controller.cleanup();
  });

  test("properly unsubscribes and cleans up channel upon leave/unmount", () => {
    const client = new MockSupabaseClient();
    const controller = createRoomRealtimeController({
      roomId: "room-abc",
      onDataChange: () => {},
      enabled: true,
      client,
    });

    assert.strictEqual(client.channels.size, 1);
    controller.cleanup();
    assert.strictEqual(client.channels.size, 0);
  });
});
