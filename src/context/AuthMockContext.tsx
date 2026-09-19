"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { User } from "@/types/domain";
import { userRepository } from "@/lib/repository";

export type MockRole = "guest" | "user" | "owner" | "admin";

interface AuthMockContextType {
  currentUser: User | null;
  currentRole: MockRole;
  setRole: (role: MockRole) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
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

const AuthMockContext = createContext<AuthMockContextType | undefined>(undefined);

export function AuthMockProvider({ children }: { children: React.ReactNode }) {
  // Default to admin for convenient testing as specified in Auth0 setup
  const [currentRole, setCurrentRole] = useState<MockRole>("admin");
  const [liveUsers, setLiveUsers] = useState<User[]>([]);

  // Fetch live users from Supabase to ensure complete identity sync
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

    // Prefer live record matching email from Supabase if available
    const live = liveUsers.find((u) => u.email === fallback.email || u.id === fallback.id);
    return live ?? fallback;
  }, [currentRole, liveUsers]);

  const value: AuthMockContextType = {
    currentUser,
    currentRole,
    setRole: setCurrentRole,
    isAuthenticated: currentRole !== "guest" && currentUser !== null,
    isAdmin: currentRole === "admin",
  };

  return (
    <AuthMockContext.Provider value={value}>
      {children}
    </AuthMockContext.Provider>
  );
}

export function useAuthMock(): AuthMockContextType {
  const context = useContext(AuthMockContext);
  if (!context) {
    throw new Error("useAuthMock must be used within an AuthMockProvider");
  }
  return context;
}
