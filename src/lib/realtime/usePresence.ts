import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface PresenceState {
  userId: string;
  name: string;
  roomId?: string | null;
  roomName?: string | null;
  isOnline: boolean;
  joinedAt: number;
}

export function usePresence(
  currentUser: { id: string; name: string } | null,
  currentRoom?: { id: string; name: string } | null,
  onDuplicateSession?: () => void
) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});
  const [myJoinTime] = useState(() => Date.now());

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const users: Record<string, PresenceState> = {};
        
        for (const [key, presenceData] of Object.entries(state)) {
          if (presenceData && presenceData.length > 0) {
            // Check for duplicate sessions for current user
            if (key === currentUser.id && presenceData.length > 1) {
              const hasNewerSession = presenceData.some(p => p.joinedAt > myJoinTime);
              if (hasNewerSession && onDuplicateSession) {
                onDuplicateSession();
                return; // Stop processing to allow logout
              }
            }
            
            // Get the most recent presence state for this user (sort by joinedAt desc)
            const sorted = [...presenceData].sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
            users[key] = sorted[0];
          }
        }
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [key]: newPresences[0] as unknown as PresenceState,
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUser.id,
            name: currentUser.name,
            roomId: currentRoom?.id ?? null,
            roomName: currentRoom?.name ?? null,
            isOnline: true,
            joinedAt: myJoinTime,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, currentRoom?.id, currentRoom?.name]);

  return onlineUsers;
}
