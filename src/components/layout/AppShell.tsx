"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useAuthMock } from "@/context/AuthMockContext";

import { AppHeader } from "./AppHeader";
import { AppNavigation, type AppNavigationItem } from "./AppNavigation";
import { getAppNavigationItems } from "./appNavigationItems.mjs";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuthMock();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = getAppNavigationItems({ isAuthenticated, isAdmin }) as AppNavigationItem[];
  const isLoginPage = pathname === "/login";

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((currentOpen) => !currentOpen);

  if (isLoginPage) {
    return (
      <div className="AppShell AppShell--login flex min-h-screen flex-col bg-canvas">
        <AppHeader />
        <div className="AppShell__login-content flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  const drawerContent = isMenuOpen ? (
    <div className="AppShell__drawer-layer fixed inset-0 z-50 xl:hidden">
      <button
        className="AppShell__drawer-backdrop absolute inset-0 bg-text-primary/40"
        type="button"
        onClick={closeMenu}
        aria-label="Đóng menu điều hướng"
      />
      <aside
        className="AppShell__drawer relative flex h-full w-80 max-w-[calc(100%-48px)] flex-col gap-8 overflow-y-auto border-r border-border bg-surface p-6 shadow-2xl"
        aria-label="Menu điều hướng"
      >
        <div className="AppShell__drawer-heading flex flex-col gap-2">
          <p className="AppShell__drawer-eyebrow text-xs font-semibold text-primary">DiemDanhCMDN</p>
          <h2 className="AppShell__drawer-title text-xl font-semibold leading-8 text-text-primary">
            Điều hướng
          </h2>
        </div>
        <AppNavigation
          items={items}
          pathname={pathname}
          variant="sidebar"
          onNavigate={closeMenu}
        />
      </aside>
    </div>
  ) : null;

  return (
    <div className="AppShell flex min-h-screen flex-col bg-canvas">
      <AppHeader isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      <div className="AppShell__workspace flex min-h-0 flex-1">
        <aside className="AppShell__sidebar hidden w-[240px] shrink-0 border-r border-border bg-surface p-6 xl:block">
          <div className="AppShell__sidebar-sticky sticky top-20">
            <AppNavigation items={items} pathname={pathname} variant="sidebar" />
          </div>
        </aside>
        <div className="AppShell__content min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
      </div>
      <AppNavigation
        items={items}
        pathname={pathname}
        variant="bottom"
        onMoreClick={openMenu}
      />
      {drawerContent}
    </div>
  );
}
