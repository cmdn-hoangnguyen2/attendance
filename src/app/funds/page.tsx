"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuthMock } from "@/context/AuthMockContext";
import type { FundContribution, Payment, Room, User } from "@/types/domain";
import { formatVND } from "@/lib/utils";
import { PaymentInfoModal } from "@/modules/funds/presentation/PaymentInfoModal";
import {
  fundContributionRepository,
  paymentRepository,
  roomPaymentImageRepository,
  roomRepository,
  userRepository,
} from "@/lib/repository";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Coins01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Home01Icon,
  Login01Icon,
  CreditCardIcon,
  Building01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/layout/PageContainer";
import { useUserRealtime } from "@/lib/realtime/useUserRealtime";

type FundStatusFilter = "all" | "outstanding" | "paid";

export default function PersonalFundsPage() {
  const { currentUser, isAuthenticated, setRole } = useAuthMock();

  // Filter tab: Tất cả vs Cần thanh toán vs Đã hoàn thành
  const [statusFilter, setStatusFilter] = useState<FundStatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [contributions, setContributions] = useState<FundContribution[]>([]);
  const [roomsMap, setRoomsMap] = useState<Map<string, Room>>(new Map());
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
  const [paymentsMap, setPaymentsMap] = useState<Map<string, Payment>>(new Map());

  // Modal xem thông tin chuyển khoản (QR code)
  const [selectedContribution, setSelectedContribution] =
    useState<FundContribution | null>(null);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // Realtime subscription for personal fund updates
  useUserRealtime({
    userId: currentUser?.id ?? "",
    onDataChange: () => setRefreshKey((k) => k + 1),
    enabled: Boolean(currentUser),
  });

  // Load data from Supabase
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;

    async function fetchData() {
      try {
        const [fetchedContribs, fetchedRooms, fetchedUsers] = await Promise.all([
          fundContributionRepository.findByContributorId(currentUser!.id),
          roomRepository.findCatalog({ includeArchived: true }),
          userRepository.listAll({ includeArchived: true }),
        ]);

        if (!isMounted) return;
        setContributions(fetchedContribs);

        const rMap = new Map<string, Room>();
        fetchedRooms.forEach((r) => rMap.set(r.id, r));
        setRoomsMap(rMap);

        const uMap = new Map<string, User>();
        fetchedUsers.forEach((u) => uMap.set(u.id, u));
        setUsersMap(uMap);

        // Fetch payments for paid contributions
        const paidContribs = fetchedContribs.filter((c) => c.status === "paid");
        const pMap = new Map<string, Payment>();
        await Promise.all(
          paidContribs.map(async (c) => {
            const p = await paymentRepository.findByContributionId(c.id);
            if (p) pMap.set(c.id, p);
          })
        );
        if (!isMounted) return;
        setPaymentsMap(pMap);
      } catch (err) {
        console.error("Failed to load personal funds data:", err);
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

  // Tổng hợp thống kê cá nhân
  const stats = useMemo(() => {
    const outstanding = contributions.filter((c) => c.status === "outstanding");
    const paid = contributions.filter((c) => c.status === "paid");

    const totalOutstandingAmount = outstanding.reduce(
      (sum, c) => sum + c.amount,
      0,
    );
    const totalPaidAmount = paid.reduce((sum, c) => sum + c.amount, 0);

    return {
      outstandingCount: outstanding.length,
      paidCount: paid.length,
      totalOutstandingAmount,
      totalPaidAmount,
    };
  }, [contributions]);

  // Lọc theo tab
  const filteredContributions = useMemo(() => {
    if (statusFilter === "outstanding") {
      return contributions.filter((c) => c.status === "outstanding");
    }
    if (statusFilter === "paid") {
      return contributions.filter((c) => c.status === "paid");
    }
    return contributions;
  }, [contributions, statusFilter]);

  // Tìm room và payment image tương ứng cho modal thanh toán
  const activeRoom = selectedContribution
    ? roomsMap.get(selectedContribution.roomId)
    : undefined;

  const activeOwner = activeRoom ? usersMap.get(activeRoom.ownerId) : undefined;

  const [modalPaymentImageUrl, setModalPaymentImageUrl] = useState<string | null>(null);

  // Dynamically resolve signed QR URL when a contribution is selected
  useEffect(() => {
    let isMounted = true;
    async function loadQrUrl() {
      if (!selectedContribution) {
        if (isMounted) setModalPaymentImageUrl(null);
        return;
      }
      try {
        const img = await roomPaymentImageRepository.findByRoomId(selectedContribution.roomId);
        if (img?.storagePath) {
          const url = await roomPaymentImageRepository.getSignedUrl(img.storagePath);
          if (isMounted) setModalPaymentImageUrl(url);
        } else {
          if (isMounted) setModalPaymentImageUrl(null);
        }
      } catch (err) {
        console.error("Failed to load signed QR URL:", err);
      }
    }
    loadQrUrl();
    return () => {
      isMounted = false;
    };
  }, [selectedContribution]);

  const activePaymentImage = modalPaymentImageUrl || activeRoom?.paymentImageUrl || null;

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
            Bạn cần đăng nhập để xem danh sách các khoản quỹ cần thanh toán và lịch sử đóng góp.
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
    <PageContainer as="main">
      {/* Header Trang: Tiêu đề & Tổng quan */}
      <section aria-labelledby="funds-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 id="funds-title" className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0B1F1A]">
            Quỹ cá nhân (Funds)
          </h1>
          <p className="text-sm text-[#4B665D] mt-1">
            Theo dõi các khoản quỹ cần đóng và lịch sử thanh toán minh bạch trên Supabase.
          </p>
        </div>
      </section>

      {/* KPI Cards: Bento 3 cột chuẩn 8pt (Gap 24px = gap-6) */}
      <section aria-label="Thống kê nghĩa vụ quỹ" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Tổng tiền cần thanh toán */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Cần thanh toán
            </span>
            <span className="rounded-full bg-amber-100 p-2 text-amber-700">
              <HugeiconsIcon icon={Clock01Icon} size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl lg:text-3xl font-extrabold text-amber-900">
              {formatVND(stats.totalOutstandingAmount)}
            </div>
            <p className="text-xs text-amber-700 mt-1">
              {stats.outstandingCount} khoản nghĩa vụ chưa nộp
            </p>
          </div>
        </div>

        {/* Card 2: Đã hoàn thành */}
        <div className="rounded-2xl border border-[#C9F2E3] bg-[#E8FBF4]/40 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#05966B]">
              Đã thanh toán
            </span>
            <span className="rounded-full bg-[#E8FBF4] p-2 text-[#05966B]">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1F1A]">
              {formatVND(stats.totalPaidAmount)}
            </div>
            <p className="text-xs text-[#4B665D] mt-1">
              {stats.paidCount} khoản đã xác nhận đủ
            </p>
          </div>
        </div>

        {/* Card 3: Tổng số khoản ghi nhận */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Tổng phát sinh
            </span>
            <span className="rounded-full bg-neutral-100 p-2 text-neutral-700">
              <HugeiconsIcon icon={Coins01Icon} size={20} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1F1A]">
              {formatVND(stats.totalOutstandingAmount + stats.totalPaidAmount)}
            </div>
            <p className="text-xs text-[#4B665D] mt-1">
              {contributions.length} lượt phát sinh nghĩa vụ
            </p>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section aria-label="Bộ lọc trạng thái quỹ" className="flex items-center justify-between border-b border-[#C9F2E3] pb-4">
        <div className="flex items-center gap-2 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/80">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-white text-[#05966B] shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            Tất cả ({contributions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("outstanding")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === "outstanding"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            Chưa thanh toán ({stats.outstandingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === "paid"
                ? "bg-white text-[#05966B] shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            Đã thanh toán ({stats.paidCount})
          </button>
        </div>
      </section>

      {/* Danh sách các khoản đóng quỹ cá nhân: Grid 4 cột Desktop-first (gap 24px = gap-6) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-neutral-200" />
          ))}
        </div>
      ) : filteredContributions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredContributions.map((contribution) => {
            const room = roomsMap.get(contribution.roomId);
            const isRoomArchived = room?.status === "archived";
            const isOutstanding = contribution.status === "outstanding";

            return (
              <article
                key={contribution.id}
                className="flex flex-col justify-between rounded-2xl border border-[#C9F2E3] bg-white p-6 shadow-xs transition-all hover:shadow-md"
              >
                <div>
                  {/* Badge Room Name & Archived Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-[#0B1F1A] truncate max-w-[160px]">
                      <HugeiconsIcon icon={Building01Icon} size={12} className="text-[#4B665D]" />
                      <span className="truncate">{room?.name ?? "Phòng họp"}</span>
                    </span>

                    {isRoomArchived && (
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Room archived
                      </span>
                    )}
                  </div>

                  {/* Số tiền cần đóng: Format VND integer */}
                  <div className="text-xl font-extrabold text-[#0B1F1A] mb-1">
                    {formatVND(contribution.amount)}
                  </div>

                  {/* Lý do & Chi tiết */}
                  <div className="space-y-1 mb-4">
                    <span className="inline-block rounded-md bg-[#E8FBF4] px-2 py-0.5 text-[11px] font-semibold text-[#05966B]">
                      {contribution.reason}
                    </span>
                    {contribution.reasonDetails && (
                      <p className="text-xs text-[#4B665D] line-clamp-2 italic">
                        &ldquo;{contribution.reasonDetails}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Card */}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                  {isOutstanding ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <HugeiconsIcon icon={Clock01Icon} size={14} />
                        <span>Chưa nộp</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedContribution(contribution)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#05966B] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#05966B]/90 focus-visible:ring-2 focus-visible:ring-[#10D9A3]"
                      >
                        <HugeiconsIcon icon={CreditCardIcon} size={14} />
                        <span>Xem TT Chuyển Khoản</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8FBF4] px-2.5 py-1 text-xs font-semibold text-[#05966B]">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                        <span>Đã hoàn thành</span>
                      </span>

                      <span className="text-[11px] text-[#4B665D]">
                        {(() => {
                          const payment = paymentsMap.get(contribution.id);
                          return payment?.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString("vi-VN")
                            : "Đã xác nhận";
                        })()}
                      </span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-[#C9F2E3] bg-white/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8FBF4] text-[#05966B] mb-4">
            <HugeiconsIcon icon={Coins01Icon} size={28} />
          </div>
          <h2 className="text-base font-bold text-[#0B1F1A] mb-1">
            Không có khoản nghĩa vụ nào
          </h2>
          <p className="max-w-md mx-auto text-xs text-[#4B665D]">
            {statusFilter === "outstanding"
              ? "Tuyệt vời! Bạn không còn khoản nợ quỹ nào chưa hoàn thành."
              : "Hiện chưa có khoản đóng góp quỹ nào được ghi nhận cho tài khoản của bạn."}
          </p>
        </div>
      )}

      {/* Modal Thông tin Chuyển khoản / QR Code */}
      {selectedContribution && (
        <PaymentInfoModal
          isOpen={Boolean(selectedContribution)}
          onClose={() => setSelectedContribution(null)}
          roomName={activeRoom?.name ?? "Phòng họp"}
          ownerName={activeOwner?.displayName ?? "Chủ phòng"}
          amount={selectedContribution.amount}
          reason={selectedContribution.reason}
          paymentImageUrl={activePaymentImage}
          isRoomArchived={activeRoom?.status === "archived"}
        />
      )}
    </PageContainer>
  );
}
