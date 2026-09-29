"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { DropdownFilter, type DropdownFilterItem } from "@/components/ui/DropdownFilter";

import { RoomFilterTab } from "@/types/domain";

export { RoomFilterTab };

const ROOM_FILTER_ITEMS: DropdownFilterItem<RoomFilterTab>[] = [
  { key: RoomFilterTab.ALL, label: "Tất cả" },
  { key: RoomFilterTab.PUBLIC, label: "Công khai" },
  { key: RoomFilterTab.PRIVATE, label: "Riêng tư" },
];

export interface RoomListFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: RoomFilterTab;
  onTabChange: (tab: RoomFilterTab) => void;
  filteredRoomsCount?: number;
}

export function RoomListFilter({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  filteredRoomsCount = 0,
}: RoomListFilterProps) {
  return (
    <section className="RoomListFilter flex flex-col gap-4" aria-labelledby="room-list-title">
      <header className="RoomListFilter__header flex items-end justify-between gap-4">
        <div className="RoomListFilter__heading flex min-w-0 flex-col gap-2">
          <h1
            className="RoomListFilter__title text-balance text-2xl font-extrabold tracking-tight text-neutral-dark"
            id="room-list-title"
          >
            Danh sách phòng họp
          </h1>
          <p className="RoomListFilter__result-count text-sm text-neutral-muted" aria-live="polite">
            Tìm thấy {filteredRoomsCount} phòng phù hợp
          </p>
        </div>
      </header>

      <div className="RoomListFilter__controls flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="RoomListFilter__search relative w-full md:max-w-lg">
          <label className="RoomListFilter__search-label sr-only" htmlFor="room-search">
            Tìm kiếm phòng họp theo tên
          </label>
          <span className="RoomListFilter__search-icon pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </span>
          <input
            className="RoomListFilter__search-input h-10 w-full rounded-full border border-neutral-border bg-white pr-4 pl-10 text-sm text-neutral-dark shadow-xs placeholder:text-neutral-muted focus:border-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            id="room-search"
            name="room-search"
            type="search"
            value={searchQuery}
            placeholder="Tìm kiếm phòng họp theo tên..."
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="RoomListFilter__visibility-filter flex shrink-0 items-center">
          <DropdownFilter
            items={ROOM_FILTER_ITEMS}
            activeKey={activeTab}
            onChange={onTabChange}
            label="Hiển thị"
          />
        </div>
      </div>
    </section>
  );
}
