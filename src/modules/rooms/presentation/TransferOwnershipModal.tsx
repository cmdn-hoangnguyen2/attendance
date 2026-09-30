"use client";

import { type FormEvent, useState } from "react";
import type { Room, User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon, CrownIcon, UserIcon, UserSwitchIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
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
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => eligibleMembers.length > 0 ? eligibleMembers[0].id : "");
  const [error, setError] = useState("");

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMemberId) {
      setError("Vui lòng chọn một thành viên để chuyển quyền chủ phòng.");
      return;
    }
    onConfirmTransfer(selectedMemberId);
    handleClose();
  };

  const selectedMember = eligibleMembers.find((member) => member.id === selectedMemberId);
  const footer = (
    <div className="TransferOwnershipModal__actions grid grid-cols-1 gap-2 sm:flex sm:justify-end">
      <Button variant="secondary" size="touch" onClick={handleClose}>Hủy bỏ</Button>
      <Button type="submit" form="transfer-ownership-form" size="touch" disabled={eligibleMembers.length === 0}>
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} aria-hidden />
        Xác nhận chuyển quyền
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog isOpen={isOpen} onClose={handleClose} labelledBy="transfer-ownership-modal-title" size="sm" footer={footer}>
      <div className="TransferOwnershipModal ui-section-stack">
        <div className="TransferOwnershipModal__heading flex items-start gap-4">
          <span className="TransferOwnershipModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info"><HugeiconsIcon icon={UserSwitchIcon} size={24} aria-hidden /></span>
          <div className="TransferOwnershipModal__heading-copy min-w-0">
            <h2 id="transfer-ownership-modal-title" className="TransferOwnershipModal__title text-xl font-bold text-text-primary">Chuyển giao quyền chủ phòng</h2>
            <p className="TransferOwnershipModal__description mt-2 text-sm leading-6 text-text-secondary">Trao quyền quản trị phòng họp cho thành viên khác.</p>
          </div>
          <Button className="TransferOwnershipModal__close shrink-0 px-2" variant="ghost" autoFocus aria-label="Đóng cửa sổ" onClick={handleClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </Button>
        </div>

        <div className="TransferOwnershipModal__context rounded-lg bg-surface-subtle p-4 text-sm leading-6 text-text-secondary">
          <p className="flex items-center gap-2 font-semibold text-text-primary"><HugeiconsIcon icon={CrownIcon} size={16} aria-hidden />Phòng họp: {room.name}</p>
          <p className="mt-2">Chủ phòng hiện tại: <strong className="text-text-primary">{currentOwner?.displayName ?? "Chưa xác định"}</strong></p>
          <p className="mt-2 text-xs text-text-tertiary">Sau khi chuyển giao thành công, bạn vẫn là thành viên hoạt động trong phòng.</p>
        </div>

        <form id="transfer-ownership-form" onSubmit={handleSubmit} className="TransferOwnershipModal__form ui-section-stack">
          <div className="TransferOwnershipModal__field flex flex-col gap-2">
            <label htmlFor="new-owner-select" className="text-sm font-semibold text-text-primary">Chọn thành viên tiếp nhận quyền chủ phòng</label>
            {eligibleMembers.length > 0 ? (
              <SelectDropdown id="new-owner-select" value={selectedMemberId} onChange={(value) => { setSelectedMemberId(value); if (error) setError(""); }} options={eligibleMembers.map((member) => ({ value: member.id, label: `${member.displayName} (${member.email})` }))} />
            ) : (
              <p className="rounded-lg bg-warning-soft p-4 text-sm leading-6 text-text-secondary">Phòng hiện chưa có thành viên khác để chuyển giao quyền chủ phòng.</p>
            )}
            {error ? <p className="TransferOwnershipModal__error text-sm font-medium text-danger" role="alert">{error}</p> : null}
          </div>

          {selectedMember ? (
            <div className="TransferOwnershipModal__preview flex items-center gap-4 rounded-lg bg-primary-soft p-4">
              <span className="TransferOwnershipModal__preview-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary"><HugeiconsIcon icon={UserIcon} size={18} aria-hidden /></span>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{selectedMember.displayName}</p><p className="mt-1 text-sm text-text-secondary">Sẽ trở thành Chủ phòng mới của &ldquo;{room.name}&rdquo;.</p></div>
            </div>
          ) : null}
        </form>
      </div>
    </ResponsiveDialog>
  );
}
