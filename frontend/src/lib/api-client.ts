/**
 * API Client
 *
 * Security model:
 * - Access token: read from in-memory Zustand store (never localStorage)
 * - Refresh token: HttpOnly cookie — sent automatically by the browser
 * - credentials: 'include' — required for cookies to be sent cross-origin
 *
 * Token refresh flow:
 * - On 401, automatically calls /auth/refresh (which uses the HttpOnly cookie)
 * - On success, updates the in-memory access token and retries the request
 * - On failure, calls logout() to clear state
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Get access token from Zustand store (memory only) */
function getAccessToken(): string | null {
  try {
    // Access the store outside React using getState()
    const { useAuthStore } = require('@/store/auth.store') as typeof import('@/store/auth.store');
    return useAuthStore.getState().accessToken;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // Send HttpOnly refresh token cookie
    });
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Make sure the backend is running.',
      0,
    );
  }

  // Auto-refresh on 401 (once)
  if (res.status === 401 && !isRetry && path !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json() as {
          data?: { accessToken?: string };
          accessToken?: string;
        };
        const newToken =
          refreshJson?.data?.accessToken ?? refreshJson?.accessToken;

        if (newToken) {
          // Update in-memory store
          const { useAuthStore } = require('@/store/auth.store') as typeof import('@/store/auth.store');
          useAuthStore.getState().setAccessToken(newToken);
          // Retry original request with new token
          return request<T>(path, options, true);
        }
      }
    } catch {
      // Refresh failed — force logout
      const { useAuthStore } = require('@/store/auth.store') as typeof import('@/store/auth.store');
      useAuthStore.getState().logout();
    }
  }

  // Parse JSON
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    if (res.ok) return undefined as T;
  }

  if (!res.ok || json['success'] === false) {
    const err = (json['error'] as Record<string, unknown>) ?? {};
    throw new ApiError(
      (err['code'] as string) ?? 'UNKNOWN_ERROR',
      (err['message'] as string) ?? `Request failed with status ${res.status}`,
      res.status,
      err['details'],
    );
  }

  return ('data' in json ? json['data'] : json) as T;
}

export const apiClient = {
  get:    <T>(path: string)                => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)               => request<T>(path, { method: 'DELETE' }),
};
