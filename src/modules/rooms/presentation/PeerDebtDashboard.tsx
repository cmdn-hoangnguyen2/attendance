"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Tick01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";
import { StatusBadge } from "@/components/ui/StatusBadge";

const MOCK_DEBTS = [
  { id: "1", creditor: "Hoang", debtor: "Quang", amount: 50000, reason: "Tiền cafe", status: "outstanding", isOwedToMe: true },
  { id: "2", creditor: "Dung", debtor: "Tôi", amount: 35000, reason: "Trà sữa", status: "outstanding", isOwedToMe: false },
];

type DebtTab = "owe_me" | "i_owe" | "history";

export function PeerDebtDashboard() {
  const [activeTab, setActiveTab] = useState<DebtTab>("owe_me");
  const [debts, setDebts] = useState(MOCK_DEBTS);

  const oweMe = debts.filter((debt) => debt.isOwedToMe && debt.status === "outstanding");
  const iOwe = debts.filter((debt) => !debt.isOwedToMe && debt.status === "outstanding");
  const tabs: PillTabItem<DebtTab>[] = [
    { key: "owe_me", label: `Ai nợ tôi (${oweMe.length})` },
    { key: "i_owe", label: `Tôi đang nợ (${iOwe.length})` },
    { key: "history", label: "Lịch sử" },
  ];

  return (
    <div className="PeerDebtDashboard ui-page-stack">
      <div className="PeerDebtDashboard__heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="PeerDebtDashboard__heading-copy">
          <p className="PeerDebtDashboard__eyebrow text-xs font-semibold uppercase tracking-wider text-text-tertiary">Channel room</p>
          <h2 className="PeerDebtDashboard__title mt-2 text-xl font-bold text-text-primary">Quản lý nợ cá nhân</h2>
          <p className="PeerDebtDashboard__description mt-2 text-sm text-text-secondary">Theo dõi các khoản nợ phát sinh giữa thành viên.</p>
        </div>
        <Button size="touch" onClick={() => undefined}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden />
          Thêm khoản nợ
        </Button>
      </div>

      <PillTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      <div className="PeerDebtDashboard__list border-y border-border">
        {activeTab === "owe_me" ? (
          oweMe.length > 0 ? oweMe.map((debt) => (
            <article className="PeerDebtDashboard__row ui-data-row flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" key={debt.id}>
              <div className="PeerDebtDashboard__row-copy">
                <p className="text-sm font-semibold text-text-primary">{debt.debtor} <span className="font-normal text-text-secondary">nợ bạn</span></p>
                <p className="mt-1 text-sm text-text-secondary">{debt.reason}</p>
              </div>
              <div className="PeerDebtDashboard__row-action flex flex-wrap items-center gap-4 sm:justify-end">
                <span className="text-base font-bold tabular-nums text-danger">{debt.amount.toLocaleString("vi-VN")} đ</span>
                <Button variant="secondary" size="compact" onClick={() => setDebts(debts.map((item) => item.id === debt.id ? { ...item, status: "paid" } : item))}>
                  <HugeiconsIcon icon={Tick01Icon} size={16} aria-hidden />
                  Đã thanh toán
                </Button>
              </div>
            </article>
          )) : <p className="py-12 text-center text-sm text-text-secondary">Không có ai nợ bạn.</p>
        ) : null}

        {activeTab === "i_owe" ? (
          iOwe.length > 0 ? iOwe.map((debt) => (
            <article className="PeerDebtDashboard__row ui-data-row flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" key={debt.id}>
              <div className="PeerDebtDashboard__row-copy">
                <p className="text-sm font-semibold text-text-primary">Bạn <span className="font-normal text-text-secondary">đang nợ</span> {debt.creditor}</p>
                <p className="mt-1 text-sm text-text-secondary">{debt.reason}</p>
              </div>
              <div className="PeerDebtDashboard__row-action flex flex-wrap items-center gap-4 sm:justify-end">
                <span className="text-base font-bold tabular-nums text-text-primary">{debt.amount.toLocaleString("vi-VN")} đ</span>
                <Button variant="ghost" size="compact" onClick={() => undefined}>Xem QR Code</Button>
              </div>
            </article>
          )) : <p className="py-12 text-center text-sm text-text-secondary">Bạn không nợ ai cả. Tuyệt vời!</p>
        ) : null}

        {activeTab === "history" ? <div className="PeerDebtDashboard__history flex items-center justify-center gap-2 py-12 text-sm text-text-secondary"><StatusBadge tone="neutral">Chưa có lịch sử giao dịch</StatusBadge></div> : null}
      </div>
    </div>
  );
}
