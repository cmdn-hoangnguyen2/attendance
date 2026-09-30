"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Notification01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useAuthMock } from "@/context/AuthMockContext";
import { useUserRealtime } from "@/lib/realtime/useUserRealtime";
import { notificationRepository } from "@/lib/repository/notificationRepository";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/domain";

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export function NotificationPopover() {
  const { currentUser } = useAuthMock();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (userId: string) => {
    const data = await notificationRepository.listByUserId(userId);
    setNotifications(data);
  }, []);

  useUserRealtime({
    userId: currentUser?.id ?? "",
    onDataChange: () => {
      if (currentUser) fetchNotifications(currentUser.id);
    },
    enabled: Boolean(currentUser),
  });

  useEffect(() => {
    if (!currentUser) return;

    let isCurrentRequest = true;
    void notificationRepository.listByUserId(currentUser.id).then((data) => {
      if (isCurrentRequest) setNotifications(data);
    });

    return () => {
      isCurrentRequest = false;
    };
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedOutside =
        popoverRef.current && !popoverRef.current.contains(event.target as Node);
      if (clickedOutside) setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markAllAsRead = async () => {
    if (currentUser) {
      await notificationRepository.markAllAsRead(currentUser.id);
      fetchNotifications(currentUser.id);
    }
  };

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await notificationRepository.markAsRead(id);
      if (currentUser) fetchNotifications(currentUser.id);
    }
  };

  const notificationElements = notifications.map((notification) => {
    const notificationTime = timeAgo(notification.createdAt);

    return (
      <li className="NotificationPopover__item border-b border-border last:border-b-0" key={notification.id}>
        <button
          className={cn(
            "NotificationPopover__item-button",
            "flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-surface-subtle",
            !notification.isRead && "NotificationPopover__item-button--unread bg-primary-soft/50",
          )}
          type="button"
          onClick={() => handleNotificationClick(notification.id, notification.isRead)}
        >
          <span className="NotificationPopover__item-heading flex w-full items-start justify-between gap-4">
            <span
              className={cn(
                "NotificationPopover__item-title text-sm leading-6 text-text-primary",
                notification.isRead ? "font-medium" : "font-semibold",
              )}
            >
              {notification.title}
            </span>
            <time
              className="NotificationPopover__item-time shrink-0 text-xs leading-4 text-text-tertiary"
              dateTime={notification.createdAt}
            >
              {notificationTime}
            </time>
          </span>
          <span className="NotificationPopover__item-content line-clamp-2 text-sm leading-6 text-text-secondary">
            {notification.content}
          </span>
        </button>
      </li>
    );
  });

  const listContent = notifications.length > 0 ? (
    <ul className="NotificationPopover__list max-h-96 overflow-y-auto">{notificationElements}</ul>
  ) : (
    <div className="NotificationPopover__empty p-8 text-center">
      <p className="NotificationPopover__empty-copy text-sm leading-6 text-text-secondary">
        Bạn chưa có thông báo nào.
      </p>
    </div>
  );

  const markAllControl = unreadCount > 0 ? (
    <button
      className="NotificationPopover__mark-all inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none"
      type="button"
      onClick={markAllAsRead}
    >
      <HugeiconsIcon icon={Tick01Icon} size={16} aria-hidden />
      <span className="NotificationPopover__mark-all-label">Đánh dấu đã đọc</span>
    </button>
  ) : null;

  const unreadBadge = unreadCount > 0 ? (
    <span
      className="NotificationPopover__count absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white"
      aria-live="polite"
    >
      {unreadCount}
    </span>
  ) : null;

  const panelContent = isOpen ? (
    <section
      className="NotificationPopover__panel absolute right-0 z-50 mt-2 w-[calc(100vw-32px)] max-w-[360px] overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
      id="notification-popover"
      aria-labelledby="notification-popover-title"
    >
      <header className="NotificationPopover__header flex items-center justify-between gap-4 border-b border-border p-4">
        <h2
          className="NotificationPopover__title text-base font-semibold leading-6 text-text-primary"
          id="notification-popover-title"
        >
          Thông báo
        </h2>
        {markAllControl}
      </header>
      {listContent}
    </section>
  ) : null;

  return (
    <div className="NotificationPopover relative" ref={popoverRef}>
      <button
        className={cn(
          "NotificationPopover__trigger",
          "relative flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none",
          isOpen && "NotificationPopover__trigger--open bg-primary-soft text-primary",
        )}
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        aria-label="Thông báo"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="notification-popover"
      >
        <HugeiconsIcon icon={Notification01Icon} size={20} aria-hidden />
        {unreadBadge}
      </button>
      {panelContent}
    </div>
  );
}
