"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { mockRepository } from "@/mocks/repository";
import { useAuthMock } from "@/context/AuthMockContext";
import type { Room, RoomVisibility, User } from "@/types/domain";
import { RoomCard } from "@/modules/rooms/presentation/RoomCard";
import { CreateRoomModal } from "@/modules/rooms/presentation/CreateRoomModal";
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

  // In-memory list rooms để phản hồi khi tạo phòng mới
  const [roomsList, setRoomsList] = useState<Room[]>(() =>
    [...mockRepository.listRooms()],
  );

  // Tra cứu users
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    mockRepository.listUsers().forEach((u) => {
      map.set(u.id, u as User);
    });
    return map;
  }, []);

  // Danh sách memberships
  const memberships = useMemo(() => {
    if (!currentUser) return [];
    return mockRepository.listRooms().flatMap((r) =>
      mockRepository.listMembershipsByRoomId(r.id),
    );
  }, [currentUser]);

  // Lọc phòng theo tab & search query
  const displayedRooms = useMemo(() => {
    if (!currentUser) return [];

    let list: Room[] = [];

    if (activeTab === "owned") {
      list = roomsList.filter((r) => r.ownerId === currentUser.id);
    } else {
      // Phòng tham gia với vai trò thành viên (không phải chủ phòng)
      const joinedRoomIds = new Set(
        memberships
          .filter(
            (m) =>
              m.userId === currentUser.id &&
              m.status === "active" &&
              roomsList.find((r) => r.id === m.roomId)?.ownerId !== currentUser.id,
          )
          .map((m) => m.roomId),
      );
      list = roomsList.filter((r) => joinedRoomIds.has(r.id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((r) => r.name.toLowerCase().includes(query));
    }

    return list;
  }, [roomsList, activeTab, currentUser, memberships, searchQuery]);

  // Đếm số lượng phòng mỗi tab
  const ownedCount = useMemo(() => {
    if (!currentUser) return 0;
    return roomsList.filter((r) => r.ownerId === currentUser.id).length;
  }, [roomsList, currentUser]);

  const joinedCount = useMemo(() => {
    if (!currentUser) return 0;
    const joinedRoomIds = new Set(
      memberships
        .filter(
          (m) =>
            m.userId === currentUser.id &&
            m.status === "active" &&
            roomsList.find((r) => r.id === m.roomId)?.ownerId !== currentUser.id,
        )
        .map((m) => m.roomId),
    );
    return roomsList.filter((r) => joinedRoomIds.has(r.id)).length;
  }, [roomsList, currentUser, memberships]);

  // Xử lý tạo phòng mới
  const handleCreateRoom = ({
    name,
    visibility,
  }: {
    name: string;
    visibility: RoomVisibility;
  }) => {
    if (!currentUser) return;
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name,
      visibility,
      ownerId: currentUser.id,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRoomsList((prev) => [newRoom, ...prev]);
    setIsCreateModalOpen(false);
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
            Quản lý và truy cập nhanh các phòng họp bạn làm chủ hoặc đang tham gia.
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
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "owned"
                  ? "bg-[#E8FBF4] text-[#05966B]"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {ownedCount}
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
            <span>Phòng tôi tham gia</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "joined"
                  ? "bg-[#E8FBF4] text-[#05966B]"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {joinedCount}
            </span>
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#4B665D]">
            <HugeiconsIcon icon={Search01Icon} size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên phòng..."
            className="w-full rounded-xl border border-[#C9F2E3] bg-white py-2 pl-9 pr-4 text-xs font-medium text-[#0B1F1A] placeholder:text-neutral-400 focus:border-[#10D9A3] focus:outline-none focus:ring-2 focus:ring-[#10D9A3]/20"
          />
        </div>
      </section>

      {/* Bento Grid 4 Cột hiển thị danh sách phòng */}
      {displayedRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedRooms.map((room) => {
            const roomOwner = usersMap.get(room.ownerId);
            const isOwner = room.ownerId === currentUser.id;

            return (
              <RoomCard
                key={room.id}
                room={room}
                owner={roomOwner}
                currentUser={currentUser}
                isOwner={isOwner}
                isMember={true}
                onRequestJoin={() => {}}
                onCancelRequest={() => {}}
              />
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-[#C9F2E3] bg-white/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8FBF4] text-[#05966B] mb-4">
            <HugeiconsIcon icon={Folder01Icon} size={28} />
          </div>
          <h2 className="text-base font-bold text-[#0B1F1A] mb-1">
            {activeTab === "owned"
              ? "Bạn chưa làm chủ phòng nào"
              : "Bạn chưa tham gia phòng nào"}
          </h2>
          <p className="text-xs text-[#4B665D] max-w-sm mx-auto mb-6">
            {activeTab === "owned"
              ? "Khởi tạo phòng họp đầu tiên để bắt đầu điểm danh các thành viên và quản lý quỹ linh hoạt."
              : "Khám phá danh sách phòng công khai tại trang chủ để gửi yêu cầu tham gia sinh hoạt cùng nhóm."}
          </p>
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
      )}

      {/* Modal Tạo Phòng Mới */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </main>
  );
}
