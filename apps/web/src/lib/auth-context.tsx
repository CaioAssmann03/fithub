'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@fithub/shared-types';
import { getCurrentUser, setTokens, clearTokens } from './token-storage';
import { login as loginRequest } from './api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, tenantId?: string) => {
    const { accessToken, refreshToken } = await loginRequest({ email, password, tenantId });
    setTokens(accessToken, refreshToken);
    setUser(getCurrentUser());
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
