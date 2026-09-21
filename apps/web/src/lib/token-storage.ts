import type { AuthUser } from '@fithub/shared-types';

const ACCESS_TOKEN_KEY = 'fithub_access_token';
const REFRESH_TOKEN_KEY = 'fithub_refresh_token';

/**
 * Tokens vivem em localStorage, não em cookie httpOnly — a API devolve
 * os dois no corpo do JSON (POST /auth/login), não os seta como cookie.
 * Decodificação do payload aqui é só pra UI (saber role/tenantId sem
 * round-trip) — a validação de verdade acontece sempre no backend.
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function decodeAccessToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  const token = getAccessToken();
  if (!token) return null;
  return decodeAccessToken(token);
}
