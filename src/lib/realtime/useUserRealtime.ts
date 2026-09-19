"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export interface UseUserRealtimeOptions {
  userId: string;
  onDataChange: () => void;
  enabled?: boolean;
}

/**
 * Custom hook to subscribe to real-time changes for a specific user.
 * Conforms to docs/05-realtime.md private topic user:{userId}.
 * Listens for fund contributions and payment confirmations.
 */
export function useUserRealtime({
  userId,
  onDataChange,
  enabled = true,
}: UseUserRealtimeOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(onDataChange);

  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const triggerUpdate = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        callbackRef.current();
      }, 300);
    };

    const channelName = `user:${userId}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    // 1. Fund contribution changes for this user
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "fund_contributions",
        filter: `contributor_id=eq.${userId}`,
      },
      triggerUpdate
    );

    // 2. Payments table changes
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "payments",
      },
      triggerUpdate
    );

    channel.subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, enabled]);
}
