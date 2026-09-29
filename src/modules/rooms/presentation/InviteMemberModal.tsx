import React, { useState } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const mockUsers = [
    { id: '1', name: 'Nguyễn Văn A' },
    { id: '2', name: 'Trần Thị B' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
          <h2 className="text-xl font-extrabold text-neutral-900">Mời thành viên</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        <div className="p-6 pb-0 shrink-0">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
              <HugeiconsIcon icon={Search01Icon} size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-neutral-surface py-3 pl-10 pr-4 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {mockUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-600">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm text-neutral-900">{user.name}</span>
                </div>
                <button 
                  className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-neutral-900 hover:bg-primary-hover transition-colors"
                  onClick={() => alert(`Đã gửi lời mời đến ${user.name}`)}
                >
                  Mời
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
