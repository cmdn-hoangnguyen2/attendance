"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAuthMock } from "@/context/AuthMockContext";
import type { Room, User } from "@/types/domain";
import { UsersManagementTab } from "@/modules/admin/presentation/UsersManagementTab";
import { RoomsManagementTab } from "@/modules/admin/presentation/RoomsManagementTab";
import { roomRepository, userRepository } from "@/lib/repository";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldAlertIcon,
  SecurityCheckIcon,
  UserGroupIcon,
  Folder01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons";

type SettingsTab = "users" | "rooms";

export default function SettingsPage() {
  const { currentUser, setRole } = useAuthMock();
  const [activeTab, setActiveTab] = useState<SettingsTab>("users");
  const [isLoading, setIsLoading] = useState(true);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);

  const [refreshKey, setRefreshKey] = useState(0);

  // Load data from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [fetchedUsers, fetchedRooms] = await Promise.all([
          userRepository.listAll({ includeArchived: true }),
          roomRepository.findCatalog({ includeArchived: true }),
        ]);

        if (!isMounted) return;
        setUsersList(fetchedUsers);
        setRoomsList(fetchedRooms);
      } catch (err) {
        console.error("Failed to load settings data from Supabase:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

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
  const handleArchiveUser = async (userId: string, replacementAdminId?: string) => {
    if (!currentUser) return;
    try {
      await userRepository.archiveUser(
        userId,
        replacementAdminId ?? "",
        currentUser.id,
        "Archive this user"
      );
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to archive user:", err);
    }
  };

  // Handler: Khôi phục người dùng
  const handleRestoreUser = async (userId: string) => {
    if (!currentUser) return;
    try {
      await userRepository.restoreUser(userId, currentUser.id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to restore user:", err);
    }
  };

  // Handler: Lưu trữ phòng họp
  const handleArchiveRoom = async (roomId: string) => {
    if (!currentUser) return;
    try {
      await roomRepository.archive(roomId, currentUser.id, "Archive this room");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to archive room:", err);
    }
  };

  // Handler: Khôi phục phòng họp
  const handleRestoreRoom = async (roomId: string) => {
    if (!currentUser) return;
    try {
      await roomRepository.restore(roomId, currentUser.id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to restore room:", err);
    }
  };

  // Trường hợp người dùng không có quyền Admin
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-6">
            <HugeiconsIcon icon={ShieldAlertIcon} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F1A] mb-2">
            Từ chối truy cập (403 Forbidden)
          </h1>
          <p className="text-sm text-[#4B665D] mb-6 leading-relaxed">
            Khu vực Quản trị Hệ thống chỉ dành riêng cho tài khoản có vai trò{" "}
            <span className="font-semibold text-red-600">Global Admin</span>.
            Tài khoản hiện tại của bạn không có đủ thẩm quyền truy cập.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <HugeiconsIcon icon={Home01Icon} size={18} />
              <span>Về trang chủ</span>
            </Link>

            {/* Helper chuyển role nhanh sang Admin cho việc kiểm thử UI */}
            <button
              type="button"
              onClick={() => setRole("admin")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#05966B] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#05966B]/90 focus-visible:ring-2 focus-visible:ring-[#10D9A3]"
            >
              <HugeiconsIcon icon={SecurityCheckIcon} size={18} />
              <span>Chuyển sang vai trò Admin</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      {/* Header Trang Settings */}
      <section aria-labelledby="settings-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#C9F2E3] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-0.5 text-xs font-bold text-red-700">
              <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
              <span>Admin Console</span>
            </span>
          </div>
          <h1 id="settings-title" className="text-2xl lg:text-3xl font-bold tracking-tight text-[#0B1F1A]">
            Quản trị hệ thống (Settings)
          </h1>
          <p className="text-sm text-[#4B665D] mt-1">
            Quản lý vòng đời người dùng, giám sát phòng họp và dữ liệu lưu trữ trên Supabase.
          </p>
        </div>

        {/* Tabs Điều hướng: Users vs Rooms */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/80 w-fit self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
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
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
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

      {isLoading ? (
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-16 rounded-2xl bg-neutral-200" />
          <div className="h-64 rounded-2xl bg-neutral-100" />
        </div>
      ) : activeTab === "users" ? (
        /* Tab 1: Quản lý Users */
        <UsersManagementTab
          users={usersList}
          rooms={roomsList}
          currentAdmin={currentUser}
          onArchiveUser={handleArchiveUser}
          onRestoreUser={handleRestoreUser}
        />
      ) : (
        /* Tab 2: Quản lý Rooms */
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
