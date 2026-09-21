'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { getMyTenancy, updateTrainerProfile } from '@/lib/api/tenancy';
import { ApiError } from '@/lib/api-client';

export default function SettingsPage() {
  const tenancy = useApiData(getMyTenancy);
  const [cref, setCref] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tenancy.data?.profile) {
      setCref(tenancy.data.profile.cref ?? '');
      setSpecialty(tenancy.data.profile.specialty ?? '');
      setBio(tenancy.data.profile.bio ?? '');
      setPhone(tenancy.data.profile.phone ?? '');
    }
  }, [tenancy.data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await updateTrainerProfile({
        cref: cref || undefined,
        specialty: specialty || undefined,
        bio: bio || undefined,
        phone: phone || undefined,
      });
      setSuccess(true);
      tenancy.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações" />

      <Card className="mb-6">
        <CardHeader title="Seu negócio" />
        <CardBody>
          {tenancy.data && (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Nome</dt>
                <dd className="font-medium text-slate-900">{tenancy.data.tenant.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Plano</dt>
                <dd>
                  <Badge tone="brand">{tenancy.data.tenant.plan}</Badge>
                </dd>
              </div>
            </dl>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Seu perfil de personal" />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert>{error}</Alert>
            {success && <Alert tone="success">Perfil atualizado com sucesso.</Alert>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="CREF">
                <Input value={cref} onChange={(e) => setCref(e.target.value)} />
              </Field>
              <Field label="Especialidade">
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              </Field>
              <Field label="Telefone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando…' : 'Salvar perfil'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
