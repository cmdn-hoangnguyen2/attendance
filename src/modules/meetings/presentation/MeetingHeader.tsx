"use client";

import React from "react";
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
  QrCode01Icon,
} from "@hugeicons/core-free-icons";

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
  fundsCount,
  isOwnerOrAdmin,
  onOpenArchiveModal,
  onOpenTransferModal,
  onOpenPaymentQrModal,
}: MeetingHeaderProps) {
  const isPublic = room.visibility === "public";
  const isArchived = room.status === "archived";

  const tabs: { key: MeetingTab; label: string; icon: typeof UserGroupIcon; count?: number }[] = [
    { key: "members", label: "Thành viên", icon: UserGroupIcon, count: membersCount },
    { key: "attendance", label: "Điểm danh", icon: Calendar01Icon },
    { key: "funds", label: "Quỹ phòng", icon: Coins01Icon, count: fundsCount },
  ];

  return (
    <div className="rounded-3xl border border-[#C9F2E3] bg-white p-6 lg:p-8 shadow-xs">
      {/* Top Row: Back button & Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B665D] hover:text-[#05966B]"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          <span>Quay lại trang chủ</span>
        </Link>

        {isArchived ? (
          <span className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 border border-neutral-300">
            Phòng đã lưu trữ (Archived)
          </span>
        ) : null}
      </div>

      {/* Main Info Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0B1F1A]">
              {room.name}
            </h1>
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
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#4B665D]">
            <span>
              Chủ phòng: <strong className="text-[#0B1F1A]">{owner?.displayName ?? "Chưa rõ"}</strong>
            </span>
            <span>•</span>
            <span>{membersCount} thành viên tham gia</span>
            {isOwnerOrAdmin ? (
              <>
                <span>•</span>
                <span className="font-semibold text-[#05966B]">Quyền Quản trị viên phòng</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Action Buttons for Owner / Admin */}
        {isOwnerOrAdmin && !isArchived && (
          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenPaymentQrModal && (
              <button
                type="button"
                onClick={onOpenPaymentQrModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9F2E3] bg-[#E8FBF4] px-3.5 py-2 text-xs font-semibold text-[#05966B] hover:bg-[#C9F2E3]/50 shadow-2xs transition-colors"
              >
                <HugeiconsIcon icon={QrCode01Icon} size={14} />
                <span>Mã QR thanh toán</span>
              </button>
            )}

            {onOpenTransferModal && (
              <button
                type="button"
                onClick={onOpenTransferModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F1A] hover:bg-neutral-50 shadow-2xs transition-colors"
              >
                <span>Chuyển quyền chủ phòng</span>
              </button>
            )}

            {onOpenArchiveModal && (
              <button
                type="button"
                onClick={onOpenArchiveModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition-colors"
              >
                <span>Lưu trữ phòng</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation Row: Margin top 16px (mt-4, space-3) */}
      <nav aria-label="Tab điều hướng phòng họp" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#10D9A3] text-[#0B1F1A] shadow-xs"
                  : "bg-neutral-50 text-[#4B665D] hover:bg-neutral-100 hover:text-[#0B1F1A]"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={18} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? "bg-[#05966B] text-white" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
