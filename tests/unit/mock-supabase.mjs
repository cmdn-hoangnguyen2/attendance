/**
 * Mock Supabase Realtime Client for pure unit testing without network dependencies.
 */
export class MockRealtimeChannel {
  constructor(name) {
    this.name = name;
    this.listeners = [];
    this.status = "INIT";
    this.unsubscribed = false;
  }

  on(type, filter, callback) {
    this.listeners.push({ type, filter, callback });
    return this;
  }

  subscribe(statusCallback) {
    this.status = "SUBSCRIBED";
    if (typeof statusCallback === "function") {
      statusCallback("SUBSCRIBED");
    }
    return this;
  }

  unsubscribe() {
    this.unsubscribed = true;
    this.status = "CLOSED";
    return this;
  }

  /**
   * Helper to simulate a realtime postgres_change event.
   */
  emitChange(table, payload = {}) {
    for (const listener of this.listeners) {
      if (listener.type === "postgres_changes") {
        const matchesTable = !listener.filter?.table || listener.filter.table === table;
        if (matchesTable) {
          listener.callback(payload);
        }
      }
    }
  }
}

export class MockSupabaseClient {
  constructor() {
    this.channels = new Map();
  }

  channel(name) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new MockRealtimeChannel(name));
    }
    return this.channels.get(name);
  }

  removeChannel(channel) {
    if (!channel) return;
    const ch = this.channels.get(channel.name);
    if (ch) {
      ch.unsubscribe();
      this.channels.delete(channel.name);
    }
  }
}
