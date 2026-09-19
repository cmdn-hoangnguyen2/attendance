"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Room, RoomVisibility, User } from "@/types/domain";
import { useAuthMock } from "@/context/AuthMockContext";
import { RoomCard } from "@/modules/rooms/presentation/RoomCard";
import {
  RoomListFilter,
  type RoomFilterTab,
} from "@/modules/rooms/presentation/RoomListFilter";
import { CreateRoomModal } from "@/modules/rooms/presentation/CreateRoomModal";
import { RoomSkeletonGrid } from "@/modules/rooms/presentation/RoomSkeletonGrid";
import {
  joinRequestRepository,
  membershipRepository,
  roomRepository,
  userRepository,
} from "@/lib/repository";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

export default function HomePage() {
  const { currentUser, isAuthenticated, setRole } = useAuthMock();

  const [isLoading, setIsLoading] = useState(true);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

  // Search and filter tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RoomFilterTab>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Map to track join request status per room for current user
  const [requestStatusMap, setRequestStatusMap] = useState<
    Record<string, "none" | "pending" | "approved" | "rejected">
  >({});

  // Fetch initial data from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [fetchedRooms, fetchedUsers] = await Promise.all([
          roomRepository.findCatalog({ includeArchived: false }),
          userRepository.listAll({ includeArchived: true }),
        ]);

        if (!isMounted) return;

        setRoomsList(fetchedRooms);

        const uMap = new Map<string, User>();
        fetchedUsers.forEach((u) => uMap.set(u.id, u));
        setUsersMap(uMap);

        if (currentUser) {
          const joined = await roomRepository.findJoinedByUserId(currentUser.id);
          if (!isMounted) return;
          setJoinedRoomIds(new Set(joined.map((r) => r.id)));

          const reqs = await joinRequestRepository.findByRequesterId(currentUser.id);
          if (!isMounted) return;
          const sMap: Record<string, "none" | "pending" | "approved" | "rejected"> = {};
          reqs.forEach((r) => {
            sMap[r.roomId] = r.status as "pending" | "approved" | "rejected";
          });
          setRequestStatusMap(sMap);
        }
      } catch (err) {
        console.error("Failed to fetch rooms from Supabase:", err);
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
  }, [currentUser]);

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
  const handleCreateRoom = async ({
    name,
    visibility,
  }: {
    name: string;
    visibility: RoomVisibility;
  }) => {
    const ownerId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
    try {
      const created = await roomRepository.create({
        name,
        visibility,
        ownerId,
      });
      setRoomsList((prev) => [created, ...prev]);
      setJoinedRoomIds((prev) => new Set([...prev, created.id]));
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  // Handle request to join room
  const handleRequestJoin = async (roomId: string) => {
    if (!isAuthenticated) {
      setRole("user");
    }

    const targetRoom = roomsList.find((r) => r.id === roomId);
    const userId = currentUser?.id ?? "00000000-0000-0000-0000-000000000004";

    if (targetRoom?.visibility === "public") {
      // Direct join
      try {
        await membershipRepository.addMember(roomId, userId);
        setJoinedRoomIds((prev) => new Set([...prev, roomId]));
        setRoomsList((prev) =>
          prev.map((r) =>
            r.id === roomId ? { ...r, memberCount: (r.memberCount ?? 0) + 1 } : r
          )
        );
      } catch (err) {
        console.error("Failed to join public room:", err);
      }
    } else {
      // Private request
      try {
        await joinRequestRepository.create(roomId, userId);
        setRequestStatusMap((prev) => ({
          ...prev,
          [roomId]: "pending",
        }));
      } catch (err) {
        console.error("Failed to send join request:", err);
      }
    }
  };

  // Handle cancel join request
  const handleCancelRequest = async (roomId: string) => {
    const userId = currentUser?.id ?? "00000000-0000-0000-0000-000000000004";
    try {
      const userRequests = await joinRequestRepository.findByRequesterId(userId);
      const pendingReq = userRequests.find(
        (r) => r.roomId === roomId && r.status === "pending"
      );
      if (pendingReq) {
        await joinRequestRepository.cancel(pendingReq.id, userId);
      }
      setRequestStatusMap((prev) => ({
        ...prev,
        [roomId]: "none",
      }));
    } catch (err) {
      console.error("Failed to cancel request:", err);
    }
  };

  return (
    <main className="flex-1 bg-neutral-50/50 py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* Hero Banner / Page Intro (Padding: 32px = p-8) */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#C9F2E3] bg-gradient-to-r from-white via-[#E8FBF4]/40 to-white p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E8FBF4] px-3 py-1 text-xs font-semibold text-[#05966B] border border-[#C9F2E3]">
                DiemDanhCMDN v1.0 • Supabase Live Database
              </span>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0B1F1A]">
                Không gian Phòng họp & Quản lý Điểm danh
              </h1>
              <p className="text-sm text-[#4B665D] leading-relaxed">
                Tham gia phòng họp nhóm, tự điểm danh trước giờ bắt đầu và theo dõi
                các khoản nghĩa vụ đóng góp quỹ một cách minh bạch, văn minh.
              </p>
            </div>

            {/* CTA Create Room Button: bo góc 12px */}
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

        {/* Filter and Search Bar */}
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

        {/* Loading State */}
        {isLoading ? (
          <RoomSkeletonGrid />
        ) : filteredRooms.length > 0 ? (
          /* Rooms Bento Grid: Desktop-first 4 cột (lg:grid-cols-4), gap 24px (gap-6) */
          <section aria-label="Danh sách các phòng họp">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRooms.map((room) => {
                const owner = usersMap.get(room.ownerId);
                const isOwner = currentUser?.id === room.ownerId;
                const isMember = isOwner || joinedRoomIds.has(room.id);
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
          /* Empty State */
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
