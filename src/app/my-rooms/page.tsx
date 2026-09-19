"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  Login01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons";

type MyRoomsTab = "owned" | "joined";

export default function MyRoomsPage() {
  const { currentUser, isAuthenticated, setRole } = useAuthMock();

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
        setJoinedRooms(fetchedJoined.filter((r) => r.ownerId !== currentUser!.id));

        const uMap = new Map<string, User>();
        fetchedUsers.forEach((u) => uMap.set(u.id, u));
        setUsersMap(uMap);
      } catch (err) {
        console.error("Failed to load my-rooms data:", err);
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

  // Lọc phòng theo tab & search query
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
      await roomRepository.create({
        name,
        visibility,
        ownerId: currentUser.id,
      });
      setIsCreateModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  // Nếu người dùng chưa đăng nhập (guest)
  if (!isAuthenticated || !currentUser) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-[#C9F2E3] bg-white p-8 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-6">
            <HugeiconsIcon icon={Login01Icon} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F1A] mb-2">
            Vui lòng đăng nhập
          </h1>
          <p className="text-sm text-[#4B665D] mb-6">
            Bạn cần đăng nhập để xem danh sách phòng họp do bạn quản trị hoặc tham gia sinh hoạt.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <HugeiconsIcon icon={Home01Icon} size={18} />
              <span>Trang chủ</span>
            </Link>
            <button
              type="button"
              onClick={() => setRole("user")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#05966B] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#05966B]/90"
            >
              <HugeiconsIcon icon={Login01Icon} size={18} />
              <span>Đăng nhập nhanh (User)</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      {/* Header Trang: Tiêu đề & Quick action */}
      <section aria-labelledby="my-rooms-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 id="my-rooms-title" className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0B1F1A]">
            Phòng của tôi
          </h1>
          <p className="text-sm text-[#4B665D] mt-1">
            Quản lý và truy cập nhanh các phòng họp bạn làm chủ hoặc đang tham gia (Dữ liệu Live Supabase).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#05966B] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#05966B]/90 focus-visible:ring-2 focus-visible:ring-[#10D9A3]"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={18} />
          <span>Tạo phòng mới</span>
        </button>
      </section>

      {/* Thanh điều hướng Tabs & Bộ lọc tìm kiếm */}
      <section aria-label="Bộ lọc phòng của tôi" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#C9F2E3] pb-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("owned")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "owned"
                ? "bg-white text-[#05966B] shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            <HugeiconsIcon icon={CrownIcon} size={16} />
            <span>Phòng tôi làm chủ</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "owned"
                  ? "bg-[#E8FBF4] text-[#05966B]"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {ownedRooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("joined")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "joined"
                ? "bg-white text-[#05966B] shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            <HugeiconsIcon icon={UserGroupIcon} size={16} />
            <span>Phòng đã tham gia</span>
            <span
              className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "joined"
                  ? "bg-[#E8FBF4] text-[#05966B]"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {joinedRooms.length}
            </span>
          </button>
        </div>

        {/* Input Tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên phòng..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-xs text-[#0B1F1A] placeholder-neutral-400 focus:border-[#10D9A3] focus:outline-hidden focus:ring-2 focus:ring-[#10D9A3]/20"
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
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9F2E3] bg-white p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8FBF4] text-[#05966B] mb-4">
            <HugeiconsIcon icon={Folder01Icon} size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#0B1F1A] mb-1">
            {activeTab === "owned"
              ? "Bạn chưa làm chủ phòng họp nào"
              : "Bạn chưa tham gia phòng họp nào"}
          </h3>
          <p className="max-w-md text-sm text-[#4B665D] mb-6">
            {activeTab === "owned"
              ? "Hãy tạo phòng họp mới để bắt đầu quản lý phiên họp và điểm danh cho các thành viên trong nhóm."
              : "Khám phá danh sách các phòng họp công khai trên Trang chủ để gửi yêu cầu tham gia."}
          </p>

          <div className="flex items-center gap-4">
            {activeTab === "owned" ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#05966B] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#05966B]/90"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                <span>Tạo phòng ngay</span>
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#05966B] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#05966B]/90"
              >
                <HugeiconsIcon icon={Home01Icon} size={16} />
                <span>Khám phá phòng họp</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Modal Tạo Phòng */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </main>
  );
}
