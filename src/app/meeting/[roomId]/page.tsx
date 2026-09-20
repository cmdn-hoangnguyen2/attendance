"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { UploadPaymentQrModal } from "@/modules/funds/presentation/UploadPaymentQrModal";
import { AccessRevokedModal } from "@/modules/meetings/presentation/AccessRevokedModal";
import { LeaveRoomModal } from "@/modules/meetings/presentation/LeaveRoomModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { useRoomRealtime } from "@/lib/realtime/useRoomRealtime";
import {
  attendanceRepository,
  fundContributionRepository,
  joinRequestRepository,
  meetingSessionRepository,
  membershipRepository,
  paymentRepository,
  roomPaymentImageRepository,
  roomRepository,
  userRepository,
} from "@/lib/repository";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  LockIcon,
  ShieldAlertIcon,
  UserAdd01Icon,
  Clock01Icon,
  Archive01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const { currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuthMock();

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const [isLoading, setIsLoading] = useState(true);
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
  const [memberships, setMemberships] = useState<RoomMembership[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [meetingSession, setMeetingSession] = useState<MeetingSession | undefined>(undefined);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [fundCandidates, setFundCandidates] = useState<FundCandidate[]>([]);
  const [contributions, setContributions] = useState<FundContribution[]>([]);

  // State cho các modal Archive, Transfer Ownership, QR Code và Rời phòng
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPaymentQrModalOpen, setIsPaymentQrModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Tab điều hướng hiện tại
  const [activeTab, setActiveTab] = useState<MeetingTab>("members");

  // Trạng thái yêu cầu tham gia của currentUser nếu đang ở ngoài phòng
  const [requestJoinStatus, setRequestJoinStatus] = useState<"none" | "pending" | "approved">("none");

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Realtime subscription for room events
  useRoomRealtime({
    roomId,
    sessionId: meetingSession?.id,
    onDataChange: () => setRefreshKey((k) => k + 1),
    enabled: Boolean(room && !isLoading),
  });

  // Load live data from Supabase
  useEffect(() => {
    if (!roomId) return;
    let isMounted = true;

    async function fetchData() {
      try {
        const [fetchedRoom, fetchedUsers, fetchedMembers, fetchedRequests, fetchedSessions, fetchedFunds, fetchedImage] =
          await Promise.all([
            roomRepository.findById(roomId),
            userRepository.listAll({ includeArchived: true }),
            membershipRepository.findByRoomId(roomId),
            joinRequestRepository.findByRoomId(roomId),
            meetingSessionRepository.findByRoomId(roomId),
            fundContributionRepository.findByRoomId(roomId),
            roomPaymentImageRepository.findByRoomId(roomId),
          ]);

        if (!isMounted) return;

        let signedPaymentUrl: string | null = null;
        if (fetchedImage?.storagePath) {
          signedPaymentUrl = await roomPaymentImageRepository.getSignedUrl(fetchedImage.storagePath);
        }

        const resolvedRoom = fetchedRoom
          ? { ...fetchedRoom, paymentImageUrl: signedPaymentUrl }
          : undefined;

        setRoom(resolvedRoom);

        const uMap = new Map<string, User>();
        fetchedUsers.forEach((u) => uMap.set(u.id, u));
        setUsersMap(uMap);

        setMemberships(fetchedMembers);
        setJoinRequests(fetchedRequests);
        setContributions(fetchedFunds);

        if (fetchedSessions.length > 0) {
          const currentSession = fetchedSessions[0];
          setMeetingSession(currentSession);
          const [fetchedAtt, fetchedCand] = await Promise.all([
            attendanceRepository.findBySessionId(currentSession.id),
            attendanceRepository.getCandidates(currentSession.id),
          ]);
          if (!isMounted) return;
          setAttendanceRecords(fetchedAtt);
          setFundCandidates(fetchedCand);
        }

        if (currentUser) {
          const userReq = fetchedRequests.find(
            (r) => r.requesterId === currentUser.id && r.status === "pending"
          );
          if (userReq) {
            setRequestJoinStatus("pending");
          }
        }
      } catch (err) {
        console.error("Failed to load room details:", err);
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
  }, [roomId, currentUser, refreshKey]);

  // Tra cứu chủ phòng (owner)
  const owner = useMemo(() => {
    if (!room) return undefined;
    return usersMap.get(room.ownerId);
  }, [room, usersMap]);

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

  // Kiểm tra xem currentUser có bị chủ phòng/admin xóa khỏi phòng không
  const isCurrentUserRemoved = useMemo(() => {
    if (!currentUser || isOwnerOrAdmin) return false;
    // Nếu vẫn còn bản ghi membership active thì không bị xóa
    const hasActive = memberships.some(
      (m) => m.userId === currentUser.id && m.status === "active"
    );
    if (hasActive) return false;

    // Kiểm tra xem có bản ghi bị removed không
    return memberships.some(
      (m) => m.userId === currentUser.id && m.status === "removed"
    );
  }, [currentUser, isOwnerOrAdmin, memberships]);

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
  const handleApproveRequest = async (requestId: string) => {
    try {
      const reviewerId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      await joinRequestRepository.approve(requestId, reviewerId);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to approve request:", err);
    }
  };

  // Handler: Từ chối yêu cầu tham gia
  const handleRejectRequest = async (requestId: string) => {
    try {
      const reviewerId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      await joinRequestRepository.reject(requestId, reviewerId);
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" as const } : r)),
      );
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  // Handler: Xóa thành viên
  const handleRemoveMember = async (userId: string, reason?: string, phrase?: string) => {
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      await membershipRepository.removeMember(room!.id, userId, actorId, reason, phrase);
      setMemberships((prev) =>
        prev.map((m) =>
          m.userId === userId
            ? { ...m, status: "removed" as const, leftAt: new Date().toISOString() }
            : m,
        ),
      );
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  // Handler: Tự điểm danh (Self check-in)
  const handleSelfCheckIn = async (status: AttendanceStatus) => {
    if (!currentUser) return;
    try {
      let session = meetingSession;
      if (!session) {
        const sessions = await meetingSessionRepository.findByRoomId(roomId);
        const activeOrScheduled = sessions.find((s) => s.status !== "closed");
        if (activeOrScheduled) {
          session = activeOrScheduled;
          setMeetingSession(activeOrScheduled);
        } else {
          const now = new Date();
          const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          const created = await meetingSessionRepository.create({
            roomId,
            title: "Phiên họp định kỳ",
            startsAt,
            attendanceDeadline: startsAt,
            closesAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          });
          session = created;
          setMeetingSession(created);
        }
      }

      const record = await attendanceRepository.submitSelfAttendance(
        session.id,
        currentUser.id,
        status
      );
      setAttendanceRecords((prev) => {
        const idx = prev.findIndex((r) => r.userId === currentUser.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = record;
          return updated;
        }
        return [...prev, record];
      });
    } catch (err) {
      console.error("Failed to submit attendance:", err);
    }
  };

  // Handler: Chủ phòng override điểm danh
  const handleOwnerOverride = async (userId: string, status: AttendanceStatus) => {
    let session = meetingSession;
    if (!session) {
      const sessions = await meetingSessionRepository.findByRoomId(roomId);
      const activeOrScheduled = sessions.find((s) => s.status !== "closed");
      if (activeOrScheduled) {
        session = activeOrScheduled;
        setMeetingSession(activeOrScheduled);
      } else {
        const now = new Date();
        const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        const created = await meetingSessionRepository.create({
          roomId,
          title: "Phiên họp định kỳ",
          startsAt,
          attendanceDeadline: startsAt,
          closesAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        });
        session = created;
        setMeetingSession(created);
      }
    }
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      const record = await attendanceRepository.overrideAttendance(
        session.id,
        userId,
        status,
        actorId
      );
      setAttendanceRecords((prev) => {
        const idx = prev.findIndex((r) => r.userId === userId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = record;
          return updated;
        }
        return [...prev, record];
      });
    } catch (err) {
      console.error("Failed to override attendance:", err);
    }
  };

  // Handler: Tạo khoản đóng quỹ từ Candidate (khi vắng mặt)
  const handleCreateFundFromCandidate = async (candidate: FundCandidate) => {
    if (!room) return;
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      const newContrib = await fundContributionRepository.create({
        roomId: room.id,
        meetingSessionId: candidate.meetingSessionId,
        contributorId: candidate.userId,
        amount: candidate.suggestedAmount || 50000,
        reason: candidate.attendanceStatus === "absent" ? "Bận nhưng chưa xin phép" : "Đi trễ",
        reasonDetails: "Ghi nhận từ ứng viên vắng mặt buổi họp",
        createdBy: actorId,
      });

      setContributions((prev) => [newContrib, ...prev]);
      setFundCandidates((prev) =>
        prev.filter(
          (c) =>
            !(
              c.userId === candidate.userId &&
              c.meetingSessionId === candidate.meetingSessionId
            ),
        ),
      );
    } catch (err) {
      console.error("Failed to create fund from candidate:", err);
    }
  };

  // Handler: Tạo khoản đóng quỹ thủ công
  const handleCreateContribution = async (data: {
    contributorId: string;
    amount: number;
    reason: FundContributionReason;
    reasonDetails?: string;
  }) => {
    if (!room) return;
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      const created = await fundContributionRepository.create({
        roomId: room.id,
        contributorId: data.contributorId,
        amount: data.amount,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        meetingSessionId: meetingSession?.id,
        createdBy: actorId,
      });
      setContributions((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create contribution:", err);
    }
  };

  // Handler: Xác nhận thanh toán đủ (All-or-nothing)
  const handleConfirmPayment = async (contributionId: string) => {
    const target = contributions.find((c) => c.id === contributionId);
    if (!target) return;
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      await paymentRepository.confirmPayment({
        contributionId,
        amount: target.amount,
        confirmedBy: actorId,
      });
      setContributions((prev) =>
        prev.map((c) =>
          c.id === contributionId
            ? { ...c, status: "paid" as const, updatedAt: new Date().toISOString() }
            : c,
        ),
      );
    } catch (err) {
      console.error("Failed to confirm payment:", err);
    }
  };

  // Handler: Hoàn tác thanh toán quỹ
  const handleRevertPayment = async (contributionId: string) => {
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      await paymentRepository.revertPayment(contributionId, actorId);
      setContributions((prev) =>
        prev.map((c) =>
          c.id === contributionId
            ? { ...c, status: "outstanding" as const, updatedAt: new Date().toISOString() }
            : c,
        ),
      );
    } catch (err) {
      console.error("Failed to revert payment:", err);
    }
  };

  // Handler: Lưu trữ phòng họp
  const handleArchiveRoom = async (phrase = "Archive this room") => {
    if (!room) return;
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      const archived = await roomRepository.archive(room.id, actorId, phrase);
      setRoom(archived);
      setIsArchiveModalOpen(false);
    } catch (err) {
      console.error("Failed to archive room:", err);
    }
  };

  // Handler: Chuyển giao quyền chủ phòng
  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!room) return;
    try {
      const actorId = currentUser?.id ?? "00000000-0000-0000-0000-000000000001";
      const updated = await roomRepository.transferOwnership(room.id, newOwnerId, actorId);
      setRoom(updated);
      setIsTransferModalOpen(false);
    } catch (err) {
      console.error("Failed to transfer ownership:", err);
    }
  };

  // Handler: Gửi yêu cầu xin vào phòng
  const handleRequestJoinRoom = async () => {
    if (!currentUser || !room) return;
    try {
      await joinRequestRepository.create(room.id, currentUser.id);
      setRequestJoinStatus("pending");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to request join room:", err);
    }
  };

  // Handler: Thành viên tự rời phòng
  const handleLeaveRoom = async () => {
    if (!currentUser || !room) return;
    try {
      await membershipRepository.leave(room.id, currentUser.id);
      setIsLeaveModalOpen(false);
      router.replace("/");
    } catch (err) {
      console.error("Failed to leave room:", err);
    }
  };

  if (isLoading || isAuthLoading || !isAuthenticated) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-32 rounded-3xl bg-neutral-200" />
          <div className="h-12 w-96 rounded-xl bg-neutral-200" />
          <div className="h-64 rounded-2xl bg-neutral-100" />
        </div>
      </main>
    );
  }

  // Trường hợp 1: Không tìm thấy phòng
  if (!room) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-6">
          <HugeiconsIcon icon={ShieldAlertIcon} size={32} />
        </div>
        <h1 className="text-2xl font-bold text-neutral-dark mb-2">
          Không tìm thấy phòng họp
        </h1>
        <p className="text-sm text-neutral-muted mb-8">
          Phòng họp bạn đang truy cập không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-dark/90"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          <span>Về trang chủ</span>
        </Link>
      </main>
    );
  }

  // Trường hợp 2A-0: Phòng đã lưu trữ (Archived) - Chỉ Owner/Admin được vào xem Quỹ, thành viên thường bị chặn
  if (room.status === "archived" && !isOwnerOrAdmin) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-neutral-border bg-white p-8 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 mb-6">
            <HugeiconsIcon icon={Archive01Icon} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-dark mb-2">
            Phòng họp đã được lưu trữ
          </h1>
          <p className="text-sm text-neutral-muted mb-6">
            Phòng họp <span className="font-semibold text-neutral-dark">&ldquo;{room.name}&rdquo;</span> đã được lưu trữ. Thành viên không thể truy cập vào chi tiết phòng này. Vui lòng kiểm tra các khoản nghĩa vụ quỹ tại trang Quỹ cá nhân.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
              <span>Về trang chủ</span>
            </Link>
            <Link
              href="/funds"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-neutral-dark shadow-xs hover:bg-primary-hover hover:text-white"
            >
              <HugeiconsIcon icon={Coins01Icon} size={18} />
              <span>Xem quỹ cá nhân</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Trường hợp 2A: Người dùng bị chủ phòng hoặc admin xóa khỏi phòng (Kicked member)
  if (isCurrentUserRemoved) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <AccessRevokedModal
          isOpen={true}
          roomName={room.name}
        />
      </main>
    );
  }

  // Trường hợp 2B: Người dùng chưa đăng nhập hoặc không có quyền truy cập phòng kín
  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        {/* Container: Bo góc 24px (rounded-3xl), padding 32px (p-8) */}
        <div className="rounded-3xl border border-neutral-border bg-white p-8 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-6">
            <HugeiconsIcon icon={LockIcon} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-dark mb-2">
            Phòng kín — Yêu cầu quyền truy cập
          </h1>
          <p className="text-sm text-neutral-muted mb-6">
            Bạn hiện chưa là thành viên chính thức của phòng{" "}
            <span className="font-semibold text-neutral-dark">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-primary-dark/90 focus-visible:ring-2 focus-visible:ring-primary"
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
    <PageContainer as="main">
      {/* Header Room Chi Tiết */}
      <MeetingHeader
        room={room}
        owner={owner}
        activeTab={room.status === "archived" ? "funds" : activeTab}
        onTabChange={setActiveTab}
        membersCount={activeMembers.length}
        fundsCount={contributions.length}
        isOwnerOrAdmin={isOwnerOrAdmin}
        isMember={isMember}
        isOwner={isOwner}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        onOpenTransferModal={() => setIsTransferModalOpen(true)}
        onOpenPaymentQrModal={() => setIsPaymentQrModalOpen(true)}
        onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
      />

      {/* Tab 1: Thành viên & Duyệt tham gia (Chỉ khả dụng khi phòng chưa archive) */}
      {room.status !== "archived" && activeTab === "members" && (
        <MembersTab
          room={room}
          members={activeMembers}
          joinRequests={joinRequests}
          usersMap={usersMap}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onRemoveMember={(userId) => handleRemoveMember(userId)}
          hasOutstandingDebtMap={hasOutstandingDebtMap}
        />
      )}

      {/* Tab 2: Điểm danh & Snapshot ứng viên quỹ (Chỉ khả dụng khi phòng chưa archive) */}
      {room.status !== "archived" && activeTab === "attendance" && (
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

      {/* Tab 3: Quỹ phòng & Thanh toán (Luôn khả dụng hoặc là tab duy nhất khi archive) */}
      {(room.status === "archived" || activeTab === "funds") && (
        <RoomFundsTab
          room={room}
          owner={owner}
          members={activeMembers}
          contributions={contributions}
          usersMap={usersMap}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onCreateContribution={handleCreateContribution}
          onConfirmPayment={handleConfirmPayment}
          onRevertPayment={handleRevertPayment}
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

      {/* Modal Cập Nhật Mã QR Thanh Toán */}
      {room && (
        <UploadPaymentQrModal
          isOpen={isPaymentQrModalOpen}
          onClose={() => setIsPaymentQrModalOpen(false)}
          roomId={room.id}
          roomName={room.name}
          currentImageUrl={room.paymentImageUrl}
          onUploadSuccess={(newUrl) => {
            setRoom((prev) => (prev ? { ...prev, paymentImageUrl: newUrl } : prev));
            setRefreshKey((k) => k + 1);
          }}
          onDeleteSuccess={() => {
            setRoom((prev) => (prev ? { ...prev, paymentImageUrl: null } : prev));
            setRefreshKey((k) => k + 1);
          }}
          uploadHandler={async (file: File) => {
            if (!currentUser) throw new Error("Vui lòng đăng nhập để thực hiện.");
            const formData = new FormData();
            formData.append("file", file);
            formData.append("actorId", currentUser.id);

            const res = await fetch(`/api/rooms/${roomId}/payment-qr`, {
              method: "POST",
              body: formData,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
              throw new Error(data.error || "Tải tệp lên Supabase Storage thất bại.");
            }

            return data.data;
          }}
          deleteHandler={async () => {
            if (!currentUser) throw new Error("Vui lòng đăng nhập để thực hiện.");
            const res = await fetch(
              `/api/rooms/${roomId}/payment-qr?actorId=${encodeURIComponent(currentUser.id)}`,
              { method: "DELETE" }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
              throw new Error(data.error || "Xóa ảnh mã QR thất bại.");
            }
          }}
        />
      )}

      {/* Modal thông báo khi bị xóa khỏi phòng (Kicked member) */}
      <AccessRevokedModal
        isOpen={isCurrentUserRemoved}
        roomName={room?.name}
      />

      {/* Modal xác nhận tự rời phòng họp (Leave Room) */}
      {room && (
        <LeaveRoomModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          room={room}
          onConfirmLeave={handleLeaveRoom}
        />
      )}
    </PageContainer>
  );
}
