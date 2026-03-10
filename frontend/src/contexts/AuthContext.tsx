"use client";
import React, { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  user: { username: string; role: string } | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock login state for direct access
  const mockContextValue = {
    user: { username: "Guest", role: "admin" },
    token: "mock-token",
    isLoading: false,
    login: async () => {},
    logout: () => {},
  };

  return (
    <AuthContext.Provider value={mockContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
