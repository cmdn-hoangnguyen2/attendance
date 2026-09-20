"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Auth0Provider, useUser } from "@auth0/nextjs-auth0/client";
import type { User } from "@/types/domain";
import { userRepository } from "@/lib/repository";

export type MockRole = "guest" | "user" | "owner" | "admin";

export interface AuthContextType {
  currentUser: User | null;
  currentRole: MockRole;
  setRole: (role: MockRole) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
  isMockActive: boolean;
  isLoading?: boolean;
}

// Deterministic seed users matching supabase/migrations/20260919000003_seed_data.sql
const SEED_USERS_BY_ROLE: Record<MockRole, User | null> = {
  admin: {
    id: "00000000-0000-0000-0000-000000000001",
    auth0Subject: "auth0|admin-primary",
    email: "nvhoang2012002@gmail.com",
    displayName: "Hoang Nguyen",
    role: "admin",
    status: "active",
    createdAt: "2026-01-02T01:00:00.000Z",
    updatedAt: "2026-01-02T01:00:00.000Z",
  },
  owner: {
    id: "00000000-0000-0000-0000-000000000003",
    auth0Subject: "auth0|owner-lan",
    email: "lan.nguyen@example.com",
    displayName: "Lan Nguyen",
    role: "user",
    status: "active",
    createdAt: "2026-01-03T02:00:00.000Z",
    updatedAt: "2026-01-03T02:00:00.000Z",
  },
  user: {
    id: "00000000-0000-0000-0000-000000000004",
    auth0Subject: "auth0|member-minh",
    email: "minh.tran@example.com",
    displayName: "Minh Tran",
    role: "user",
    status: "active",
    createdAt: "2026-01-04T02:00:00.000Z",
    updatedAt: "2026-01-04T02:00:00.000Z",
  },
  guest: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// 1. Mock Auth Provider (for local development & offline testing)
// ============================================================================
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<MockRole>("admin");
  const [liveUsers, setLiveUsers] = useState<User[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveUsers() {
      try {
        const fetched = await userRepository.listAll({ includeArchived: true });
        if (isMounted && fetched.length > 0) {
          setLiveUsers(fetched);
        }
      } catch (err) {
        console.warn("Could not fetch live users for AuthMock, using seed constants:", err);
      }
    }
    loadLiveUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentUser = useMemo<User | null>(() => {
    const fallback = SEED_USERS_BY_ROLE[currentRole];
    if (!fallback) return null;

    const live = liveUsers.find((u) => u.email === fallback.email || u.id === fallback.id);
    return live ?? fallback;
  }, [currentRole, liveUsers]);

  const login = useCallback(() => {
    setCurrentRole("user");
  }, []);

  const logout = useCallback(() => {
    setCurrentRole("guest");
  }, []);

  const value: AuthContextType = {
    currentUser,
    currentRole,
    setRole: setCurrentRole,
    isAuthenticated: currentRole !== "guest" && currentUser !== null,
    isAdmin: currentRole === "admin",
    login,
    logout,
    isMockActive: true,
    isLoading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// 2. Real Auth0 Provider (production & real testing via @auth0/nextjs-auth0)
// ============================================================================
function RealAuthProviderInner({ children }: { children: React.ReactNode }) {
  const { user: auth0User, isLoading: isAuth0Loading } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncAndFetchUser() {
      if (!auth0User || !auth0User.sub) {
        if (isMounted) setDbUser(null);
        return;
      }

      setIsSyncing(true);
      try {
        // Find existing user by auth0Subject
        let existing = await userRepository.findByAuth0Subject(auth0User.sub);

        // Fallback secondary lookup by email if not found
        if (!existing && auth0User.email) {
          existing = await userRepository.findByEmail(auth0User.email);
        }

        // If not found yet (beforeSessionSaved delay), onboard user directly
        if (!existing && auth0User.email) {
          const roleClaim = auth0User["https://diemdanh.cmdn/role"] as string | undefined;
          const role: "admin" | "user" = roleClaim === "admin" ? "admin" : "user";
          existing = await userRepository.createOrSync({
            auth0Subject: auth0User.sub,
            email: auth0User.email,
            displayName:
              auth0User.name ||
              auth0User.nickname ||
              auth0User.email.split("@")[0] ||
              "User",
            role,
          });
        }

        if (isMounted) {
          setDbUser(existing);
        }
      } catch (err) {
        console.error("[RealAuthProvider] Error resolving user from database:", err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    syncAndFetchUser();

    return () => {
      isMounted = false;
    };
  }, [auth0User]);

  const roleClaim = (auth0User?.["https://diemdanh.cmdn/role"] as string | undefined) || dbUser?.role;
  const isAdmin = roleClaim === "admin";
  const isAuthenticated = Boolean(auth0User && dbUser && dbUser.status !== "soft_deleted");

  const currentRole: MockRole = useMemo(() => {
    if (!isAuthenticated) return "guest";
    if (isAdmin) return "admin";
    return "user";
  }, [isAuthenticated, isAdmin]);

  const login = useCallback(() => {
    // Auth0 routes trigger full-page external OIDC redirects via middleware
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/login";
  }, []);

  const logout = useCallback(() => {
    // Auth0 routes trigger full-page external OIDC redirects via middleware
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/logout";
  }, []);

  const setRole = useCallback(
    (role: MockRole) => {
      if (role === "guest") {
        logout();
      } else if (!isAuthenticated) {
        login();
      }
    },
    [isAuthenticated, login, logout]
  );

  const value: AuthContextType = {
    currentUser: dbUser,
    currentRole,
    setRole,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    isMockActive: false,
    isLoading: isAuth0Loading || isSyncing,
  };

  // Deny access if user was soft-deleted per docs/04-auth-security.md rule 5
  if (dbUser?.status === "soft_deleted") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Tài khoản tạm ngưng hoạt động</h2>
          <p className="mt-4 text-sm text-neutral-600">
            Tài khoản của bạn đã bị vô hiệu hóa hoặc chuyển sang trạng thái lưu trữ. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// 3. Main Exported Provider (Decides between Mock and Real Auth0)
// ============================================================================
export function AuthMockProvider({ children }: { children: React.ReactNode }) {
  const isMockActive = process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === "true";

  if (isMockActive) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <Auth0Provider>
      <RealAuthProviderInner>{children}</RealAuthProviderInner>
    </Auth0Provider>
  );
}

export function useAuthMock(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthMock must be used within an AuthMockProvider");
  }
  return context;
}
