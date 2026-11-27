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
    if (data.token && typeof window !== "undefined") {
      localStorage.setItem("admin_token", data.token);
    }
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

export interface AdminProfile {
  email: string;
  name: string;
  phone: string;
  title: string;
  specialization: string;
  role: string;
  createdAt?: string;
}

export const getAdminProfile = async (): Promise<AdminProfile> => {
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to load profile");
  return data.profile;
};

export const updateAdminProfile = async (payload: {
  name: string;
  phone?: string;
  title?: string;
  specialization?: string;
}): Promise<AdminProfile> => {
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to update profile");
  return data.profile;
};

export const requestPasswordChangeOtp = async (currentPassword: string): Promise<string> => {
  const res = await fetch(`${API_URL}/auth/change-password/request-otp`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to send 2FA verification code");
  return data.message;
};

export const confirmPasswordChange = async (otp: string, newPassword: string): Promise<string> => {
  const res = await fetch(`${API_URL}/auth/change-password/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to change password");
  return data.message;
};
