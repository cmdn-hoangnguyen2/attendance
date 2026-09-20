"use client";

import React, { useState, useEffect } from "react";
import type { Room } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Archive01Icon,
  Cancel01Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";

export interface ArchiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onConfirmArchive: (roomId: string) => void;
}

const REQUIRED_CONFIRMATION_PHRASE = "Archive this room";

export function ArchiveRoomModal({
  isOpen,
  onClose,
  room,
  onConfirmArchive,
}: ArchiveRoomModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setTypedPhrase("");
    setError("");
    onClose();
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const isPhraseValid = typedPhrase.trim() === REQUIRED_CONFIRMATION_PHRASE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhraseValid) {
      setError(`Vui lòng gõ chính xác cụm từ "${REQUIRED_CONFIRMATION_PHRASE}" để xác nhận.`);
      return;
    }
    onConfirmArchive(room.id);
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-room-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Container: Bo góc 24px (rounded-3xl), padding 32px (p-8, space-5) */}
      <div
        className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <HugeiconsIcon icon={Archive01Icon} size={20} />
            </span>
            <div>
              <h2
                id="archive-room-modal-title"
                className="text-base font-bold text-neutral-dark"
              >
                Lưu trữ phòng họp
              </h2>
              <p className="text-xs text-neutral-muted">
                Hành động này sẽ đóng phòng và hạn chế quyền truy cập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Thông tin phòng họp */}
        <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-dark">
            <HugeiconsIcon icon={Folder01Icon} size={16} />
            <span>Phòng họp: {room.name}</span>
          </div>
          <p className="text-[11px] text-neutral-muted">
            Mã định danh (ID): {room.id}
          </p>
        </div>

        {/* Danh sách tác động cụ thể (Explicit Impact List) */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <span>Các tác động khi lưu trữ phòng:</span>
          </div>
          <ul className="list-disc pl-5 text-[11px] text-rose-800 space-y-1">
            <li>Không thể tạo thêm phiên họp hoặc điểm danh mới.</li>
            <li>Không thể nhận thêm thành viên hoặc duyệt yêu cầu tham gia mới.</li>
            <li>Không thể tạo thêm khoản quỹ hay thay đổi ảnh thông tin thanh toán.</li>
            <li>
              Các khoản nợ quỹ cũ vẫn <strong>giữ nguyên và tiếp tục được thanh toán</strong>.
            </li>
            <li>Phòng sẽ bị ẩn khỏi Trang chủ và chỉ xem được trong chế độ lưu trữ.</li>
          </ul>
        </div>

        {/* Form xác nhận bằng văn bản tiếng Anh (Typed-English Confirmation) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="archive-confirmation-phrase"
              className="block text-xs font-medium text-neutral-dark"
            >
              Để xác nhận, vui lòng gõ chính xác cụm từ:{" "}
              <span className="font-bold text-rose-700 select-all font-mono">
                {REQUIRED_CONFIRMATION_PHRASE}
              </span>
            </label>
            <input
              id="archive-confirmation-phrase"
              type="text"
              value={typedPhrase}
              onChange={(e) => {
                setTypedPhrase(e.target.value);
                if (error) setError("");
              }}
              placeholder={REQUIRED_CONFIRMATION_PHRASE}
              autoComplete="off"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-mono text-neutral-dark placeholder:text-neutral-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            {error && (
              <p className="text-[11px] font-medium text-rose-600">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={!isPhraseValid}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>Xác nhận lưu trữ phòng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
