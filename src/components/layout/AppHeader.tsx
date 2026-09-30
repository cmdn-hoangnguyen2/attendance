"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cancel01Icon,
  Login01Icon,
  Logout01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useAuthMock } from "@/context/AuthMockContext";
import { cn } from "@/lib/utils";

import { NotificationPopover } from "./NotificationPopover";

export interface AppHeaderProps {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}

export function AppHeader({ isMenuOpen = false, onMenuToggle }: AppHeaderProps) {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isAdmin, login, logout, isMockActive } = useAuthMock();
  const isLoginPage = pathname === "/login";
  const userInitial = currentUser?.displayName.charAt(0).toUpperCase() ?? "";
  const menuIcon = isMenuOpen ? Cancel01Icon : Menu01Icon;

  const handleLogout = () => logout();
  const handleLogin = () => login();

  const adminBadge = isAdmin ? (
    <span className="AppHeader__admin-badge rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary-active">
      Admin
    </span>
  ) : null;

  let authContent = null;
  if (!isLoginPage && isAuthenticated && currentUser) {
    authContent = (
      <div className="AppHeader__user-actions flex items-center gap-2">
        <NotificationPopover />
        <div className="AppHeader__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-community text-sm font-bold text-text-primary">
          {userInitial}
        </div>
        <div className="AppHeader__user-details hidden min-w-0 flex-col gap-1 lg:flex">
          <div className="AppHeader__user-name-row flex items-center gap-2">
            <span className="AppHeader__user-name max-w-40 truncate text-sm font-semibold text-text-primary">
              {currentUser.displayName}
            </span>
            {adminBadge}
          </div>
          <span className="AppHeader__user-email max-w-48 truncate text-xs text-text-tertiary">
            {currentUser.email}
          </span>
        </div>
        <button
          className="AppHeader__logout inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none"
          type="button"
          title={isMockActive ? "Đăng xuất khỏi phiên giả lập" : "Đăng xuất"}
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <HugeiconsIcon icon={Logout01Icon} size={18} aria-hidden />
          <span className="AppHeader__logout-label hidden sm:inline">Thoát</span>
        </button>
      </div>
    );
  }

  if (!isLoginPage && !isAuthenticated) {
    authContent = (
      <button
        className="AppHeader__login inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none"
        type="button"
        onClick={handleLogin}
      >
        <HugeiconsIcon icon={Login01Icon} size={18} aria-hidden />
        <span className="AppHeader__login-label">Đăng nhập</span>
      </button>
    );
  }

  const menuButton = !isLoginPage && onMenuToggle ? (
    <button
      className={cn(
        "AppHeader__menu-toggle",
        "hidden h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none md:inline-flex xl:hidden",
        isMenuOpen && "AppHeader__menu-toggle--open border-primary text-primary",
      )}
      type="button"
      onClick={onMenuToggle}
      aria-label={isMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
      aria-expanded={isMenuOpen}
    >
      <HugeiconsIcon icon={menuIcon} size={20} aria-hidden />
    </button>
  ) : null;

  return (
    <header className="AppHeader sticky top-0 z-40 h-16 border-b border-border bg-surface">
      <div className="AppHeader__inner flex h-full w-full items-center justify-between gap-4 px-4 md:px-6 xl:px-8">
        <div className="AppHeader__leading flex min-w-0 items-center gap-4">
          {menuButton}
          <Link
            className="AppHeader__brand flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none"
            href="/"
            aria-label="DiemDanhCMDN — Trang chủ"
          >
            <span className="AppHeader__brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold tracking-wide text-white">
              CM
            </span>
            <span className="AppHeader__brand-copy hidden min-w-0 flex-col sm:flex">
              <span className="AppHeader__brand-name truncate text-base font-bold leading-6 text-text-primary">
                DiemDanhCMDN
              </span>
              <span className="AppHeader__brand-tagline truncate text-xs leading-4 text-text-tertiary">
                Điểm danh & Quản lý Quỹ
              </span>
            </span>
          </Link>
        </div>
        {authContent}
      </div>
    </header>
  );
}
