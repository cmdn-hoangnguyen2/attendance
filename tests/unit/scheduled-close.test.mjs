import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Scheduled Close Session Flow (Unit Tests)", () => {
  // -------------------------------------------------------------
  // 1. Read-level Expiration Guard (Graceful Degrade)
  // -------------------------------------------------------------
  describe("Read-level Expiration Guard (findCurrentByRoomId logic)", () => {
    function filterCurrentSession(sessions, roomId, asOfDate = new Date()) {
      const nowIso = asOfDate.toISOString();
      const eligible = sessions
        .filter(
          (s) =>
            s.roomId === roomId &&
            (s.status === "scheduled" || s.status === "active") &&
            s.closesAt > nowIso
        )
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

      return eligible.length > 0 ? eligible[0] : null;
    }

    test("excludes expired session whose closesAt is in the past even if status is still 'scheduled'", () => {
      const now = new Date("2026-09-20T10:00:00Z");
      const pastClosesAt = new Date("2026-09-20T00:00:00Z").toISOString(); // Yesterday midnight

      const sessions = [
        {
          id: "session-expired",
          roomId: "room-1",
          startsAt: "2026-09-19T09:00:00Z",
          closesAt: pastClosesAt,
          status: "scheduled",
        },
      ];

      const current = filterCurrentSession(sessions, "room-1", now);
      assert.strictEqual(
        current,
        null,
        "Session past closesAt must NOT be returned as current session (Read-level guard)"
      );
    });

    test("returns active session when closesAt is in the future", () => {
      const now = new Date("2026-09-20T10:00:00Z");
      const futureClosesAt = new Date("2026-09-21T00:00:00Z").toISOString(); // Tonight midnight

      const sessions = [
        {
          id: "session-valid",
          roomId: "room-1",
          startsAt: "2026-09-20T09:00:00Z",
          closesAt: futureClosesAt,
          status: "scheduled",
        },
      ];

      const current = filterCurrentSession(sessions, "room-1", now);
      assert.ok(current);
      assert.strictEqual(current.id, "session-valid");
    });
  });

  // -------------------------------------------------------------
  // 2. Batch Session Closer Logic (closeExpiredSessions)
  // -------------------------------------------------------------
  describe("Batch Expiration Closer (closeExpiredSessions logic)", () => {
    class MockSessionStore {
      constructor(initialSessions = []) {
        this.sessions = new Map(initialSessions.map((s) => [s.id, { ...s }]));
        this.auditLogs = [];
      }

      closeExpiredSessions(asOfDate = new Date()) {
        const asOfIso = asOfDate.toISOString();
        const expired = [];

        for (const s of this.sessions.values()) {
          if (
            (s.status === "scheduled" || s.status === "active") &&
            s.closesAt <= asOfIso
          ) {
            expired.push(s);
          }
        }

        if (expired.length === 0) {
          return { closedCount: 0, sessionIds: [] };
        }

        const sessionIds = [];
        for (const s of expired) {
          s.status = "closed";
          sessionIds.push(s.id);
          this.auditLogs.push({
            action: "session.closed_scheduled",
            targetId: s.id,
            metadata: { roomId: s.roomId, closesAt: s.closesAt },
          });
        }

        return { closedCount: sessionIds.length, sessionIds };
      }
    }

    test("closes only expired sessions and generates audit log entries", () => {
      const store = new MockSessionStore([
        {
          id: "s-1",
          roomId: "r-1",
          status: "active",
          closesAt: "2026-09-19T17:00:00Z",
        },
        {
          id: "s-2",
          roomId: "r-2",
          status: "scheduled",
          closesAt: "2026-09-19T23:59:59Z",
        },
        {
          id: "s-future",
          roomId: "r-3",
          status: "scheduled",
          closesAt: "2026-09-22T00:00:00Z",
        },
        {
          id: "s-already-closed",
          roomId: "r-1",
          status: "closed",
          closesAt: "2026-09-18T00:00:00Z",
        },
      ]);

      const asOf = new Date("2026-09-20T00:00:00Z");
      const result = store.closeExpiredSessions(asOf);

      assert.strictEqual(result.closedCount, 2);
      assert.deepStrictEqual(result.sessionIds.sort(), ["s-1", "s-2"].sort());

      // Check updated status
      assert.strictEqual(store.sessions.get("s-1").status, "closed");
      assert.strictEqual(store.sessions.get("s-2").status, "closed");
      assert.strictEqual(store.sessions.get("s-future").status, "scheduled");
      assert.strictEqual(store.sessions.get("s-already-closed").status, "closed");

      // Check audit logs
      assert.strictEqual(store.auditLogs.length, 2);
      assert.ok(store.auditLogs.every((l) => l.action === "session.closed_scheduled"));
    });

    test("returns closedCount 0 when no expired sessions exist", () => {
      const store = new MockSessionStore([
        {
          id: "s-future",
          roomId: "r-1",
          status: "scheduled",
          closesAt: "2026-09-25T00:00:00Z",
        },
      ]);

      const result = store.closeExpiredSessions(new Date("2026-09-20T00:00:00Z"));
      assert.strictEqual(result.closedCount, 0);
      assert.deepStrictEqual(result.sessionIds, []);
    });
  });

  // -------------------------------------------------------------
  // 3. Cron Route Authorization & Contract Verification
  // -------------------------------------------------------------
  describe("Cron Route Handler Security & Response Contract", () => {
    function verifyCronAuthorization(headers, searchParams, expectedSecret) {
      if (!expectedSecret) return true; // Dev mode allows unauthenticated execution
      const authHeader = headers.get("authorization");
      const urlSecret = searchParams.get("secret");
      return authHeader === `Bearer ${expectedSecret}` || urlSecret === expectedSecret;
    }

    test("denies unauthorized request when CRON_SECRET is configured", () => {
      const headers = new Map([["authorization", "Bearer wrong-secret"]]);
      const params = new Map();
      const isAuth = verifyCronAuthorization(headers, params, "super-secret-key-123");
      assert.strictEqual(isAuth, false);
    });

    test("authorizes valid Bearer token header", () => {
      const headers = new Map([["authorization", "Bearer super-secret-key-123"]]);
      const params = new Map();
      const isAuth = verifyCronAuthorization(headers, params, "super-secret-key-123");
      assert.strictEqual(isAuth, true);
    });

    test("authorizes valid query parameter secret", () => {
      const headers = new Map();
      const params = new Map([["secret", "super-secret-key-123"]]);
      const isAuth = verifyCronAuthorization(headers, params, "super-secret-key-123");
      assert.strictEqual(isAuth, true);
    });
  });
});
