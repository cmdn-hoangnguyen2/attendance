"use client";

import React, { useState, useMemo } from "react";
import type { Room, User } from "@/types/domain";
import { ArchiveUserModal } from "./ArchiveUserModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Search01Icon,
  CheckmarkCircle01Icon,
  UserRemove01Icon,
  ArrowReloadHorizontalIcon,
  SecurityCheckIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";

export interface UsersManagementTabProps {
  users: User[];
  rooms: Room[];
  currentAdmin: User | null;
  onArchiveUser: (userId: string, replacementAdminId?: string) => void;
  onRestoreUser: (userId: string) => void;
}

type UserStatusFilter = "all" | "active" | "soft_deleted";

export function UsersManagementTab({
  users,
  rooms,
  currentAdmin,
  onArchiveUser,
  onRestoreUser,
}: UsersManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [selectedUserToArchive, setSelectedUserToArchive] = useState<User | null>(null);

  // Thống kê
  const activeUsersCount = users.filter((u) => u.status === "active").length;
  const softDeletedUsersCount = users.filter((u) => u.status === "soft_deleted").length;

  // Lọc danh sách người dùng
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          u.displayName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [users, statusFilter, searchQuery]);

  // Các phòng active mà user đang sở hữu (dùng cho modal archive)
  const userOwnedActiveRooms = useMemo(() => {
    if (!selectedUserToArchive) return [];
    return rooms.filter(
      (r) => r.ownerId === selectedUserToArchive.id && r.status === "active",
    );
  }, [rooms, selectedUserToArchive]);

  // Danh sách các admin khả dụng tiếp nhận phòng (loại trừ chính user bị xóa)
  const eligibleAdmins = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === "admin" &&
        u.status === "active" &&
        u.id !== selectedUserToArchive?.id,
    );
  }, [users, selectedUserToArchive]);

  return (
    <div className="space-y-6">
      {/* 3 Thẻ thống kê người dùng (Summary Cards) */}
      <section aria-label="Thống kê người dùng" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-[#C9F2E3] bg-white p-6 shadow-xs">
          <p className="text-xs font-semibold text-[#4B665D]">Tổng số tài khoản</p>
          <p className="text-2xl font-black text-[#0B1F1A] mt-1">{users.length}</p>
        </div>

        <div className="rounded-2xl border border-[#C9F2E3] bg-[#E8FBF4]/50 p-6 shadow-xs">
          <p className="text-xs font-semibold text-[#05966B]">Đang hoạt động</p>
          <p className="text-2xl font-black text-[#0B1F1A] mt-1">{activeUsersCount}</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs">
          <p className="text-xs font-semibold text-rose-800">Đã xóa mềm (Archived)</p>
          <p className="text-2xl font-black text-rose-950 mt-1">{softDeletedUsersCount}</p>
        </div>
      </section>

      {/* Thanh bộ lọc & Tìm kiếm */}
      <section aria-label="Bộ lọc người dùng" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#C9F2E3] pb-4">
        {/* Sub-tabs trạng thái */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-[#05966B] text-white shadow-xs"
                : "bg-white text-[#4B665D] border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <span>Tất cả</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-[#05966B] text-white shadow-xs"
                : "bg-white text-[#05966B] border border-[#C9F2E3] hover:bg-[#E8FBF4]/50"
            }`}
          >
            <span>Đang hoạt động</span>
            <span className="rounded-full bg-[#C9F2E3]/60 px-1.5 py-0.2 text-[10px] text-[#05966B]">
              {activeUsersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("soft_deleted")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === "soft_deleted"
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            <span>Đã xóa mềm</span>
            <span className="rounded-full bg-rose-200 px-1.5 py-0.2 text-[10px] text-rose-900">
              {softDeletedUsersCount}
            </span>
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#4B665D]">
            <HugeiconsIcon icon={Search01Icon} size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full rounded-xl border border-[#C9F2E3] bg-white py-2 pl-9 pr-4 text-xs font-medium text-[#0B1F1A] placeholder:text-neutral-400 focus:border-[#10D9A3] focus:outline-none focus:ring-2 focus:ring-[#10D9A3]/20"
          />
        </div>
      </section>

      {/* Bảng danh sách Người dùng */}
      <section aria-label="Bảng danh sách người dùng" className="overflow-hidden rounded-2xl border border-[#C9F2E3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0B1F1A]">
            <thead className="bg-[#E8FBF4]/60 border-b border-[#C9F2E3] text-[11px] font-bold text-[#05966B] uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Người dùng
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Vai trò toàn cục
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((user) => {
                const isActive = user.status === "active";
                const isCurrent = user.id === currentAdmin?.id;

                return (
                  <tr key={user.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 font-bold text-[#0B1F1A]">
                          {user.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0B1F1A]">
                              {user.displayName}
                            </span>
                            {isCurrent && (
                              <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] font-bold text-neutral-600">
                                Bạn
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#4B665D]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-800">
                          <HugeiconsIcon icon={SecurityCheckIcon} size={12} />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                          <HugeiconsIcon icon={UserIcon} size={12} />
                          <span>User</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#E8FBF4] px-2.5 py-1 text-[11px] font-bold text-[#05966B]">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                          <HugeiconsIcon icon={UserRemove01Icon} size={12} />
                          <span>Đã xóa mềm</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-[11px] text-[#4B665D]">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isCurrent ? (
                        <span className="text-[11px] italic text-neutral-400">
                          Không thể tự xóa
                        </span>
                      ) : isActive ? (
                        <button
                          type="button"
                          onClick={() => setSelectedUserToArchive(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <HugeiconsIcon icon={UserRemove01Icon} size={14} />
                          <span>Xóa mềm</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRestoreUser(user.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#05966B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#05966B]/90 transition-colors"
                        >
                          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
                          <span>Khôi phục</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Xóa Mềm Người Dùng */}
      {selectedUserToArchive && (
        <ArchiveUserModal
          isOpen={Boolean(selectedUserToArchive)}
          onClose={() => setSelectedUserToArchive(null)}
          user={selectedUserToArchive}
          ownedActiveRooms={userOwnedActiveRooms}
          eligibleAdmins={eligibleAdmins}
          onConfirmArchiveUser={onArchiveUser}
        />
      )}
    </div>
  );
}
