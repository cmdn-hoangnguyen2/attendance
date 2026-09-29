import React from "react";

const ROOM_SKELETON_ITEMS = [1, 2, 3, 4];

export function RoomSkeletonGrid() {
  const skeletonCards = ROOM_SKELETON_ITEMS.map((item) => (
    <article
      key={item}
      className="RoomSkeletonGrid__card flex min-h-60 animate-pulse flex-col gap-6 rounded-2xl border border-neutral-border bg-white p-6 shadow-xs"
    >
      <div className="RoomSkeletonGrid__badges flex items-center gap-2">
        <span className="RoomSkeletonGrid__badge h-6 w-20 rounded-full bg-neutral-200" />
        <span className="RoomSkeletonGrid__badge h-6 w-16 rounded-full bg-neutral-100" />
      </div>

      <div className="RoomSkeletonGrid__content flex flex-col gap-4">
        <span className="RoomSkeletonGrid__title h-6 w-3/4 rounded-lg bg-neutral-200" />
        <div className="RoomSkeletonGrid__metadata grid grid-cols-1 gap-2 sm:grid-cols-2">
          <span className="RoomSkeletonGrid__metadata-line h-4 w-1/2 rounded-md bg-neutral-100 sm:col-span-2" />
          <span className="RoomSkeletonGrid__metadata-line h-4 w-24 rounded-md bg-neutral-100" />
          <span className="RoomSkeletonGrid__metadata-line h-4 w-20 rounded-md bg-neutral-100" />
        </div>
      </div>

      <span className="RoomSkeletonGrid__action mt-auto h-10 w-full rounded-xl bg-neutral-200" />
    </article>
  ));

  return (
    <div
      className="RoomSkeletonGrid grid grid-cols-1 gap-6 xl:grid-cols-2"
      aria-label="Đang tải danh sách phòng..."
      aria-live="polite"
    >
      {skeletonCards}
    </div>
  );
}
