"use client";

import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

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

export function PillTabs<T extends string = string>({
  tabs,
  activeKey,
  onChange,
  className,
}: PillTabsProps<T>) {
  const tabElements = tabs.map((tab) => {
    const isActive = activeKey === tab.key;
    const iconContent = tab.icon ? (
      <HugeiconsIcon
        className="PillTabs__icon shrink-0"
        icon={tab.icon}
        size={16}
        aria-hidden
      />
    ) : null;

    return (
      <button
        className={cn(
          "PillTabs__tab",
          isActive && "PillTabs__tab--active",
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-150",
          "focus-visible:outline-none",
          isActive
            ? "bg-surface text-primary shadow-sm"
            : "text-text-secondary hover:bg-surface hover:text-text-primary",
        )}
        key={tab.key}
        type="button"
        onClick={() => onChange(tab.key)}
        role="tab"
        aria-selected={isActive}
      >
        {iconContent}
        <span className="PillTabs__label">{tab.label}</span>
      </button>
    );
  });

  return (
    <div
      className={cn(
        "PillTabs",
        "inline-flex max-w-full items-center gap-2 overflow-x-auto rounded-lg border border-border bg-surface-subtle p-2",
        className,
      )}
      role="tablist"
    >
      {tabElements}
    </div>
  );
}
