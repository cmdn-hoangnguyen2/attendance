"use client";

import { useState, type FormEvent } from "react";
import {
  Camera02Icon,
  Cancel01Icon,
  Comment01Icon,
  Globe02Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { cn } from "@/lib/utils";
import { RoomType, RoomVisibility } from "@/types/domain";

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (data: { name: string; type: RoomType; visibility: RoomVisibility }) => void;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
}: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<RoomType>(RoomType.MEETING);
  const [visibility, setVisibility] = useState<RoomVisibility>(RoomVisibility.PUBLIC);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên phòng.");
      return;
    }
    onCreateRoom({
      name: name.trim(),
      type,
      visibility,
    });
    setName("");
    setType(RoomType.MEETING);
    setVisibility(RoomVisibility.PUBLIC);
    setError("");
    onClose();
  };

  const footer = (
    <div className="CreateRoomModal__actions flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
      <Button className="w-full sm:w-auto" variant="secondary" size="touch" onClick={onClose}>
        Hủy
      </Button>
      <Button className="w-full sm:w-auto" size="touch" type="submit" form="create-room-form">
        Tạo phòng
      </Button>
    </div>
  );

  const optionClassName =
    "CreateRoomModal__option flex min-h-28 flex-col gap-2 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none";

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="create-room-title"
      footer={footer}
      size="md"
    >
      <header className="CreateRoomModal__header flex items-start justify-between gap-4 border-b border-border pb-6">
        <div className="CreateRoomModal__heading min-w-0">
          <h2 className="CreateRoomModal__title text-xl font-bold leading-8 text-text-primary md:text-2xl" id="create-room-title">
            Tạo phòng mới
          </h2>
          <p className="CreateRoomModal__description mt-2 max-w-xl text-sm leading-6 text-text-secondary">
            Tạo không gian điểm danh, họp và quản lý quỹ cho nhóm của bạn.
          </p>
        </div>
        <button
          className="CreateRoomModal__close flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none"
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ tạo phòng"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
        </button>
      </header>

      <form className="CreateRoomModal__form mt-6 flex flex-col gap-6" id="create-room-form" onSubmit={handleSubmit}>
        <div className="CreateRoomModal__field flex flex-col gap-2">
          <label className="CreateRoomModal__label text-sm font-semibold text-text-primary" htmlFor="room-name">
            Tên phòng <span className="text-danger">*</span>
          </label>
          <input
            className={cn(
              "CreateRoomModal__input h-12 w-full rounded-md border bg-surface px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus-visible:ring-2",
              error
                ? "border-danger focus-visible:ring-danger/20"
                : "border-border focus:border-primary focus-visible:ring-primary/20",
            )}
            id="room-name"
            type="text"
            value={name}
            placeholder="Ví dụ: Daily Standup Frontend"
            autoComplete="off"
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "room-name-error" : "room-name-help"}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
          />
          {error ? (
            <p className="CreateRoomModal__error text-xs font-semibold text-danger" id="room-name-error" role="alert">
              {error}
            </p>
          ) : (
            <p className="CreateRoomModal__help text-xs leading-5 text-text-tertiary" id="room-name-help">
              Dùng tên ngắn, dễ nhận biết với mọi thành viên.
            </p>
          )}
        </div>

        <fieldset className="CreateRoomModal__fieldset flex flex-col gap-4">
          <legend className="CreateRoomModal__legend text-sm font-semibold text-text-primary">
            Loại không gian
          </legend>
          <div className="CreateRoomModal__option-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              className={cn(
                optionClassName,
                type === RoomType.MEETING
                  ? "border-primary bg-primary-soft text-primary-active"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle",
              )}
              type="button"
              onClick={() => setType(RoomType.MEETING)}
              aria-pressed={type === RoomType.MEETING}
            >
              <span className="CreateRoomModal__option-heading flex items-center gap-2 text-sm font-bold text-text-primary">
                <HugeiconsIcon icon={Camera02Icon} size={20} aria-hidden />
                Phòng họp
              </span>
              <span className="CreateRoomModal__option-description text-xs leading-5">
                Dành cho họp, điểm danh và quỹ phạt.
              </span>
            </button>
            <button
              className={cn(
                optionClassName,
                type === RoomType.CHANNEL
                  ? "border-primary bg-primary-soft text-primary-active"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle",
              )}
              type="button"
              onClick={() => setType(RoomType.CHANNEL)}
              aria-pressed={type === RoomType.CHANNEL}
            >
              <span className="CreateRoomModal__option-heading flex items-center gap-2 text-sm font-bold text-text-primary">
                <HugeiconsIcon icon={Comment01Icon} size={20} aria-hidden />
                Kênh chung
              </span>
              <span className="CreateRoomModal__option-description text-xs leading-5">
                Dành cho thảo luận, tin tức và quỹ chung.
              </span>
            </button>
          </div>
        </fieldset>

        <fieldset className="CreateRoomModal__fieldset flex flex-col gap-4">
          <legend className="CreateRoomModal__legend text-sm font-semibold text-text-primary">
            Quyền truy cập
          </legend>
          <div className="CreateRoomModal__option-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              className={cn(
                optionClassName,
                visibility === RoomVisibility.PUBLIC
                  ? "border-primary bg-primary-soft text-primary-active"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle",
              )}
              type="button"
              onClick={() => setVisibility(RoomVisibility.PUBLIC)}
              aria-pressed={visibility === RoomVisibility.PUBLIC}
            >
              <span className="CreateRoomModal__option-heading flex items-center gap-2 text-sm font-bold text-text-primary">
                <HugeiconsIcon icon={Globe02Icon} size={20} aria-hidden />
                Công khai
              </span>
              <span className="CreateRoomModal__option-description text-xs leading-5">
                Thành viên có thể tham gia ngay.
              </span>
            </button>
            <button
              className={cn(
                optionClassName,
                visibility === RoomVisibility.PRIVATE
                  ? "border-primary bg-primary-soft text-primary-active"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-subtle",
              )}
              type="button"
              onClick={() => setVisibility(RoomVisibility.PRIVATE)}
              aria-pressed={visibility === RoomVisibility.PRIVATE}
            >
              <span className="CreateRoomModal__option-heading flex items-center gap-2 text-sm font-bold text-text-primary">
                <HugeiconsIcon icon={LockIcon} size={20} aria-hidden />
                Riêng tư
              </span>
              <span className="CreateRoomModal__option-description text-xs leading-5">
                Chủ phòng cần phê duyệt yêu cầu.
              </span>
            </button>
          </div>
        </fieldset>
      </form>
    </ResponsiveDialog>
  );
}
