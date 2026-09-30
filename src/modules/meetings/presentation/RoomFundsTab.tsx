"use client";

import { useState } from "react";
import {
  FundContributionStatus,
  RoomStatus,
  type FundContribution,
  type FundContributionReason,
  type Room,
  type User,
} from "@/types/domain";
import { formatVND } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowTurnBackwardIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  PlusSignIcon,
  QrCode01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CreateFundContributionModal } from "@/modules/funds/presentation/CreateFundContributionModal";
import { PaymentInfoModal } from "@/modules/funds/presentation/PaymentInfoModal";

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
  const isArchived = room.status === RoomStatus.ARCHIVED;

  const outstandingContributions = contributions.filter(
    (contribution) => contribution.status === FundContributionStatus.OUTSTANDING,
  );
  const paidContributions = contributions.filter(
    (contribution) => contribution.status === FundContributionStatus.PAID,
  );
  const orderedContributions = [...outstandingContributions, ...paidContributions];
  const totalOutstanding = outstandingContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  const totalPaid = paidContributions.reduce((sum, contribution) => sum + contribution.amount, 0);

  return (
    <div className="RoomFundsTab ui-page-stack">
      {isArchived ? (
        <div className="RoomFundsTab__archived-notice flex items-start gap-4 rounded-lg bg-neutral-soft p-4 text-sm leading-6 text-text-secondary">
          <HugeiconsIcon className="RoomFundsTab__archived-icon mt-1 shrink-0 text-neutral" icon={InformationCircleIcon} size={20} aria-hidden />
          <div className="RoomFundsTab__archived-copy">
            <p className="RoomFundsTab__archived-title font-semibold text-text-primary">Phòng đang ở chế độ lưu trữ</p>
            <p className="RoomFundsTab__archived-description mt-1">Không thể tạo nghĩa vụ quỹ mới; Chủ phòng và Admin chỉ được xác nhận hoặc hoàn tác khoản đã có.</p>
          </div>
        </div>
      ) : null}

      <section className="RoomFundsTab__overview ui-section-stack" aria-labelledby="funds-overview-title">
        <div className="RoomFundsTab__overview-heading flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="RoomFundsTab__eyebrow text-xs font-semibold uppercase tracking-wider text-text-tertiary">Tổng quan</p>
            <h2 id="funds-overview-title" className="RoomFundsTab__title mt-2 text-xl font-bold text-text-primary">Sổ quỹ phòng họp</h2>
          </div>
          <p className="RoomFundsTab__count text-sm text-text-secondary">{contributions.length} khoản ghi nhận</p>
        </div>

        <dl className="RoomFundsTab__summary grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="RoomFundsTab__summary-item py-4 md:pr-6">
            <dt className="text-sm text-text-secondary">Chưa nộp · cần thu</dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums text-warning">{formatVND(totalOutstanding)}</dd>
            <dd className="mt-1 text-sm text-text-tertiary">{outstandingContributions.length} khoản cần thanh toán</dd>
          </div>
          <div className="RoomFundsTab__summary-item py-4 md:px-6">
            <dt className="text-sm text-text-secondary">Đã thu thành công</dt>
            <dd className="mt-2 text-2xl font-bold tabular-nums text-primary">{formatVND(totalPaid)}</dd>
            <dd className="mt-1 text-sm text-text-tertiary">{paidContributions.length} khoản đã xác nhận</dd>
          </div>
          <div className="RoomFundsTab__summary-item flex flex-col gap-4 py-4 md:pl-6">
            <div>
              <dt className="text-sm font-semibold text-text-primary">Thao tác quỹ</dt>
              <dd className="mt-1 text-sm leading-6 text-text-secondary">Quét QR để chuyển khoản hoặc tạo khoản nghĩa vụ mới.</dd>
            </div>
            <div className="RoomFundsTab__actions flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" size="compact" onClick={() => setIsQrModalOpen(true)}>
                <HugeiconsIcon icon={QrCode01Icon} size={16} aria-hidden />
                Xem mã QR
              </Button>
              {!isArchived && isOwnerOrAdmin ? (
                <Button size="compact" onClick={() => setIsCreateModalOpen(true)}>
                  <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden />
                  Tạo khoản
                </Button>
              ) : null}
            </div>
          </div>
        </dl>
      </section>

      <section className="RoomFundsTab__ledger ui-section-stack" aria-labelledby="funds-list-title">
        <div className="RoomFundsTab__section-copy">
          <h2 id="funds-list-title" className="RoomFundsTab__section-title text-xl font-bold text-text-primary">Chi tiết khoản quỹ</h2>
          <p className="RoomFundsTab__section-description mt-2 text-sm text-text-secondary">Khoản chưa nộp được đặt trước lịch sử đã xác nhận để ưu tiên xử lý.</p>
        </div>

        {orderedContributions.length > 0 ? (
          <div className="RoomFundsTab__contribution-list border-y border-border">
            {orderedContributions.map((item) => {
              const contributor = usersMap.get(item.contributorId);
              const isPaid = item.status === FundContributionStatus.PAID;

              return (
                <article className="RoomFundsTab__contribution ui-data-row flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(120px,0.7fr)_minmax(180px,1fr)_auto] xl:items-center" key={item.id}>
                  <div className="RoomFundsTab__person flex min-w-0 items-center gap-4">
                    <span className="RoomFundsTab__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {contributor?.displayName?.charAt(0) ?? "?"}
                    </span>
                    <div className="RoomFundsTab__person-copy min-w-0">
                      <h3 className="RoomFundsTab__person-name truncate text-sm font-semibold text-text-primary">{contributor?.displayName ?? "Thành viên ẩn"}</h3>
                      <p className="RoomFundsTab__person-email truncate text-sm text-text-secondary">{contributor?.email}</p>
                    </div>
                  </div>

                  <div className="RoomFundsTab__amount-row flex items-center justify-between gap-4 xl:block">
                    <span className="text-sm text-text-secondary xl:hidden">Số tiền</span>
                    <span className="text-base font-bold tabular-nums text-text-primary">{formatVND(item.amount)}</span>
                  </div>

                  <div className="RoomFundsTab__reason-row flex items-start justify-between gap-4 xl:block">
                    <span className="text-sm text-text-secondary xl:hidden">Lý do</span>
                    <div className="text-right xl:text-left">
                      <p className="text-sm font-semibold text-text-primary">{item.reason}</p>
                      {item.reasonDetails ? <p className="mt-1 text-sm italic text-text-secondary">&ldquo;{item.reasonDetails}&rdquo;</p> : null}
                      <p className="mt-1 text-xs text-text-tertiary">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>

                  <div className="RoomFundsTab__status-row flex items-center justify-between gap-4 xl:justify-end">
                    <StatusBadge tone={isPaid ? "success" : "warning"}>
                      {isPaid ? "Đã nộp" : "Chưa nộp"}
                    </StatusBadge>
                    {isOwnerOrAdmin ? (
                      !isPaid ? (
                        <Button size="compact" onClick={() => onConfirmPayment(item.id)} title="Xác nhận thành viên đã nộp đủ tiền">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} aria-hidden />
                          Xác nhận
                        </Button>
                      ) : onRevertPayment ? (
                        <Button variant="ghost" size="compact" onClick={() => onRevertPayment(item.id)} title="Hoàn tác trạng thái về Chưa nộp">
                          <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} aria-hidden />
                          Hoàn tác
                        </Button>
                      ) : null
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="RoomFundsTab__empty border-y border-border py-12 text-center">
            <p className="RoomFundsTab__empty-title text-sm font-semibold text-text-primary">Chưa có khoản đóng quỹ</p>
            <p className="RoomFundsTab__empty-description mt-2 text-sm text-text-secondary">Các khoản phát sinh trong phòng sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </section>

      <CreateFundContributionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        roomMembers={members}
        onCreateContribution={onCreateContribution}
      />

      <PaymentInfoModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomName={room.name}
        ownerName={owner?.displayName ?? "Chủ phòng"}
        paymentImageUrl={room.paymentImageUrl}
        isRoomArchived={isArchived}
      />
    </div>
  );
}
