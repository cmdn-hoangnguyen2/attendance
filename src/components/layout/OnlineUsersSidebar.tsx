"use client";

import React, { useState, useEffect } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { usePresence } from "@/lib/realtime/usePresence";
import { useAuthMock } from "@/context/AuthMockContext";
import { userRepository } from "@/lib/repository";
import { User } from "@/types/domain";

export function OnlineUsersSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { currentUser, logout } = useAuthMock();

  // Track global presence (no specific room)
  const onlinePresenceMap = usePresence(
    currentUser ? { id: currentUser.id, name: currentUser.displayName } : null,
    null,
    () => {
      alert("Tài khoản của bạn vừa được đăng nhập ở một nơi khác. Phiên làm việc này sẽ kết thúc để đảm bảo an toàn.");
      logout();
    }
  );

  useEffect(() => {
    let mounted = true;
    userRepository.listAll().then(users => {
      if (mounted) setAllUsers(users);
    });
    return () => { mounted = false; };
  }, []);

  const mergedUsers = allUsers.map(u => {
    const presence = onlinePresenceMap[u.id];
    return {
      id: u.id,
      name: u.displayName,
      isOnline: !!presence?.isOnline,
      roomName: presence?.roomName || null,
    };
  });

  const filteredUsers = mergedUsers.filter(u => 
    u.id !== currentUser?.id && u.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Sort online first
    if (a.isOnline !== b.isOnline) {
      return b.isOnline ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  const onlineCount = Object.keys(onlinePresenceMap).filter(id => id !== currentUser?.id).length;

  return (
    <div className="flex flex-col rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden h-[600px]">
      <div className="p-6 border-b border-neutral-100 shrink-0">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Thành viên ({onlineCount} online)</h2>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
            <HugeiconsIcon icon={Search01Icon} size={16} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-neutral-300 bg-neutral-surface py-2 pl-8 pr-4 text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredUsers.map(user => (
          <div key={user.id} className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-50 p-2 rounded-xl transition-colors">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-600 border border-neutral-200">
                {user.name.charAt(0)}
              </div>
              <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-primary transition-colors">{user.name}</p>
              {user.isOnline ? (
                <p className="text-xs text-neutral-500 truncate">
                  {user.roomName ? user.roomName : 'Bên ngoài'}
                </p>
              ) : (
                <p className="text-xs text-neutral-400">Ngoại tuyến</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
