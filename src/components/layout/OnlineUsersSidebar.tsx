"use client";

import { useEffect, useState } from "react";
import { Cancel01Icon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/Button";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { useAuthMock } from "@/context/AuthMockContext";
import { usePresence } from "@/lib/realtime/usePresence";
import { userRepository } from "@/lib/repository";
import type { User } from "@/types/domain";

export function OnlineUsersSidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentUser, logout } = useAuthMock();

  const onlinePresenceMap = usePresence(
    currentUser ? { id: currentUser.id, name: currentUser.displayName } : null,
    null,
    () => {
      alert(
        "Tài khoản của bạn vừa được đăng nhập ở một nơi khác. Phiên làm việc này sẽ kết thúc để đảm bảo an toàn.",
      );
      logout();
    },
  );

  useEffect(() => {
    let mounted = true;
    userRepository.listAll().then((users) => {
      if (mounted) setAllUsers(users);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const mergedUsers = allUsers.map((user) => {
    const presence = onlinePresenceMap[user.id];
    return {
      id: user.id,
      name: user.displayName,
      isOnline: Boolean(presence?.isOnline),
      roomName: presence?.roomName || null,
    };
  });

  const filteredUsers = mergedUsers
    .filter(
      (user) =>
        user.id !== currentUser?.id &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

  const onlineCount = Object.keys(onlinePresenceMap).filter(
    (id) => id !== currentUser?.id,
  ).length;

  const memberRows = filteredUsers.map((user) => (
    <li className="OnlineUsersSidebar__member flex items-center gap-4 rounded-md p-2" key={user.id}>
      <span className="OnlineUsersSidebar__avatar relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-subtle text-sm font-bold text-text-secondary">
        {user.name.charAt(0).toUpperCase()}
        <span
          className={`OnlineUsersSidebar__presence absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-surface ${
            user.isOnline ? "bg-success" : "bg-border-strong"
          }`}
          aria-label={user.isOnline ? "Đang online" : "Ngoại tuyến"}
        />
      </span>
      <span className="OnlineUsersSidebar__member-copy min-w-0 flex-1">
        <span className="OnlineUsersSidebar__member-name block truncate text-sm font-semibold text-text-primary">
          {user.name}
        </span>
        <span className="OnlineUsersSidebar__member-status block truncate text-xs leading-5 text-text-tertiary">
          {user.isOnline ? user.roomName || "Đang ở sảnh" : "Ngoại tuyến"}
        </span>
      </span>
    </li>
  ));

  const listContent = filteredUsers.length > 0 ? (
    <ul className="OnlineUsersSidebar__list flex flex-col gap-2">{memberRows}</ul>
  ) : (
    <p className="OnlineUsersSidebar__empty px-2 py-8 text-center text-sm leading-6 text-text-secondary">
      Không tìm thấy thành viên phù hợp.
    </p>
  );

  const renderSidebarContent = (searchId: string) => (
    <div className="OnlineUsersSidebar__content flex min-h-0 flex-col">
      <div className="OnlineUsersSidebar__search relative">
        <label className="OnlineUsersSidebar__search-label sr-only" htmlFor={searchId}>
          Tìm thành viên
        </label>
        <HugeiconsIcon
          className="OnlineUsersSidebar__search-icon pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
          icon={Search01Icon}
          size={18}
          aria-hidden
        />
        <input
          className="OnlineUsersSidebar__search-input h-12 w-full rounded-md border border-border bg-surface pl-12 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          id={searchId}
          type="search"
          placeholder="Tìm thành viên"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <div className="OnlineUsersSidebar__scroll mt-4 max-h-[480px] overflow-y-auto">
        {listContent}
      </div>
    </div>
  );

  const dialogFooter = (
    <Button className="w-full" variant="secondary" size="touch" onClick={() => setIsMobileOpen(false)}>
      Đóng
    </Button>
  );

  return (
    <div className="OnlineUsersSidebar">
      <div className="OnlineUsersSidebar__mobile-trigger min-[1440px]:hidden">
        <Button
          className="w-full"
          variant="secondary"
          size="touch"
          onClick={() => setIsMobileOpen(true)}
        >
          <span className="OnlineUsersSidebar__trigger-label flex items-center gap-2"><HugeiconsIcon icon={UserGroupIcon} size={24} aria-hidden />Thành viên online ({onlineCount})</span>
        </Button>
      </div>

      <section
        className="OnlineUsersSidebar__desktop hidden overflow-hidden rounded-lg border border-border bg-surface min-[1440px]:block"
        aria-labelledby="online-users-title"
      >
        <header className="OnlineUsersSidebar__header flex items-center justify-between gap-4 border-b border-border p-4">
          <div className="OnlineUsersSidebar__heading">
            <h2 className="OnlineUsersSidebar__title text-base font-bold text-text-primary" id="online-users-title">
              Thành viên
            </h2>
            <p className="OnlineUsersSidebar__count mt-2 text-xs text-text-secondary">
              {onlineCount} người đang online
            </p>
          </div>
          <span
            className="OnlineUsersSidebar__live-indicator flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success"
            aria-hidden
          >
            <HugeiconsIcon icon={UserGroupIcon} size={18} />
          </span>
        </header>
        <div className="OnlineUsersSidebar__desktop-body p-4">{renderSidebarContent("online-member-search-desktop")}</div>
      </section>

      <ResponsiveDialog
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        labelledBy="online-users-dialog-title"
        footer={dialogFooter}
        size="sm"
      >
        <header className="OnlineUsersSidebar__dialog-header mb-6 flex items-start justify-between gap-4">
          <div className="OnlineUsersSidebar__dialog-heading">
            <h2 className="OnlineUsersSidebar__dialog-title text-xl font-bold text-text-primary" id="online-users-dialog-title">
              Thành viên online
            </h2>
            <p className="OnlineUsersSidebar__dialog-description mt-2 text-sm leading-6 text-text-secondary">
              {onlineCount} người đang hoạt động trong cộng đồng.
            </p>
          </div>
          <button
            className="OnlineUsersSidebar__dialog-close flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none"
            type="button"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng danh sách thành viên"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
          </button>
        </header>
        {renderSidebarContent("online-member-search-dialog")}
      </ResponsiveDialog>
    </div>
  );
}
