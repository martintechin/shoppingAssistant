const AUTH_TOKEN_KEY = "shoppingassistant_auth_token";
const AUTH_EXPIRED_EVENT = "auth:expired";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export function getAuthToken(): string | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearAuthToken();
      return null;
    }
  } catch {
    clearAuthToken();
    return null;
  }

  return token;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function onAuthExpired(callback: () => void): () => void {
  window.addEventListener(AUTH_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, callback);
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("X-Auth-Token", token);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  return response;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** authFetch + JSON + unified error extraction for all API calls. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await authFetch(`${API_BASE}/${path}`, options);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      data?.error || `Förfrågan misslyckades (${response.status})`,
      response.status,
      data
    );
  }
  return response.json() as Promise<T>;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function apiDelete<T>(path: string, id: string): Promise<T> {
  return apiRequest<T>(`${path}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
