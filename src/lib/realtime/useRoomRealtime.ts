"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export interface UseRoomRealtimeOptions {
  roomId: string;
  sessionId?: string;
  onDataChange: () => void;
  enabled?: boolean;
}

/**
 * Custom hook to subscribe to real-time database changes for a specific room.
 * Conforms to docs/05-realtime.md private topic room:{roomId}.
 * Automatically unsubscribes and cleans up channel on unmount or options change.
 */
export function useRoomRealtime({
  roomId,
  sessionId,
  onDataChange,
  enabled = true,
}: UseRoomRealtimeOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(onDataChange);

  // Keep latest callback ref
  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const triggerUpdate = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        callbackRef.current();
      }, 300);
    };

    const channelName = `room:${roomId}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    // 1. Attendance records changes
    if (sessionId) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
          filter: `meeting_session_id=eq.${sessionId}`,
        },
        triggerUpdate
      );

      // 2. Fund candidates changes
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fund_candidates",
          filter: `meeting_session_id=eq.${sessionId}`,
        },
        triggerUpdate
      );
    }

    // 3. Meeting session updates
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "meeting_sessions",
        filter: `room_id=eq.${roomId}`,
      },
      triggerUpdate
    );

    // 4. Join requests updates
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "join_requests",
        filter: `room_id=eq.${roomId}`,
      },
      triggerUpdate
    );

    // 5. Room membership changes
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_memberships",
        filter: `room_id=eq.${roomId}`,
      },
      triggerUpdate
    );

    // 6. Payment image updates
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_payment_images",
        filter: `room_id=eq.${roomId}`,
      },
      triggerUpdate
    );

    // 7. Room metadata changes (e.g. status archived, owner changed)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      triggerUpdate
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Channel connected successfully
      }
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, sessionId, enabled]);
}
