"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";

export type RoomFilterTab = "all" | "public" | "private";

export interface RoomListFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: RoomFilterTab;
  onTabChange: (tab: RoomFilterTab) => void;
  totalRooms?: number;
  filteredRoomsCount?: number;
}

export function RoomListFilter({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}: RoomListFilterProps) {
  const tabs: PillTabItem<RoomFilterTab>[] = [
    { key: "all", label: "Tất cả" },
    { key: "public", label: "Công khai" },
    { key: "private", label: "Riêng tư" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
      {/* Search Input Container: Pill layout */}
      <div className="relative flex-1 max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
          <HugeiconsIcon icon={Search01Icon} size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm phòng họp theo tên..."
          className="w-full rounded-full border border-neutral-200 bg-neutral-50/60 py-2.5 pr-4 pl-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200"
        />
      </div>

      {/* Filter PillTabs */}
      <div className="flex items-center">
        <PillTabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={onTabChange}
        />
      </div>
    </div>
  );
}
