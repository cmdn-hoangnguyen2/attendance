"use client";

import React, { useState, useRef, useEffect } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useAuthMock } from "@/context/AuthMockContext";
import { notificationRepository } from "@/lib/repository/notificationRepository";
import { AppNotification } from "@/types/domain";
import { useUserRealtime } from "@/lib/realtime/useUserRealtime";

// Format time diff manually for simple display
function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
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

  // Subscribe to real-time changes
  useUserRealtime({
    userId: currentUser?.id ?? "",
    onDataChange: () => {
      if (currentUser) fetchNotifications(currentUser.id);
    },
    enabled: !!currentUser,
  });

  const fetchNotifications = async (userId: string) => {
    const data = await notificationRepository.listByUserId(userId);
    setNotifications(data);
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id);
    }
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (currentUser) {
      await notificationRepository.markAllAsRead(currentUser.id);
      fetchNotifications(currentUser.id);
    }
  };

  const handleNotifClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await notificationRepository.markAsRead(id);
      if (currentUser) fetchNotifications(currentUser.id);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 transition-colors"
        aria-label="Thông báo"
      >
        <HugeiconsIcon icon={Notification01Icon} size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[320px] md:w-[360px] origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <HugeiconsIcon icon={Tick01Icon} size={14} />
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotifClick(notif.id, notif.isRead)}
                    className={`p-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-surface transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                      {notif.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <p className="text-sm font-medium">Bạn không có thông báo nào</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
