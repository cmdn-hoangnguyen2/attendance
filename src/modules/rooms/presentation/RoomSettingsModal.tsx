"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Archive01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CrownIcon,
  QrCode01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

export interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  onOpenPaymentQrModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenArchiveModal?: () => void;
}

export function RoomSettingsModal({
  isOpen,
  onClose,
  roomName,
  onOpenPaymentQrModal,
  onOpenTransferModal,
  onOpenArchiveModal,
}: RoomSettingsModalProps) {
  const handleAction = (callback?: () => void) => {
    onClose();
    callback?.();
  };

  return (
    <ResponsiveDialog isOpen={isOpen} onClose={onClose} labelledBy="room-settings-modal-title" size="sm">
      <div className="RoomSettingsModal ui-section-stack">
        <div className="RoomSettingsModal__heading flex items-start gap-4">
          <span className="RoomSettingsModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <HugeiconsIcon icon={Settings01Icon} size={24} aria-hidden />
          </span>
          <div className="RoomSettingsModal__heading-copy min-w-0">
            <h2 id="room-settings-modal-title" className="RoomSettingsModal__title text-xl font-bold text-text-primary">Cài đặt phòng họp</h2>
            <p className="RoomSettingsModal__description mt-2 text-sm leading-6 text-text-secondary">Quản lý thao tác hành chính cho phòng &ldquo;{roomName}&rdquo;.</p>
          </div>
          <Button className="RoomSettingsModal__close shrink-0 px-2" variant="ghost" autoFocus aria-label="Đóng cửa sổ" onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </Button>
        </div>

        <div className="RoomSettingsModal__actions border-y border-border">
          {onOpenPaymentQrModal ? (
            <Button variant="ghost" className="RoomSettingsModal__action ui-data-row h-auto min-h-16 w-full justify-between rounded-none py-4 text-left" onClick={() => handleAction(onOpenPaymentQrModal)}>
              <span className="RoomSettingsModal__action-copy flex min-w-0 items-center gap-4">
                <span className="RoomSettingsModal__action-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><HugeiconsIcon icon={QrCode01Icon} size={20} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-text-primary">Mã QR thanh toán phòng</span><span className="mt-1 block text-sm leading-6 text-text-secondary">Tải lên hoặc cập nhật ảnh QR nhận quỹ.</span></span>
              </span>
              <HugeiconsIcon className="shrink-0 text-text-tertiary" icon={ArrowRight01Icon} size={18} aria-hidden />
            </Button>
          ) : null}

          {onOpenTransferModal ? (
            <Button variant="ghost" className="RoomSettingsModal__action ui-data-row h-auto min-h-16 w-full justify-between rounded-none py-4 text-left" onClick={() => handleAction(onOpenTransferModal)}>
              <span className="RoomSettingsModal__action-copy flex min-w-0 items-center gap-4">
                <span className="RoomSettingsModal__action-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info"><HugeiconsIcon icon={CrownIcon} size={20} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-text-primary">Chuyển quyền chủ phòng</span><span className="mt-1 block text-sm leading-6 text-text-secondary">Bàn giao quyền quản trị cho thành viên khác.</span></span>
              </span>
              <HugeiconsIcon className="shrink-0 text-text-tertiary" icon={ArrowRight01Icon} size={18} aria-hidden />
            </Button>
          ) : null}

          {onOpenArchiveModal ? (
            <Button variant="ghost" className="RoomSettingsModal__action ui-data-row h-auto min-h-16 w-full justify-between rounded-none py-4 text-left" onClick={() => handleAction(onOpenArchiveModal)}>
              <span className="RoomSettingsModal__action-copy flex min-w-0 items-center gap-4">
                <span className="RoomSettingsModal__action-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger"><HugeiconsIcon icon={Archive01Icon} size={20} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-text-primary">Lưu trữ phòng họp</span><span className="mt-1 block text-sm leading-6 text-text-secondary">Đóng phòng và chuyển dữ liệu sang chỉ đọc.</span></span>
              </span>
              <HugeiconsIcon className="shrink-0 text-text-tertiary" icon={ArrowRight01Icon} size={18} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
