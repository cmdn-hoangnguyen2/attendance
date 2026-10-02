import type { ReactNode } from "react";
import {
  Alert02Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  MinusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  tone: "info" | "success" | "warning" | "danger" | "neutral";
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<StatusBadgeProps["tone"], string> = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-neutral-soft text-neutral",
};

const toneIcons = {
  info: InformationCircleIcon,
  success: CheckmarkCircle02Icon,
  warning: Alert02Icon,
  danger: CancelCircleIcon,
  neutral: MinusSignCircleIcon,
} satisfies Record<StatusBadgeProps["tone"], typeof InformationCircleIcon>;

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  const icon = toneIcons[tone];

  return (
    <span
      className={cn(
        "StatusBadge",
        "inline-flex min-h-8 items-center gap-2 rounded-full px-4 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      <HugeiconsIcon
        className="StatusBadge__icon shrink-0"
        icon={icon}
        size={16}
        aria-hidden
      />
      <span className="StatusBadge__label">{children}</span>
    </span>
  );
}
