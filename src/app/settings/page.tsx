"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { PageContainer } from "@/components/layout/PageContainer";

import { PillTabs, type PillTabItem } from "@/components/ui/PillTabs";

type SettingsTab = "users" | "rooms";

export default function SettingsPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading: isAuthLoading, setRole, login, isMockActive } = useAuthMock();

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

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

  // Nếu chưa đăng nhập hoặc đang tải phiên, hiển thị loader và chờ redirect về /login
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex-1 bg-neutral-50/50">
        <PageContainer as="main">
          <div className="flex flex-col gap-6 py-8 animate-pulse">
            <div className="h-12 w-64 rounded-xl bg-neutral-200" />
            <div className="h-64 rounded-2xl bg-neutral-100" />
          </div>
        </PageContainer>
      </div>
    );
  }

  // Trường hợp người dùng không có quyền Admin
  if (!isAdmin) {
    return (
      <div className="flex-1 bg-neutral-50/50">
        <PageContainer as="main" className="flex items-center justify-center py-16">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 shadow-xs text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-5">
              <HugeiconsIcon icon={ShieldAlertIcon} size={28} />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">
              Từ chối truy cập
            </h1>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Trang Quản trị chỉ dành riêng cho tài khoản có quyền Global Admin.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                <HugeiconsIcon icon={Home01Icon} size={16} />
                <span>Trang chủ</span>
              </Link>

              {isMockActive ? (
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-primary-hover hover:text-white transition-all"
                >
                  <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
                  <span>Chuyển sang Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={login}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-primary-hover hover:text-white transition-all"
                >
                  <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
                  <span>Đăng nhập tài khoản Admin</span>
                </button>
              )}
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  const tabItems: PillTabItem<SettingsTab>[] = [
    { key: "users", label: "Người dùng", icon: UserGroupIcon },
    { key: "rooms", label: "Phòng họp", icon: Folder01Icon },
  ];

  return (
    <div className="flex-1 bg-neutral-50/50">
      <PageContainer as="main">
        {/* Header Trang Settings */}
        <section aria-labelledby="settings-title" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <h1 id="settings-title" className="text-2xl font-extrabold tracking-tight text-neutral-900">
              Quản trị hệ thống
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Quản lý tài khoản người dùng và giám sát phòng họp.
            </p>
          </div>

          {/* PillTabs: Users vs Rooms */}
          <PillTabs
            tabs={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
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
      </PageContainer>
    </div>
  );
}
