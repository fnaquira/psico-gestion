import type { AuthPayload } from "../../../shared/types.js";

const TOKEN_KEY = "pg_token";

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function parseJwt(token: string): AuthPayload | null {
  try {
    const base64 = token.split(".")[1];
    const decoded = JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded as AuthPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJwt(token);
    if (!payload) return true;
    const exp = (payload as any).exp;
    if (!exp) return false;
    return Date.now() / 1000 > exp;
  } catch {
    return true;
  }
}
