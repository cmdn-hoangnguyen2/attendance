"use client";

import React, { useState, useEffect } from "react";
import type { Room, User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserSwitchIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  CrownIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { SelectDropdown } from "@/components/ui/SelectDropdown";

export interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  currentOwner?: User;
  eligibleMembers: User[];
  onConfirmTransfer: (newOwnerId: string) => void;
}

export function TransferOwnershipModal({
  isOpen,
  onClose,
  room,
  currentOwner,
  eligibleMembers,
  onConfirmTransfer,
}: TransferOwnershipModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() =>
    eligibleMembers.length > 0 ? eligibleMembers[0].id : "",
  );
  const [error, setError] = useState<string>("");

  const handleClose = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError("Vui lòng chọn một thành viên để chuyển quyền chủ phòng.");
      return;
    }
    onConfirmTransfer(selectedMemberId);
    handleClose();
  };

  const selectedMember = eligibleMembers.find((m) => m.id === selectedMemberId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-ownership-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Container: Bo góc 24px (rounded-3xl), padding 32px (p-8, space-5) */}
      <div
        className="w-full max-w-lg rounded-3xl border border-neutral-border bg-white p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-surface text-primary-dark">
              <HugeiconsIcon icon={UserSwitchIcon} size={20} />
            </span>
            <div>
              <h2
                id="transfer-ownership-modal-title"
                className="text-base font-bold text-neutral-dark"
              >
                Chuyển giao quyền chủ phòng
              </h2>
              <p className="text-xs text-neutral-muted">
                Trao quyền quản trị phòng họp cho thành viên khác
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

        {/* Thông báo quy định chuyển giao */}
        <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 text-xs text-neutral-muted space-y-2">
          <div className="flex items-center gap-2 font-semibold text-neutral-dark">
            <HugeiconsIcon icon={CrownIcon} size={16} />
            <span>Phòng họp: {room.name}</span>
          </div>
          <p>
            Chủ phòng hiện tại:{" "}
            <strong className="text-neutral-dark">
              {currentOwner?.displayName ?? "Chưa xác định"}
            </strong>
          </p>
          <p className="text-[11px] text-neutral-500">
            * Sau khi chuyển giao thành công, bạn vẫn tiếp tục là thành viên hoạt động trong phòng họp này.
          </p>
        </div>

        {/* Chọn thành viên kế nhiệm */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="new-owner-select"
              className="block text-xs font-semibold text-neutral-dark"
            >
              Chọn thành viên tiếp nhận quyền chủ phòng:
            </label>

            {eligibleMembers.length > 0 ? (
              <SelectDropdown
                id="new-owner-select"
                value={selectedMemberId}
                onChange={(val) => {
                  setSelectedMemberId(val);
                  if (error) setError("");
                }}
                options={eligibleMembers.map((member) => ({
                  value: member.id,
                  label: `${member.displayName} (${member.email})`,
                }))}
              />
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Phòng này hiện chưa có thành viên nào khác để chuyển giao quyền chủ phòng.
              </div>
            )}

            {error && (
              <p className="text-[11px] font-medium text-rose-600">{error}</p>
            )}
          </div>

          {/* Xem trước thành viên được chọn */}
          {selectedMember && (
            <div className="rounded-xl border border-neutral-border bg-neutral-surface/40 p-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 text-primary-dark">
                <HugeiconsIcon icon={UserIcon} size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-neutral-dark">
                  {selectedMember.displayName}
                </p>
                <p className="text-[11px] text-neutral-muted">
                  Sẽ trở thành Chủ phòng mới của &ldquo;{room.name}&rdquo;
                </p>
              </div>
            </div>
          )}

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
              disabled={eligibleMembers.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-dark px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>Xác nhận chuyển quyền</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
