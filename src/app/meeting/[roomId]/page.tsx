"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mockRepository } from "@/mocks/repository";
import { useAuthMock } from "@/context/AuthMockContext";
import type {
  AttendanceRecord,
  AttendanceStatus,
  FundCandidate,
  FundContribution,
  FundContributionReason,
  JoinRequest,
  MeetingSession,
  Room,
  RoomMembership,
  User,
} from "@/types/domain";

import {
  MeetingHeader,
  type MeetingTab,
} from "@/modules/meetings/presentation/MeetingHeader";
import { MembersTab } from "@/modules/meetings/presentation/MembersTab";
import { AttendanceTab } from "@/modules/meetings/presentation/AttendanceTab";
import { RoomFundsTab } from "@/modules/meetings/presentation/RoomFundsTab";
import { ArchiveRoomModal } from "@/modules/rooms/presentation/ArchiveRoomModal";
import { TransferOwnershipModal } from "@/modules/rooms/presentation/TransferOwnershipModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  LockIcon,
  ShieldAlertIcon,
  UserAdd01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

export default function MeetingDetailPage() {
  const params = useParams();
  const roomId = params?.roomId as string;

  const { currentUser } = useAuthMock();

  // 1. Lấy thông tin Room cơ bản từ repository & quản lý state
  const [room, setRoom] = useState<Room | undefined>(() => {
    if (!roomId) return undefined;
    return mockRepository.findRoomById(roomId);
  });

  // State cho các modal Archive và Transfer Ownership
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 2. Tra cứu chủ phòng (owner)
  const owner = useMemo(() => {
    if (!room) return undefined;
    return mockRepository.findUserById(room.ownerId);
  }, [room]);

  // 3. Toàn bộ người dùng phục vụ lookup
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    mockRepository.listUsers().forEach((u) => {
      map.set(u.id, u as User);
    });
    return map;
  }, []);

  // 4. In-memory state cho Memberships của Room này
  const [memberships, setMemberships] = useState<RoomMembership[]>(() => {
    if (!roomId) return [];
    return [...mockRepository.listMembershipsByRoomId(roomId)];
  });

  // 5. In-memory state cho Join Requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(() => {
    if (!roomId) return [];
    return [...mockRepository.listJoinRequestsByRoomId(roomId)];
  });

  // 6. Buổi họp gần nhất & Attendance Records
  const meetingSession = useMemo<MeetingSession | undefined>(() => {
    if (!roomId) return undefined;
    const sessions = mockRepository.listMeetingsByRoomId(roomId);
    return sessions.length > 0 ? (sessions[0] as MeetingSession) : undefined;
  }, [roomId]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    if (!roomId) return [];
    const sessions = mockRepository.listMeetingsByRoomId(roomId);
    if (sessions.length === 0) return [];
    return [...mockRepository.listAttendanceByMeetingId(sessions[0].id)];
  });

  // 7. Fund Candidates của buổi họp
  const [fundCandidates, setFundCandidates] = useState<FundCandidate[]>(() => {
    if (!meetingSession) return [];
    return [...mockRepository.listFundCandidatesByMeetingId(meetingSession.id)];
  });

  // 8. In-memory state cho Quỹ phòng (Fund Contributions)
  const [contributions, setContributions] = useState<FundContribution[]>(() => {
    if (!roomId) return [];
    return [...mockRepository.listFundContributionsByRoomId(roomId)];
  });

  // 9. Tab điều hướng hiện tại
  const [activeTab, setActiveTab] = useState<MeetingTab>("members");

  // 10. Trạng thái yêu cầu tham gia của currentUser nếu đang ở ngoài phòng
  const [requestJoinStatus, setRequestJoinStatus] = useState<"none" | "pending" | "approved">("none");

  // Danh sách thành viên kích hoạt (User[])
  const activeMembers = useMemo(() => {
    return memberships
      .filter((m) => m.status === "active")
      .map((m) => usersMap.get(m.userId))
      .filter((u): u is User => Boolean(u));
  }, [memberships, usersMap]);

  // Kiểm tra quyền hạn
  const isOwner = Boolean(currentUser && room && room.ownerId === currentUser.id);
  const isAdmin = currentUser?.role === "admin";
  const isOwnerOrAdmin = isOwner || isAdmin;
  const isMember = Boolean(
    currentUser &&
      memberships.some(
        (m) => m.userId === currentUser.id && m.status === "active",
      ),
  );
  const hasAccess = isOwnerOrAdmin || isMember;

  // Map nợ quỹ của các thành viên trong room
  const hasOutstandingDebtMap = useMemo(() => {
    const debtMap: Record<string, boolean> = {};
    contributions.forEach((c) => {
      if (c.status === "outstanding") {
        debtMap[c.contributorId] = true;
      }
    });
    return debtMap;
  }, [contributions]);

  // Handler: Phê duyệt yêu cầu tham gia
  const handleApproveRequest = (requestId: string) => {
    const req = joinRequests.find((r) => r.id === requestId);
    if (!req) return;

    setJoinRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "approved" as const } : r)),
    );

    // Thêm vào membership
    setMemberships((prev) => [
      ...prev,
      {
        roomId: room!.id,
        userId: req.requesterId,
        status: "active",
        joinedAt: new Date().toISOString(),
      },
    ]);
  };

  // Handler: Từ chối yêu cầu tham gia
  const handleRejectRequest = (requestId: string) => {
    setJoinRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" as const } : r)),
    );
  };

  // Handler: Xóa thành viên
  const handleRemoveMember = (userId: string) => {
    setMemberships((prev) =>
      prev.map((m) =>
        m.userId === userId
          ? { ...m, status: "removed" as const, leftAt: new Date().toISOString() }
          : m,
      ),
    );
  };

  // Handler: Tự điểm danh (Self check-in)
  const handleSelfCheckIn = (status: AttendanceStatus) => {
    if (!currentUser || !meetingSession) return;
    setAttendanceRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.userId === currentUser.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          changedBy: currentUser.id,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `att-${Date.now()}`,
          meetingSessionId: meetingSession.id,
          userId: currentUser.id,
          status,
          changedBy: currentUser.id,
          updatedAt: new Date().toISOString(),
        },
      ];
    });
  };

  // Handler: Chủ phòng override điểm danh
  const handleOwnerOverride = (userId: string, status: AttendanceStatus) => {
    if (!meetingSession) return;
    setAttendanceRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.userId === userId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          changedBy: currentUser?.id ?? "admin",
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `att-${Date.now()}`,
          meetingSessionId: meetingSession.id,
          userId,
          status,
          changedBy: currentUser?.id ?? "admin",
          updatedAt: new Date().toISOString(),
        },
      ];
    });
  };

  // Handler: Tạo khoản đóng quỹ từ Candidate (khi vắng mặt)
  const handleCreateFundFromCandidate = (candidate: FundCandidate) => {
    if (!room) return;
    const newContrib: FundContribution = {
      id: `contrib-${Date.now()}`,
      roomId: room.id,
      meetingSessionId: candidate.meetingSessionId,
      contributorId: candidate.userId,
      amount: candidate.suggestedAmount || 50000,
      reason:
        candidate.attendanceStatus === "absent"
          ? "Bận nhưng chưa xin phép"
          : "Đi trễ",
      reasonDetails: `Ghi nhận từ ứng viên vắng mặt buổi họp`,
      status: "outstanding",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setContributions((prev) => [newContrib, ...prev]);
    // Loại candidate đã được tạo ra khỏi danh sách
    setFundCandidates((prev) =>
      prev.filter(
        (c) =>
          !(
            c.userId === candidate.userId &&
            c.meetingSessionId === candidate.meetingSessionId
          ),
      ),
    );
  };

  // Handler: Tạo khoản đóng quỹ thủ công
  const handleCreateContribution = (data: {
    contributorId: string;
    amount: number;
    reason: FundContributionReason;
    reasonDetails?: string;
  }) => {
    if (!room) return;
    const newContrib: FundContribution = {
      id: `contrib-${Date.now()}`,
      roomId: room.id,
      meetingSessionId: meetingSession?.id,
      contributorId: data.contributorId,
      amount: data.amount,
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      status: "outstanding",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setContributions((prev) => [newContrib, ...prev]);
  };

  // Handler: Xác nhận thanh toán đủ (All-or-nothing)
  const handleConfirmPayment = (contributionId: string) => {
    setContributions((prev) =>
      prev.map((c) =>
        c.id === contributionId
          ? { ...c, status: "paid" as const, updatedAt: new Date().toISOString() }
          : c,
      ),
    );
  };

  // Handler: Lưu trữ phòng họp
  const handleArchiveRoom = () => {
    if (!room) return;
    setRoom((prev: Room | undefined) =>
      prev ? { ...prev, status: "archived", updatedAt: new Date().toISOString() } : prev,
    );
  };

  // Handler: Chuyển giao quyền chủ phòng
  const handleTransferOwnership = (newOwnerId: string) => {
    if (!room) return;
    setRoom((prev: Room | undefined) =>
      prev ? { ...prev, ownerId: newOwnerId, updatedAt: new Date().toISOString() } : prev,
    );
  };

  // Handler: Gửi yêu cầu xin vào phòng
  const handleRequestJoinRoom = () => {
    if (!currentUser || !room) return;
    setRequestJoinStatus("pending");
    const newRequest: JoinRequest = {
      id: `req-${Date.now()}`,
      roomId: room.id,
      requesterId: currentUser.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setJoinRequests((prev) => [...prev, newRequest]);
  };

  // Trường hợp 1: Không tìm thấy phòng
  if (!room) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-6">
          <HugeiconsIcon icon={ShieldAlertIcon} size={32} />
        </div>
        <h1 className="text-2xl font-bold text-[#0B1F1A] mb-2">
          Không tìm thấy phòng họp
        </h1>
        <p className="text-sm text-[#4B665D] mb-8">
          Phòng họp bạn đang truy cập không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#05966B] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#05966B]/90"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          <span>Về trang chủ</span>
        </Link>
      </main>
    );
  }

  // Trường hợp 2: Người dùng chưa đăng nhập hoặc không có quyền truy cập phòng kín
  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        {/* Container: Bo góc 24px (rounded-3xl), padding 32px (p-8) */}
        <div className="rounded-3xl border border-[#C9F2E3] bg-white p-8 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-6">
            <HugeiconsIcon icon={LockIcon} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F1A] mb-2">
            Phòng kín — Yêu cầu quyền truy cập
          </h1>
          <p className="text-sm text-[#4B665D] mb-6">
            Bạn hiện chưa là thành viên chính thức của phòng{" "}
            <span className="font-semibold text-[#0B1F1A]">
              &ldquo;{room.name}&rdquo;
            </span>
            . Vui lòng gửi yêu cầu để chủ phòng duyệt quyền tham gia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
              <span>Trang chủ</span>
            </Link>

            {requestJoinStatus === "pending" ? (
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-100 px-6 py-3 text-sm font-semibold text-amber-800">
                <HugeiconsIcon icon={Clock01Icon} size={18} />
                <span>Đang chờ chủ phòng duyệt</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestJoinRoom}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#05966B] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#05966B]/90 focus-visible:ring-2 focus-visible:ring-[#10D9A3]"
              >
                <HugeiconsIcon icon={UserAdd01Icon} size={18} />
                <span>Xin tham gia phòng</span>
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Trường hợp 3: Thành viên hoặc Chủ phòng / Admin truy cập thành công
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      {/* Header Room Chi Tiết */}
      <MeetingHeader
        room={room}
        owner={owner}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        membersCount={activeMembers.length}
        fundsCount={contributions.length}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenTransferModal={() => setIsTransferModalOpen(true)}
      />

      {/* Tab 1: Thành viên & Duyệt tham gia */}
      {activeTab === "members" && (
        <MembersTab
          room={room}
          members={activeMembers}
          joinRequests={joinRequests}
          usersMap={usersMap}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onRemoveMember={handleRemoveMember}
          hasOutstandingDebtMap={hasOutstandingDebtMap}
        />
      )}

      {/* Tab 2: Điểm danh & Snapshot ứng viên quỹ */}
      {activeTab === "attendance" && (
        <AttendanceTab
          meetingSession={meetingSession}
          members={activeMembers}
          attendanceRecords={attendanceRecords}
          fundCandidates={fundCandidates}
          currentUser={currentUser}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onSelfCheckIn={handleSelfCheckIn}
          onOwnerOverride={handleOwnerOverride}
          onCreateFundFromCandidate={handleCreateFundFromCandidate}
        />
      )}

      {/* Tab 3: Quỹ phòng & Thanh toán */}
      {activeTab === "funds" && (
        <RoomFundsTab
          room={room}
          owner={owner}
          members={activeMembers}
          contributions={contributions}
          usersMap={usersMap}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onCreateContribution={handleCreateContribution}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* Modal Lưu Trữ Phòng Họp */}
      {room && (
        <ArchiveRoomModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          room={room}
          onConfirmArchive={handleArchiveRoom}
        />
      )}

      {/* Modal Chuyển Giao Quyền Chủ Phòng */}
      {room && (
        <TransferOwnershipModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          room={room}
          currentOwner={owner}
          eligibleMembers={activeMembers.filter((m) => m.id !== room.ownerId)}
          onConfirmTransfer={handleTransferOwnership}
        />
      )}
    </main>
  );
}
