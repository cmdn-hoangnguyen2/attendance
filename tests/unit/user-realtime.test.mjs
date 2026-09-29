import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createRealtimeChannelName } from "../../src/lib/realtime/createRealtimeChannelName.mjs";
import { MockSupabaseClient } from "./mock-supabase.mjs";

describe("User Realtime Flow (Unit Tests)", () => {
  function createUserRealtimeController({ userId, onDataChange, enabled = true, client }) {
    let debounceTimer = null;
    let channel = null;

    function start() {
      if (!enabled || !userId) return;

      const triggerUpdate = () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          onDataChange();
        }, 300);
      };

      const channelName = createRealtimeChannelName(`user:${userId}`);
      channel = client.channel(channelName);

      // 1. Fund contribution changes for this user
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fund_contributions",
          filter: `contributor_id=eq.${userId}`,
        },
        triggerUpdate
      );

      // 2. Payments table changes
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
    return { channel, cleanup };
  }

  test("subscribes to fund_contributions and payments for specific user", () => {
    const client = new MockSupabaseClient();
    const userId = "user-789";

    const controller = createUserRealtimeController({
      userId,
      onDataChange: () => {},
      enabled: true,
      client,
    });

    assert.ok(controller.channel);
    assert.strictEqual(controller.channel.listeners.length, 2);

    const fundListener = controller.channel.listeners.find((l) => l.filter.table === "fund_contributions");
    assert.strictEqual(fundListener.filter.filter, `contributor_id=eq.${userId}`);

    const paymentListener = controller.channel.listeners.find((l) => l.filter.table === "payments");
    assert.ok(paymentListener);

    controller.cleanup();
  });

  test("debounces updates when payment is recorded", async () => {
    const client = new MockSupabaseClient();
    let updates = 0;
    const controller = createUserRealtimeController({
      userId: "user-789",
      onDataChange: () => updates++,
      enabled: true,
      client,
    });

    controller.channel.emitChange("fund_contributions", { eventType: "UPDATE" });
    controller.channel.emitChange("payments", { eventType: "INSERT" });

    assert.strictEqual(updates, 0);

    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.strictEqual(updates, 1);

    controller.cleanup();
  });

  test("creates separate channels for simultaneous subscriptions to the same user", () => {
    const client = new MockSupabaseClient();
    const originalNow = Date.now;

    Date.now = () => 1790687403143;

    try {
      const firstController = createUserRealtimeController({
        userId: "user-789",
        onDataChange: () => {},
        enabled: true,
        client,
      });

      assert.doesNotThrow(() =>
        createUserRealtimeController({
          userId: "user-789",
          onDataChange: () => {},
          enabled: true,
          client,
        })
      );

      firstController.cleanup();
    } finally {
      Date.now = originalNow;
    }
  });
});
