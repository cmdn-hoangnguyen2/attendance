"use client";

import React, { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  Cancel01Icon,
  QrCode01Icon,
  CrownIcon,
  Archive01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  onOpenPaymentQrModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenArchiveModal?: () => void;
}

/**
 * Settings Modal for Room Owner / Admin.
 * Consolidates Room Actions (Payment QR, Transfer Ownership, Archive Room)
 * into a clean vertical list column flex layout.
 * Strictly adheres to 8pt-grid-spacing and zhon-conventions.
 */
export function RoomSettingsModal({
  isOpen,
  onClose,
  roomName,
  onOpenPaymentQrModal,
  onOpenTransferModal,
  onOpenArchiveModal,
}: RoomSettingsModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (callback?: () => void) => {
    onClose();
    if (callback) callback();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Container: Bo góc 24px (rounded-3xl), padding 32px (p-8), max-w-lg */}
      <div
        className="w-full max-w-lg rounded-3xl border border-[#C9F2E3] bg-white p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#05966B]">
              <HugeiconsIcon icon={Settings01Icon} size={20} />
            </span>
            <div>
              <h2
                id="room-settings-modal-title"
                className="text-base font-bold text-[#0B1F1A]"
              >
                Cài đặt phòng họp
              </h2>
              <p className="text-xs text-[#4B665D]">
                Quản lý các thao tác hành chính cho phòng &ldquo;{roomName}&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Action List: Column Flex Cards (gap 16px = gap-4) */}
        <div className="flex flex-col gap-3">
          {/* Action 1: QR thanh toán */}
          {onOpenPaymentQrModal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenPaymentQrModal)}
              className="flex items-center justify-between rounded-2xl border border-[#C9F2E3] bg-white p-4 text-left shadow-2xs transition-all hover:border-[#10D9A3] hover:bg-[#E8FBF4]/40"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8FBF4] text-[#05966B]">
                  <HugeiconsIcon icon={QrCode01Icon} size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F1A]">
                    Mã QR thanh toán phòng
                  </h3>
                  <p className="text-xs text-[#4B665D] mt-0.5">
                    Tải lên hoặc cập nhật ảnh QR tài khoản ngân hàng nhận quỹ
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className="text-[#4B665D] shrink-0"
              />
            </button>
          )}

          {/* Action 2: Chuyển quyền chủ phòng */}
          {onOpenTransferModal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenTransferModal)}
              className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-2xs transition-all hover:border-neutral-400 hover:bg-neutral-50"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <HugeiconsIcon icon={CrownIcon} size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F1A]">
                    Chuyển quyền chủ phòng
                  </h3>
                  <p className="text-xs text-[#4B665D] mt-0.5">
                    Bàn giao quyền quản trị cao nhất cho một thành viên khác
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className="text-[#4B665D] shrink-0"
              />
            </button>
          )}

          {/* Action 3: Lưu trữ phòng */}
          {onOpenArchiveModal && (
            <button
              type="button"
              onClick={() => handleAction(onOpenArchiveModal)}
              className="flex items-center justify-between rounded-2xl border border-rose-200 bg-white p-4 text-left shadow-2xs transition-all hover:border-rose-400 hover:bg-rose-50/50"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <HugeiconsIcon icon={Archive01Icon} size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F1A]">
                    Lưu trữ phòng họp
                  </h3>
                  <p className="text-xs text-[#4B665D] mt-0.5">
                    Đóng phòng họp và chuyển toàn bộ dữ liệu vào chế độ chỉ đọc
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className="text-[#4B665D] shrink-0"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
