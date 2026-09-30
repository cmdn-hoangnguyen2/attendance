const HOME_ITEM = { key: "home", href: "/", label: "Trang chủ" };
const ROOMS_ITEM = { key: "rooms", href: "/my-rooms", label: "Phòng của tôi" };
const FUNDS_ITEM = { key: "funds", href: "/funds", label: "Quỹ của tôi" };
const ADMIN_ITEM = { key: "admin", href: "/settings", label: "Quản trị" };

/**
 * @param {{ isAuthenticated: boolean; isAdmin: boolean }} access
 * @returns {Array<{ key: "home" | "rooms" | "funds" | "admin"; href: string; label: string }>}
 */
export function getAppNavigationItems({ isAuthenticated, isAdmin }) {
  if (!isAuthenticated) return [HOME_ITEM];
  if (isAdmin) return [HOME_ITEM, ROOMS_ITEM, FUNDS_ITEM, ADMIN_ITEM];
  return [HOME_ITEM, ROOMS_ITEM, FUNDS_ITEM];
}
