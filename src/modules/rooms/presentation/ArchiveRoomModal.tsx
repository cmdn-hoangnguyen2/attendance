"use client";

import { type FormEvent, useState } from "react";
import { ConfirmationPhrase, type Room } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Archive01Icon, Cancel01Icon, CheckmarkCircle01Icon, Folder01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

export interface ArchiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onConfirmArchive: (roomId: string) => void;
}

const REQUIRED_CONFIRMATION_PHRASE = ConfirmationPhrase.ARCHIVE_ROOM;

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

  const isPhraseValid = typedPhrase.trim() === REQUIRED_CONFIRMATION_PHRASE;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPhraseValid) {
      setError(`Vui lòng gõ chính xác cụm từ "${REQUIRED_CONFIRMATION_PHRASE}" để xác nhận.`);
      return;
    }
    onConfirmArchive(room.id);
    handleClose();
  };

  const footer = (
    <div className="ArchiveRoomModal__actions grid grid-cols-1 gap-2 sm:flex sm:justify-end">
      <Button variant="secondary" size="touch" onClick={handleClose}>Hủy bỏ</Button>
      <Button type="submit" form="archive-room-form" variant="destructive" size="touch" disabled={!isPhraseValid}>
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} aria-hidden />
        Xác nhận lưu trữ
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog isOpen={isOpen} onClose={handleClose} labelledBy="archive-room-modal-title" size="sm" footer={footer}>
      <div className="ArchiveRoomModal ui-section-stack">
        <div className="ArchiveRoomModal__heading flex items-start gap-4">
          <span className="ArchiveRoomModal__icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger"><HugeiconsIcon icon={Archive01Icon} size={24} aria-hidden /></span>
          <div className="ArchiveRoomModal__heading-copy min-w-0">
            <h2 id="archive-room-modal-title" className="ArchiveRoomModal__title text-xl font-bold text-text-primary">Lưu trữ phòng họp</h2>
            <p className="ArchiveRoomModal__description mt-2 text-sm leading-6 text-text-secondary">Hành động này sẽ đóng phòng và hạn chế quyền truy cập.</p>
          </div>
          <Button className="ArchiveRoomModal__close shrink-0 px-2" variant="ghost" autoFocus aria-label="Đóng cửa sổ" onClick={handleClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </Button>
        </div>

        <div className="ArchiveRoomModal__room-info rounded-lg bg-surface-subtle p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-text-primary"><HugeiconsIcon icon={Folder01Icon} size={16} aria-hidden />Phòng họp: {room.name}</p>
          <p className="mt-2 break-all text-xs text-text-tertiary">Mã định danh: {room.id}</p>
        </div>

        <div className="ArchiveRoomModal__impact rounded-lg bg-danger-soft p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-danger"><HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden />Các tác động khi lưu trữ</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-sm leading-6 text-text-secondary">
            <li>Không thể tạo thêm phiên họp hoặc điểm danh mới.</li>
            <li>Không thể nhận thêm thành viên hoặc duyệt yêu cầu tham gia mới.</li>
            <li>Không thể tạo khoản quỹ hay thay đổi ảnh thanh toán.</li>
            <li>Các khoản nợ quỹ cũ vẫn <strong className="text-text-primary">giữ nguyên và tiếp tục được thanh toán</strong>.</li>
            <li>Phòng bị ẩn khỏi Trang chủ và chỉ xem được trong chế độ lưu trữ.</li>
          </ul>
        </div>

        <form id="archive-room-form" onSubmit={handleSubmit} className="ArchiveRoomModal__form flex flex-col gap-2">
          <label htmlFor="archive-confirmation-phrase" className="text-sm font-semibold leading-6 text-text-primary">Gõ chính xác cụm từ để xác nhận: <code className="select-all text-danger">{REQUIRED_CONFIRMATION_PHRASE}</code></label>
          <input id="archive-confirmation-phrase" type="text" value={typedPhrase} onChange={(event) => { setTypedPhrase(event.target.value); if (error) setError(""); }} placeholder={REQUIRED_CONFIRMATION_PHRASE} autoComplete="off" className="ui-field font-mono" />
          {error ? <p className="ArchiveRoomModal__error text-sm font-medium text-danger" role="alert">{error}</p> : null}
        </form>
      </div>
    </ResponsiveDialog>
  );
}
