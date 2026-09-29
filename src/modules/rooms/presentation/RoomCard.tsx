"use client";

import React, { useMemo } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { GlobalRole, JoinRequestStatus, RoomVisibility, type Room, type User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Globe02Icon,
  LockIcon,
  UserGroupIcon,
  UserIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

export interface RoomCardProps {
  room: Room;
  owner?: User;
  meetingStartTime?: string | null;
  currentUser: User | null;
  isMember?: boolean;
  isOwner?: boolean;
  joinRequestStatus?: "none" | JoinRequestStatus;
  onRequestJoin: (roomId: string) => void;
  onCancelRequest: (roomId: string) => void;
  layout?: "list" | "catalog";
}

export function RoomCard({
  room,
  owner,
  meetingStartTime,
  currentUser,
  isMember,
  isOwner,
  joinRequestStatus = "none",
  onRequestJoin,
  onCancelRequest,
  layout = "list",
}: RoomCardProps) {
  const isPublic = room.visibility === RoomVisibility.PUBLIC;
  const isCatalogLayout = layout === "catalog";
  const canDirectlyEnter =
    isMember ||
    isOwner ||
    currentUser?.role === GlobalRole.ADMIN ||
    joinRequestStatus === JoinRequestStatus.APPROVED;

  const formattedMeetingTime = useMemo(() => {
    if (!meetingStartTime) return "-";
    try {
      const date = new Date(meetingStartTime);
      if (isNaN(date.getTime())) return "-";
      const timeStr = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const dateStr = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      return `${timeStr} ${dateStr}`;
    } catch {
      return "-";
    }
  }, [meetingStartTime]);

  const handleRequestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRequestJoin(room.id);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancelRequest(room.id);
  };

  const renderPrivateRoomAction = () => {
    switch (joinRequestStatus) {
      case JoinRequestStatus.PENDING:
        return (
          <div
            className={cn(
              "RoomCard__pending-actions",
              "flex items-center gap-2",
              isCatalogLayout && "w-full flex-col items-stretch",
            )}
          >
            <span
              className={cn(
                "RoomCard__request-status",
                "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-700",
                isCatalogLayout && "px-4",
              )}
            >
              Đang chờ duyệt...
            </span>
            <button
              className="RoomCard__cancel-action min-h-10 rounded-xl border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              type="button"
              onClick={handleCancelClick}
            >
              Hủy yêu cầu
            </button>
          </div>
        );
      case JoinRequestStatus.REJECTED:
        return (
          <div
            className={cn(
              "RoomCard__rejected-actions",
              "flex items-center gap-2",
              isCatalogLayout && "w-full flex-col items-stretch",
            )}
          >
            <span
              className={cn(
                "RoomCard__request-status",
                "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-700",
                isCatalogLayout && "px-4",
              )}
            >
              Bị từ chối
            </span>
            <button
              className="RoomCard__retry-action min-h-10 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
              type="button"
              onClick={handleRequestClick}
            >
              Gửi lại yêu cầu
            </button>
          </div>
        );
      default:
        return (
          <button
            className={cn(
              "RoomCard__request-action",
              "rounded-xl border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50",
              isCatalogLayout && "min-h-10 w-full px-4 font-bold",
            )}
            type="button"
            onClick={handleRequestClick}
          >
            Gửi yêu cầu tham gia
          </button>
        );
    }
  };

  const renderRoomAction = () => {
    if (canDirectlyEnter) {
      return (
        <Link
          className={cn(
            "RoomCard__enter-action",
            "flex items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-primary-hover hover:text-white",
            isCatalogLayout && "min-h-10 w-full px-4 text-neutral-dark",
          )}
          href={`/meeting/${room.id}`}
        >
          Vào phòng họp
        </Link>
      );
    }

    if (isPublic) {
      return (
        <button
          className={cn(
            "RoomCard__join-action",
            "rounded-xl bg-primary px-5 py-2 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-primary-hover hover:text-white",
            isCatalogLayout && "min-h-10 w-full px-4 text-neutral-dark",
          )}
          type="button"
          onClick={handleRequestClick}
        >
          Tham gia ngay
        </button>
      );
    }

    return renderPrivateRoomAction();
  };

  const visibilityBadge = isPublic ? (
    <span
      className={cn(
        "RoomCard__visibility-badge",
        "inline-flex items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700",
        isCatalogLayout ? "gap-2 px-2 py-2" : "gap-1.5 px-3 py-1",
      )}
    >
      <HugeiconsIcon icon={Globe02Icon} size={14} />
      <span className="RoomCard__visibility-label">Công khai</span>
    </span>
  ) : (
    <span
      className={cn(
        "RoomCard__visibility-badge",
        "inline-flex items-center rounded-full bg-amber-50 text-xs font-bold text-amber-700",
        isCatalogLayout ? "gap-2 px-2 py-2" : "gap-1.5 px-3 py-1",
      )}
    >
      <HugeiconsIcon icon={LockIcon} size={14} />
      <span className="RoomCard__visibility-label">Riêng tư</span>
    </span>
  );

  const roomTypeLabel = room.type === "meeting" ? "Meeting" : "Channel";
  const roomTypeClassName = cn(
    "RoomCard__type-badge",
    "inline-flex items-center rounded-full text-xs font-bold",
    isCatalogLayout ? "px-2 py-2" : "px-3 py-1",
    room.type === "meeting" && isCatalogLayout && "bg-neutral-100 text-neutral-700",
    room.type === "meeting" && !isCatalogLayout && "bg-indigo-50 text-indigo-700",
    room.type !== "meeting" && "bg-sky-50 text-sky-700",
  );
  const roomAction = renderRoomAction();

  if (!isCatalogLayout) {
    return (
      <article className="RoomCard group flex flex-col gap-2.5 p-5 transition-colors hover:bg-neutral-50">
        <div className="RoomCard__primary-row flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <h3 className="RoomCard__title line-clamp-2 text-lg leading-snug font-bold text-neutral-900 md:max-w-[70%]">
            {room.name}
          </h3>

          <div className="RoomCard__action flex shrink-0">{roomAction}</div>
        </div>

        <div className="RoomCard__badges flex flex-wrap items-center gap-2">
          {visibilityBadge}
          <span className={roomTypeClassName}>{roomTypeLabel}</span>
        </div>

        <div className="RoomCard__summary mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
          <span className="RoomCard__owner flex items-center gap-1.5">
            Chủ phòng:{" "}
            <strong className="RoomCard__owner-name max-w-[150px] truncate font-semibold text-neutral-900">
              {owner?.displayName ?? "Chưa xác định"}
            </strong>
          </span>
          <span className="RoomCard__member-count flex items-center gap-1.5 before:mr-1 before:text-neutral-300 before:content-['•']">
            {room.memberCount ?? 0} thành viên
          </span>
          <span className="RoomCard__meeting-time flex items-center gap-1.5 before:mr-1 before:text-neutral-300 before:content-['•']">
            Giờ họp: {formattedMeetingTime}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className="RoomCard group flex h-full min-w-0 flex-col gap-6 rounded-2xl border border-neutral-border bg-white p-6 shadow-xs transition-colors hover:border-primary/60"
      aria-labelledby={`room-${room.id}-title`}
    >
      <header className="RoomCard__header flex min-w-0 flex-col gap-4">
        <div className="RoomCard__badges flex flex-wrap items-center gap-2">
          {visibilityBadge}
          <span className={roomTypeClassName}>{roomTypeLabel}</span>
        </div>

        <h3
          className="RoomCard__title line-clamp-2 text-lg leading-snug font-bold text-neutral-900"
          id={`room-${room.id}-title`}
        >
          {room.name}
        </h3>
      </header>

      <dl
        className="RoomCard__metadata grid grid-cols-1 gap-2 text-sm text-neutral-muted sm:grid-cols-2"
      >
        <div className="RoomCard__metadata-item flex min-w-0 items-center gap-2 sm:col-span-2">
          <dt className="RoomCard__metadata-label sr-only">Chủ phòng</dt>
          <HugeiconsIcon icon={UserIcon} size={16} className="shrink-0 text-neutral-muted" />
          <dd className="RoomCard__metadata-value truncate">
            Chủ phòng:{" "}
            <strong className="RoomCard__owner-name font-semibold text-neutral-dark">
              {owner?.displayName ?? "Chưa xác định"}
            </strong>
          </dd>
        </div>

        <div className="RoomCard__metadata-item flex items-center gap-2">
          <dt className="RoomCard__metadata-label sr-only">Số thành viên</dt>
          <HugeiconsIcon icon={UserGroupIcon} size={16} className="shrink-0 text-neutral-muted" />
          <dd className="RoomCard__metadata-value">{room.memberCount ?? 0} thành viên</dd>
        </div>

        <div className="RoomCard__metadata-item flex items-center gap-2">
          <dt className="RoomCard__metadata-label sr-only">Giờ họp</dt>
          <HugeiconsIcon icon={Clock01Icon} size={16} className="shrink-0 text-neutral-muted" />
          <dd className="RoomCard__metadata-value">{formattedMeetingTime}</dd>
        </div>
      </dl>

      <footer className="RoomCard__footer mt-auto flex w-full shrink-0 items-start pt-2">{roomAction}</footer>
    </article>
  );
}
