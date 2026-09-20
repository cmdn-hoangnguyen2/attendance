"use client";

import React, { useEffect } from "react";
import type { Room } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Logout01Icon, Alert02Icon } from "@hugeicons/core-free-icons";

export interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onConfirmLeave: () => void;
}

export function LeaveRoomModal({
  isOpen,
  onClose,
  room,
  onConfirmLeave,
}: LeaveRoomModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Container: Padding 32px (p-8), bo góc 16px (rounded-2xl) */}
      <div
        className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <HugeiconsIcon icon={Logout01Icon} size={20} />
            </span>
            <div>
              <h2 id="leave-room-title" className="text-base font-bold text-neutral-dark">
                Rời phòng họp
              </h2>
              <p className="text-xs text-neutral-muted">
                {room.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-muted hover:bg-neutral-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Content Body: Gap 24px (space-y-6) */}
        <div className="space-y-4">
          <p className="text-sm text-neutral-dark">
            Bạn có chắc chắn muốn rời khỏi phòng họp{" "}
            <strong className="font-bold text-neutral-dark">&ldquo;{room.name}&rdquo;</strong> không?
          </p>

          {/* Cảnh báo bảo lưu dữ liệu theo docs/01-product-scope.md */}
          <div className="rounded-xl border border-neutral-border bg-neutral-50 p-4 text-xs text-neutral-muted space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-neutral-dark">
              <HugeiconsIcon icon={Alert02Icon} size={16} className="text-amber-600 shrink-0" />
              <span>Lưu ý về nghĩa vụ quỹ:</span>
            </div>
            <p className="leading-relaxed">
              Tư cách thành viên của bạn sẽ kết thúc. Tuy nhiên, toàn bộ nghĩa vụ đóng quỹ cũ và lịch sử thanh toán <strong>vẫn được bảo lưu bất biến</strong> và bạn vẫn có thể xem tại trang Quỹ cá nhân.
            </p>
          </div>
        </div>

        {/* Action Buttons: Button padding chuẩn px-4 py-2 */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-muted hover:bg-neutral-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmLeave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} />
            <span>Xác nhận rời phòng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
