"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthMock } from "@/context/AuthMockContext";
import type { Room, RoomVisibility, User } from "@/types/domain";
import { RoomCard } from "@/modules/rooms/presentation/RoomCard";
import { CreateRoomModal } from "@/modules/rooms/presentation/CreateRoomModal";
import { roomRepository, userRepository } from "@/lib/repository";
import { useLobbyRealtime } from "@/lib/realtime/useLobbyRealtime";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  CrownIcon,
  UserGroupIcon,
  Search01Icon,
  PlusSignIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/layout/PageContainer";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";
import { EmptyState } from "@/components/ui/EmptyState";

type MyRoomsTab = "owned" | "joined";

export default function MyRoomsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuthMock();

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

  // Nếu người dùng chưa đăng nhập hoặc đang kiểm tra phiên
  if (isAuthLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex-1 bg-neutral-50/50">
        <PageContainer as="main">
          <div className="flex flex-col gap-6 py-8 animate-pulse">
            <div className="h-12 w-64 rounded-xl bg-neutral-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-48 rounded-2xl bg-neutral-100" />
              <div className="h-48 rounded-2xl bg-neutral-100" />
              <div className="h-48 rounded-2xl bg-neutral-100" />
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  const tabItems: PillTabItem<MyRoomsTab>[] = [
    {
      key: "owned",
      label: "Phòng tôi tạo",
      icon: CrownIcon,
    },
    {
      key: "joined",
      label: "Phòng đã tham gia",
      icon: UserGroupIcon,
    },
  ];

  return (
    <div className="flex-1 bg-neutral-50/50">
      <PageContainer as="main">
        {/* Header Trang: Tiêu đề & Action (Pill button) */}
        <section aria-labelledby="my-rooms-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 id="my-rooms-title" className="text-2xl font-extrabold tracking-tight text-neutral-900">
              Phòng của tôi
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Quản lý phòng họp bạn làm chủ hoặc đang tham gia.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#10D9A3] px-6 py-2.5 text-sm font-bold text-neutral-900 shadow-xs transition-all hover:bg-[#05966B] hover:text-white"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={18} />
            <span>Tạo phòng mới</span>
          </button>
        </section>

        {/* Thanh điều hướng PillTabs & Bộ lọc tìm kiếm */}
        <section aria-label="Bộ lọc phòng của tôi" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <PillTabs
            tabs={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
          />

          {/* Input Tìm kiếm: Pill layout */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên phòng..."
              className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-200"
            />
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3 top-2.5 text-neutral-400"
            />
          </div>
        </section>

        {/* Danh sách phòng: Grid 4 cột chuẩn Desktop */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-neutral-200" />
            ))}
          </div>
        ) : displayedRooms.length > 0 ? (
          <section aria-label="Danh sách kết quả phòng">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedRooms.map((room) => {
                const owner = usersMap.get(room.ownerId);
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    owner={owner}
                    currentUser={currentUser}
                    isOwner={currentUser.id === room.ownerId}
                    isMember={true}
                    joinRequestStatus="approved"
                    onRequestJoin={() => {}}
                    onCancelRequest={() => {}}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          /* Reusable Empty State Component */
          <EmptyState
            icon={Folder01Icon}
            title={
              activeTab === "owned"
                ? "Bạn chưa làm chủ phòng họp nào"
                : "Bạn chưa tham gia phòng họp nào"
            }
            description={
              activeTab === "owned"
                ? "Hãy tạo phòng họp mới để bắt đầu quản lý phiên họp và điểm danh cho các thành viên trong nhóm."
                : "Khám phá danh sách các phòng họp công khai trên Trang chủ để gửi yêu cầu tham gia."
            }
            action={
              activeTab === "owned" ? (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#10D9A3] px-6 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#05966B] hover:text-white transition-all"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  <span>Tạo phòng ngay</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-xs font-semibold text-neutral-800 shadow-xs hover:border-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  <HugeiconsIcon icon={Home01Icon} size={16} />
                  <span>Khám phá phòng họp</span>
                </Link>
              )
            }
          />
        )}

        {/* Modal Tạo Phòng */}
        <CreateRoomModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateRoom={handleCreateRoom}
        />
      </PageContainer>
    </div>
  );
}
