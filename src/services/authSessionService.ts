let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
if (rawApiUrl.endsWith("/")) {
  rawApiUrl = rawApiUrl.slice(0, -1);
}
if (!rawApiUrl.endsWith("/api")) {
  rawApiUrl = `${rawApiUrl}/api`;
}
const API_URL = rawApiUrl;

export interface AuthSessionUser {
  id?: string;
  email: string;
  role: string;
  name?: string;
}

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const getAuthMe = async (): Promise<AuthSessionUser | null> => {
  try {
    let res = await fetchWithTimeout(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshAuthSession();
      if (!refreshed) return null;
      res = await fetchWithTimeout(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
};

export const refreshAuthSession = async (): Promise<boolean> => {
  try {
    const res = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const logoutSession = async (): Promise<void> => {
  try {
    await fetchWithTimeout(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }, 2500);
  } catch {
    // Best-effort cookie clear
  }
};
