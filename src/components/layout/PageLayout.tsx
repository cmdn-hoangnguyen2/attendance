"use client";

import React from "react";

import { cn } from "@/lib/utils";

import { GlobalSubNavigation } from "./GlobalSubNavigation";

interface PageLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function PageLayout({ children, sidebar, actionButton }: PageLayoutProps) {
  const mainClassName = cn(
    "PageLayout__main",
    "flex flex-col gap-6",
    sidebar ? "lg:col-span-9" : "lg:col-span-12",
  );

  return (
    <div className="PageLayout flex w-full flex-1 flex-col bg-neutral-50/50">
      {/* Sub Nav */}
      <GlobalSubNavigation actionButton={actionButton} />

      {/* Content Area */}
      <div className="PageLayout__content mx-auto w-full max-w-7xl px-6 pb-12">
        <div className="PageLayout__grid grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <main className={mainClassName}>{children}</main>

          {sidebar && (
            <aside className="PageLayout__sidebar sticky top-20 lg:col-span-3">
              {sidebar}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
