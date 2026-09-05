/**
 * API Client — thin wrapper around fetch.
 *
 * - Automatically injects the Authorization header from the auth store.
 * - Unwraps the { success, data } envelope on success.
 * - Throws a typed ApiError on failure.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    // Restore prototype chain — required when extending built-ins in TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('smartshop_auth');
    if (!raw) return null;
    return (JSON.parse(raw) as { accessToken?: string }).accessToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (networkErr) {
    throw new ApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Make sure the backend is running.',
      0,
    );
  }

  // Parse JSON — some responses (204) have no body
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    // Non-JSON response or empty body — treat as success for 2xx
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

  // Unwrap the success envelope — return data if present, otherwise full response
  return ('data' in json ? json['data'] : json) as T;
}

export const apiClient = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
};
