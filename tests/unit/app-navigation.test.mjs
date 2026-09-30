import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getAppNavigationItems } from "../../src/components/layout/appNavigationItems.mjs";

describe("role-aware application navigation", () => {
  test("shows only Trang chủ to guests", () => {
    const items = getAppNavigationItems({ isAuthenticated: false, isAdmin: false });

    assert.deepStrictEqual(items, [
      { key: "home", href: "/", label: "Trang chủ" },
    ]);
  });

  test("shows member routes without Quản trị to authenticated non-admin users", () => {
    const items = getAppNavigationItems({ isAuthenticated: true, isAdmin: false });

    assert.deepStrictEqual(items, [
      { key: "home", href: "/", label: "Trang chủ" },
      { key: "rooms", href: "/my-rooms", label: "Phòng của tôi" },
      { key: "funds", href: "/funds", label: "Quỹ của tôi" },
    ]);
  });

  test("shows every approved route to admins", () => {
    const items = getAppNavigationItems({ isAuthenticated: true, isAdmin: true });

    assert.deepStrictEqual(items, [
      { key: "home", href: "/", label: "Trang chủ" },
      { key: "rooms", href: "/my-rooms", label: "Phòng của tôi" },
      { key: "funds", href: "/funds", label: "Quỹ của tôi" },
      { key: "admin", href: "/settings", label: "Quản trị" },
    ]);
  });
});
