import React from "react";

export function RoomSkeletonGrid() {
  return (
    <div
      aria-label="Đang tải danh sách phòng..."
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex flex-col justify-between rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs animate-pulse"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded-md bg-neutral-200" />
              <div className="h-4 w-24 rounded bg-neutral-100" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-1/2 rounded bg-neutral-100" />
            </div>
          </div>
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <div className="h-9 w-full rounded-lg bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
