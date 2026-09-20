"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import type { Room, User } from "@/types/domain";
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
  joinRequestStatus?: "none" | "pending" | "approved" | "rejected";
  onRequestJoin: (roomId: string) => void;
  onCancelRequest: (roomId: string) => void;
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
}: RoomCardProps) {
  const isPublic = room.visibility === "public";
  const canDirectlyEnter =
    isMember ||
    isOwner ||
    currentUser?.role === "admin" ||
    joinRequestStatus === "approved";

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

  return (
    // Card Container: neutral border, 8pt-grid (p-6, rounded-2xl)
    <article className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs transition-all hover:border-neutral-400 hover:shadow-sm">
      {/* Top Content: Type room -> Title -> List info */}
      <div className="flex flex-col gap-3">
        {/* 1. Type room (Badge) */}
        <div>
          {isPublic ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
              <HugeiconsIcon icon={Globe02Icon} size={13} />
              <span>Công khai</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 border border-neutral-200">
              <HugeiconsIcon icon={LockIcon} size={13} />
              <span>Riêng tư</span>
            </span>
          )}
        </div>

        {/* 2. Room Name */}
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-900">
          {room.name}
        </h3>

        {/* 3. List Info: Owner -> Member count -> Meeting start time */}
        <div className="flex flex-col gap-2 pt-1 text-xs text-neutral-600">
          {/* Owner info */}
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserIcon} size={14} className="text-neutral-400 shrink-0" />
            <span className="truncate">
              Chủ phòng:{" "}
              <strong className="font-semibold text-neutral-900">
                {owner?.displayName ?? "Chưa xác định"}
              </strong>
            </span>
          </div>

          {/* Member count */}
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-neutral-400 shrink-0" />
            <span>{room.memberCount ?? 0} thành viên</span>
          </div>

          {/* Meeting start time */}
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} size={14} className="text-neutral-400 shrink-0" />
            <span>Giờ họp: {formattedMeetingTime}</span>
          </div>
        </div>
      </div>

      {/* 4. Action CTA (Pill layout: rounded-full) */}
      <div className="mt-6 border-t border-neutral-100 pt-4">
        {canDirectlyEnter ? (
          <Link
            href={`/meeting/${room.id}`}
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-primary-hover hover:text-white"
          >
            Vào phòng họp
          </Link>
        ) : isPublic ? (
          <button
            type="button"
            onClick={handleRequestClick}
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-bold text-neutral-900 shadow-xs transition-colors hover:bg-primary-hover hover:text-white"
          >
            Tham gia ngay
          </button>
        ) : (
          /* Private Room States */
          <div>
            {joinRequestStatus === "pending" ? (
              <div className="flex flex-col gap-2">
                <span className="text-center text-xs font-semibold text-amber-700 bg-amber-50 py-1.5 rounded-full border border-amber-200">
                  Đang chờ duyệt...
                </span>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="w-full rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Hủy yêu cầu
                </button>
              </div>
            ) : joinRequestStatus === "rejected" ? (
              <div className="flex flex-col gap-2">
                <span className="text-center text-xs font-medium text-rose-700 bg-rose-50 py-1.5 rounded-full border border-rose-200">
                  Yêu cầu đã bị từ chối
                </span>
                <button
                  type="button"
                  onClick={handleRequestClick}
                  className="w-full rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Gửi lại yêu cầu
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestClick}
                className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50"
              >
                Gửi yêu cầu tham gia
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
