"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export interface UseLobbyRealtimeOptions {
  onDataChange: () => void;
  enabled?: boolean;
}

/**
 * Custom hook to subscribe to real-time database changes for the Lobby / Catalog view.
 * Synchronizes room catalog, member count, membership changes, and join requests live.
 * Uses 300ms debounce to prevent re-fetch storms.
 */
export function useLobbyRealtime({
  onDataChange,
  enabled = true,
}: UseLobbyRealtimeOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(onDataChange);

  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!enabled) return;

    const triggerUpdate = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        callbackRef.current();
      }, 300);
    };

    const channelName = `lobby:global:${Date.now()}`;
    const channel = supabase.channel(channelName);

    // 1. Listen for changes in rooms (created, status changed, renamed)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
      },
      triggerUpdate
    );

    // 2. Listen for changes in room memberships (joined, removed, left - affects member count)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_memberships",
      },
      triggerUpdate
    );

    // 3. Listen for changes in join requests (sent, approved, rejected, canceled)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "join_requests",
      },
      triggerUpdate
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Successfully connected to lobby channel
      }
    });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
