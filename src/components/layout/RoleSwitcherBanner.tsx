"use client";

import React from "react";
import { useAuthMock, type MockRole } from "@/context/AuthMockContext";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";

interface RoleOption {
  key: MockRole;
  label: string;
  desc: string;
}

const ROLES: RoleOption[] = [
  { key: "guest", label: "Khách (Guest)", desc: "Chưa đăng nhập" },
  { key: "user", label: "Thành viên (User)", desc: "Lê Văn C (Member)" },
  { key: "owner", label: "Chủ phòng (Owner)", desc: "Trần Thị B (Owner)" },
  { key: "admin", label: "Quản trị viên (Admin)", desc: "nvhoang2012002@gmail.com" },
];

export function RoleSwitcherBanner() {
  const { currentRole, setRole, currentUser, isMockActive } = useAuthMock();

  if (!isMockActive) {
    return null;
  }

  const handleRoleChange = (role: MockRole) => {
    setRole(role);
  };

  return (
    <aside
      aria-label="Thanh chuyển đổi vai trò kiểm thử"
      className="border-b border-[#C9F2E3] bg-[#E8FBF4] px-6 py-2 text-xs text-[#0B1F1A]"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Nhóm thông tin vai trò hiện tại */}
        <div className="flex items-center gap-2">
          {/* Icon user có kích thước 16px (chuẩn 8pt) */}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10D9A3]/30 text-[#05966B]">
            <HugeiconsIcon icon={UserIcon} size={14} />
          </span>
          <span className="font-semibold text-[#0B1F1A]">
            Phase 1 UI Mock Mode:
          </span>
          <span className="text-[#4B665D]">
            Đang mô phỏng quyền{" "}
            <strong className="text-[#05966B]">
              {ROLES.find((r) => r.key === currentRole)?.label}
            </strong>
            {currentUser ? ` (${currentUser.displayName})` : " (Chưa đăng nhập)"}
          </span>
        </div>

        {/* Cụm nút chuyển đổi vai trò */}
        <div className="flex items-center gap-2">
          <span className="text-[#4B665D]">Chuyển vai trò:</span>
          <div className="flex items-center gap-1 rounded-md bg-white p-1 shadow-xs border border-[#C9F2E3]">
            {ROLES.map((role) => {
              const isActive = currentRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleRoleChange(role.key)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#05966B] text-white shadow-xs"
                      : "text-[#4B665D] hover:bg-[#E8FBF4] hover:text-[#0B1F1A]"
                  }`}
                  title={role.desc}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
