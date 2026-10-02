const ROOM_SKELETON_ITEMS = [1, 2, 3, 4];

export function RoomSkeletonGrid() {
  const skeletonCards = ROOM_SKELETON_ITEMS.map((item) => (
    <article
      className="RoomSkeletonGrid__card flex min-h-64 flex-col gap-6 rounded-lg border border-border bg-surface p-6 motion-safe:animate-pulse"
      key={item}
    >
      <div className="RoomSkeletonGrid__heading flex flex-col gap-4">
        <span className="RoomSkeletonGrid__title h-6 w-3/4 rounded-md bg-neutral-soft" />
        <div className="RoomSkeletonGrid__badges flex items-center gap-2">
          <span className="RoomSkeletonGrid__badge h-8 w-24 rounded-full bg-primary-soft" />
          <span className="RoomSkeletonGrid__badge h-8 w-20 rounded-full bg-neutral-soft" />
        </div>
      </div>
      <div className="RoomSkeletonGrid__metadata flex flex-col gap-4">
        <span className="RoomSkeletonGrid__metadata-line h-4 w-1/2 rounded bg-neutral-soft" />
        <span className="RoomSkeletonGrid__metadata-line h-4 w-32 rounded bg-neutral-soft" />
        <span className="RoomSkeletonGrid__metadata-line h-8 w-40 rounded-full bg-neutral-soft" />
      </div>
      <span className="RoomSkeletonGrid__action mt-auto h-12 w-full rounded-md bg-neutral-soft" />
    </article>
  ));

  return (
    <div
      className="RoomSkeletonGrid grid grid-cols-1 gap-6 lg:grid-cols-2"
      aria-label="Đang tải danh sách phòng"
      aria-live="polite"
    >
      {skeletonCards}
    </div>
  );
}
