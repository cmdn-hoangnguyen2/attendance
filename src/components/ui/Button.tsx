"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "compact" | "default" | "touch";
  isLoading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-border bg-surface text-text-primary hover:border-border-strong hover:bg-surface-subtle active:bg-primary-soft",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary active:bg-primary-soft",
  destructive: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  compact: "h-8 px-4 text-xs",
  default: "h-10 px-4 text-sm",
  touch: "h-12 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled = false,
    isLoading = false,
    size = "default",
    type = "button",
    variant = "primary",
    ...buttonProps
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  const loadingIcon = isLoading ? (
    <HugeiconsIcon
      className="Button__loading-icon animate-spin"
      icon={Loading03Icon}
      size={16}
      aria-hidden
    />
  ) : null;

  return (
    <button
      className={cn(
        "Button",
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      ref={ref}
      type={type}
      {...buttonProps}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
    >
      {loadingIcon}
      <span className="Button__label">{children}</span>
    </button>
  );
});
