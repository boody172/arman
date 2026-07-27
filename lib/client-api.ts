"use client";

const TOKEN_KEY = "sawty_admin_token";

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getStoredToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(init.headers || {}),
    },
  });
  if (res.status === 401) {
    throw new Error("التوكن غلط أو مش موجود. حدّثه من الأعلى.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `حصل خطأ (${res.status})`);
  }
  return res.json();
}
