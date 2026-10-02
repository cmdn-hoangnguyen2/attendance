"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RoomDetailTab,
  RoomStatus,
  RoomVisibility,
  type Room,
  type User,
} from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Coins01Icon,
  Logout01Icon,
  Settings01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoomSettingsModal } from "@/modules/rooms/presentation/RoomSettingsModal";

export type MeetingTab = RoomDetailTab;

export interface MeetingHeaderProps {
  room: Room;
  owner?: User;
  activeTab: MeetingTab;
  onTabChange: (tab: MeetingTab) => void;
  membersCount: number;
  fundsCount: number;
  isOwnerOrAdmin: boolean;
  isMember?: boolean;
  isOwner?: boolean;
  onOpenArchiveModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenPaymentQrModal?: () => void;
  onOpenLeaveModal?: () => void;
}

export function MeetingHeader({
  room,
  owner,
  activeTab,
  onTabChange,
  membersCount,
  fundsCount,
  isOwnerOrAdmin,
  isMember,
  isOwner,
  onOpenArchiveModal,
  onOpenTransferModal,
  onOpenPaymentQrModal,
  onOpenLeaveModal,
}: MeetingHeaderProps) {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const isPublic = room.visibility === RoomVisibility.PUBLIC;
  const isArchived = room.status === RoomStatus.ARCHIVED;

  const tabs: PillTabItem<MeetingTab>[] = isArchived
    ? [{ key: RoomDetailTab.FUNDS, label: `Quỹ (${fundsCount})`, icon: Coins01Icon }]
    : [
        { key: RoomDetailTab.ATTENDANCE, label: "Điểm danh", icon: Calendar01Icon },
        { key: RoomDetailTab.MEMBERS, label: `Thành viên (${membersCount})`, icon: UserGroupIcon },
        { key: RoomDetailTab.FUNDS, label: `Quỹ (${fundsCount})`, icon: Coins01Icon },
      ];

  return (
    <header className="MeetingHeader border-b border-border pb-6">
      <div className="MeetingHeader__utility-row flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="MeetingHeader__back-link inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden />
          <span>Danh sách phòng</span>
        </Link>

        {isArchived ? <StatusBadge tone="neutral">Phòng đã lưu trữ</StatusBadge> : null}
      </div>

      <div className="MeetingHeader__identity-row mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="MeetingHeader__identity min-w-0">
          <div className="MeetingHeader__title-row flex flex-wrap items-center gap-2">
            <h1 className="MeetingHeader__title min-w-0 text-2xl font-bold tracking-tight text-text-primary md:text-[32px] md:leading-10">
              {room.name}
            </h1>
            <StatusBadge tone={isPublic ? "success" : "neutral"}>
              {isPublic ? "Công khai" : "Riêng tư"}
            </StatusBadge>
          </div>

          <dl className="MeetingHeader__metadata mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
            <div className="MeetingHeader__metadata-item flex gap-2">
              <dt>Chủ phòng</dt>
              <dd className="font-semibold text-text-primary">{owner?.displayName ?? "Chưa rõ"}</dd>
            </div>
            <div className="MeetingHeader__metadata-item flex gap-2">
              <dt>Thành viên</dt>
              <dd className="font-semibold text-text-primary">{membersCount}</dd>
            </div>
            {isOwnerOrAdmin ? (
              <div className="MeetingHeader__metadata-item flex gap-2">
                <dt>Quyền</dt>
                <dd className="font-semibold text-primary">Quản trị phòng</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="MeetingHeader__actions flex flex-wrap items-center gap-2">
          {isMember && !isOwner && !isArchived && onOpenLeaveModal ? (
            <Button variant="ghost" onClick={onOpenLeaveModal}>
              <HugeiconsIcon icon={Logout01Icon} size={16} aria-hidden />
              Rời phòng
            </Button>
          ) : null}

          {isOwnerOrAdmin && !isArchived ? (
            <Button
              variant="secondary"
              onClick={() => setIsSettingsModalOpen(true)}
              aria-label="Mở cài đặt phòng họp"
            >
              <HugeiconsIcon icon={Settings01Icon} size={16} aria-hidden />
              Cài đặt phòng
            </Button>
          ) : null}
        </div>
      </div>

      <nav className="MeetingHeader__tabs mt-6" aria-label="Nội dung phòng">
        <PillTabs tabs={tabs} activeKey={activeTab} onChange={onTabChange} />
      </nav>

      <RoomSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        roomName={room.name}
        onOpenPaymentQrModal={onOpenPaymentQrModal}
        onOpenTransferModal={onOpenTransferModal}
        onOpenArchiveModal={onOpenArchiveModal}
      />
    </header>
  );
}
