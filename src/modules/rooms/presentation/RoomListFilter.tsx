"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

export type RoomFilterTab = "all" | "public" | "private";

export interface RoomListFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: RoomFilterTab;
  onTabChange: (tab: RoomFilterTab) => void;
  totalRooms: number;
  filteredRoomsCount: number;
}

export function RoomListFilter({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  totalRooms,
  filteredRoomsCount,
}: RoomListFilterProps) {
  const tabs: { key: RoomFilterTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "public", label: "Công khai" },
    { key: "private", label: "Riêng tư" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#C9F2E3] bg-white p-4 shadow-xs">
      {/* Search Input Container */}
      <div className="relative flex-1 max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#4B665D]">
          <HugeiconsIcon icon={Search01Icon} size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm phòng họp theo tên..."
          className="w-full rounded-lg border border-[#C9F2E3] bg-neutral-50/50 py-2 pr-4 pl-10 text-sm text-[#0B1F1A] placeholder:text-[#4B665D]/60 focus:border-[#10D9A3] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10D9A3]/30"
        />
      </div>

      {/* Filter Tabs & Count badge */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-white text-[#05966B] shadow-xs"
                    : "text-[#4B665D] hover:text-[#0B1F1A]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Counter Badge */}
        <span className="text-xs font-medium text-[#4B665D]">
          Hiển thị: <strong className="text-[#0B1F1A]">{filteredRoomsCount}</strong> / {totalRooms} phòng
        </span>
      </div>
    </div>
  );
}
