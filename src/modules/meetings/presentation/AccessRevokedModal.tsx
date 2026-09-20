"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldAlertIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons";

export interface AccessRevokedModalProps {
  isOpen: boolean;
  roomName?: string;
  onBackToHome?: () => void;
}

/**
 * Modal shown when a member inside a room is removed/kicked by room owner or admin.
 * Fully non-dismissible: blocks interactions with the underlying room and prompts
 * the user to return to the Home page.
 * Strictly adheres to 8pt-grid-spacing and zhon-conventions.
 */
export function AccessRevokedModal({
  isOpen,
  roomName,
  onBackToHome,
}: AccessRevokedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-revoked-title"
      aria-describedby="access-revoked-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      {/* Modal Container: Bo góc 24px (rounded-3xl), padding 32px (p-8), border alert */}
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-2xl">
        {/* Icon cảnh báo: 64x64px (h-16 w-16 = 8pt) */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-6">
          <HugeiconsIcon icon={ShieldAlertIcon} size={32} />
        </div>

        {/* Tiêu đề & Thông báo */}
        <h2
          id="access-revoked-title"
          className="text-xl font-bold text-neutral-dark mb-2"
        >
          Hết hạn quyền vào phòng họp
        </h2>

        <p
          id="access-revoked-desc"
          className="text-sm text-neutral-muted leading-relaxed mb-6"
        >
          Bạn đã bị chủ phòng hoặc quản trị viên xóa khỏi phòng họp{" "}
          {roomName ? (
            <span className="font-semibold text-neutral-dark">
              &ldquo;{roomName}&rdquo;
            </span>
          ) : (
            "này"
          )}
          . Quyền truy cập và thao tác của bạn trong phòng đã kết thúc.
        </p>

        {/* CTA Button: Quay về trang chủ (Padding 16px: px-6 py-3, bo góc 12px: rounded-xl) */}
        <div className="pt-2">
          <Link
            href="/"
            onClick={onBackToHome}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-neutral-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <HugeiconsIcon icon={Home01Icon} size={18} />
            <span>Quay về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
