"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { mockRepository } from "@/mocks/repository";
import { useAuthMock } from "@/context/AuthMockContext";
import type { Room, User } from "@/types/domain";
import { UsersManagementTab } from "@/modules/admin/presentation/UsersManagementTab";
import { RoomsManagementTab } from "@/modules/admin/presentation/RoomsManagementTab";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  ShieldAlertIcon,
  SecurityCheckIcon,
  UserGroupIcon,
  Folder01Icon,
  Home01Icon,
  Login01Icon,
} from "@hugeicons/core-free-icons";

type SettingsTab = "users" | "rooms";

export default function SettingsPage() {
  const { currentUser, isAuthenticated, setRole } = useAuthMock();
  const [activeTab, setActiveTab] = useState<SettingsTab>("users");

  // In-memory state cho users và rooms để phục vụ phản hồi UI tức thì
  const [usersList, setUsersList] = useState<User[]>(() =>
    [...mockRepository.listUsers()],
  );

  const [roomsList, setRoomsList] = useState<Room[]>(() =>
    [...mockRepository.listRooms()],
  );

  // Map tra cứu Users
  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    usersList.forEach((u) => {
      map.set(u.id, u);
    });
    return map;
  }, [usersList]);

  // Kiểm tra quyền Admin
  const isAdmin = Boolean(currentUser && currentUser.role === "admin");

  // Handler: Xóa mềm người dùng
  const handleArchiveUser = (userId: string, replacementAdminId?: string) => {
    // 1. Chuyển giao các phòng active của user nếu có admin thay thế
    if (replacementAdminId) {
      setRoomsList((prev) =>
        prev.map((r) =>
          r.ownerId === userId && r.status === "active"
            ? { ...r, ownerId: replacementAdminId, updatedAt: new Date().toISOString() }
            : r,
        ),
      );
    }

    // 2. Chuyển trạng thái user sang soft_deleted
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: "soft_deleted" as const, updatedAt: new Date().toISOString() }
          : u,
      ),
    );
  };

  // Handler: Khôi phục người dùng
  const handleRestoreUser = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: "active" as const, updatedAt: new Date().toISOString() }
          : u,
      ),
    );
  };

  // Handler: Lưu trữ phòng họp
  const handleArchiveRoom = (roomId: string) => {
    setRoomsList((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, status: "archived" as const, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
  };

  // Handler: Khôi phục phòng họp
  const handleRestoreRoom = (roomId: string) => {
    setRoomsList((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, status: "active" as const, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
  };

  // Trường hợp KHÔNG PHẢI ADMIN: Chặn truy cập (403 Forbidden)
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        {/* Container: Bo góc 24px (rounded-3xl), padding 32px (p-8) */}
        <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 mb-6">
            <HugeiconsIcon icon={ShieldAlertIcon} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F1A] mb-2">
            Truy cập bị từ chối (403 Forbidden)
          </h1>
          <p className="text-sm text-[#4B665D] mb-6">
            Trang Cài đặt hệ thống chỉ dành riêng cho tài khoản có quyền{" "}
            <strong className="text-rose-700">Quản trị viên (Global Admin)</strong>. Tài khoản hiện tại của bạn không đủ đặc quyền để truy cập dữ liệu này.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <HugeiconsIcon icon={Home01Icon} size={18} />
              <span>Về trang chủ</span>
            </Link>

            <button
              type="button"
              onClick={() => setRole("admin")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-purple-800"
            >
              <HugeiconsIcon icon={SecurityCheckIcon} size={18} />
              <span>Chuyển sang vai trò Admin</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Trường hợp ADMIN: Render giao diện quản trị đầy đủ
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      {/* Header Trang Admin */}
      <section aria-labelledby="settings-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#C9F2E3] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
              <HugeiconsIcon icon={Settings01Icon} size={18} />
            </span>
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
              Global Admin
            </span>
          </div>
          <h1 id="settings-title" className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0B1F1A]">
            Cài đặt & Quản trị Hệ thống
          </h1>
          <p className="text-sm text-[#4B665D] mt-1">
            Quản trị vòng đời tài khoản người dùng, toàn bộ phòng họp và khôi phục dữ liệu lưu trữ.
          </p>
        </div>

        {/* Tabs điều hướng cấp cao: Người dùng vs Phòng họp */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "users"
                ? "bg-white text-[#05966B] shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            <HugeiconsIcon icon={UserGroupIcon} size={16} />
            <span>Người dùng ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rooms")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              activeTab === "rooms"
                ? "bg-white text-[#05966B] shadow-xs"
                : "text-[#4B665D] hover:text-[#0B1F1A]"
            }`}
          >
            <HugeiconsIcon icon={Folder01Icon} size={16} />
            <span>Phòng họp ({roomsList.length})</span>
          </button>
        </div>
      </section>

      {/* Nội dung Tab 1: Quản lý Người dùng */}
      {activeTab === "users" && (
        <UsersManagementTab
          users={usersList}
          rooms={roomsList}
          currentAdmin={currentUser}
          onArchiveUser={handleArchiveUser}
          onRestoreUser={handleRestoreUser}
        />
      )}

      {/* Nội dung Tab 2: Quản lý Phòng họp */}
      {activeTab === "rooms" && (
        <RoomsManagementTab
          rooms={roomsList}
          usersMap={usersMap}
          onArchiveRoom={handleArchiveRoom}
          onRestoreRoom={handleRestoreRoom}
        />
      )}
    </main>
  );
}
