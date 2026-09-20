"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";

export interface EmptyStateProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized EmptyState card across DiemDanhCMDN pages.
 * Conforms 100% to 8pt-grid-spacing (p-12, gap-4) and neutral gray borders.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-xs ${className}`.trim()}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
        <HugeiconsIcon icon={icon} size={28} />
      </div>
      <h3 className="text-base font-bold text-neutral-900 mb-1">
        {title}
      </h3>
      {description ? (
        <p className="max-w-md text-xs text-neutral-500 leading-relaxed mb-6">
          {description}
        </p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
