import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

let refreshPromise: Promise<boolean> | null = null;

/** Garante uma única chamada de refresh em voo mesmo se várias requisições baterem 401 ao mesmo tempo. */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        setTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })();
  }
  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Pula a lógica de refresh/redirect — usado pelo próprio fluxo de login. */
  skipAuth?: boolean;
}

/**
 * Access token de 15min expira o tempo todo numa sessão de uso normal do
 * painel — em vez de deslogar o usuário a cada expiração, tenta um
 * refresh silencioso uma vez e repete a chamada original antes de desistir.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options;

  const doFetch = (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!skipAuth) {
      const token = getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    } else {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError(401, 'Sessão expirada');
    }
  }

  if (!res.ok) {
    let parsedBody: unknown = null;
    try {
      parsedBody = await res.json();
    } catch {
      // corpo vazio ou não-JSON (ex: erro 500 cru) — segue com fallback abaixo
    }
    throw new ApiError(res.status, extractMessage(parsedBody, `Erro ${res.status}`));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
