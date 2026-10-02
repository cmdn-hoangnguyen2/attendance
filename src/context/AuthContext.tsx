"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { createBrowserAuthLifecycle } from "@/lib/supabase/browserAuthLifecycle.mjs";
import { supabase } from "@/lib/supabase/client";
import { clearSupabaseTokenCache } from "@/lib/supabase/tokenProvider";
import type { User } from "@/types/domain";

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  login: () => void;
  logout: () => void;
}
interface AuthState {
  currentUser: User | null;
  globalRole: "admin" | "user";
  isLoading: boolean;
  error: string | null;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: null,
    globalRole: "user",
    isLoading: true,
    error: null,
  });
  const lifecycleRef = useRef<ReturnType<typeof createBrowserAuthLifecycle> | null>(null);
  const retry = useCallback(() => {
    void lifecycleRef.current?.refresh();
  }, []);
  const login = useCallback(() => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/login";
  }, []);
  const logout = useCallback(() => {
    if (lifecycleRef.current) {
      lifecycleRef.current.logout();
    } else {
      clearSupabaseTokenCache();
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/logout";
  }, []);

  useEffect(() => {
    const lifecycle = createBrowserAuthLifecycle({
      client: supabase,
      eventTarget: window,
      clearTokenCache: clearSupabaseTokenCache,
      onStateChange: setAuthState,
    });
    lifecycleRef.current = lifecycle;
    void lifecycle.start();

    return () => {
      lifecycle.dispose();
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
    };
  }, []);

  const { currentUser, globalRole, isLoading, error } = authState;
  const value = { currentUser, isAuthenticated: currentUser !== null, isAdmin: currentUser !== null && globalRole === "admin", isLoading, error, retry, login, logout };
  const content = error ? (
    <main className="AuthRecovery flex min-h-screen items-center justify-center bg-canvas p-8">
      <section className="AuthRecovery__card flex max-w-lg flex-col gap-8 rounded-2xl border border-border bg-surface p-8" aria-label="Khôi phục đăng nhập">
        <p className="AuthRecovery__error text-text-primary" role="alert">{error}</p>
        <div className="AuthRecovery__actions flex flex-wrap gap-4">
          <button className="AuthRecovery__retry rounded-lg bg-primary px-4 py-2 text-white" type="button" onClick={retry}>Thử lại</button>
          <button className="AuthRecovery__logout rounded-lg border border-border px-4 py-2 text-text-primary" type="button" onClick={logout}>Đăng xuất</button>
        </div>
      </section>
    </main>
  ) : children;
  return <AuthContext.Provider value={value}>{content}</AuthContext.Provider>;
}
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
