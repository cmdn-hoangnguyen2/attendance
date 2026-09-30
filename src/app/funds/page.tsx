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
import { Coins01Icon } from "@hugeicons/core-free-icons";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUserRealtime } from "@/lib/realtime/useUserRealtime";
import { DropdownFilter, type DropdownFilterItem } from "@/components/ui/DropdownFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { FundFilterTab, FundContributionStatus, RoomStatus } from "@/types/domain";

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
  const [statusFilter, setStatusFilter] = useState<FundFilterTab>(FundFilterTab.ALL);
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
      if (c.status === FundContributionStatus.OUTSTANDING) {
        outstandingCount += 1;
        totalOutstandingAmount += c.amount;
      } else if (c.status === FundContributionStatus.PAID) {
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
    if (statusFilter === FundFilterTab.OUTSTANDING) {
      return contributions.filter((c) => c.status === FundContributionStatus.OUTSTANDING);
    }
    if (statusFilter === FundFilterTab.PAID) {
      return contributions.filter((c) => c.status === FundContributionStatus.PAID);
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

  const tabItems: DropdownFilterItem<FundFilterTab>[] = [
    { key: FundFilterTab.ALL, label: "Tất cả" },
    { key: FundFilterTab.OUTSTANDING, label: "Cần thanh toán" },
    { key: FundFilterTab.PAID, label: "Đã thanh toán" },
  ];
  const outstandingAmount = formatVND(stats.totalOutstandingAmount);
  const paidAmount = formatVND(stats.totalPaidAmount);
  const totalAmount = formatVND(stats.totalOutstandingAmount + stats.totalPaidAmount);
  const closePayment = () => setSelectedContribution(null);
  const emptyDescription = statusFilter === FundFilterTab.OUTSTANDING
    ? "Bạn không còn khoản quỹ nào cần thanh toán."
    : "Chưa có khoản đóng góp quỹ trong danh mục đã chọn.";

  const renderContribution = (contribution: FundContribution) => {
    const room = roomsMap.get(contribution.roomId);
    const isOutstanding = contribution.status === FundContributionStatus.OUTSTANDING;
    const roomName = room?.name ?? "Phòng họp";
    const amount = formatVND(contribution.amount);
    const createdDate = new Date(contribution.createdAt).toLocaleDateString("vi-VN");
    const payment = paymentsMap.get(contribution.id);
    const paidDate = payment?.paidAt ? new Date(payment.paidAt).toLocaleDateString("vi-VN") : "Đã xác nhận";
    const archivedBadge = room?.status === RoomStatus.ARCHIVED
      ? <StatusBadge tone="neutral">Phòng đã lưu trữ</StatusBadge> : null;
    const reasonDetails = contribution.reasonDetails
      ? <p className="MyFunds__details break-words text-sm text-text-secondary">{contribution.reasonDetails}</p> : null;
    const action = isOutstanding ? (
      <Button className="MyFunds__payment-action w-full sm:w-auto" size="touch" variant="secondary" onClick={() => setSelectedContribution(contribution)}>Xem QR thanh toán</Button>
    ) : <span className="MyFunds__paid-date text-xs text-text-tertiary">{paidDate}</span>;
    const tone = isOutstanding ? "warning" : "success";
    const statusLabel = isOutstanding ? "Chưa nộp" : "Đã thanh toán";
    return (
      <li className="MyFunds__row ui-data-row grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]" key={contribution.id}>
        <div className="MyFunds__identity flex min-w-0 flex-col gap-2">
          <div className="MyFunds__room-line flex flex-wrap items-center gap-2">
            <h3 className="MyFunds__room-name break-words text-base font-semibold text-text-primary">{roomName}</h3>
            {archivedBadge}
          </div>
          <p className="MyFunds__reason break-words text-sm text-text-secondary">{contribution.reason}</p>
          {reasonDetails}
          <time className="MyFunds__created-date text-xs text-text-tertiary" dateTime={contribution.createdAt}>{createdDate}</time>
        </div>
        <div className="MyFunds__payment flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:justify-end">
          <div className="MyFunds__amount-status flex flex-col items-start gap-2 lg:items-end">
            <p className="MyFunds__amount tabular-numbers text-xl font-semibold text-text-primary">{amount}</p>
            <StatusBadge tone={tone}>{statusLabel}</StatusBadge>
          </div>
          {action}
        </div>
      </li>
    );
  };
  const outstandingRows = filteredContributions.filter((item) => item.status === FundContributionStatus.OUTSTANDING).map(renderContribution);
  const paidRows = filteredContributions.filter((item) => item.status !== FundContributionStatus.OUTSTANDING).map(renderContribution);
  const outstandingSection = outstandingRows.length ? (
    <section className="MyFunds__outstanding" aria-labelledby="outstanding-title">
      <h2 className="MyFunds__section-title text-lg font-semibold text-text-primary" id="outstanding-title">Cần thanh toán</h2>
      <ul className="MyFunds__list">{outstandingRows}</ul>
    </section>
  ) : null;
  const paidSection = paidRows.length ? (
    <section className="MyFunds__history" aria-labelledby="paid-title">
      <h2 className="MyFunds__section-title text-lg font-semibold text-text-primary" id="paid-title">Lịch sử thanh toán</h2>
      <ul className="MyFunds__list">{paidRows}</ul>
    </section>
  ) : null;
  const skeletons = [1, 2, 3].map((item) => <div className="MyFunds__skeleton h-24 rounded-lg bg-surface-subtle" key={item} />);
  let results = <div className="MyFunds__groups ui-page-stack">{outstandingSection}{paidSection}</div>;
  if (!filteredContributions.length) {
    results = <EmptyState icon={Coins01Icon} title="Không có khoản quỹ nào" description={emptyDescription} />;
  }
  if (isLoading) {
    results = <div className="MyFunds__loading ui-section-stack animate-pulse" role="status" aria-label="Đang tải quỹ">{skeletons}</div>;
  }
  const paymentDialog = selectedContribution ? (
    <PaymentInfoModal
      isOpen={Boolean(selectedContribution)}
      onClose={closePayment}
      roomName={activeRoom?.name ?? "Phòng họp"}
      ownerName={activeOwner?.displayName ?? "Chủ phòng"}
      amount={selectedContribution.amount}
      reason={selectedContribution.reason}
      paymentImageUrl={activePaymentImage}
      isRoomArchived={activeRoom?.status === RoomStatus.ARCHIVED}
    />
  ) : null;
  if (isAuthLoading || !isAuthenticated || !currentUser) {
    return <PageLayout><div className="MyFunds__loading ui-section-stack animate-pulse" role="status" aria-label="Đang kiểm tra phiên đăng nhập">{skeletons}</div></PageLayout>;
  }
  return (
    <PageLayout>
      <div className="MyFunds ui-page-stack">
        <PageHeader id="funds-title" title="Quỹ của tôi" description="Các khoản cần đóng và lịch sử thanh toán của bạn." />
        <section className="MyFunds__summary flex flex-col gap-6 rounded-lg bg-surface-subtle p-6 lg:flex-row lg:items-center lg:justify-between" aria-label="Tổng hợp quỹ">
          <div className="MyFunds__balance flex flex-col gap-2">
            <h2 className="MyFunds__balance-label text-sm font-semibold text-text-secondary">Cần thanh toán</h2>
            <p className="MyFunds__balance-value tabular-numbers text-2xl font-bold leading-8 text-text-primary">{outstandingAmount}</p>
            <p className="MyFunds__balance-count text-sm text-text-secondary">{stats.outstandingCount} khoản chưa nộp</p>
          </div>
          <dl className="MyFunds__totals flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <div className="MyFunds__total flex flex-col gap-2">
              <dt className="MyFunds__total-label text-text-secondary">Đã thanh toán · {stats.paidCount} khoản</dt>
              <dd className="MyFunds__total-value tabular-numbers font-semibold text-text-primary">{paidAmount}</dd>
            </div>
            <div className="MyFunds__total flex flex-col gap-2">
              <dt className="MyFunds__total-label text-text-secondary">Tổng phát sinh · {contributions.length} khoản</dt>
              <dd className="MyFunds__total-value tabular-numbers font-semibold text-text-primary">{totalAmount}</dd>
            </div>
          </dl>
        </section>
        <section className="MyFunds__content ui-section-stack" aria-label="Danh sách khoản quỹ">
          <div className="MyFunds__filters">
            <DropdownFilter items={tabItems} activeKey={statusFilter} onChange={setStatusFilter} />
          </div>
          {results}
        </section>
        {paymentDialog}
      </div>
    </PageLayout>
  );
}
