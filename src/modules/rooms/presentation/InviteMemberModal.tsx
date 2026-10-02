"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Search01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const mockUsers = [
    { id: "1", name: "Nguyễn Văn A" },
    { id: "2", name: "Trần Thị B" },
  ];

  return (
    <ResponsiveDialog isOpen={isOpen} onClose={onClose} labelledBy="invite-member-title" size="sm">
      <div className="InviteMemberModal ui-section-stack">
        <div className="InviteMemberModal__heading flex items-start justify-between gap-4">
          <div className="InviteMemberModal__heading-copy">
            <p className="InviteMemberModal__eyebrow text-xs font-semibold uppercase tracking-wider text-text-tertiary">Thành viên phòng</p>
            <h2 id="invite-member-title" className="InviteMemberModal__title mt-2 text-xl font-bold text-text-primary">Mời thành viên</h2>
            <p className="InviteMemberModal__description mt-2 text-sm leading-6 text-text-secondary">Tìm người dùng và gửi lời mời tham gia phòng.</p>
          </div>
          <Button className="InviteMemberModal__close shrink-0 px-2" variant="ghost" aria-label="Đóng cửa sổ" onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </Button>
        </div>

        <label className="InviteMemberModal__search relative block">
          <span className="InviteMemberModal__search-label sr-only">Tìm kiếm người dùng</span>
          <HugeiconsIcon className="InviteMemberModal__search-icon pointer-events-none absolute left-4 top-4 text-text-tertiary" icon={Search01Icon} size={16} aria-hidden />
          <input
            type="search"
            placeholder="Tìm kiếm người dùng"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="InviteMemberModal__search-input ui-field pl-10"
          />
        </label>

        <div className="InviteMemberModal__user-list border-y border-border">
          {mockUsers.map((user) => (
            <div className="InviteMemberModal__user ui-data-row flex items-center justify-between gap-4" key={user.id}>
              <div className="InviteMemberModal__person flex min-w-0 items-center gap-4">
                <span className="InviteMemberModal__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {user.name.charAt(0)}
                </span>
                <span className="InviteMemberModal__name truncate text-sm font-semibold text-text-primary">{user.name}</span>
              </div>
              <Button size="compact" onClick={() => alert(`Đã gửi lời mời đến ${user.name}`)}>
                <HugeiconsIcon icon={UserAdd01Icon} size={16} aria-hidden />
                Mời
              </Button>
            </div>
          ))}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
