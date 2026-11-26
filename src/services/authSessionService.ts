const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface AuthSessionUser {
  id?: string;
  email: string;
  role: string;
  name?: string;
}

export const getAuthMe = async (): Promise<AuthSessionUser | null> => {
  try {
    let res = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (res.status === 401 || res.status === 403) {
      const refreshed = await refreshAuthSession();
      if (!refreshed) return null;
      res = await fetch(`${API_URL}/auth/me`, {
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
    const res = await fetch(`${API_URL}/auth/refresh`, {
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
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best-effort cookie clear
  }
};
