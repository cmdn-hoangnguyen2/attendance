import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Realtime State Transitions & Business Logic (Unit Tests)", () => {
  // -------------------------------------------------------------
  // 1. Kicked Member Detection Logic (Bugfix & Behavior verification)
  // -------------------------------------------------------------
  describe("Kicked Member State Detection", () => {
    function computeIsCurrentUserRemoved(memberships, currentUserId) {
      if (!currentUserId) return false;
      const hasActiveMembership = memberships.some(
        (m) => m.userId === currentUserId && m.status === "active"
      );
      const hasRemovedMembership = memberships.some(
        (m) => m.userId === currentUserId && m.status === "removed"
      );
      return !hasActiveMembership && hasRemovedMembership;
    }

    test("evaluates to TRUE when member has been removed by admin/owner", () => {
      const currentUserId = "user-1";
      const memberships = [
        { id: "m-1", roomId: "r-1", userId: "user-owner", status: "active" },
        { id: "m-2", roomId: "r-1", userId: "user-1", status: "removed" },
      ];

      const isRemoved = computeIsCurrentUserRemoved(memberships, currentUserId);
      assert.strictEqual(isRemoved, true, "User with only 'removed' membership must be flagged as kicked");
    });

    test("evaluates to FALSE when user is actively in the room", () => {
      const currentUserId = "user-1";
      const memberships = [
        { id: "m-1", roomId: "r-1", userId: "user-owner", status: "active" },
        { id: "m-2", roomId: "r-1", userId: "user-1", status: "active" },
      ];

      const isRemoved = computeIsCurrentUserRemoved(memberships, currentUserId);
      assert.strictEqual(isRemoved, false, "Active member must NOT be flagged as kicked");
    });

    test("evaluates to FALSE when user was never a member of the room", () => {
      const currentUserId = "user-stranger";
      const memberships = [
        { id: "m-1", roomId: "r-1", userId: "user-owner", status: "active" },
      ];

      const isRemoved = computeIsCurrentUserRemoved(memberships, currentUserId);
      assert.strictEqual(isRemoved, false, "Non-member must not trigger kicked dialog");
    });
  });

  // -------------------------------------------------------------
  // 2. Join Request Lifecycle & Cancellation Guard
  // -------------------------------------------------------------
  describe("Join Request Realtime Lifecycle & Action Guards", () => {
    function canCancelJoinRequest(requestStatus, isAlreadyMember) {
      if (isAlreadyMember) return false;
      if (requestStatus === "approved") return false;
      if (requestStatus === "pending") return true;
      return false;
    }

    test("allows cancellation ONLY when request is pending and user is not yet member", () => {
      assert.strictEqual(canCancelJoinRequest("pending", false), true);
    });

    test("guards against cancellation when request was approved via realtime", () => {
      // Prevents the bug where user cancels an already-approved request
      assert.strictEqual(canCancelJoinRequest("approved", false), false);
      assert.strictEqual(canCancelJoinRequest("approved", true), false);
    });

    test("guards against cancellation when user is already active member", () => {
      assert.strictEqual(canCancelJoinRequest("pending", true), false);
    });
  });

  // -------------------------------------------------------------
  // 3. Room Member Count Calculation (Lobby Realtime Sync)
  // -------------------------------------------------------------
  describe("Active Member Count Calculation", () => {
    function computeActiveMemberCount(memberships) {
      return memberships.filter((m) => m.status === "active").length;
    }

    test("calculates memberCount accurately ignoring removed members", () => {
      const memberships = [
        { id: "m-1", userId: "u-1", status: "active" },
        { id: "m-2", userId: "u-2", status: "active" },
        { id: "m-3", userId: "u-3", status: "removed" },
        { id: "m-4", userId: "u-4", status: "left" },
      ];

      assert.strictEqual(computeActiveMemberCount(memberships), 2);
    });

    test("accurately decrements memberCount when realtime member removal event is applied", () => {
      let memberships = [
        { id: "m-1", userId: "u-1", status: "active" },
        { id: "m-2", userId: "u-2", status: "active" },
      ];
      assert.strictEqual(computeActiveMemberCount(memberships), 2);

      // Simulate Realtime UPDATE event on room_memberships
      memberships = memberships.map((m) =>
        m.userId === "u-2" ? { ...m, status: "removed" } : m
      );

      assert.strictEqual(computeActiveMemberCount(memberships), 1);
    });
  });

  // -------------------------------------------------------------
  // 4. Fund Contribution, Payment Confirmation & Revert Logic
  // -------------------------------------------------------------
  describe("Fund Payment & Revert Realtime State Machine", () => {
    function computeBalances(contributions) {
      const outstanding = contributions
        .filter((c) => c.status === "outstanding")
        .reduce((sum, c) => sum + c.amount, 0);
      const paid = contributions
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + c.amount, 0);
      return { outstanding, paid };
    }

    test("transitions status from outstanding -> paid -> outstanding on confirm & revert", () => {
      let contribution = {
        id: "contrib-1",
        roomId: "room-1",
        contributorId: "user-1",
        amount: 20000,
        status: "outstanding",
      };

      let balances = computeBalances([contribution]);
      assert.strictEqual(balances.outstanding, 20000);
      assert.strictEqual(balances.paid, 0);

      // Step 1: Admin confirms payment (Realtime UPDATE event arrives)
      contribution = { ...contribution, status: "paid" };
      balances = computeBalances([contribution]);
      assert.strictEqual(balances.outstanding, 0);
      assert.strictEqual(balances.paid, 20000);

      // Step 2: Admin reverts payment (Realtime UPDATE event arrives)
      contribution = { ...contribution, status: "outstanding" };
      balances = computeBalances([contribution]);
      assert.strictEqual(balances.outstanding, 20000);
      assert.strictEqual(balances.paid, 0);
    });
  });
});
