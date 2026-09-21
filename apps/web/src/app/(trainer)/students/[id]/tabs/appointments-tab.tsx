'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { cancelAppointment, completeAppointment, createAppointment, listUpcomingAppointments } from '@/lib/api/appointments';
import { ApiError } from '@/lib/api-client';
import type { AppointmentType } from '@fithub/shared-types';

const TYPE_LABEL: Record<AppointmentType, string> = {
  ASSESSMENT: 'Avaliação',
  CONSULTATION: 'Consulta',
  WORKOUT_SESSION: 'Sessão de treino',
  OTHER: 'Outro',
};

export function AppointmentsTab({ studentId }: { studentId: string }) {
  // janela ampla o suficiente pra listar tudo relevante deste aluno específico
  const all = useApiData(() => listUpcomingAppointments(24 * 365));
  const appointments = { ...all, data: all.data?.filter((a) => a.studentId === studentId) };
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setError(null);
    try {
      await cancelAppointment(id);
      all.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cancelar.');
    }
  }

  async function handleComplete(id: string) {
    setError(null);
    try {
      await completeAppointment(id);
      all.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível concluir.');
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Compromissos"
          action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : 'Agendar'}</Button>}
        />
        <CardBody>
          <Alert>{error}</Alert>
          {appointments.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
          {appointments.data?.length === 0 && <p className="text-sm text-slate-400">Nenhum compromisso.</p>}
          <ul className="divide-y divide-slate-100">
            {appointments.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{TYPE_LABEL[a.type]}</span>
                  <span className="ml-2 text-slate-500">{new Date(a.scheduledAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={a.status === 'COMPLETED' ? 'success' : a.status === 'NO_SHOW' ? 'danger' : 'neutral'}>
                    {a.status}
                  </Badge>
                  {a.status === 'SCHEDULED' && (
                    <>
                      <Button variant="secondary" onClick={() => handleComplete(a.id)}>
                        Concluir
                      </Button>
                      <Button variant="ghost" onClick={() => handleCancel(a.id)}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {showForm && (
        <NewAppointmentForm
          studentId={studentId}
          onCreated={() => {
            setShowForm(false);
            all.refetch();
          }}
        />
      )}
    </div>
  );
}

function NewAppointmentForm({ studentId, onCreated }: { studentId: string; onCreated: () => void }) {
  const [type, setType] = useState<AppointmentType>('CONSULTATION');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createAppointment({
        studentId,
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível agendar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Agendar compromisso" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>{error}</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo">
              <Select value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data e hora">
              <Input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </Field>
            <Field label="Duração (min)">
              <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </Field>
          </div>
          <Field label="Observações">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Agendando…' : 'Agendar'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
