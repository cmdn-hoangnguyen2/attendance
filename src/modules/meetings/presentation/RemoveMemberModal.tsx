"use client";

import React, { useState, useEffect } from "react";
import type { User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Alert02Icon } from "@hugeicons/core-free-icons";

export interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: User | null;
  hasOutstandingDebt: boolean;
  onConfirmRemove: (userId: string) => void;
}

const REQUIRED_PHRASE = "I agree to remove this user";

export function RemoveMemberModal({
  isOpen,
  onClose,
  member,
  hasOutstandingDebt,
  onConfirmRemove,
}: RemoveMemberModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");

  const handleClose = () => {
    setTypedPhrase("");
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const isConfirmed = hasOutstandingDebt
    ? typedPhrase.trim() === REQUIRED_PHRASE
    : true;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirmRemove(member.id);
      handleClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Container: Padding 32px (p-8, space-5), bo góc 16px (rounded-2xl) */}
      <div
        className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <HugeiconsIcon icon={Alert02Icon} size={22} />
            </span>
            <div>
              <h2 id="remove-member-title" className="text-lg font-bold text-[#0B1F1A]">
                Xác nhận xóa thành viên
              </h2>
              <p className="text-xs text-[#4B665D]">
                Thao tác quản trị phòng họp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#4B665D] hover:bg-neutral-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Content Body: Gap 24px (space-y-6, space-4) */}
        <div className="mt-6 space-y-6">
          <p className="text-sm text-[#0B1F1A]">
            Bạn đang yêu cầu xóa thành viên{" "}
            <strong className="font-bold text-rose-600">{member.displayName}</strong> (
            {member.email}) ra khỏi phòng họp này.
          </p>

          {/* Cảnh báo tác động nghiệp vụ nghiêm ngặt */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-900 space-y-2">
            <strong className="font-bold">Các tác động bảo lưu dữ liệu:</strong>
            <ul className="list-disc pl-5 space-y-1 text-rose-800">
              <li>Tư cách thành viên (membership) trong phòng sẽ chấm dứt ngay lập tức.</li>
              <li>
                Toàn bộ bản ghi đóng quỹ và lịch sử thanh toán của thành viên{" "}
                <strong>vẫn được bảo lưu bất biến</strong> để phục vụ kiểm toán.
              </li>
              <li>
                Thành viên vẫn tiếp tục nhìn thấy các khoản quỹ này tại trang cá nhân{" "}
                <code>/funds</code>.
              </li>
            </ul>
          </div>

          {/* Khối yêu cầu gõ chuỗi xác thực tiếng Anh nếu thành viên còn nợ quỹ */}
          {hasOutstandingDebt ? (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <label htmlFor="confirm-phrase" className="text-xs font-semibold text-amber-900">
                Thành viên này hiện đang có khoản quỹ chưa hoàn thành. Để đảm bảo an toàn, vui lòng
                nhập chính xác cụm từ sau để xác nhận:
              </label>
              <div className="select-all rounded bg-white px-3 py-1.5 font-mono text-xs font-bold text-rose-700 border border-amber-300">
                {REQUIRED_PHRASE}
              </div>
              <input
                id="confirm-phrase"
                type="text"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder="Nhập cụm từ tiếng Anh ở trên..."
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-[#0B1F1A] focus:border-rose-500 focus:outline-none"
              />
            </div>
          ) : null}

          {/* Action Buttons: Margin top 32px (mt-8, space-5) */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-[#4B665D] hover:bg-neutral-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                isConfirmed
                  ? "bg-rose-600 text-white shadow-xs hover:bg-rose-700"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              }`}
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
