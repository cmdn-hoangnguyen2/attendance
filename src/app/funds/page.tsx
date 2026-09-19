"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { mockRepository } from "@/mocks/repository";
import { useAuthMock } from "@/context/AuthMockContext";
import type { FundContribution, Room, User } from "@/types/domain";
import { formatVND } from "@/lib/utils";
import { PaymentInfoModal } from "@/modules/funds/presentation/PaymentInfoModal";
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

type FundStatusFilter = "all" | "outstanding" | "paid";

export default function PersonalFundsPage() {
  const { currentUser, isAuthenticated, setRole } = useAuthMock();

  // Filter tab: Tất cả vs Cần thanh toán vs Đã hoàn thành
  const [statusFilter, setStatusFilter] = useState<FundStatusFilter>("all");

  // In-memory contributions của currentUser
  const [contributions] = useState<FundContribution[]>(() => {
    if (!currentUser) return [];
    return [...mockRepository.listFundContributionsByUserId(currentUser.id)];
  });

  // Modal xem thông tin chuyển khoản (QR code)
  const [selectedContribution, setSelectedContribution] =
    useState<FundContribution | null>(null);

  // Map tra cứu Room & Users
  const roomsMap = useMemo(() => {
    const map = new Map<string, Room>();
    mockRepository.listRooms().forEach((r) => {
      map.set(r.id, r as Room);
    });
    return map;
  }, []);

  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    mockRepository.listUsers().forEach((u) => {
      map.set(u.id, u as User);
    });
    return map;
  }, []);

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

  const activePaymentImage = useMemo(() => {
    if (!activeRoom) return null;
    return activeRoom.paymentImageUrl ?? null;
  }, [activeRoom]);

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
            Bạn cần đăng nhập để theo dõi các nghĩa vụ đóng quỹ cá nhân của các phòng họp.
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
      {/* Header Trang: Tiêu đề & Giới thiệu */}
      <section aria-labelledby="funds-page-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 id="funds-page-title" className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0B1F1A]">
            Quỹ cá nhân & Nghĩa vụ đóng
          </h1>
          <p className="text-sm text-[#4B665D] mt-1">
            Theo dõi tổng quan các khoản phạt vắng mặt/đi trễ và đóng góp quỹ xuyên suốt các phòng họp.
          </p>
        </div>
      </section>

      {/* 2 Thẻ Thống kê Tổng quan (Summary Cards) - 8pt Grid */}
      <section aria-label="Thống kê nghĩa vụ quỹ" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Card 1: Tổng tiền cần đóng */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <HugeiconsIcon icon={Clock01Icon} size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Cần thanh toán
                </p>
                <p className="text-2xl font-black text-amber-950">
                  {formatVND(stats.totalOutstandingAmount)}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              {stats.outstandingCount} khoản
            </span>
          </div>
        </div>

        {/* Card 2: Tổng tiền đã nộp */}
        <div className="rounded-2xl border border-[#C9F2E3] bg-[#E8FBF4]/50 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9F2E3] text-[#05966B]">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#05966B]">
                  Đã hoàn thành nộp
                </p>
                <p className="text-2xl font-black text-[#0B1F1A]">
                  {formatVND(stats.totalPaidAmount)}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#E8FBF4] px-3 py-1 text-xs font-bold text-[#05966B]">
              {stats.paidCount} khoản
            </span>
          </div>
        </div>
      </section>

      {/* Tabs lọc trạng thái */}
      <section aria-label="Bộ lọc trạng thái quỹ" className="flex items-center gap-2 border-b border-[#C9F2E3] pb-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "all"
              ? "bg-[#05966B] text-white shadow-xs"
              : "bg-white text-[#4B665D] border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <span>Tất cả</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
            {contributions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("outstanding")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "outstanding"
              ? "bg-amber-700 text-white shadow-xs"
              : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50/50"
          }`}
        >
          <span>Chưa thanh toán</span>
          <span className="rounded-full bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
            {stats.outstandingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("paid")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            statusFilter === "paid"
              ? "bg-[#05966B] text-white shadow-xs"
              : "bg-white text-[#05966B] border border-[#C9F2E3] hover:bg-[#E8FBF4]/50"
          }`}
        >
          <span>Đã thanh toán</span>
          <span className="rounded-full bg-[#C9F2E3]/60 px-1.5 py-0.5 text-[10px] font-bold text-[#05966B]">
            {stats.paidCount}
          </span>
        </button>
      </section>

      {/* Danh sách các khoản đóng quỹ (Bento Grid 3 hoặc 4 cột) */}
      {filteredContributions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContributions.map((contribution) => {
            const room = roomsMap.get(contribution.roomId);
            const isRoomArchived = room?.status === "archived";
            const isOutstanding = contribution.status === "outstanding";

            const reasonLabels: Record<string, string> = {
              late: "Đi trễ",
              absent: "Vắng mặt",
              custom: "Khoản thu khác",
              other: "Khoản thu khác",
            };

            return (
              <article
                key={contribution.id}
                className="flex flex-col justify-between rounded-2xl border border-[#C9F2E3] bg-white p-6 shadow-xs transition-all hover:border-[#10D9A3]/60 hover:shadow-md"
              >
                {/* Phần trên */}
                <div className="space-y-4">
                  {/* Dòng 1: Tên phòng & Badge Lưu Trữ */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                        <HugeiconsIcon icon={Building01Icon} size={16} />
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-[#0B1F1A] truncate">
                          {room ? room.name : "Phòng họp"}
                        </p>
                        <p className="text-[11px] text-[#4B665D]">
                          Mã: {contribution.roomId}
                        </p>
                      </div>
                    </div>

                    {/* Badge Phòng đã lưu trữ nếu room.status === 'archived' */}
                    {isRoomArchived && (
                      <span className="shrink-0 rounded-md bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                        Phòng đã lưu trữ
                      </span>
                    )}
                  </div>

                  {/* Dòng 2: Lý do & Số tiền */}
                  <div className="rounded-xl bg-neutral-50 p-4 space-y-2 border border-neutral-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#4B665D]">Lý do:</span>
                      <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-[#0B1F1A] border border-neutral-200 shadow-2xs">
                        {reasonLabels[contribution.reason] || contribution.reason}
                      </span>
                    </div>

                    {contribution.reasonDetails && (
                      <p className="text-[11px] text-neutral-500 italic">
                        {contribution.reasonDetails}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                      <span className="text-xs font-semibold text-[#0B1F1A]">
                        Số tiền:
                      </span>
                      <span
                        className={`text-base font-bold ${
                          isOutstanding ? "text-amber-800" : "text-[#05966B]"
                        }`}
                      >
                        {formatVND(contribution.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phần dưới: Trạng thái & Action Button */}
                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                  {isOutstanding ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
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
                          const payment = mockRepository.listPaymentsByContributionId(contribution.id)[0];
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
            Không có khoản quỹ nào
          </h2>
          <p className="text-xs text-[#4B665D] max-w-sm mx-auto mb-6">
            {statusFilter === "all"
              ? "Bạn hiện không có bất kỳ khoản đóng quỹ hoặc tiền phạt nào cần thực hiện."
              : statusFilter === "outstanding"
              ? "Tuyệt vời! Bạn không còn khoản tiền nào cần phải thanh toán."
              : "Bạn chưa có khoản đóng quỹ nào đã hoàn thành."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#05966B] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#05966B]/90"
          >
            <HugeiconsIcon icon={Home01Icon} size={16} />
            <span>Trang chủ</span>
          </Link>
        </div>
      )}

      {/* Modal hiển thị thông tin thanh toán & QR Chuyển khoản */}
      {selectedContribution && activeRoom && (
        <PaymentInfoModal
          isOpen={Boolean(selectedContribution)}
          onClose={() => setSelectedContribution(null)}
          roomName={activeRoom.name}
          ownerName={activeOwner ? activeOwner.displayName : "Chủ phòng"}
          amount={selectedContribution.amount}
          reason={selectedContribution.reason}
          paymentImageUrl={activePaymentImage}
          isRoomArchived={activeRoom.status === "archived"}
        />
      )}
    </main>
  );
}
