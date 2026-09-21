'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { listTenants, requestAssistedAccess } from '@/lib/api/admin';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function AdminPage() {
  const { logout } = useAuth();
  const tenants = useApiData(listTenants);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grantedToken, setGrantedToken] = useState<{ accessToken: string; expiresAt: string } | null>(null);

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGrantedToken(null);
    setIsSubmitting(true);
    try {
      const result = await requestAssistedAccess({ tenantId: selectedTenantId, reason: reason || undefined });
      setGrantedToken(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível conceder acesso assistido.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Platform Admin"
        description="Gestão de tenants"
        action={
          <Button variant="ghost" onClick={logout}>
            Sair
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader title="Tenants" />
        {tenants.isLoading && <p className="p-5 text-sm text-slate-400">Carregando…</p>}
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Plano</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.data?.map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-2.5 font-medium text-slate-900">{t.name}</td>
                <td className="px-5 py-2.5 text-slate-600">{t.plan}</td>
                <td className="px-5 py-2.5">
                  <Badge tone={t.status === 'ACTIVE' ? 'success' : 'danger'}>{t.status}</Badge>
                </td>
                <td className="px-5 py-2.5 text-slate-500">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader title="Acesso assistido" />
        <CardBody>
          <p className="mb-4 text-sm text-slate-500">
            Gera um token de 5 minutos pra dar suporte a um tenant específico. Toda concessão fica registrada em
            audit_logs.
          </p>
          <form onSubmit={handleRequestAccess} className="max-w-md space-y-4">
            <Alert>{error}</Alert>
            <Field label="Tenant">
              <Select required value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)}>
                <option value="">Selecione…</option>
                {tenants.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Motivo (opcional)">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Suporte ao cliente" />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Gerando…' : 'Solicitar acesso'}
            </Button>
          </form>

          {grantedToken && (
            <div className="mt-4 rounded-md bg-slate-100 p-4 text-sm">
              <p className="mb-2 text-slate-600">
                Token válido até {new Date(grantedToken.expiresAt).toLocaleTimeString('pt-BR')}:
              </p>
              <code className="block break-all text-xs text-slate-800">{grantedToken.accessToken}</code>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
