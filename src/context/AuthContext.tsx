"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [globalRole, setGlobalRole] = useState<"admin" | "user">("user");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const login = useCallback(() => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/login";
  }, []);
  const logout = useCallback(() => {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/logout";
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let mounted = true;
    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      setCurrentUser(null);
      setGlobalRole("user");
      try {
        const response = await fetch("/api/me", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
        if (response.status === 401) return;
        if (response.status === 403) throw new Error("Tài khoản đã được lưu trữ. Vui lòng liên hệ quản trị viên.");
        if (!response.ok) throw new Error("Không thể tải hồ sơ. Vui lòng thử lại hoặc đăng nhập lại.");
        const data = await response.json();
        if (!data.user?.id || data.user.status !== "active" || !["admin", "user"].includes(data.globalRole)) throw new Error("Hồ sơ đăng nhập không hợp lệ.");
        if (mounted) { setCurrentUser(data.user); setGlobalRole(data.globalRole); }
      } catch (cause) {
        if (mounted) setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "Không thể tải phiên đăng nhập. Vui lòng thử lại.");
      } finally {
        window.clearTimeout(timeout);
        if (mounted) setIsLoading(false);
      }
    }
    void loadProfile();
    return () => { mounted = false; window.clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
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
