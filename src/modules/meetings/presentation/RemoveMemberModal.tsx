"use client";

import { useState } from "react";
import { ConfirmationPhrase, type User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

export interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: User | null;
  hasOutstandingDebt: boolean;
  onConfirmRemove: (userId: string) => void;
}

const REQUIRED_PHRASE = ConfirmationPhrase.REMOVE_MEMBER_WITH_DEBT;

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

  if (!member) return null;

  const isConfirmed = hasOutstandingDebt
    ? typedPhrase.trim() === REQUIRED_PHRASE
    : true;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirmRemove(member.id);
      handleClose();
    }
  };

  const footer = (
    <div className="RemoveMemberModal__actions grid grid-cols-1 gap-2 sm:flex sm:justify-end">
      <Button variant="secondary" size="touch" onClick={handleClose}>Hủy bỏ</Button>
      <Button variant="destructive" size="touch" onClick={handleConfirm} disabled={!isConfirmed}>Xác nhận xóa</Button>
    </div>
  );

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="remove-member-title"
      size="sm"
      footer={footer}
    >
      <div className="RemoveMemberModal">
        <div className="RemoveMemberModal__heading flex items-start gap-4">
          <span className="RemoveMemberModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <HugeiconsIcon icon={Alert02Icon} size={24} aria-hidden />
          </span>
          <div className="RemoveMemberModal__heading-copy min-w-0">
            <h2 id="remove-member-title" className="RemoveMemberModal__title text-xl font-bold text-text-primary">Xóa thành viên</h2>
            <p className="RemoveMemberModal__subtitle mt-2 text-sm text-text-secondary">Thao tác quản trị phòng</p>
          </div>
        </div>

        <p className="RemoveMemberModal__summary mt-6 text-sm leading-6 text-text-primary">
          Bạn đang yêu cầu xóa <strong>{member.displayName}</strong> ({member.email}) khỏi phòng họp này.
        </p>

        <div className="RemoveMemberModal__impact mt-6 rounded-lg bg-danger-soft p-4">
          <h3 className="RemoveMemberModal__impact-title text-sm font-semibold text-danger">Dữ liệu được bảo lưu</h3>
          <ul className="RemoveMemberModal__impact-list mt-2 list-disc space-y-2 pl-6 text-sm leading-6 text-text-secondary">
            <li className="RemoveMemberModal__impact-item">Tư cách thành viên trong phòng chấm dứt ngay lập tức.</li>
            <li className="RemoveMemberModal__impact-item">Bản ghi đóng quỹ và lịch sử thanh toán vẫn được giữ nguyên để kiểm toán.</li>
            <li className="RemoveMemberModal__impact-item">Thành viên vẫn xem được các khoản quỹ tại trang <code>/funds</code>.</li>
          </ul>
        </div>

        {hasOutstandingDebt ? (
          <div className="RemoveMemberModal__confirmation mt-6">
            <label htmlFor="confirm-phrase" className="RemoveMemberModal__confirmation-label text-sm font-semibold leading-6 text-text-primary">
              Thành viên còn nghĩa vụ quỹ. Nhập chính xác cụm từ sau để xác nhận:
            </label>
            <code className="RemoveMemberModal__phrase mt-2 block select-all rounded-md bg-surface-subtle px-4 py-2 text-sm font-bold text-danger">
              {REQUIRED_PHRASE}
            </code>
            <input
              id="confirm-phrase"
              type="text"
              value={typedPhrase}
              onChange={(event) => setTypedPhrase(event.target.value)}
              placeholder="Nhập cụm từ ở trên"
              className="RemoveMemberModal__confirmation-input ui-field mt-4"
              autoComplete="off"
            />
          </div>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}
