'use client';

import { create } from 'zustand';

/**
 * Auth store — access token in memory ONLY.
 *
 * Security model:
 * - accessToken: kept in memory (lost on page refresh — re-fetched via /auth/refresh)
 * - refreshToken: HttpOnly cookie set by the server (JS cannot read it)
 * - Nothing is persisted to localStorage or sessionStorage
 */

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: true }),

  setUser: (user) => set({ user }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),

  setHydrated: () => set({ isHydrated: true }),
}));
