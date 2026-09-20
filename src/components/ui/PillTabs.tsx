"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";

export interface PillTabItem<T extends string = string> {
  key: T;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
}

export interface PillTabsProps<T extends string = string> {
  tabs: PillTabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  className?: string;
}

/**
 * Standardized Pill-layout segmented tab filter across DiemDanhCMDN.
 * Conforms 100% to 8pt-grid-spacing and zhon-conventions.
 */
export function PillTabs<T extends string = string>({
  tabs,
  activeKey,
  onChange,
  className = "",
}: PillTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100/90 p-1 ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
              isActive
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {tab.icon ? (
              <HugeiconsIcon icon={tab.icon} size={15} />
            ) : null}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
