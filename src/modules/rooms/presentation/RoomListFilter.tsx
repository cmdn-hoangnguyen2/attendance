"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
    <section className="RoomListFilter flex flex-col gap-4 border-b border-border pb-6" aria-label="Tìm và lọc phòng">
      <div className="RoomListFilter__controls flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="RoomListFilter__search flex w-full flex-col gap-2 md:max-w-xl">
          <label className="RoomListFilter__search-label text-sm font-semibold text-text-primary" htmlFor="room-search">
            Tìm phòng
          </label>
          <div className="RoomListFilter__search-field relative">
            <HugeiconsIcon
              className="RoomListFilter__search-icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              icon={Search01Icon}
              size={18}
              aria-hidden
            />
            <input
              className="RoomListFilter__search-input h-12 w-full rounded-md border border-border bg-surface pl-12 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              id="room-search"
              name="room-search"
              type="search"
              value={searchQuery}
              placeholder="Nhập tên phòng cần tìm"
              onChange={(event) => onSearchChange(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="RoomListFilter__visibility-filter flex shrink-0 items-center">
          <DropdownFilter
            items={ROOM_FILTER_ITEMS}
            activeKey={activeTab}
            onChange={onTabChange}
            label="Quyền truy cập"
          />
        </div>
      </div>

      <p className="RoomListFilter__result-count text-sm text-text-secondary" aria-live="polite">
        {filteredRoomsCount} phòng phù hợp
      </p>
    </section>
  );
}
