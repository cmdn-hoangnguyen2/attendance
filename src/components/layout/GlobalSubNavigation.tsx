"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthMock } from "@/context/AuthMockContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Menu01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

interface GlobalSubNavigationProps {
  actionButton?: React.ReactNode;
}

export function GlobalSubNavigation({ actionButton }: GlobalSubNavigationProps) {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuthMock();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Auto-close mobile menu during render when route changes
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  const isLoginPage = pathname === "/login";

  if (isLoginPage) return null;

  const navLinks = [
    { href: "/", label: "Trang chủ", show: true },
    { href: "/my-rooms", label: "Phòng của tôi", show: isAuthenticated },
    { href: "/funds", label: "Quỹ", show: isAuthenticated },
    { href: "/settings", label: "Cài đặt", show: isAdmin },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Desktop Links (Segmented Control style) */}
        <nav aria-label="Menu phụ" className="hidden md:flex items-center gap-1 bg-neutral-100 p-1.5 rounded-full">
          {navLinks
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 min-w-[100px] text-center inline-flex justify-center ${
                    isActive
                      ? "bg-white text-neutral-dark shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-10 w-10 md:hidden items-center justify-center rounded-xl border border-neutral-border bg-neutral-surface text-primary-dark transition-colors hover:bg-neutral-border/60 focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={isMobileMenuOpen}
          aria-label="Mở menu điều hướng"
        >
          <HugeiconsIcon icon={isMobileMenuOpen ? Cancel01Icon : Menu01Icon} size={20} />
        </button>

        {/* Right Side: Action Button (e.g. Add new room) */}
        {actionButton && (
          <div className="flex shrink-0">
            {actionButton}
          </div>
        )}
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <nav
          aria-label="Menu di động"
          className="mt-4 flex flex-col gap-1.5 md:hidden"
        >
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
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      )}
    </div>
  );
}
