"use client";

import React, { useState, useMemo } from "react";
import { mockRepository } from "@/mocks/repository";
import type { Room, RoomVisibility, User } from "@/types/domain";
import { useAuthMock } from "@/context/AuthMockContext";
import { RoomCard } from "@/modules/rooms/presentation/RoomCard";
import {
  RoomListFilter,
  type RoomFilterTab,
} from "@/modules/rooms/presentation/RoomListFilter";
import { CreateRoomModal } from "@/modules/rooms/presentation/CreateRoomModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";

export default function HomePage() {
  const { currentUser, isAuthenticated, setRole } = useAuthMock();

  // In-memory state for rooms in Phase 1 UI Mock
  const [roomsList, setRoomsList] = useState<Room[]>(() =>
    [...mockRepository.listRooms()].filter((r) => r.status === "active"),
  );

  // Search and filter tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RoomFilterTab>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Map to track join request status per room for current user
  const [requestStatusMap, setRequestStatusMap] = useState<
    Record<string, "none" | "pending" | "approved" | "rejected">
  >(() => {
    const map: Record<string, "none" | "pending" | "approved" | "rejected"> = {};
    // Seed initial statuses from fixtures for user-member-minh
    map["room-private-product"] = "pending";
    return map;
  });

  // Users lookup map
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    mockRepository.listUsers().forEach((user) => {
      map.set(user.id, user as User);
    });
    return map;
  }, []);

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    return roomsList.filter((room) => {
      // Filter by tab
      if (activeTab === "public" && room.visibility !== "public") return false;
      if (activeTab === "private" && room.visibility !== "private") return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return room.name.toLowerCase().includes(query);
      }

      return true;
    });
  }, [roomsList, activeTab, searchQuery]);

  // Handle creating a new room
  const handleCreateRoom = ({
    name,
    visibility,
  }: {
    name: string;
    visibility: RoomVisibility;
  }) => {
    const newRoom: Room = {
      id: `room-custom-${Date.now()}`,
      name,
      visibility,
      ownerId: currentUser?.id ?? "user-admin-primary",
      status: "active",
      memberCount: 1,
      paymentImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRoomsList((prev) => [newRoom, ...prev]);
  };

  // Handle request to join room
  const handleRequestJoin = (roomId: string) => {
    if (!isAuthenticated) {
      setRole("user");
    }
    setRequestStatusMap((prev) => ({
      ...prev,
      [roomId]: "pending",
    }));
  };

  // Handle cancel join request
  const handleCancelRequest = (roomId: string) => {
    setRequestStatusMap((prev) => ({
      ...prev,
      [roomId]: "none",
    }));
  };

  return (
    <main className="flex-1 bg-neutral-50/50 py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* Hero Banner / Page Intro (Padding: 32px = p-8, space-5) */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#C9F2E3] bg-gradient-to-r from-white via-[#E8FBF4]/40 to-white p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8FBF4] px-3 py-1 text-xs font-semibold text-[#05966B] border border-[#C9F2E3]">
                DiemDanhCMDN v1.0 • Phase 1 Mock UI
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0B1F1A]">
                Không gian Phòng họp & Quản lý Điểm danh
              </h1>
              <p className="text-sm text-[#4B665D] leading-relaxed">
                Tham gia phòng họp nhóm, tự điểm danh trước giờ bắt đầu và theo dõi
                các khoản nghĩa vụ đóng góp quỹ một cách minh bạch, văn minh.
              </p>
            </div>

            {/* CTA Create Room Button: px-5 py-2.5 (chuẩn button), bo góc 12px */}
            <div className="flex shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setRole("user");
                  }
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-[#10D9A3] px-5 py-3 text-sm font-bold text-[#0B1F1A] shadow-sm transition-all hover:bg-[#05966B] hover:text-white hover:shadow-md"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={20} />
                <span>Tạo phòng mới</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar: margin-bottom 24px (mb-6, space-4) */}
        <div className="mb-6">
          <RoomListFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalRooms={roomsList.length}
            filteredRoomsCount={filteredRooms.length}
          />
        </div>

        {/* Rooms Bento Grid: Desktop-first 4 cột (lg:grid-cols-4), gap 24px (gap-6, space-4) */}
        {filteredRooms.length > 0 ? (
          <section aria-label="Danh sách các phòng họp">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRooms.map((room) => {
                const owner = usersMap.get(room.ownerId);
                const isOwner = currentUser?.id === room.ownerId;
                const isMember =
                  isOwner ||
                  (currentUser?.id === "user-member-minh" &&
                    room.id === "room-public-engineering");
                const joinStatus = requestStatusMap[room.id] ?? "none";

                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    owner={owner}
                    currentUser={currentUser}
                    isOwner={isOwner}
                    isMember={isMember}
                    joinRequestStatus={joinStatus}
                    onRequestJoin={handleRequestJoin}
                    onCancelRequest={handleCancelRequest}
                  />
                );
              })}
            </div>
          </section>
        ) : (
          /* Empty State khi không tìm thấy kết quả */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9F2E3] bg-white p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8FBF4] text-[#05966B] mb-4">
              <HugeiconsIcon icon={Search01Icon} size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#0B1F1A] mb-1">
              Không tìm thấy phòng họp nào
            </h3>
            <p className="max-w-md text-sm text-[#4B665D] mb-6">
              {searchQuery
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Vui lòng thử tìm kiếm với tên khác.`
                : "Hiện chưa có phòng họp nào trong danh mục đã chọn."}
            </p>
            {searchQuery || activeTab !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="rounded-lg border border-[#10D9A3] bg-white px-4 py-2 text-xs font-semibold text-[#05966B] hover:bg-[#E8FBF4]"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Modal Tạo Phòng Họp */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </main>
  );
}
