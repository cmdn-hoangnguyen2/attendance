"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, ShieldAlertIcon } from "@hugeicons/core-free-icons";

import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

export interface AccessRevokedModalProps {
  isOpen: boolean;
  roomName?: string;
  onBackToHome?: () => void;
}

export function AccessRevokedModal({
  isOpen,
  roomName,
  onBackToHome,
}: AccessRevokedModalProps) {
  const footer = (
    <div className="AccessRevokedModal__actions flex justify-end">
      <Link
        href="/"
        onClick={onBackToHome}
        className="AccessRevokedModal__home-link inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto"
      >
        <HugeiconsIcon icon={Home01Icon} size={18} aria-hidden />
        <span>Quay về trang chủ</span>
      </Link>
    </div>
  );

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={() => undefined}
      labelledBy="access-revoked-title"
      preventClose
      size="sm"
      footer={footer}
    >
      <div className="AccessRevokedModal text-center">
        <span className="AccessRevokedModal__icon mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-danger-soft text-danger">
          <HugeiconsIcon icon={ShieldAlertIcon} size={32} aria-hidden />
        </span>
        <h2 id="access-revoked-title" className="AccessRevokedModal__title mt-6 text-xl font-bold text-text-primary">
          Quyền truy cập đã kết thúc
        </h2>
        <p className="AccessRevokedModal__description mt-4 text-sm leading-6 text-text-secondary">
          Bạn đã bị chủ phòng hoặc quản trị viên xóa khỏi phòng họp{" "}
          {roomName ? <strong className="AccessRevokedModal__room-name text-text-primary">&ldquo;{roomName}&rdquo;</strong> : "này"}.
          Quyền truy cập và thao tác của bạn trong phòng đã kết thúc.
        </p>
      </div>
    </ResponsiveDialog>
  );
}
