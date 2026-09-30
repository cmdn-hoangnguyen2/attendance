"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";

import { cn } from "@/lib/utils";

export interface ResponsiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  footer?: ReactNode;
  preventClose?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<ResponsiveDialogProps["size"]>, string> = {
  sm: "md:max-w-lg",
  md: "md:max-w-2xl",
  lg: "md:max-w-4xl",
};

export function ResponsiveDialog({
  isOpen,
  onClose,
  labelledBy,
  children,
  footer,
  preventClose = false,
  size = "md",
}: ResponsiveDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      if (dialog?.open) dialog.close();
      openerRef.current?.focus();
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!preventClose) onClose();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const clickedBackdrop = event.target === event.currentTarget;
    if (clickedBackdrop && !preventClose) onClose();
  };

  const footerContent = footer ? (
    <footer className="ResponsiveDialog__footer border-t border-border bg-surface-subtle px-6 py-4 md:px-8">
      {footer}
    </footer>
  ) : null;

  return (
    <dialog
      className={cn(
        "ResponsiveDialog",
        "m-0 mt-auto hidden max-h-[calc(100dvh-64px)] w-full max-w-none flex-col overflow-hidden rounded-t-xl bg-surface p-0 text-text-primary shadow-2xl open:flex",
        "backdrop:bg-text-primary/40 md:m-auto md:max-h-[calc(100dvh-96px)] md:rounded-xl",
        sizeClasses[size],
      )}
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <div className="ResponsiveDialog__body min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </div>
      {footerContent}
    </dialog>
  );
}
