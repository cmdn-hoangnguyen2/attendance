"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  CreditCardIcon,
  Building01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "@/components/layout/PageContainer";
import { useUserRealtime } from "@/lib/realtime/useUserRealtime";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";
import { EmptyState } from "@/components/ui/EmptyState";

type FundStatusFilter = "all" | "outstanding" | "paid";

export default function PersonalFundsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuthMock();

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

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
        const [fetchedContribs, fetchedRooms, fetchedUsers] =
          await Promise.all([
            fundContributionRepository.findByContributorId(currentUser!.id),
            roomRepository.findCatalog({ includeArchived: true }),
            userRepository.listAll({ includeArchived: true }),
          ]);

        if (!isMounted) return;
        setContributions(fetchedContribs);

        const rMap = new Map<string, Room>();
        fetchedRooms.forEach((r: Room) => rMap.set(r.id, r));
        setRoomsMap(rMap);

        const uMap = new Map<string, User>();
        fetchedUsers.forEach((u: User) => uMap.set(u.id, u));
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
        console.error("Failed to load personal funds from Supabase:", err);
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

  // Thống kê tổng hợp (KPI)
  const stats = useMemo(() => {
    let outstandingCount = 0;
    let totalOutstandingAmount = 0;
    let paidCount = 0;
    let totalPaidAmount = 0;

    contributions.forEach((c) => {
      if (c.status === "outstanding") {
        outstandingCount += 1;
        totalOutstandingAmount += c.amount;
      } else if (c.status === "paid") {
        paidCount += 1;
        totalPaidAmount += c.amount;
      }
    });

    return {
      outstandingCount,
      totalOutstandingAmount,
      paidCount,
      totalPaidAmount,
    };
  }, [contributions]);

  // Lọc danh sách theo tab
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

  // Nếu người dùng chưa đăng nhập hoặc đang kiểm tra phiên
  if (isAuthLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex-1 bg-neutral-50/50">
        <PageContainer as="main">
          <div className="flex flex-col gap-6 py-8 animate-pulse">
            <div className="h-12 w-64 rounded-xl bg-neutral-200" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="h-32 rounded-2xl bg-neutral-100" />
              <div className="h-32 rounded-2xl bg-neutral-100" />
              <div className="h-32 rounded-2xl bg-neutral-100" />
            </div>
            <div className="h-64 rounded-2xl bg-neutral-100" />
          </div>
        </PageContainer>
      </div>
    );
  }

  const tabItems: PillTabItem<FundStatusFilter>[] = [
    { key: "all", label: "Tất cả" },
    { key: "outstanding", label: "Cần thanh toán" },
    { key: "paid", label: "Đã thanh toán" },
  ];

  return (
    <div className="flex-1 bg-neutral-50/50">
      <PageContainer as="main">
        {/* Header Trang: Tiêu đề súc tích */}
        <section aria-labelledby="funds-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 id="funds-title" className="text-2xl font-extrabold tracking-tight text-neutral-900">
              Quỹ cá nhân
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Theo dõi các khoản quỹ cần đóng và lịch sử thanh toán.
            </p>
          </div>
        </section>

        {/* KPI Cards: Bento 3 cột (Neutral borders, amber only for outstanding state) */}
        <section aria-label="Thống kê nghĩa vụ quỹ" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Tổng tiền cần thanh toán (Status Amber) */}
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

          {/* Card 2: Đã hoàn thành (Neutral Gray Border) */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Đã thanh toán
              </span>
              <span className="rounded-full bg-neutral-100 p-2 text-neutral-700">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900">
                {formatVND(stats.totalPaidAmount)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {stats.paidCount} khoản đã hoàn thành
              </p>
            </div>
          </div>

          {/* Card 3: Tổng số khoản ghi nhận (Neutral Gray Border) */}
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
              <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900">
                {formatVND(stats.totalOutstandingAmount + stats.totalPaidAmount)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {contributions.length} lượt phát sinh nghĩa vụ
              </p>
            </div>
          </div>
        </section>

        {/* Filter PillTabs */}
        <section aria-label="Bộ lọc trạng thái quỹ" className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <PillTabs
            tabs={tabItems}
            activeKey={statusFilter}
            onChange={setStatusFilter}
          />
        </section>

        {/* Danh sách khoản đóng góp: Grid 3 cột */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-neutral-200" />
            ))}
          </div>
        ) : filteredContributions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContributions.map((contribution) => {
              const room = roomsMap.get(contribution.roomId);
              const isOutstanding = contribution.status === "outstanding";

              return (
                <article
                  key={contribution.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs transition-all hover:border-neutral-400 flex flex-col justify-between"
                >
                  {/* Top content */}
                  <div>
                    {/* Room Name & Date */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 truncate">
                        <HugeiconsIcon icon={Building01Icon} size={15} className="text-neutral-400 shrink-0" />
                        <span className="truncate">{room?.name ?? "Phòng họp"}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400 shrink-0">
                        {new Date(contribution.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="text-2xl font-extrabold text-neutral-900 mb-2">
                      {formatVND(contribution.amount)}
                    </div>

                    {/* Reason */}
                    <div className="space-y-1 mb-4">
                      <span className="inline-block rounded-md bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                        {contribution.reason}
                      </span>
                      {contribution.reasonDetails && (
                        <p className="text-xs text-neutral-500 line-clamp-2 italic">
                          &ldquo;{contribution.reasonDetails}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Card */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                    {isOutstanding ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                          <HugeiconsIcon icon={Clock01Icon} size={13} />
                          <span>Chưa nộp</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedContribution(contribution)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#10D9A3] px-4 py-2 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#05966B] hover:text-white transition-all"
                        >
                          <HugeiconsIcon icon={CreditCardIcon} size={14} />
                          <span>Xem QR Thanh toán</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                          <span>Đã hoàn thành</span>
                        </span>

                        <span className="text-[11px] text-neutral-400">
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
          /* Reusable Empty State Component */
          <EmptyState
            icon={Coins01Icon}
            title="Không có khoản nghĩa vụ nào"
            description={
              statusFilter === "outstanding"
                ? "Tuyệt vời! Bạn không còn khoản nợ quỹ nào cần thanh toán."
                : "Hiện chưa có khoản đóng góp quỹ nào trong danh mục đã chọn."
            }
          />
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
    </div>
  );
}
