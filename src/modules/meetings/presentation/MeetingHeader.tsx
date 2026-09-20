"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Room, User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Globe02Icon,
  LockIcon,
  UserGroupIcon,
  Calendar01Icon,
  Coins01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { RoomSettingsModal } from "@/modules/rooms/presentation/RoomSettingsModal";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";

export type MeetingTab = "members" | "attendance" | "funds";

export interface MeetingHeaderProps {
  room: Room;
  owner?: User;
  activeTab: MeetingTab;
  onTabChange: (tab: MeetingTab) => void;
  membersCount: number;
  fundsCount: number;
  isOwnerOrAdmin: boolean;
  onOpenArchiveModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenPaymentQrModal?: () => void;
}

export function MeetingHeader({
  room,
  owner,
  activeTab,
  onTabChange,
  membersCount,
  isOwnerOrAdmin,
  onOpenArchiveModal,
  onOpenTransferModal,
  onOpenPaymentQrModal,
}: MeetingHeaderProps) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const isPublic = room.visibility === "public";
  const isArchived = room.status === "archived";

  const tabs: PillTabItem<MeetingTab>[] = [
    { key: "members", label: "Thành viên", icon: UserGroupIcon },
    { key: "attendance", label: "Điểm danh", icon: Calendar01Icon },
    { key: "funds", label: "Quỹ phòng", icon: Coins01Icon },
  ];

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 lg:p-8 shadow-xs">
      {/* Top Row: Back button & Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 py-1 text-xs font-semibold text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Về trang chủ</span>
        </Link>

        {isArchived ? (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 border border-neutral-200">
            Phòng đã lưu trữ
          </span>
        ) : null}
      </div>

      {/* Main Info Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900">
              {room.name}
            </h1>
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

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span>
              Chủ phòng: <strong className="text-neutral-900">{owner?.displayName ?? "Chưa rõ"}</strong>
            </span>
            <span>•</span>
            <span>{membersCount} thành viên</span>
            {isOwnerOrAdmin ? (
              <>
                <span>•</span>
                <span className="font-semibold text-primary-dark">Quản trị viên phòng</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Action Button: Settings Icon Button for Owner / Admin */}
        {isOwnerOrAdmin && !isArchived && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 shadow-2xs transition-all hover:border-neutral-900 hover:bg-neutral-900 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400"
              title="Cài đặt phòng họp (Mã QR, Chuyển quyền, Lưu trữ)"
              aria-label="Cài đặt phòng họp"
            >
              <HugeiconsIcon icon={Settings01Icon} size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Modal Cài Đặt Phòng Họp */}
      <RoomSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        roomName={room.name}
        onOpenPaymentQrModal={onOpenPaymentQrModal}
        onOpenTransferModal={onOpenTransferModal}
        onOpenArchiveModal={onOpenArchiveModal}
      />

      {/* Tab Navigation: PillTabs */}
      <div className="mt-6 flex">
        <PillTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={onTabChange}
        />
      </div>
    </div>
  );
}
