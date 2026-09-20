"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthMock } from "@/context/AuthMockContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Folder01Icon,
  Coins01Icon,
  Settings01Icon,
  Login01Icon,
  Logout01Icon,
  Menu01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

export function AppHeader() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isAdmin, login, logout, isMockActive } = useAuthMock();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Auto-close mobile menu during render when route changes
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
    login();
  };

  const navLinks = [
    { href: "/", label: "Trang chủ", icon: Home01Icon, show: true },
    { href: "/my-rooms", label: "Phòng của tôi", icon: Folder01Icon, show: isAuthenticated },
    { href: "/funds", label: "Quỹ", icon: Coins01Icon, show: isAuthenticated },
    { href: "/settings", label: "Cài đặt", icon: Settings01Icon, show: isAdmin },
  ];

  const isLoginPage = pathname === "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-decoration-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Logo icon container: 40x40px (chuẩn 8pt) */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-xs">
              <span className="font-extrabold text-base tracking-wider">CM</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-neutral-dark">
                DiemDanhCMDN
              </span>
              <span className="text-[11px] font-medium text-neutral-muted">
                Điểm danh & Quản lý Quỹ
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) - hidden on /login */}
          {!isLoginPage && (
            <nav aria-label="Menu chính" className="hidden md:flex items-center gap-2">
              {navLinks
                .filter((item) => item.show)
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-neutral-surface text-primary-dark"
                          : "text-neutral-muted hover:bg-neutral-50 hover:text-neutral-dark"
                      }`}
                    >
                      <HugeiconsIcon icon={item.icon} size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </nav>
          )}
        </div>

        {/* User Auth Section & Mobile Menu Button - hidden on /login */}
        {!isLoginPage && (
          <div className="flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-3">
                {/* User Avatar Circle: 32x32px (chuẩn 8pt) */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-surface font-bold text-xs text-primary-dark border border-neutral-border">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>

                {/* User Information (Desktop only) */}
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm leading-none text-neutral-dark">
                      {currentUser.displayName}
                    </span>
                    {isAdmin ? (
                      <span className="rounded bg-neutral-surface px-1.5 py-0.5 text-[10px] font-bold text-primary-dark border border-neutral-border">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-neutral-muted leading-none mt-1">
                    {currentUser.email}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-border px-3 py-1.5 text-xs font-semibold text-neutral-muted transition-colors hover:bg-neutral-50 hover:text-neutral-dark"
                  title={isMockActive ? "Đăng xuất khỏi phiên giả lập" : "Đăng xuất"}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={16} />
                  <span className="hidden sm:inline">Thoát</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-neutral-dark shadow-xs transition-colors hover:bg-primary-hover hover:text-white"
              >
                <HugeiconsIcon icon={Login01Icon} size={18} />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button: 40x40px touch target (chuẩn 8pt) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 md:hidden items-center justify-center rounded-xl border border-neutral-border bg-neutral-surface text-primary-dark transition-colors hover:bg-neutral-border/60 focus-visible:ring-2 focus-visible:ring-primary"
              aria-expanded={isMobileMenuOpen}
              aria-label="Mở menu điều hướng"
            >
              <HugeiconsIcon icon={isMobileMenuOpen ? Cancel01Icon : Menu01Icon} size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation Dropdown Menu - hidden on /login */}
      {!isLoginPage && isMobileMenuOpen && (
        <nav
          aria-label="Menu di động"
          className="border-t border-neutral-border bg-white px-6 py-4 md:hidden shadow-lg animate-in slide-in-from-top-2"
        >
          <div className="flex flex-col gap-1.5">
            {navLinks
              .filter((item) => item.show)
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-neutral-surface text-primary-dark"
                        : "text-neutral-muted hover:bg-neutral-50 hover:text-neutral-dark"
                    }`}
                  >
                    <HugeiconsIcon icon={item.icon} size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>
        </nav>
      )}
    </header>
  );
}
