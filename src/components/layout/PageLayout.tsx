"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageLayoutProps {
  children: ReactNode;
  contextRail?: ReactNode;
  className?: string;
  /** @deprecated Migrate to contextRail in the owning screen task. */
  sidebar?: ReactNode;
  /** @deprecated Migrate to PageHeader action in the owning screen task. */
  actionButton?: ReactNode;
}

export function PageLayout({
  children,
  contextRail,
  className,
  sidebar,
  actionButton,
}: PageLayoutProps) {
  const resolvedContextRail = contextRail ?? sidebar;
  const mainClassName = cn(
    "PageLayout__main",
    "flex min-w-0 flex-col gap-8",
    "w-full",
  );
  const legacyActionContent = actionButton ? (
    <div className="PageLayout__legacy-action flex justify-end">{actionButton}</div>
  ) : null;
  const contextContent = resolvedContextRail ? (
    <aside className="PageLayout__context min-w-0">
      <div className="PageLayout__context-sticky sticky top-20">{resolvedContextRail}</div>
    </aside>
  ) : null;

  return (
    <div className={cn("PageLayout", "w-full bg-canvas", className)}>
      <div className="PageLayout__content mx-auto w-full max-w-[1600px] px-4 py-8 md:px-6 xl:px-8 2xl:px-12">
        <div className={cn("PageLayout__grid grid grid-cols-1 items-start gap-8", resolvedContextRail && "min-[1440px]:grid-cols-[minmax(0,1fr)_280px]")}>
          <main className={mainClassName}>
            {legacyActionContent}
            {children}
          </main>
          {contextContent}
        </div>
      </div>
    </div>
  );
}
