'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { enableStudentAccess } from '@/lib/api/students';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { Student } from '@fithub/shared-types';

export function AccessTab({ student, onUpdated }: { student: Student; onUpdated: () => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(student.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await enableStudentAccess(student.id, { email, password });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const params = new URLSearchParams({ tenantId: user?.tenantId ?? '', email });
      setShareLink(`${origin}/login?${params.toString()}`);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível habilitar o acesso.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (student.hasAppAccess && !shareLink) {
    return (
      <Card>
        <CardHeader title="Acesso ao app" />
        <CardBody>
          <p className="text-sm text-slate-600">Este aluno já tem acesso ao Painel do Aluno.</p>
        </CardBody>
      </Card>
    );
  }

  if (shareLink) {
    return (
      <Card>
        <CardHeader title="Acesso ao app" />
        <CardBody className="space-y-3">
          <p className="text-sm text-slate-600">
            Acesso criado. Compartilhe este link e a senha combinada com o aluno:
          </p>
          <code className="block break-all rounded-md bg-slate-100 p-3 text-sm text-slate-800">{shareLink}</code>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Habilitar acesso ao app" />
      <CardBody>
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          <Alert>{error}</Alert>
          <p className="text-sm text-slate-500">
            Defina um e-mail e senha para o aluno usar na tela de check-in. Não há envio automático de e-mail —
            repasse os dados diretamente.
          </p>
          <Field label="E-mail do aluno">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha inicial">
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando…' : 'Habilitar acesso'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
