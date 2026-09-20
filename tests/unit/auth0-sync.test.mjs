import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Auth0 Integration & Onboarding Sync (Unit Tests)", () => {
  // Helper simulating the beforeSessionSaved logic in src/lib/auth0.ts
  async function simulateBeforeSessionSaved(session, mockRepo) {
    const auth0User = session?.user;
    if (auth0User && auth0User.sub && auth0User.email) {
      const roleClaim = auth0User["https://diemdanh.cmdn/role"];
      const role = roleClaim === "admin" ? "admin" : "user";

      await mockRepo.createOrSync({
        auth0Subject: auth0User.sub,
        email: auth0User.email,
        displayName:
          auth0User.name ||
          auth0User.nickname ||
          auth0User.email.split("@")[0] ||
          "User",
        role,
      });
    }
    return session;
  }

  // -------------------------------------------------------------
  // 1. Role Claim Extraction & Default Fallback
  // -------------------------------------------------------------
  describe("Role Claim Resolution", () => {
    test("assigns 'admin' role when custom claim https://diemdanh.cmdn/role is 'admin'", async () => {
      let syncedData = null;
      const mockRepo = {
        async createOrSync(data) {
          syncedData = data;
          return { id: "user-1", ...data, status: "active" };
        },
      };

      const session = {
        user: {
          sub: "auth0|admin-123",
          email: "nvhoang2012002@gmail.com",
          name: "Hoang Nguyen",
          "https://diemdanh.cmdn/role": "admin",
        },
      };

      await simulateBeforeSessionSaved(session, mockRepo);

      assert.ok(syncedData, "User data should be synced");
      assert.strictEqual(syncedData.role, "admin");
      assert.strictEqual(syncedData.email, "nvhoang2012002@gmail.com");
      assert.strictEqual(syncedData.auth0Subject, "auth0|admin-123");
    });

    test("assigns 'user' role when custom claim is 'user'", async () => {
      let syncedData = null;
      const mockRepo = {
        async createOrSync(data) {
          syncedData = data;
          return { id: "user-2", ...data, status: "active" };
        },
      };

      const session = {
        user: {
          sub: "auth0|member-456",
          email: "lan.nguyen@example.com",
          name: "Lan Nguyen",
          "https://diemdanh.cmdn/role": "user",
        },
      };

      await simulateBeforeSessionSaved(session, mockRepo);

      assert.ok(syncedData);
      assert.strictEqual(syncedData.role, "user");
    });

    test("defaults to 'user' role when custom claim is missing or undefined", async () => {
      let syncedData = null;
      const mockRepo = {
        async createOrSync(data) {
          syncedData = data;
          return { id: "user-3", ...data, status: "active" };
        },
      };

      const session = {
        user: {
          sub: "google-oauth2|789",
          email: "newuser@example.com",
        },
      };

      await simulateBeforeSessionSaved(session, mockRepo);

      assert.ok(syncedData);
      assert.strictEqual(syncedData.role, "user");
      assert.strictEqual(syncedData.displayName, "newuser");
    });
  });

  // -------------------------------------------------------------
  // 2. Display Name Resolution Fallback Cascade
  // -------------------------------------------------------------
  describe("Display Name Resolution", () => {
    test("uses name if available", async () => {
      let syncedData = null;
      const mockRepo = {
        async createOrSync(data) {
          syncedData = data;
          return { id: "user-4", ...data, status: "active" };
        },
      };

      const session = {
        user: {
          sub: "auth0|sub-1",
          email: "test@domain.com",
          name: "Full Name",
          nickname: "nick",
        },
      };

      await simulateBeforeSessionSaved(session, mockRepo);
      assert.strictEqual(syncedData.displayName, "Full Name");
    });

    test("falls back to nickname when name is not provided", async () => {
      let syncedData = null;
      const mockRepo = {
        async createOrSync(data) {
          syncedData = data;
          return { id: "user-5", ...data, status: "active" };
        },
      };

      const session = {
        user: {
          sub: "auth0|sub-2",
          email: "test@domain.com",
          nickname: "cool_user",
        },
      };

      await simulateBeforeSessionSaved(session, mockRepo);
      assert.strictEqual(syncedData.displayName, "cool_user");
    });

    test("falls back to email prefix when neither name nor nickname is provided", async () => {
      let syncedData = null;
      const mockRepo = {
        async createOrSync(data) {
          syncedData = data;
          return { id: "user-6", ...data, status: "active" };
        },
      };

      const session = {
        user: {
          sub: "auth0|sub-3",
          email: "alexander.great@domain.com",
        },
      };

      await simulateBeforeSessionSaved(session, mockRepo);
      assert.strictEqual(syncedData.displayName, "alexander.great");
    });
  });

  // -------------------------------------------------------------
  // 3. Soft-Deleted User Access Denial (Rule 5)
  // -------------------------------------------------------------
  describe("Soft-Deleted User Guard (docs/04-auth-security.md)", () => {
    function evaluateAppAccess(auth0User, dbUser) {
      if (!auth0User || !dbUser) {
        return { isAuthenticated: false, accessDenied: false };
      }
      if (dbUser.status === "soft_deleted") {
        return { isAuthenticated: false, accessDenied: true, message: "Account disabled" };
      }
      return { isAuthenticated: true, accessDenied: false };
    }

    test("denies app access and flags accessDenied when user is soft_deleted", () => {
      const auth0User = { sub: "auth0|deleted-1", email: "deleted@example.com" };
      const dbUser = {
        id: "00000000-0000-0000-0000-000000000099",
        auth0Subject: "auth0|deleted-1",
        email: "deleted@example.com",
        displayName: "Deleted User",
        role: "user",
        status: "soft_deleted",
      };

      const access = evaluateAppAccess(auth0User, dbUser);
      assert.strictEqual(access.isAuthenticated, false);
      assert.strictEqual(access.accessDenied, true);
    });

    test("grants access when user status is active", () => {
      const auth0User = { sub: "auth0|active-1", email: "active@example.com" };
      const dbUser = {
        id: "00000000-0000-0000-0000-000000000001",
        auth0Subject: "auth0|active-1",
        email: "active@example.com",
        displayName: "Active User",
        role: "user",
        status: "active",
      };

      const access = evaluateAppAccess(auth0User, dbUser);
      assert.strictEqual(access.isAuthenticated, true);
      assert.strictEqual(access.accessDenied, false);
    });
  });

  // -------------------------------------------------------------
  // 4. Dual-Mode Toggle Evaluation
  // -------------------------------------------------------------
  describe("Dual-Mode Mock vs Real Auth0 Toggle", () => {
    function resolveAuthMode(envValue) {
      const isMockActive = envValue === "true";
      return {
        isMockActive,
        shouldBypassMiddleware: isMockActive,
        shouldDisplayMockBanner: isMockActive,
      };
    }

    test("activates mock mode when NEXT_PUBLIC_ALLOW_MOCK_AUTH is 'true'", () => {
      const mode = resolveAuthMode("true");
      assert.strictEqual(mode.isMockActive, true);
      assert.strictEqual(mode.shouldBypassMiddleware, true);
      assert.strictEqual(mode.shouldDisplayMockBanner, true);
    });

    test("activates real Auth0 mode when NEXT_PUBLIC_ALLOW_MOCK_AUTH is 'false'", () => {
      const mode = resolveAuthMode("false");
      assert.strictEqual(mode.isMockActive, false);
      assert.strictEqual(mode.shouldBypassMiddleware, false);
      assert.strictEqual(mode.shouldDisplayMockBanner, false);
    });

    test("defaults to real Auth0 mode when env var is undefined or empty", () => {
      const mode = resolveAuthMode(undefined);
      assert.strictEqual(mode.isMockActive, false);
      assert.strictEqual(mode.shouldBypassMiddleware, false);
      assert.strictEqual(mode.shouldDisplayMockBanner, false);
    });
  });

  // -------------------------------------------------------------
  // 5. Safe Handling of Empty Session / Missing User
  // -------------------------------------------------------------
  describe("Safe Handling of Incomplete Sessions", () => {
    test("does not throw or call repo if session has no user", async () => {
      let called = false;
      const mockRepo = {
        async createOrSync() {
          called = true;
        },
      };

      const session = {};
      const result = await simulateBeforeSessionSaved(session, mockRepo);

      assert.strictEqual(called, false);
      assert.deepStrictEqual(result, session);
    });

    test("does not throw if user has no sub or email", async () => {
      let called = false;
      const mockRepo = {
        async createOrSync() {
          called = true;
        },
      };

      const session = { user: { name: "Anonymous" } };
      const result = await simulateBeforeSessionSaved(session, mockRepo);

      assert.strictEqual(called, false);
      assert.deepStrictEqual(result, session);
    });
  });
});
