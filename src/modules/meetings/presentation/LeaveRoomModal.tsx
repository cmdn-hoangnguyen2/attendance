"use client";

import type { Room } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Logout01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

export interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onConfirmLeave: () => void;
}

export function LeaveRoomModal({
  isOpen,
  onClose,
  room,
  onConfirmLeave,
}: LeaveRoomModalProps) {
  const footer = (
    <div className="LeaveRoomModal__actions grid grid-cols-1 gap-2 sm:flex sm:justify-end">
      <Button variant="secondary" size="touch" onClick={onClose}>Hủy bỏ</Button>
      <Button variant="destructive" size="touch" onClick={onConfirmLeave}>
        <HugeiconsIcon icon={Logout01Icon} size={16} aria-hidden />
        Xác nhận rời phòng
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="leave-room-title"
      size="sm"
      footer={footer}
    >
      <div className="LeaveRoomModal">
        <div className="LeaveRoomModal__heading flex items-start gap-4">
          <span className="LeaveRoomModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <HugeiconsIcon icon={Logout01Icon} size={24} aria-hidden />
          </span>
          <div className="LeaveRoomModal__heading-copy min-w-0">
            <h2 id="leave-room-title" className="LeaveRoomModal__title text-xl font-bold text-text-primary">Rời phòng họp</h2>
            <p className="LeaveRoomModal__room-name mt-2 truncate text-sm text-text-secondary">{room.name}</p>
          </div>
        </div>

        <p className="LeaveRoomModal__question mt-6 text-sm leading-6 text-text-primary">
          Bạn có chắc chắn muốn rời khỏi phòng họp <strong>&ldquo;{room.name}&rdquo;</strong> không?
        </p>

        <div className="LeaveRoomModal__notice mt-6 rounded-lg bg-warning-soft p-4">
          <h3 className="LeaveRoomModal__notice-title flex items-center gap-2 text-sm font-semibold text-text-primary">
            <HugeiconsIcon className="LeaveRoomModal__notice-icon shrink-0 text-warning" icon={Alert02Icon} size={16} aria-hidden />
            Nghĩa vụ quỹ được bảo lưu
          </h3>
          <p className="LeaveRoomModal__notice-copy mt-2 text-sm leading-6 text-text-secondary">
            Tư cách thành viên của bạn sẽ kết thúc. Toàn bộ nghĩa vụ đóng quỹ cũ và lịch sử thanh toán vẫn được bảo lưu bất biến; bạn vẫn có thể xem tại trang Quỹ cá nhân.
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
