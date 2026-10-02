"use client";

import Link from "next/link";
import {
  Door01Icon,
  Home01Icon,
  MoreHorizontalIcon,
  Settings01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

export interface AppNavigationItem {
  key: "home" | "rooms" | "funds" | "admin";
  href: string;
  label: string;
}

export interface AppNavigationProps {
  items: AppNavigationItem[];
  pathname: string;
  variant: "sidebar" | "bottom";
  onNavigate?: () => void;
  onMoreClick?: () => void;
}

const itemIcons = {
  home: Home01Icon,
  rooms: Door01Icon,
  funds: Wallet01Icon,
  admin: Settings01Icon,
} satisfies Record<AppNavigationItem["key"], typeof Home01Icon>;

function isNavigationItemActive(item: AppNavigationItem, pathname: string) {
  if (item.key === "home") return pathname === "/";
  if (item.key === "rooms") {
    return pathname === item.href || pathname.startsWith("/meeting/");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppNavigation({
  items,
  pathname,
  variant,
  onNavigate,
  onMoreClick,
}: AppNavigationProps) {
  const navigationElements = items.map((item) => {
    const isActive = isNavigationItemActive(item, pathname);
    const icon = itemIcons[item.key];

    return (
      <Link
        className={cn(
          "AppNavigation__link",
          isActive && "AppNavigation__link--active",
          variant === "sidebar"
            ? "flex min-h-12 items-center gap-4 rounded-md px-4 text-sm font-semibold transition-colors"
            : "flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold transition-colors",
          isActive
            ? "bg-primary-soft text-primary-active"
            : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
        )}
        key={item.key}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
      >
        <HugeiconsIcon
          className="AppNavigation__icon shrink-0"
          icon={icon}
          size={20}
          aria-hidden
        />
        <span className="AppNavigation__label">{item.label}</span>
      </Link>
    );
  });

  if (variant === "sidebar") {
    return (
      <nav className="AppNavigation AppNavigation--sidebar flex flex-col gap-2" aria-label="Điều hướng chính">
        {navigationElements}
      </nav>
    );
  }

  const primaryMobileElements = navigationElements.slice(0, 3);

  return (
    <nav
      className="AppNavigation AppNavigation--bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Điều hướng di động"
    >
      {primaryMobileElements}
      <button
        className={cn(
          "AppNavigation__more",
          "flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary",
          pathname === "/settings" && "AppNavigation__more--active bg-primary-soft text-primary-active",
        )}
        type="button"
        onClick={onMoreClick}
        aria-label="Mở thêm điều hướng"
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} size={20} aria-hidden />
        <span className="AppNavigation__label">Thêm</span>
      </button>
    </nav>
  );
}
