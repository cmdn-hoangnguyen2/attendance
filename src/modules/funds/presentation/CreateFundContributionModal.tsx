"use client";

import React, { useState, useEffect } from "react";
import type { FundCandidate, FundContributionReason, User } from "@/types/domain";
import { formatVND } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Coins01Icon } from "@hugeicons/core-free-icons";
import { SelectDropdown } from "@/components/ui/SelectDropdown";

export interface CreateFundContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomMembers: User[];
  candidate?: FundCandidate | null;
  preselectedUserId?: string;
  onCreateContribution: (data: {
    contributorId: string;
    amount: number;
    reason: FundContributionReason;
    reasonDetails?: string;
  }) => void;
}

export function CreateFundContributionModal({
  isOpen,
  onClose,
  roomMembers,
  candidate,
  preselectedUserId,
  onCreateContribution,
}: CreateFundContributionModalProps) {
  const [selectedUserId, setSelectedUserId] = useState(() =>
    candidate
      ? candidate.userId
      : preselectedUserId
      ? preselectedUserId
      : roomMembers.length > 0
      ? roomMembers[0].id
      : "",
  );
  const [amount, setAmount] = useState(() => candidate?.suggestedAmount || 10000);
  const [reason, setReason] = useState<FundContributionReason>(() =>
    candidate?.attendanceStatus === "absent" ? "Bận nhưng chưa xin phép" : "Đi trễ",
  );
  const [reasonDetails, setReasonDetails] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    setReasonDetails("");
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
    if (!selectedUserId) {
      setError("Vui lòng chọn thành viên cần đóng quỹ.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Số tiền đóng quỹ phải lớn hơn 0 VND.");
      return;
    }
    if (reason === "Khác" && !reasonDetails.trim()) {
      setError("Vui lòng nhập chi tiết lý do khi chọn 'Khác'.");
      return;
    }

    onCreateContribution({
      contributorId: selectedUserId,
      amount: Math.round(amount), // integer VND
      reason,
      reasonDetails: reason === "Khác" ? reasonDetails.trim() : undefined,
    });
    handleClose();
  };

  const presetAmounts = [5000, 10000, 20000, 50000];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-fund-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Container: Padding 32px (p-8, space-5), bo góc 16px (rounded-2xl) */}
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-border bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-surface text-primary-dark">
              <HugeiconsIcon icon={Coins01Icon} size={20} />
            </span>
            <div>
              <h2 id="create-fund-title" className="text-lg font-bold text-neutral-dark">
                Tạo khoản đóng quỹ
              </h2>
              <p className="text-xs text-neutral-muted">Ghi nhận nghĩa vụ quỹ phòng họp</p>
            </div>
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

        {/* Form Fields: Spacing giữa các field 24px (space-y-6, space-4) */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Field 1: Chọn thành viên */}
          <div className="flex flex-col gap-2">
            <label htmlFor="contributor-select" className="text-sm font-semibold text-neutral-dark">
              Thành viên đóng quỹ <span className="text-rose-500">*</span>
            </label>
            <SelectDropdown
              id="contributor-select"
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              disabled={!!candidate}
              options={roomMembers.map((member) => ({
                value: member.id,
                label: `${member.displayName} (${member.email})`,
              }))}
            />
          </div>

          {/* Field 2: Số tiền (integer VND) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="fund-amount" className="text-sm font-semibold text-neutral-dark">
                Số tiền (VND) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-primary-dark">{formatVND(amount)}</span>
            </div>
            <input
              id="fund-amount"
              type="number"
              step="1000"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-border bg-neutral-50/50 px-4 py-2 text-sm text-neutral-dark focus:border-primary focus:bg-white focus:outline-none"
            />
            {/* Quick preset buttons: gap 8px (gap-2) */}
            <div className="flex items-center gap-2 pt-1">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors ${
                    amount === preset
                      ? "border-primary bg-neutral-surface text-primary-dark font-bold"
                      : "border-neutral-200 text-neutral-muted hover:bg-neutral-50"
                  }`}
                >
                  +{preset / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Lý do (Reason) */}
          <div className="flex flex-col gap-2">
            <label htmlFor="fund-reason" className="text-sm font-semibold text-neutral-dark">
              Lý do đóng quỹ <span className="text-rose-500">*</span>
            </label>
            <SelectDropdown
              id="fund-reason"
              value={reason}
              onChange={(val) => setReason(val as FundContributionReason)}
              options={[
                { value: "Đi trễ", label: "Đi trễ" },
                { value: "Bận nhưng chưa xin phép", label: "Bận nhưng chưa xin phép" },
                { value: "Khác", label: "Khác (Yêu cầu nhập chi tiết)" },
              ]}
            />
          </div>

          {/* Field 4 (Conditional): Chi tiết lý do nếu chọn 'Khác' */}
          {reason === "Khác" ? (
            <div className="flex flex-col gap-2 animate-in fade-in">
              <label htmlFor="reason-details" className="text-sm font-semibold text-neutral-dark">
                Chi tiết lý do <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reason-details"
                rows={2}
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="VD: Không chuẩn bị tài liệu họp tuần theo cam kết..."
                className="w-full rounded-lg border border-neutral-border bg-neutral-50/50 px-4 py-2 text-sm text-neutral-dark placeholder:text-neutral-400 focus:border-primary focus:bg-white focus:outline-none"
              />
            </div>
          ) : null}

          {error ? <p className="text-xs font-medium text-rose-500">{error}</p> : null}

          {/* Actions: Margin-top 32px (mt-8, space-5) */}
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
              Xác nhận tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
