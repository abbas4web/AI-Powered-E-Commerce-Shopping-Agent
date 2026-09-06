'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/**
 * AuthProvider — silently restores the session on page load.
 *
 * On mount, calls /auth/refresh using the HttpOnly cookie.
 * If successful, sets the access token in memory.
 * If failed (cookie expired/missing), user stays logged out.
 *
 * This replaces the old localStorage persistence approach.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAccessToken, setUser, logout, setHydrated } = useAuthStore();

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const json = await res.json() as {
            data?: { accessToken?: string };
            accessToken?: string;
          };
          const token = json?.data?.accessToken ?? json?.accessToken;

          if (token) {
            setAccessToken(token);

            // Fetch user profile
            const profileRes = await fetch(`${BASE_URL}/users/me`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: 'include',
            });

            if (profileRes.ok) {
              const profileJson = await profileRes.json() as {
                data?: {
                  id: string;
                  email: string;
                  firstName: string;
                  lastName: string;
                  role: string;
                  avatarUrl: string | null;
                };
              };
              if (profileJson.data) {
                setUser(profileJson.data);
              }
            }
          }
        } else {
          // No valid refresh token — ensure clean state
          logout();
        }
      } catch {
        // Network error or backend not running — silent fail
        logout();
      } finally {
        setHydrated();
      }
    }

    restoreSession();
  }, [setAccessToken, setUser, logout, setHydrated]);

  return <>{children}</>;
}
