"use client";

import { useEffect, useRef } from "react";

import { supabase } from "@/lib/supabase/client";
import { subscribeUserRealtime } from "@/lib/supabase/browserAuthLifecycle.mjs";

export interface UseUserRealtimeOptions {
  userId: string;
  onDataChange: () => void;
  enabled?: boolean;
}

/** Subscribes to existing financial notifications for a specific user. */
export function useUserRealtime({
  userId,
  onDataChange,
  enabled = true,
}: UseUserRealtimeOptions) {
  const callbackRef = useRef(onDataChange);

  useEffect(() => {
    callbackRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => subscribeUserRealtime({
    userId,
    enabled,
    client: supabase,
    onDataChange: () => callbackRef.current(),
  }), [userId, enabled]);
}
