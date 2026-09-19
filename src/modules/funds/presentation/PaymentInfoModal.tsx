"use client";

import React, { useEffect } from "react";
import { formatVND } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Coins01Icon, UserIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";

export interface PaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  ownerName: string;
  amount: number;
  reason: string;
  paymentImageUrl?: string | null;
  isRoomArchived?: boolean;
}

export function PaymentInfoModal({
  isOpen,
  onClose,
  roomName,
  ownerName,
  amount,
  reason,
  paymentImageUrl,
  isRoomArchived,
}: PaymentInfoModalProps) {
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
      aria-labelledby="payment-info-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Container: Padding 32px (p-8, space-5), bo góc 16px (rounded-2xl) */}
      <div
        className="w-full max-w-md rounded-2xl border border-[#C9F2E3] bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8FBF4] text-[#05966B]">
              <HugeiconsIcon icon={Coins01Icon} size={20} />
            </span>
            <div>
              <h2 id="payment-info-title" className="text-lg font-bold text-[#0B1F1A]">
                Thông tin nộp quỹ
              </h2>
              <p className="text-xs text-[#4B665D]">{roomName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#4B665D] hover:bg-neutral-100 hover:text-[#0B1F1A]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Content Body: Gap giữa các nhóm là 24px (space-y-6, space-4) */}
        <div className="mt-6 space-y-6">
          {/* Cảnh báo phòng đã archive nếu có */}
          {isRoomArchived ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <HugeiconsIcon icon={InformationCircleIcon} size={18} className="shrink-0 text-amber-600" />
              <div>
                <strong className="font-semibold">Phòng đã được lưu trữ (Archived):</strong>
                <p className="mt-0.5 text-amber-700">
                  Phòng họp này đã đóng, nhưng khoản nghĩa vụ quỹ vẫn có thể được hoàn thành và xác nhận bởi Chủ phòng.
                </p>
              </div>
            </div>
          ) : null}

          {/* Chi tiết khoản quỹ */}
          <div className="rounded-xl border border-[#C9F2E3] bg-[#E8FBF4]/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4B665D]">Số tiền cần nộp:</span>
              <span className="text-xl font-black text-[#05966B]">{formatVND(amount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[#C9F2E3]/60 pt-2 text-xs">
              <span className="text-[#4B665D]">Lý do:</span>
              <span className="font-semibold text-[#0B1F1A]">{reason}</span>
            </div>
          </div>

          {/* Khu vực ảnh QR thanh toán hoặc thông tin liên hệ */}
          <div className="flex flex-col items-center justify-center">
            {paymentImageUrl ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-[#C9F2E3] bg-white p-2 shadow-xs">
                  {/* Ảnh QR: object-contain theo đúng quy chuẩn 06-ui-mock-phase.md */}
                  <img
                    src={paymentImageUrl}
                    alt={`Mã QR thanh toán phòng ${roomName}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-xs text-[#4B665D]">Quét mã QR để chuyển khoản trực tiếp</span>
              </div>
            ) : (
              /* Fallback khi phòng chưa có ảnh QR: Hiển thị đúng text quy định trong 03-domain-and-states.md */
              <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-[#C9F2E3] bg-white p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8FBF4] text-[#05966B]">
                  <HugeiconsIcon icon={UserIcon} size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-[#0B1F1A]">
                    Liên hệ chủ room: {ownerName}
                  </span>
                  <p className="text-xs text-[#4B665D]">
                    Phòng họp chưa đăng tải ảnh QR thanh toán. Vui lòng liên hệ trực tiếp chủ phòng để nộp quỹ.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nút đóng: padding chuẩn px-4 py-2 */}
          <div className="border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[#10D9A3] px-4 py-2 text-sm font-semibold text-[#0B1F1A] transition-colors hover:bg-[#05966B] hover:text-white"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
