'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@fithub/shared-types';
import { useAuth } from '@/lib/auth-context';

export function RequireRole({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== role) {
      router.replace('/');
    }
  }, [user, isLoading, role, router]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Carregando…</div>
    );
  }

  return <>{children}</>;
}
