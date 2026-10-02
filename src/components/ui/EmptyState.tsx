"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const descriptionContent = description ? (
    <p className="EmptyState__description max-w-md text-pretty text-sm leading-6 text-text-secondary">
      {description}
    </p>
  ) : null;
  const actionContent = action ? (
    <div className="EmptyState__action pt-2">{action}</div>
  ) : null;

  return (
    <section
      className={cn(
        "EmptyState",
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-surface-subtle p-8 text-center md:p-12",
        className,
      )}
    >
      <div className="EmptyState__icon flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <HugeiconsIcon icon={icon} size={24} aria-hidden />
      </div>
      <div className="EmptyState__content flex flex-col items-center gap-2">
        <h2 className="EmptyState__title text-lg font-semibold leading-8 text-text-primary">
          {title}
        </h2>
        {descriptionContent}
      </div>
      {actionContent}
    </section>
  );
}
