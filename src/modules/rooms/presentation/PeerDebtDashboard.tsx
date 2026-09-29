import React, { useState } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Tick01Icon } from "@hugeicons/core-free-icons";

// Mock data until connected
const MOCK_DEBTS = [
  { id: '1', creditor: 'Hoang', debtor: 'Quang', amount: 50000, reason: 'Tiền cafe', status: 'outstanding', isOwedToMe: true },
  { id: '2', creditor: 'Dung', debtor: 'Tôi', amount: 35000, reason: 'Trà sữa', status: 'outstanding', isOwedToMe: false },
];

export function PeerDebtDashboard() {
  const [activeTab, setActiveTab] = useState<'owe_me' | 'i_owe' | 'history'>('owe_me');
  const [debts, setDebts] = useState(MOCK_DEBTS);

  const oweMe = debts.filter(d => d.isOwedToMe && d.status === 'outstanding');
  const iOwe = debts.filter(d => !d.isOwedToMe && d.status === 'outstanding');

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900">Quản lý nợ cá nhân (P2P)</h2>
        <button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-neutral-900 transition-colors hover:bg-primary-hover">
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Thêm khoản nợ
        </button>
      </div>

      <div className="flex gap-4 border-b border-neutral-200 mb-6">
        <button 
          onClick={() => setActiveTab('owe_me')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'owe_me' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          Ai đang nợ tôi ({oweMe.length})
        </button>
        <button 
          onClick={() => setActiveTab('i_owe')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'i_owe' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          Tôi đang nợ ({iOwe.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
        >
          Lịch sử giao dịch
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'owe_me' && (
          oweMe.length > 0 ? oweMe.map(debt => (
            <div key={debt.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-surface">
              <div>
                <p className="text-sm font-bold text-neutral-900">{debt.debtor} <span className="font-medium text-neutral-500">nợ bạn</span></p>
                <p className="text-xs text-neutral-500 mt-1">{debt.reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-base font-black text-rose-600">{debt.amount.toLocaleString('vi-VN')} đ</span>
                <button 
                  onClick={() => setDebts(debts.map(d => d.id === debt.id ? { ...d, status: 'paid' } : d))}
                  className="flex items-center gap-1 rounded-lg bg-white border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                >
                  <HugeiconsIcon icon={Tick01Icon} size={14} />
                  Đã thanh toán
                </button>
              </div>
            </div>
          )) : <p className="text-center text-neutral-500 p-6 text-sm">Không có ai nợ bạn.</p>
        )}

        {activeTab === 'i_owe' && (
          iOwe.length > 0 ? iOwe.map(debt => (
            <div key={debt.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-neutral-surface">
              <div>
                <p className="text-sm font-bold text-neutral-900">Bạn <span className="font-medium text-neutral-500">đang nợ</span> {debt.creditor}</p>
                <p className="text-xs text-neutral-500 mt-1">{debt.reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-base font-black text-neutral-900">{debt.amount.toLocaleString('vi-VN')} đ</span>
                <button className="text-xs font-bold text-primary hover:underline">
                  Xem QR Code
                </button>
              </div>
            </div>
          )) : <p className="text-center text-neutral-500 p-6 text-sm">Bạn không nợ ai cả. Tuyệt vời!</p>
        )}

        {activeTab === 'history' && (
          <p className="text-center text-neutral-500 p-6 text-sm">Chưa có lịch sử giao dịch.</p>
        )}
      </div>
    </div>
  );
}
