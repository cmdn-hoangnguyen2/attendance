"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Room, RoomVisibility, User } from "@/types/domain";
import { RoomCard } from "@/modules/rooms/presentation/RoomCard";
import { CreateRoomModal } from "@/modules/rooms/presentation/CreateRoomModal";
import { roomRepository, userRepository } from "@/lib/repository";
import { useLobbyRealtime } from "@/lib/realtime/useLobbyRealtime";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import { PageLayout } from "@/components/layout/PageLayout";
import { Pagination } from "@/components/ui/Pagination";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type MyRoomsTab = "owned" | "joined";

export default function MyRoomsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Tab hiện tại: Phòng làm chủ vs Phòng tham gia
  const [activeTab, setActiveTab] = useState<MyRoomsTab>("owned");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [ownedRooms, setOwnedRooms] = useState<Room[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());

  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time changes across rooms, memberships, and join requests
  useLobbyRealtime({
    onDataChange: () => setRefreshKey((k) => k + 1),
    enabled: Boolean(currentUser),
  });

  // Load data from Supabase
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;

    async function fetchData() {
      try {
        const [fetchedOwned, fetchedJoined, fetchedUsers] = await Promise.all([
          roomRepository.findByOwnerId(currentUser!.id),
          roomRepository.findJoinedByUserId(currentUser!.id),
          userRepository.listAll({ includeArchived: true }),
        ]);

        if (!isMounted) return;
        setOwnedRooms(fetchedOwned);
        setJoinedRooms(fetchedJoined);

        const uMap = new Map<string, User>();
        fetchedUsers.forEach((u) => uMap.set(u.id, u));
        setUsersMap(uMap);
      } catch (err) {
        console.error("Failed to load user rooms from Supabase:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, refreshKey]);

  // Danh sách hiển thị theo tab và tìm kiếm
  const displayedRooms = useMemo(() => {
    const list = activeTab === "owned" ? ownedRooms : joinedRooms;
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter((r) => r.name.toLowerCase().includes(query));
  }, [activeTab, ownedRooms, joinedRooms, searchQuery]);

  // Xử lý tạo phòng mới
  const handleCreateRoom = async ({
    name,
    visibility,
  }: {
    name: string;
    visibility: RoomVisibility;
  }) => {
    if (!currentUser) return;
    try {
      const newRoom = await roomRepository.create({
        name,
        visibility,
        ownerId: currentUser.id,
      });
      setOwnedRooms((prev) => [newRoom, ...prev]);
      setIsCreateModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  const openCreateRoom = () => setIsCreateModalOpen(true);
  const closeCreateRoom = () => setIsCreateModalOpen(false);
  const tabItems: PillTabItem<MyRoomsTab>[] = [
    { key: "owned", label: "Tôi quản lý" },
    { key: "joined", label: "Tôi tham gia" },
  ];
  const createAction = <Button className="MyRooms__create w-full sm:w-auto" size="touch" onClick={openCreateRoom}>Tạo phòng</Button>;
  const isSearching = Boolean(searchQuery.trim());
  let emptyTitle = activeTab === "owned" ? "Bạn chưa quản lý phòng nào" : "Bạn chưa tham gia phòng nào";
  let emptyDescription = activeTab === "owned"
    ? "Tạo phòng để bắt đầu điểm danh và quản lý quỹ cùng nhóm."
    : "Tìm một phòng phù hợp tại Trang chủ.";
  if (isSearching) {
    emptyTitle = "Không tìm thấy phòng";
    emptyDescription = "Thử tên khác hoặc xóa nội dung tìm kiếm.";
  }
  let emptyAction = activeTab === "owned" ? createAction : (
    <Link className="MyRooms__discover inline-flex min-h-12 items-center gap-2 rounded-md px-4 font-semibold text-primary hover:bg-primary-soft" href="/">
      <HugeiconsIcon icon={Home01Icon} size={20} aria-hidden />
      Khám phá phòng
    </Link>
  );
  if (isSearching) {
    emptyAction = <Button variant="secondary" size="touch" onClick={() => setSearchQuery("")}>Xóa tìm kiếm</Button>;
  }
  const roomItems = displayedRooms.map((room) => (
    <li className="MyRooms__item" key={room.id}>
      <RoomCard
        room={room}
        owner={usersMap.get(room.ownerId)}
        currentUser={currentUser}
        isOwner={currentUser?.id === room.ownerId}
        isMember={true}
        joinRequestStatus="approved"
        onRequestJoin={() => {}}
        onCancelRequest={() => {}}
      />
    </li>
  ));
  const skeletonItems = [1, 2, 3].map((item) => (
    <div className="MyRooms__skeleton h-24 rounded-lg bg-surface-subtle" key={item} />
  ));
  let results = (
    <EmptyState icon={Folder01Icon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
  );
  if (displayedRooms.length > 0) {
    results = (
      <section className="MyRooms__results ui-section-stack" aria-label="Danh sách phòng">
        <p className="MyRooms__count text-sm text-text-secondary" role="status">{displayedRooms.length} phòng</p>
        <ul className="MyRooms__list divide-y divide-border">{roomItems}</ul>
        <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
      </section>
    );
  }
  if (isLoading) {
    results = <div className="MyRooms__loading ui-section-stack animate-pulse" role="status" aria-label="Đang tải phòng">{skeletonItems}</div>;
  }
  if (isAuthLoading || !isAuthenticated || !currentUser) {
    return <PageLayout><div className="MyRooms__loading ui-section-stack animate-pulse" role="status" aria-label="Đang kiểm tra phiên đăng nhập">{skeletonItems}</div></PageLayout>;
  }
  return (
    <PageLayout>
      <div className="MyRooms ui-page-stack">
        <PageHeader id="my-rooms-title" title="Phòng của tôi" description="Trở lại phòng của nhóm, tiếp tục công việc hôm nay." action={createAction} />
        <section className="MyRooms__filters flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" aria-label="Bộ lọc phòng của tôi">
          <PillTabs tabs={tabItems} activeKey={activeTab} onChange={setActiveTab} />
          <div className="MyRooms__search flex w-full flex-col gap-2 lg:max-w-xs">
            <label className="MyRooms__search-label text-sm font-semibold text-text-primary" htmlFor="my-rooms-search">Tìm phòng</label>
            <input className="MyRooms__search-input ui-field" id="my-rooms-search" type="search" value={searchQuery} placeholder="Nhập tên phòng…" onChange={(event) => setSearchQuery(event.target.value)} />
          </div>
        </section>
        {results}
        <CreateRoomModal isOpen={isCreateModalOpen} onClose={closeCreateRoom} onCreateRoom={handleCreateRoom} />
      </div>
    </PageLayout>
  );
}
