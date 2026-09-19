"use client";

import React, { useState } from "react";
import type { FundContribution, FundContributionReason, Room, User } from "@/types/domain";
import { formatVND } from "@/lib/utils";
import { CreateFundContributionModal } from "@/modules/funds/presentation/CreateFundContributionModal";
import { PaymentInfoModal } from "@/modules/funds/presentation/PaymentInfoModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Clock01Icon,
  QrCode01Icon,
  ArrowTurnBackwardIcon,
} from "@hugeicons/core-free-icons";

export interface RoomFundsTabProps {
  room: Room;
  owner?: User;
  members: User[];
  contributions: FundContribution[];
  usersMap: Map<string, User>;
  isOwnerOrAdmin: boolean;
  onCreateContribution: (data: {
    contributorId: string;
    amount: number;
    reason: FundContributionReason;
    reasonDetails?: string;
  }) => void;
  onConfirmPayment: (contributionId: string) => void;
  onRevertPayment?: (contributionId: string) => void;
}

export function RoomFundsTab({
  room,
  owner,
  members,
  contributions,
  usersMap,
  isOwnerOrAdmin,
  onCreateContribution,
  onConfirmPayment,
  onRevertPayment,
}: RoomFundsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const isArchived = room.status === "archived";

  // Tính tổng số tiền quỹ
  const totalOutstanding = contributions
    .filter((c) => c.status === "outstanding")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = contributions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-8">
      {/* Cảnh báo nếu phòng đã bị lưu trữ */}
      {isArchived ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <HugeiconsIcon icon={InformationCircleIcon} size={20} className="shrink-0 text-amber-600" />
          <div>
            <strong className="font-bold">Chế độ Xem Quỹ Phòng Đã Lưu Trữ:</strong>
            <p className="mt-0.5">
              Phòng họp này đã được lưu trữ (Archive). Không thể tạo thêm khoản đóng quỹ mới; Chủ phòng và Admin chỉ được xác nhận hoặc hoàn tác các khoản đã nộp từ trước.
            </p>
          </div>
        </div>
      ) : null}

      {/* SECTION 1: Tổng quan số liệu Quỹ (Bento 3 khối) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cần thu */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Chưa nộp (Cần thu)
          </span>
          <div className="mt-2 text-2xl font-black text-amber-900">
            {formatVND(totalOutstanding)}
          </div>
          <span className="text-xs text-amber-700 mt-1 block">
            {contributions.filter((c) => c.status === "outstanding").length} khoản cần thanh toán
          </span>
        </div>

        {/* Card 2: Đã thu */}
        <div className="rounded-2xl border border-[#C9F2E3] bg-[#E8FBF4]/60 p-6 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#05966B]">
            Đã thu thành công
          </span>
          <div className="mt-2 text-2xl font-black text-[#05966B]">
            {formatVND(totalPaid)}
          </div>
          <span className="text-xs text-[#4B665D] mt-1 block">
            {contributions.filter((c) => c.status === "paid").length} khoản đã xác nhận
          </span>
        </div>

        {/* Card 3: Nút tạo khoản quỹ nhanh & Nút xem QR phòng */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#C9F2E3] bg-white p-6 shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B665D]">
              Hành động quỹ phòng
            </span>
            <p className="text-xs text-[#4B665D] mt-1">
              Quét mã QR để chuyển khoản hoặc tạo khoản nghĩa vụ quỹ
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2.5">
            {/* Nút xem mã QR phòng: Tất cả thành viên đều có thể bấm để quét */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#C9F2E3] bg-[#E8FBF4] px-4 py-2.5 text-xs font-bold text-[#05966B] hover:bg-[#C9F2E3]/60 transition-colors shadow-2xs"
            >
              <HugeiconsIcon icon={QrCode01Icon} size={16} />
              <span>Xem mã QR thanh toán</span>
            </button>

            {!isArchived && isOwnerOrAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#10D9A3] px-4 py-2.5 text-xs font-bold text-[#0B1F1A] shadow-xs hover:bg-[#05966B] hover:text-white transition-colors"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                <span>Tạo khoản đóng quỹ</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* SECTION 2: Bảng Danh Sách Khoản Đóng Quỹ */}
      <section aria-labelledby="funds-list-title" className="rounded-2xl border border-[#C9F2E3] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 id="funds-list-title" className="text-lg font-bold text-[#0B1F1A]">
              Sổ quỹ phòng họp ({contributions.length})
            </h2>
            <p className="text-xs text-[#4B665D]">
              Theo dõi lịch sử và trạng thái đóng quỹ của các thành viên
            </p>
          </div>
        </div>

        {contributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs font-bold uppercase text-[#4B665D] bg-neutral-50/50">
                <tr>
                  <th className="py-3 px-4">Thành viên</th>
                  <th className="py-3 px-4">Số tiền</th>
                  <th className="py-3 px-4">Lý do</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Thời gian</th>
                  {/* Chỉ hiển thị cột Thao tác cho Chủ phòng / Admin */}
                  {isOwnerOrAdmin ? (
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {contributions.map((item) => {
                  const contributor = usersMap.get(item.contributorId);
                  const isPaid = item.status === "paid";

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FBF4] text-[#05966B] font-bold text-xs">
                            {contributor?.displayName?.charAt(0) ?? "?"}
                          </div>
                          <div>
                            <span className="font-bold text-[#0B1F1A] block">
                              {contributor?.displayName ?? "Thành viên ẩn"}
                            </span>
                            <span className="text-xs text-[#4B665D]">{contributor?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#0B1F1A]">
                        {formatVND(item.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#4B665D]">
                        <span className="font-semibold text-[#0B1F1A]">{item.reason}</span>
                        {item.reasonDetails ? (
                          <span className="block text-[11px] text-neutral-500 italic mt-0.5">
                            &ldquo;{item.reasonDetails}&rdquo;
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E8FBF4] px-2.5 py-1 text-xs font-bold text-[#05966B]">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                            <span>Đã nộp</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <HugeiconsIcon icon={Clock01Icon} size={14} />
                            <span>Chưa nộp</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#4B665D]">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Cột thao tác: Chỉ hiển thị cho Admin/Owner */}
                      {isOwnerOrAdmin ? (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Khi chưa nộp: Nút xác nhận đã nộp */}
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => onConfirmPayment(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#05966B] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0B1F1A] transition-colors shadow-2xs"
                                title="Xác nhận thành viên đã nộp đủ tiền"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                <span>Xác nhận đã nộp</span>
                              </button>
                            ) : onRevertPayment ? (
                              /* Khi đã nộp: Nút hoàn tác về Chưa nộp */
                              <button
                                type="button"
                                onClick={() => onRevertPayment(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-2xs"
                                title="Hoàn tác trạng thái về Chưa nộp"
                              >
                                <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={14} />
                                <span>Hoàn tác</span>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#4B665D]">
            Chưa có khoản đóng quỹ nào được ghi nhận trong phòng này.
          </div>
        )}
      </section>

      {/* Modal Tạo Khoản Quỹ */}
      <CreateFundContributionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        roomMembers={members}
        onCreateContribution={onCreateContribution}
      />

      {/* Modal Xem QR Thanh Toán Của Phòng */}
      {isQrModalOpen ? (
        <PaymentInfoModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          roomName={room.name}
          ownerName={owner?.displayName ?? "Chủ phòng"}
          paymentImageUrl={room.paymentImageUrl}
          isRoomArchived={isArchived}
        />
      ) : null}
    </div>
  );
}
