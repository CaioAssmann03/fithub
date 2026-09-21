'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { registerTrainer } from '@/lib/api/auth';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await registerTrainer({ email, password, tenantName });
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-brand-700">FitHub</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Cadastre seu negócio</p>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Alert>{error}</Alert>
          <Field label="Nome do negócio">
            <Input required value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Academia do João" />
          </Field>
          <Field label="Seu e-mail">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
