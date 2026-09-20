"use client";

import React, { useState, useEffect } from "react";
import type { RoomVisibility } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Globe02Icon, LockIcon } from "@hugeicons/core-free-icons";

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (data: { name: string; visibility: RoomVisibility }) => void;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
}: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<RoomVisibility>("public");
  const [error, setError] = useState("");

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên phòng họp.");
      return;
    }
    onCreateRoom({
      name: name.trim(),
      visibility,
    });
    setName("");
    setVisibility("public");
    setError("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Box: Padding 32px (p-8, space-5), Bo góc 16px (rounded-2xl) */}
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-border bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex flex-col gap-1">
            <h2
              id="create-room-title"
              className="text-xl font-bold text-neutral-dark"
            >
              Tạo phòng họp mới
            </h2>
            <p className="text-xs text-neutral-muted">
              Khởi tạo không gian điểm danh và quản lý quỹ cho nhóm của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-muted hover:bg-neutral-100 hover:text-neutral-dark"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {/* Form Fields: Spacing giữa các field là 24px (space-y-6, space-4) */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Field 1: Tên phòng */}
          {/* Spacing Label -> Input: 8px (gap-2, space-2) => Proximity Ratio = 24/8 = 3.0 */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="room-name"
              className="text-sm font-semibold text-neutral-dark"
            >
              Tên phòng họp <span className="text-rose-500">*</span>
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="VD: Daily Standup Frontend Team"
              className={`w-full rounded-lg border px-4 py-2 text-sm text-neutral-dark placeholder:text-neutral-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                error
                  ? "border-rose-400 bg-rose-50/30"
                  : "border-neutral-border bg-neutral-50/50 focus:bg-white"
              }`}
            />
            {error ? (
              <span className="text-xs font-medium text-rose-500">{error}</span>
            ) : null}
          </div>

          {/* Field 2: Quyền riêng tư (Visibility) */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-dark">
              Quyền truy cập phòng
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Công khai */}
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all ${
                  visibility === "public"
                    ? "border-primary bg-neutral-surface/50 shadow-xs"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Globe02Icon}
                    size={18}
                    className={
                      visibility === "public"
                        ? "text-primary-dark"
                        : "text-neutral-muted"
                    }
                  />
                  <span className="text-sm font-bold text-neutral-dark">
                    Công khai
                  </span>
                </div>
                <p className="text-xs text-neutral-muted">
                  Mọi thành viên đều có thể tham gia ngay mà không cần duyệt.
                </p>
              </button>

              {/* Option 2: Riêng tư */}
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-all ${
                  visibility === "private"
                    ? "border-primary bg-neutral-surface/50 shadow-xs"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={LockIcon}
                    size={18}
                    className={
                      visibility === "private"
                        ? "text-primary-dark"
                        : "text-neutral-muted"
                    }
                  />
                  <span className="text-sm font-bold text-neutral-dark">
                    Riêng tư
                  </span>
                </div>
                <p className="text-xs text-neutral-muted">
                  Cần gửi yêu cầu và được Chủ phòng hoặc Admin phê duyệt.
                </p>
              </button>
            </div>
          </div>

          {/* Action Buttons: Margin-top 32px (mt-8, space-5) */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-muted hover:bg-neutral-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-neutral-dark shadow-xs transition-colors hover:bg-primary-hover hover:text-white"
            >
              Tạo phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
