"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { OnlineUsersSidebar } from "@/components/layout/OnlineUsersSidebar";
import { PageLayout } from "@/components/layout/PageLayout";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useLobbyRealtime } from "@/lib/realtime/useLobbyRealtime";
import {
  joinRequestRepository,
  membershipRepository,
  roomRepository,
  userRepository,
} from "@/lib/repository";
import { CreateRoomModal } from "@/modules/rooms/presentation/CreateRoomModal";
import { RoomCard } from "@/modules/rooms/presentation/RoomCard";
import { RoomListFilter } from "@/modules/rooms/presentation/RoomListFilter";
import { RoomSkeletonGrid } from "@/modules/rooms/presentation/RoomSkeletonGrid";
import {
  JoinRequestStatus,
  RoomFilterTab,
  RoomType,
  RoomVisibility,
  type Room,
  type User,
} from "@/types/domain";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: isAuthLoading, login } = useAuth();

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
  const [joinedRoomIds, setJoinedRoomIds] = useState<Set<string>>(new Set());

  // Search and filter tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RoomFilterTab>(RoomFilterTab.ALL);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Map to track join request status per room for current user
  const [requestStatusMap, setRequestStatusMap] = useState<
    Record<string, "none" | JoinRequestStatus>
  >({});

  // Refresh trigger for realtime updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time changes across rooms, memberships, and join requests
  useLobbyRealtime({
    onDataChange: () => setRefreshKey((k) => k + 1),
  });

  // Fetch rooms and metadata from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (roomsList.length === 0) {
        setIsLoading(true);
      }
      setHasLoadError(false);
      try {
        const [rooms, users] = await Promise.all([
          roomRepository.findCatalog(),
          userRepository.listAll(),
        ]);

        if (!isMounted) return;

        setRoomsList(rooms);

        const uMap = new Map<string, User>();
        users.forEach((u) => uMap.set(u.id, u));
        setUsersMap(uMap);

        // If authenticated, determine joined rooms and pending requests
        if (currentUser) {
          const [joinedRooms, requests] = await Promise.all([
            roomRepository.findJoinedByUserId(currentUser.id),
            joinRequestRepository.findByRequesterId(currentUser.id),
          ]);

          if (!isMounted) return;

          setJoinedRoomIds(new Set(joinedRooms.map((r) => r.id)));

          const reqMap: Record<string, "none" | JoinRequestStatus> = {};
          requests.forEach((req) => {
            reqMap[req.roomId] = req.status;
          });
          setRequestStatusMap(reqMap);
        }
      } catch (err) {
        console.error("Failed to load lobby rooms:", err);
        if (isMounted) setHasLoadError(true);
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

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    return roomsList.filter((room) => {
      // Filter Channel type: only visible to members/owners
      if (room.type === "channel") {
        const isOwner = currentUser?.id === room.ownerId;
        const isMember = isOwner || joinedRoomIds.has(room.id);
        if (!isMember) return false;
      }

      // Filter by tab
      if (activeTab === RoomFilterTab.PUBLIC && room.visibility !== RoomVisibility.PUBLIC) return false;
      if (activeTab === RoomFilterTab.PRIVATE && room.visibility !== RoomVisibility.PRIVATE) return false;

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
    type,
    visibility,
  }: {
    name: string;
    type: RoomType;
    visibility: RoomVisibility;
  }) => {
    const ownerId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
    try {
      const created = await roomRepository.create({
        name,
        type,
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

    if (targetRoom?.visibility === RoomVisibility.PUBLIC) {
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
          [roomId]: JoinRequestStatus.PENDING,
        }));
      } catch (err) {
        console.error("Failed to send join request:", err);
      }
    }
  };

  // Handle cancel join request
  const handleCancelRequest = async (roomId: string) => {
    // Guard: Do not cancel if already joined or already approved
    if (joinedRoomIds.has(roomId) || requestStatusMap[roomId] === JoinRequestStatus.APPROVED) {
      return;
    }
    const userId = currentUser?.id ?? "00000000-0000-0000-0000-000000000004";
    try {
      const userRequests = await joinRequestRepository.findByRequesterId(userId);
      const pendingReq = userRequests.find(
        (r) => r.roomId === roomId && r.status === JoinRequestStatus.PENDING
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
      <PageLayout>
        <div className="HomePage__loading flex flex-col gap-6">
          <RoomSkeletonGrid />
        </div>
      </PageLayout>
    );
  }

  const actionButton = (
    <Button
      className="HomePage__create-room-action w-full sm:w-auto"
      size="touch"
      onClick={() => {
        if (!isAuthenticated) {
          login();
          return;
        }
        setIsCreateModalOpen(true);
      }}
    >
      <span className="HomePage__create-room-label flex items-center gap-2"><HugeiconsIcon icon={PlusSignIcon} size={24} aria-hidden />Tạo phòng</span>
    </Button>
  );

  const roomCards = filteredRooms.map((room) => {
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
        layout="catalog"
      />
    );
  });

  const trimmedSearchQuery = searchQuery.trim();
  const hasActiveRoomFilter = Boolean(trimmedSearchQuery) || activeTab !== RoomFilterTab.ALL;
  const emptyStateAction = hasActiveRoomFilter ? (
    <Button
      className="HomePage__clear-filter-action"
      variant="secondary"
      size="touch"
      onClick={() => {
        setSearchQuery("");
        setActiveTab(RoomFilterTab.ALL);
      }}
    >
      Xóa bộ lọc
    </Button>
  ) : null;
  const emptyStateDescription = trimmedSearchQuery
    ? `Không có kết quả nào khớp với từ khóa "${trimmedSearchQuery}". Vui lòng thử tìm kiếm với tên khác.`
    : "Hiện chưa có phòng họp nào trong danh mục đã chọn.";
  const handlePageChange = () => undefined;

  const renderRoomListContent = () => {
    if (isLoading) {
      return <RoomSkeletonGrid />;
    }

    if (hasLoadError && roomsList.length === 0) {
      return <EmptyState icon={Alert02Icon} title="Chưa thể tải danh sách phòng" description="Vui lòng kiểm tra kết nối và tải lại trang." />;
    }

    if (filteredRooms.length === 0) {
      return (
        <EmptyState
          icon={Search01Icon}
          title="Không tìm thấy phòng họp nào"
          description={emptyStateDescription}
          action={emptyStateAction}
        />
      );
    }

    return (
      <section className="HomePage__room-results flex flex-col gap-6" aria-label="Danh sách kết quả phòng họp">
        <div className="HomePage__room-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roomCards}
        </div>
        <div className="HomePage__pagination">
          <Pagination currentPage={1} totalPages={1} onPageChange={handlePageChange} />
        </div>
      </section>
    );
  };

  const roomListContent = renderRoomListContent();

  return (
    <PageLayout contextRail={<OnlineUsersSidebar />}>
      <div className="HomePage flex flex-col gap-8">
        <PageHeader
          id="home-page-title"
          title="Không gian cộng đồng"
          description="Tìm phòng phù hợp, tham gia cuộc họp và kết nối với các thành viên."
          action={actionButton}
        />
        {/* Filter and Search Bar */}
        <RoomListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filteredRoomsCount={filteredRooms.length}
        />

        {roomListContent}
      </div>

      {/* Modal Tạo Phòng Họp */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </PageLayout>
  );
}
