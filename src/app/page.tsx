"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useLobbyRealtime } from "@/lib/realtime/useLobbyRealtime";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: isAuthLoading, login } = useAuthMock();

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

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

  // Refresh trigger for realtime updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time changes across rooms, memberships, and join requests
  useLobbyRealtime({
    onDataChange: () => setRefreshKey((k) => k + 1),
    enabled: isAuthenticated,
  });

  // Fetch initial data from Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [currentUser, isAuthenticated, refreshKey]);

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
      login();
      return;
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
    // Guard: Do not cancel if already joined or already approved
    if (joinedRoomIds.has(roomId) || requestStatusMap[roomId] === "approved") {
      return;
    }
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

  // Prevent unauthenticated flash: while checking or if not authenticated, show skeleton
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex-1 bg-neutral-50/50">
        <PageContainer as="main" className="py-12">
          <RoomSkeletonGrid />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-50/50">
      <PageContainer as="main">
        {/* Hero Banner (Padding: 32px = p-8, neutral border) */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-1.5">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900">
                Không gian Phòng họp
              </h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Tham gia phòng họp, tự điểm danh trước giờ bắt đầu và theo dõi nghĩa vụ quỹ minh bạch.
              </p>
            </div>

            {/* CTA Create Room Button: Pill layout */}
            <div className="flex shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    login();
                    return;
                  }
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-neutral-900 shadow-xs transition-all hover:bg-primary-hover hover:text-white hover:shadow-md active:scale-[0.99]"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={18} />
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
          /* Standardized Empty State Component */
          <EmptyState
            icon={Search01Icon}
            title="Không tìm thấy phòng họp nào"
            description={
              searchQuery
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Vui lòng thử tìm kiếm với tên khác.`
                : "Hiện chưa có phòng họp nào trong danh mục đã chọn."
            }
            action={
              searchQuery || activeTab !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="rounded-full border border-neutral-300 bg-white px-5 py-2 text-xs font-semibold text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              ) : null
            }
          />
        )}
      </PageContainer>

      {/* Modal Tạo Phòng Họp */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}
