"use client";

import React from "react";
import Link from "next/link";
import type { Room, User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Globe02Icon,
  LockIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export interface RoomCardProps {
  room: Room;
  owner?: User;
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
  currentUser,
  isMember,
  isOwner,
  joinRequestStatus = "none",
  onRequestJoin,
  onCancelRequest,
}: RoomCardProps) {
  const isPublic = room.visibility === "public";
  const canDirectlyEnter = isMember || isOwner || currentUser?.role === "admin";

  const handleRequestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRequestJoin(room.id);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onCancelRequest(room.id);
  };

  return (
    // Card Container: padding 24px (p-6, space-4), bo góc 16px (rounded-2xl)
    <article className="flex flex-col justify-between rounded-2xl border border-[#C9F2E3] bg-white p-6 shadow-xs transition-all hover:border-[#10D9A3]/60 hover:shadow-md">
      {/* Top Section: Header & Badges */}
      <div className="flex flex-col gap-4">
        {/* Row 1: Visibility & Member count */}
        <div className="flex items-center justify-between gap-2">
          {/* Visibility Badge */}
          {isPublic ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8FBF4] px-2.5 py-1 text-xs font-semibold text-[#05966B]">
              <HugeiconsIcon icon={Globe02Icon} size={14} />
              <span>Công khai</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-[#4B665D]">
              <HugeiconsIcon icon={LockIcon} size={14} />
              <span>Riêng tư</span>
            </span>
          )}

          {/* Member Count */}
          <span className="flex items-center gap-1 text-xs font-medium text-[#4B665D]">
            <HugeiconsIcon icon={UserGroupIcon} size={14} />
            <span>{room.memberCount ?? 0} thành viên</span>
          </span>
        </div>

        {/* Room Title */}
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#0B1F1A]">
            {room.name}
          </h3>
          {/* Owner info */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B665D]">
            <HugeiconsIcon icon={UserIcon} size={13} />
            <span className="truncate">
              Chủ phòng:{" "}
              <strong className="font-medium text-[#0B1F1A]">
                {owner?.displayName ?? "Chưa xác định"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Action CTA (External margin top: 24px = mt-6) */}
      <div className="mt-6 border-t border-neutral-100 pt-4">
        {canDirectlyEnter ? (
          <Link
            href={`/meeting/${room.id}`}
            className="flex w-full items-center justify-center rounded-lg bg-[#10D9A3] px-4 py-2 text-sm font-semibold text-[#0B1F1A] transition-colors hover:bg-[#05966B] hover:text-white"
          >
            Vào phòng họp
          </Link>
        ) : isPublic ? (
          <button
            type="button"
            onClick={handleRequestClick}
            className="w-full rounded-lg bg-[#10D9A3] px-4 py-2 text-sm font-semibold text-[#0B1F1A] transition-colors hover:bg-[#05966B] hover:text-white"
          >
            Tham gia ngay
          </button>
        ) : (
          /* Private Room States */
          <div>
            {joinRequestStatus === "pending" ? (
              <div className="flex flex-col gap-2">
                <span className="text-center text-xs font-semibold text-amber-600 bg-amber-50 py-1 rounded">
                  Đang chờ duyệt...
                </span>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="w-full rounded-lg border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Hủy yêu cầu
                </button>
              </div>
            ) : joinRequestStatus === "rejected" ? (
              <div className="flex flex-col gap-2">
                <span className="text-center text-xs font-medium text-rose-600 bg-rose-50 py-1 rounded">
                  Yêu cầu đã bị từ chối
                </span>
                <button
                  type="button"
                  onClick={handleRequestClick}
                  className="w-full rounded-lg bg-[#05966B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B1F1A]"
                >
                  Gửi lại yêu cầu
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestClick}
                className="w-full rounded-lg border border-[#10D9A3] bg-white px-4 py-2 text-sm font-semibold text-[#05966B] transition-colors hover:bg-[#E8FBF4]"
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
