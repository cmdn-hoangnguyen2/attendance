"use client";

import { useState } from "react";
import {
  AttendanceStatus,
  FundContributionReason,
  type FundCandidate,
  type User,
} from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Coins01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { formatVND } from "@/lib/utils";

export interface CreateFundContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
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
  const [selectedUserId, setSelectedUserId] = useState<string>(() =>
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
    candidate?.attendanceStatus === AttendanceStatus.ABSENT
      ? FundContributionReason.BUSY_WITHOUT_PERMISSION
      : FundContributionReason.LATE,
  );
  const [reasonDetails, setReasonDetails] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    setReasonDetails("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) {
      setError("Vui lòng chọn thành viên cần đóng quỹ.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Số tiền đóng quỹ phải lớn hơn 0 VND.");
      return;
    }
    if (reason === FundContributionReason.OTHER && !reasonDetails.trim()) {
      setError(`Vui lòng nhập chi tiết lý do khi chọn '${FundContributionReason.OTHER}'.`);
      return;
    }

    onCreateContribution({
      contributorId: selectedUserId,
      amount: Math.round(amount),
      reason,
      reasonDetails: reason === FundContributionReason.OTHER ? reasonDetails.trim() : undefined,
    });
    handleClose();
  };

  const presetAmounts = [5000, 10000, 20000, 50000];
  const footer = (
    <div className="CreateFundContributionModal__actions grid grid-cols-1 gap-2 sm:flex sm:justify-end">
      <Button variant="secondary" size="touch" onClick={handleClose}>Hủy</Button>
      <Button type="submit" form="create-fund-form" size="touch">Xác nhận tạo</Button>
    </div>
  );

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="create-fund-title"
      size="sm"
      footer={footer}
    >
      <div className="CreateFundContributionModal ui-section-stack">
        <div className="CreateFundContributionModal__heading flex items-start gap-4">
          <span className="CreateFundContributionModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={Coins01Icon} size={24} aria-hidden />
          </span>
          <div className="CreateFundContributionModal__heading-copy min-w-0">
            <h2 id="create-fund-title" className="CreateFundContributionModal__title text-xl font-bold text-text-primary">Tạo khoản đóng quỹ</h2>
            <p className="CreateFundContributionModal__description mt-2 text-sm text-text-secondary">Ghi nhận nghĩa vụ quỹ phòng họp.</p>
          </div>
          <Button className="CreateFundContributionModal__close shrink-0 px-2" variant="ghost" autoFocus aria-label="Đóng cửa sổ" onClick={handleClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </Button>
        </div>

        <form id="create-fund-form" className="CreateFundContributionModal__form ui-section-stack" onSubmit={handleSubmit}>
          <div className="CreateFundContributionModal__field flex flex-col gap-2">
            <label htmlFor="contributor-select" className="text-sm font-semibold text-text-primary">Thành viên đóng quỹ <span className="text-danger">*</span></label>
            <SelectDropdown
              id="contributor-select"
              value={selectedUserId}
              onChange={setSelectedUserId}
              disabled={!!candidate}
              options={roomMembers.map((member) => ({ value: member.id, label: `${member.displayName} (${member.email})` }))}
            />
          </div>

          <div className="CreateFundContributionModal__field flex flex-col gap-2">
            <div className="CreateFundContributionModal__field-heading flex items-center justify-between gap-4">
              <label htmlFor="fund-amount" className="text-sm font-semibold text-text-primary">Số tiền (VND) <span className="text-danger">*</span></label>
              <span className="text-sm font-bold tabular-nums text-primary">{formatVND(amount)}</span>
            </div>
            <input id="fund-amount" type="number" step="1000" min="1000" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="ui-field" />
            <div className="CreateFundContributionModal__presets flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button key={preset} type="button" variant={amount === preset ? "primary" : "secondary"} size="compact" onClick={() => setAmount(preset)}>+{preset / 1000}k</Button>
              ))}
            </div>
          </div>

          <div className="CreateFundContributionModal__field flex flex-col gap-2">
            <label htmlFor="fund-reason" className="text-sm font-semibold text-text-primary">Lý do đóng quỹ <span className="text-danger">*</span></label>
            <SelectDropdown
              id="fund-reason"
              value={reason}
              onChange={(value) => setReason(value as FundContributionReason)}
              options={[
                { value: FundContributionReason.LATE, label: FundContributionReason.LATE },
                { value: FundContributionReason.BUSY_WITHOUT_PERMISSION, label: FundContributionReason.BUSY_WITHOUT_PERMISSION },
                { value: FundContributionReason.OTHER, label: `${FundContributionReason.OTHER} (Yêu cầu nhập chi tiết)` },
              ]}
            />
          </div>

          {reason === FundContributionReason.OTHER ? (
            <div className="CreateFundContributionModal__field flex flex-col gap-2">
              <label htmlFor="reason-details" className="text-sm font-semibold text-text-primary">Chi tiết lý do <span className="text-danger">*</span></label>
              <textarea id="reason-details" rows={3} value={reasonDetails} onChange={(event) => setReasonDetails(event.target.value)} placeholder="Nhập chi tiết lý do" className="ui-field h-auto min-h-24 resize-y" />
            </div>
          ) : null}

          {error ? <p className="CreateFundContributionModal__error text-sm font-medium text-danger" role="alert">{error}</p> : null}
        </form>
      </div>
    </ResponsiveDialog>
  );
}
