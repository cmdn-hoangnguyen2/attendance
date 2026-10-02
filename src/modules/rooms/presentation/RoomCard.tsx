"use client";

import { useMemo, type MouseEvent } from "react";
import Link from "next/link";
import {
  Clock01Icon,
  Globe02Icon,
  LockIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/Button";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  GlobalRole,
  JoinRequestStatus,
  RoomVisibility,
  type Room,
  type User,
} from "@/types/domain";

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

interface RelationshipState {
  label: string;
  tone: StatusBadgeProps["tone"];
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
      if (Number.isNaN(date.getTime())) return "-";
      const time = date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const dateLabel = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      return `${time} ${dateLabel}`;
    } catch {
      return "-";
    }
  }, [meetingStartTime]);

  const handleRequestClick = (event: MouseEvent) => {
    event.preventDefault();
    onRequestJoin(room.id);
  };

  const handleCancelClick = (event: MouseEvent) => {
    event.preventDefault();
    onCancelRequest(room.id);
  };

  let relationshipState: RelationshipState;
  if (isOwner) {
    relationshipState = { label: "Bạn là chủ phòng", tone: "success" };
  } else if (isMember) {
    relationshipState = { label: "Đã tham gia", tone: "success" };
  } else if (currentUser?.role === GlobalRole.ADMIN) {
    relationshipState = { label: "Quyền truy cập Admin", tone: "info" };
  } else if (joinRequestStatus === JoinRequestStatus.APPROVED) {
    relationshipState = { label: "Yêu cầu đã được duyệt", tone: "success" };
  } else if (joinRequestStatus === JoinRequestStatus.PENDING) {
    relationshipState = { label: "Đang chờ duyệt", tone: "warning" };
  } else if (joinRequestStatus === JoinRequestStatus.REJECTED) {
    relationshipState = { label: "Yêu cầu bị từ chối", tone: "danger" };
  } else if (isPublic) {
    relationshipState = { label: "Có thể tham gia ngay", tone: "neutral" };
  } else {
    relationshipState = { label: "Cần chủ phòng phê duyệt", tone: "neutral" };
  }

  const relationshipBadge = (
    <StatusBadge className="RoomCard__relationship-badge" tone={relationshipState.tone}>
      {relationshipState.label}
    </StatusBadge>
  );

  const visibilityBadge = (
    <span
      className={cn(
        "RoomCard__visibility-badge inline-flex min-h-8 items-center gap-2 rounded-full px-4 text-xs font-semibold",
        isPublic ? "bg-success-soft text-success" : "bg-neutral-soft text-neutral",
      )}
    >
      <HugeiconsIcon icon={isPublic ? Globe02Icon : LockIcon} size={16} aria-hidden />
      <span className="RoomCard__visibility-label">{isPublic ? "Công khai" : "Riêng tư"}</span>
    </span>
  );

  const roomTypeLabel = room.type === "meeting" ? "Phòng họp" : "Kênh chung";
  const roomTypeBadge = (
    <span className="RoomCard__type-badge inline-flex min-h-8 items-center rounded-full bg-primary-soft px-4 text-xs font-semibold text-primary-active">
      {roomTypeLabel}
    </span>
  );

  let roomAction;
  if (canDirectlyEnter) {
    roomAction = (
      <Link
        className="RoomCard__enter-action inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none"
        href={`/meeting/${room.id}`}
      >
        Vào phòng
      </Link>
    );
  } else if (isPublic) {
    roomAction = (
      <Button className="RoomCard__join-action w-full" size="touch" onClick={handleRequestClick}>
        Tham gia ngay
      </Button>
    );
  } else if (joinRequestStatus === JoinRequestStatus.PENDING) {
    roomAction = (
      <Button
        className="RoomCard__cancel-action w-full"
        variant="secondary"
        size="touch"
        onClick={handleCancelClick}
      >
        Hủy yêu cầu
      </Button>
    );
  } else if (joinRequestStatus === JoinRequestStatus.REJECTED) {
    roomAction = (
      <Button className="RoomCard__retry-action w-full" size="touch" onClick={handleRequestClick}>
        Gửi lại yêu cầu
      </Button>
    );
  } else {
    roomAction = (
      <Button className="RoomCard__request-action w-full" size="touch" onClick={handleRequestClick}>
        Gửi yêu cầu tham gia
      </Button>
    );
  }

  if (!isCatalogLayout) {
    return (
      <article className="RoomCard RoomCard--list flex flex-col gap-4 p-6 transition-colors hover:bg-surface-subtle md:flex-row md:items-center md:justify-between">
        <div className="RoomCard__list-content min-w-0">
          <h3 className="RoomCard__title line-clamp-2 text-lg font-bold leading-7 text-text-primary">
            {room.name}
          </h3>
          <div className="RoomCard__badges mt-4 flex flex-wrap items-center gap-2">
            {visibilityBadge}
            {roomTypeBadge}
          </div>
          <div className="RoomCard__summary mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary">
            <span className="RoomCard__owner">
              Chủ phòng: <strong className="text-text-primary">{owner?.displayName ?? "Chưa xác định"}</strong>
            </span>
            <span className="RoomCard__member-count">{room.memberCount ?? 0} thành viên</span>
            <span className="RoomCard__meeting-time">Giờ họp: {formattedMeetingTime}</span>
          </div>
        </div>
        <div className="RoomCard__list-action w-full shrink-0 md:w-48">{roomAction}</div>
      </article>
    );
  }

  return (
    <article
      className="RoomCard RoomCard--catalog flex h-full min-w-0 flex-col rounded-lg border border-border bg-surface p-6 transition-colors duration-150 hover:border-primary"
      aria-labelledby={`room-${room.id}-title`}
    >
      <header className="RoomCard__header min-w-0">
        <h3
          className="RoomCard__title line-clamp-2 min-h-14 text-xl font-bold leading-7 text-text-primary"
          id={`room-${room.id}-title`}
          title={room.name}
        >
          {room.name}
        </h3>
        <div className="RoomCard__badges mt-4 flex flex-wrap items-center gap-2">
          {visibilityBadge}
          {roomTypeBadge}
        </div>
      </header>

      <dl className="RoomCard__metadata mt-6 flex flex-col gap-4 text-sm text-text-secondary">
        <div className="RoomCard__metadata-item flex min-w-0 items-center gap-4">
          <dt className="RoomCard__metadata-label sr-only">Chủ phòng</dt>
          <HugeiconsIcon icon={UserIcon} size={18} className="shrink-0 text-text-tertiary" aria-hidden />
          <dd className="RoomCard__metadata-value truncate">
            Chủ phòng: <strong className="font-semibold text-text-primary">{owner?.displayName ?? "Chưa xác định"}</strong>
          </dd>
        </div>
        <div className="RoomCard__metadata-item flex items-center gap-4">
          <dt className="RoomCard__metadata-label sr-only">Số thành viên</dt>
          <HugeiconsIcon icon={UserGroupIcon} size={18} className="shrink-0 text-text-tertiary" aria-hidden />
          <dd className="RoomCard__metadata-value">{room.memberCount ?? 0} thành viên</dd>
        </div>
        {meetingStartTime ? (
          <div className="RoomCard__metadata-item flex items-center gap-4">
            <dt className="RoomCard__metadata-label sr-only">Giờ họp</dt>
            <HugeiconsIcon icon={Clock01Icon} size={18} className="shrink-0 text-text-tertiary" aria-hidden />
            <dd className="RoomCard__metadata-value">{formattedMeetingTime}</dd>
          </div>
        ) : null}
      </dl>

      <div className="RoomCard__relationship mt-6">{relationshipBadge}</div>
      <footer className="RoomCard__footer mt-auto pt-6">{roomAction}</footer>
    </article>
  );
}
