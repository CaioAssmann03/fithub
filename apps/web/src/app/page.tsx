'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const HOME_BY_ROLE: Record<string, string> = {
  PERSONAL_TRAINER: '/dashboard',
  PLATFORM_ADMIN: '/admin',
  STUDENT: '/checkin',
};

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? (HOME_BY_ROLE[user.role] ?? '/login') : '/login');
  }, [user, isLoading, router]);

  return null;
}
