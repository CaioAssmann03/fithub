'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getCurrentUser } from '@/lib/token-storage';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

const HOME_BY_ROLE: Record<string, string> = {
  PERSONAL_TRAINER: '/dashboard',
  PLATFORM_ADMIN: '/admin',
  STUDENT: '/checkin',
};

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const tenantId = params.get('tenantId') ?? undefined;

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password, tenantId);
      const user = getCurrentUser();
      router.push(user ? (HOME_BY_ROLE[user.role] ?? '/') : '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-brand-700">FitHub</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {tenantId ? 'Login do aluno' : 'Entrar no painel'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Alert>{error}</Alert>
          <Field label="E-mail">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        {!tenantId && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Ainda não tem conta?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              Cadastre seu negócio
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
