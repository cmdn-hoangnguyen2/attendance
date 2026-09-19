"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import type { User } from "@/types/domain";
import { users } from "@/mocks/fixtures";

export type MockRole = "guest" | "user" | "owner" | "admin";

interface AuthMockContextType {
  currentUser: User | null;
  currentRole: MockRole;
  setRole: (role: MockRole) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthMockContext = createContext<AuthMockContextType | undefined>(undefined);

export function AuthMockProvider({ children }: { children: React.ReactNode }) {
  // Default to admin for convenient initial testing as specified in Auth0 setup
  const [currentRole, setCurrentRole] = useState<MockRole>("admin");

  const currentUser = useMemo<User | null>(() => {
    switch (currentRole) {
      case "admin":
        // Global admin: nvhoang2012002@gmail.com
        return users.find((u) => u.id === "user-admin-primary") ?? users[0];
      case "owner":
        // Room owner: lan.nguyen@example.com
        return users.find((u) => u.id === "user-owner-lan") ?? users[2];
      case "user":
        // Regular member: minh.tran@example.com
        return users.find((u) => u.id === "user-member-minh") ?? users[3];
      case "guest":
      default:
        return null;
    }
  }, [currentRole]);

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
