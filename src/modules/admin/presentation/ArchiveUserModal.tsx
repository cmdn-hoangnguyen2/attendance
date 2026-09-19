"use client";

import React, { useState, useEffect } from "react";
import type { Room, User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserRemove01Icon,
  Cancel01Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { SelectDropdown } from "@/components/ui/SelectDropdown";

export interface ArchiveUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  ownedActiveRooms: Room[];
  eligibleAdmins: User[];
  onConfirmArchiveUser: (userId: string, replacementAdminId?: string) => void;
}

const REQUIRED_CONFIRMATION_PHRASE = "Archive this user";

export function ArchiveUserModal({
  isOpen,
  onClose,
  user,
  ownedActiveRooms,
  eligibleAdmins,
  onConfirmArchiveUser,
}: ArchiveUserModalProps) {
  const [typedPhrase, setTypedPhrase] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState<string>(() =>
    eligibleAdmins.length > 0 ? eligibleAdmins[0].id : "",
  );
  const [error, setError] = useState("");

  const hasOwnedRooms = ownedActiveRooms.length > 0;

  const handleClose = () => {
    setTypedPhrase("");
    setError("");
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

  if (!isOpen) return null;

  const isPhraseValid = typedPhrase.trim() === REQUIRED_CONFIRMATION_PHRASE;
  const isTransferValid = !hasOwnedRooms || Boolean(selectedAdminId);
  const canSubmit = isPhraseValid && isTransferValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhraseValid) {
      setError(`Vui lòng gõ chính xác cụm từ "${REQUIRED_CONFIRMATION_PHRASE}" để xác nhận.`);
      return;
    }
    if (hasOwnedRooms && !selectedAdminId) {
      setError("Người dùng này đang làm chủ phòng họp. Bạn bắt buộc phải chọn Admin thay thế để tiếp nhận quyền sở hữu.");
      return;
    }
    onConfirmArchiveUser(user.id, hasOwnedRooms ? selectedAdminId : undefined);
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-user-modal-title"
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
              <HugeiconsIcon icon={UserRemove01Icon} size={20} />
            </span>
            <div>
              <h2
                id="archive-user-modal-title"
                className="text-base font-bold text-[#0B1F1A]"
              >
                Xóa mềm người dùng (Soft-delete)
              </h2>
              <p className="text-xs text-[#4B665D]">
                Khóa quyền truy cập ứng dụng của tài khoản này
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

        {/* Thông tin người dùng bị xóa mềm */}
        <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 space-y-1">
          <p className="text-xs font-bold text-[#0B1F1A]">
            Người dùng: {user.displayName} ({user.email})
          </p>
          <p className="text-[11px] text-[#4B665D]">
            Mã định danh (ID): {user.id}
          </p>
        </div>

        {/* Cảnh báo chuyển giao phòng nếu user đang sở hữu phòng active */}
        {hasOwnedRooms && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <HugeiconsIcon icon={Alert02Icon} size={16} />
              <span>Yêu cầu chuyển quyền sở hữu phòng họp</span>
            </div>
            <p className="text-xs text-amber-800">
              Người dùng này đang làm chủ{" "}
              <strong>{ownedActiveRooms.length} phòng họp đang hoạt động</strong>:
            </p>
            <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5">
              {ownedActiveRooms.map((r) => (
                <li key={r.id}>
                  {r.name} ({r.visibility})
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
              <label
                htmlFor="replacement-admin-select"
                className="block text-xs font-semibold text-amber-950"
              >
                Chọn Admin tiếp nhận quyền sở hữu các phòng này:
              </label>
              {eligibleAdmins.length > 0 ? (
                <SelectDropdown
                  id="replacement-admin-select"
                  value={selectedAdminId}
                  onChange={(val) => {
                    setSelectedAdminId(val);
                    if (error) setError("");
                  }}
                  options={eligibleAdmins.map((adm) => ({
                    value: adm.id,
                    label: `${adm.displayName} (${adm.email})`,
                  }))}
                />
              ) : (
                <p className="text-xs text-rose-700 font-semibold">
                  Không tìm thấy Admin nào khác để tiếp nhận quyền sở hữu. Không thể xóa mềm!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form xác nhận cụm từ tiếng Anh */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="archive-user-confirmation-phrase"
              className="block text-xs font-medium text-[#0B1F1A]"
            >
              Để xác nhận, vui lòng gõ chính xác cụm từ:{" "}
              <span className="font-bold text-rose-700 select-all font-mono">
                {REQUIRED_CONFIRMATION_PHRASE}
              </span>
            </label>
            <input
              id="archive-user-confirmation-phrase"
              type="text"
              value={typedPhrase}
              onChange={(e) => {
                setTypedPhrase(e.target.value);
                if (error) setError("");
              }}
              placeholder={REQUIRED_CONFIRMATION_PHRASE}
              autoComplete="off"
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-mono text-[#0B1F1A] placeholder:text-neutral-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>Xác nhận xóa mềm</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
