import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Membership Lifecycle & Archive Filtering (Unit Tests)", () => {
  class MockRoomAndMembershipService {
    constructor() {
      this.rooms = new Map();
      this.memberships = new Map(); // key: `${roomId}:${userId}`
      this.debts = new Map(); // key: contributionId, value: { roomId, userId, status }
      this.auditLogs = [];
    }

    addRoom({ id, name, ownerId, status = "active" }) {
      this.rooms.set(id, { id, name, ownerId, status });
    }

    addMembership({ roomId, userId, status = "active" }) {
      this.memberships.set(`${roomId}:${userId}`, {
        roomId,
        userId,
        status,
        joinedAt: new Date().toISOString(),
        leftAt: null,
      });
    }

    addDebt({ id, roomId, userId, status = "outstanding" }) {
      this.debts.set(id, { id, roomId, userId, status });
    }

    async leave(roomId, userId) {
      const room = this.rooms.get(roomId);
      if (room && room.ownerId === userId) {
        throw new Error("Chủ phòng không thể tự rời phòng. Vui lòng chuyển giao quyền chủ phòng hoặc lưu trữ phòng họp trước.");
      }

      const key = `${roomId}:${userId}`;
      const mem = this.memberships.get(key);
      if (!mem || mem.status !== "active") {
        throw new Error("Thành viên không tồn tại hoặc đã rời phòng.");
      }

      mem.status = "left";
      mem.leftAt = new Date().toISOString();
      return mem;
    }

    async removeMember(roomId, userId, actorId, reason, confirmationPhrase) {
      const debts = Array.from(this.debts.values()).filter(
        (d) => d.roomId === roomId && d.userId === userId && d.status === "outstanding"
      );

      if (debts.length > 0) {
        if (confirmationPhrase?.trim() !== "I agree to remove this user") {
          throw new Error("Confirmation phrase 'I agree to remove this user' required for member with debt");
        }
      }

      const key = `${roomId}:${userId}`;
      const mem = this.memberships.get(key);
      if (!mem || mem.status !== "active") {
        throw new Error("Thành viên không hoạt động trong phòng.");
      }

      mem.status = "removed";
      mem.removedAt = new Date().toISOString();
      mem.removedBy = actorId;
      mem.removalReason = reason;

      this.auditLogs.push({
        action: "membership.removed",
        actorId,
        targetId: `${roomId}:${userId}`,
        metadata: { reason, hadOutstandingDebt: debts.length > 0 },
      });

      return mem;
    }

    async findByOwnerId(ownerId) {
      return Array.from(this.rooms.values()).filter(
        (r) => r.ownerId === ownerId && r.status === "active"
      );
    }

    async findJoinedByUserId(userId) {
      const activeMemberships = Array.from(this.memberships.values()).filter(
        (m) => m.userId === userId && m.status === "active"
      );
      const roomIds = activeMemberships.map((m) => m.roomId);
      return Array.from(this.rooms.values()).filter(
        (r) => roomIds.includes(r.id) && r.status === "active"
      );
    }
  }

  describe("Leave Room Guards (docs/01-product-scope.md line 26-27)", () => {
    test("allows a regular active member to leave the room", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "room-1", name: "Alpha", ownerId: "user-owner" });
      service.addMembership({ roomId: "room-1", userId: "user-member", status: "active" });

      const updated = await service.leave("room-1", "user-member");
      assert.strictEqual(updated.status, "left");
      assert.ok(updated.leftAt);
    });

    test("strictly rejects room owner from leaving the room", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "room-1", name: "Alpha", ownerId: "user-owner" });
      service.addMembership({ roomId: "room-1", userId: "user-owner", status: "active" });

      await assert.rejects(
        () => service.leave("room-1", "user-owner"),
        /Chủ phòng không thể tự rời phòng/
      );
    });
  });

  describe("Remove Member With Debt Validation (docs/03-domain-and-states.md line 57-58)", () => {
    test("rejects removal of member with outstanding debt when confirmation phrase is missing or incorrect", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "room-1", name: "Alpha", ownerId: "user-owner" });
      service.addMembership({ roomId: "room-1", userId: "user-debtor", status: "active" });
      service.addDebt({ id: "d-1", roomId: "room-1", userId: "user-debtor", status: "outstanding" });

      // No phrase provided
      await assert.rejects(
        () => service.removeMember("room-1", "user-debtor", "user-owner", "Banned", ""),
        /Confirmation phrase 'I agree to remove this user' required/
      );

      // Wrong phrase provided
      await assert.rejects(
        () => service.removeMember("room-1", "user-debtor", "user-owner", "Banned", "agree to remove"),
        /Confirmation phrase 'I agree to remove this user' required/
      );
    });

    test("successfully removes member with debt when exact phrase 'I agree to remove this user' is provided", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "room-1", name: "Alpha", ownerId: "user-owner" });
      service.addMembership({ roomId: "room-1", userId: "user-debtor", status: "active" });
      service.addDebt({ id: "d-1", roomId: "room-1", userId: "user-debtor", status: "outstanding" });

      const removed = await service.removeMember(
        "room-1",
        "user-debtor",
        "user-owner",
        "Disciplinary",
        "  I agree to remove this user  "
      );

      assert.strictEqual(removed.status, "removed");
      const audit = service.auditLogs.find((l) => l.action === "membership.removed");
      assert.ok(audit);
      assert.strictEqual(audit.metadata.hadOutstandingDebt, true);
    });

    test("allows removal of member without debt without requiring confirmation phrase", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "room-1", name: "Alpha", ownerId: "user-owner" });
      service.addMembership({ roomId: "room-1", userId: "user-clean", status: "active" });

      const removed = await service.removeMember(
        "room-1",
        "user-clean",
        "user-owner",
        "Left voluntarily"
      );

      assert.strictEqual(removed.status, "removed");
      const audit = service.auditLogs.find((l) => l.action === "membership.removed");
      assert.ok(audit);
      assert.strictEqual(audit.metadata.hadOutstandingDebt, false);
    });
  });

  describe("Active vs Archived Room Queries (docs/03-domain-and-states.md line 50)", () => {
    test("findByOwnerId excludes archived rooms", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "r-active", name: "Active Room", ownerId: "u-owner", status: "active" });
      service.addRoom({ id: "r-archived", name: "Archived Room", ownerId: "u-owner", status: "archived" });

      const owned = await service.findByOwnerId("u-owner");
      assert.strictEqual(owned.length, 1);
      assert.strictEqual(owned[0].id, "r-active");
    });

    test("findJoinedByUserId excludes archived rooms", async () => {
      const service = new MockRoomAndMembershipService();
      service.addRoom({ id: "r-active", name: "Active Room", ownerId: "u-other", status: "active" });
      service.addRoom({ id: "r-archived", name: "Archived Room", ownerId: "u-other", status: "archived" });

      service.addMembership({ roomId: "r-active", userId: "u-member", status: "active" });
      service.addMembership({ roomId: "r-archived", userId: "u-member", status: "active" });

      const joined = await service.findJoinedByUserId("u-member");
      assert.strictEqual(joined.length, 1);
      assert.strictEqual(joined[0].id, "r-active");
    });
  });
});
