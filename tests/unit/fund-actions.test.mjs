import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Fund Payment & Revert Actions (Unit Tests)", () => {
  class MockFundService {
    constructor() {
      this.contributions = new Map();
      this.payments = new Map();
      this.auditLogs = [];
    }

    addContribution({ id, roomId, contributorId, amount, status = "outstanding" }) {
      this.contributions.set(id, { id, roomId, contributorId, amount, status });
    }

    confirmPayment(contributionId, confirmedBy) {
      const contrib = this.contributions.get(contributionId);
      if (!contrib) throw new Error("Contribution not found");
      if (contrib.status === "paid") throw new Error("Contribution is already paid");

      const payment = {
        id: `pay-${Date.now()}`,
        contributionId,
        amount: contrib.amount,
        confirmedBy,
        paidAt: new Date().toISOString(),
      };
      this.payments.set(contributionId, payment);
      contrib.status = "paid";

      this.auditLogs.push({
        action: "payment.confirmed",
        actorId: confirmedBy,
        targetId: contributionId,
        metadata: { paymentId: payment.id, amount: contrib.amount },
      });

      return payment;
    }

    revertPayment(contributionId, actorId) {
      const contrib = this.contributions.get(contributionId);
      if (!contrib) throw new Error("Contribution not found");
      if (contrib.status !== "paid") throw new Error("Cannot revert payment for unpaid contribution");

      const existingPayment = this.payments.get(contributionId);
      this.payments.delete(contributionId);
      contrib.status = "outstanding";

      this.auditLogs.push({
        action: "payment.reverted",
        actorId,
        targetId: contributionId,
        metadata: {
          previousPaymentId: existingPayment?.id,
          amount: contrib.amount,
        },
      });
    }
  }

  test("confirmPayment transitions status to 'paid' and logs audit record", () => {
    const service = new MockFundService();
    service.addContribution({
      id: "c-1",
      roomId: "r-1",
      contributorId: "u-1",
      amount: 25000,
      status: "outstanding",
    });

    const payment = service.confirmPayment("c-1", "admin-1");
    assert.strictEqual(payment.amount, 25000);
    assert.strictEqual(payment.confirmedBy, "admin-1");

    const contrib = service.contributions.get("c-1");
    assert.strictEqual(contrib.status, "paid");

    const log = service.auditLogs.find((l) => l.action === "payment.confirmed");
    assert.ok(log);
    assert.strictEqual(log.actorId, "admin-1");
    assert.strictEqual(log.targetId, "c-1");
  });

  test("revertPayment resets status to 'outstanding', removes payment, and logs audit record", () => {
    const service = new MockFundService();
    service.addContribution({
      id: "c-1",
      roomId: "r-1",
      contributorId: "u-1",
      amount: 25000,
      status: "outstanding",
    });

    service.confirmPayment("c-1", "admin-1");
    assert.strictEqual(service.contributions.get("c-1").status, "paid");

    // Perform revert
    service.revertPayment("c-1", "admin-1");
    assert.strictEqual(service.contributions.get("c-1").status, "outstanding");
    assert.strictEqual(service.payments.has("c-1"), false, "Payment record must be deleted");

    const revertLog = service.auditLogs.find((l) => l.action === "payment.reverted");
    assert.ok(revertLog);
    assert.strictEqual(revertLog.actorId, "admin-1");
    assert.strictEqual(revertLog.targetId, "c-1");
  });

  test("throws error when attempting to revert an unpaid contribution", () => {
    const service = new MockFundService();
    service.addContribution({
      id: "c-unpaid",
      roomId: "r-1",
      contributorId: "u-1",
      amount: 10000,
      status: "outstanding",
    });

    assert.throws(
      () => service.revertPayment("c-unpaid", "admin-1"),
      /Cannot revert payment for unpaid contribution/
    );
  });
});
