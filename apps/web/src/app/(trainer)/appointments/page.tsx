'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { useApiData } from '@/lib/use-api-data';
import { cancelAppointment, completeAppointment, listUpcomingAppointments } from '@/lib/api/appointments';
import { listStudents } from '@/lib/api/students';
import { ApiError } from '@/lib/api-client';
import type { AppointmentType } from '@fithub/shared-types';

const TYPE_LABEL: Record<AppointmentType, string> = {
  ASSESSMENT: 'Avaliação',
  CONSULTATION: 'Consulta',
  WORKOUT_SESSION: 'Sessão de treino',
  OTHER: 'Outro',
};

export default function AppointmentsPage() {
  const [hours, setHours] = useState(168);
  const appointments = useApiData(() => listUpcomingAppointments(hours), [hours]);
  const students = useApiData(() => listStudents());
  const [error, setError] = useState<string | null>(null);

  const studentName = (id: string) => students.data?.find((s) => s.id === id)?.name ?? id;

  async function handleCancel(id: string) {
    setError(null);
    try {
      await cancelAppointment(id);
      appointments.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cancelar.');
    }
  }

  async function handleComplete(id: string) {
    setError(null);
    try {
      await completeAppointment(id);
      appointments.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível concluir.');
    }
  }

  return (
    <div>
      <PageHeader title="Agenda" description="Próximos compromissos de todos os alunos" />

      <div className="mb-4">
        <Select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="max-w-48">
          <option value={24}>Próximas 24h</option>
          <option value={168}>Próximos 7 dias</option>
          <option value={720}>Próximos 30 dias</option>
        </Select>
      </div>

      <Card>
        <div className="p-5">
          <Alert>{error}</Alert>
        </div>
        {appointments.isLoading && <p className="p-5 text-sm text-slate-400">Carregando…</p>}
        {appointments.data?.length === 0 && <p className="p-5 text-sm text-slate-400">Nenhum compromisso.</p>}
        <ul className="divide-y divide-slate-100">
          {appointments.data?.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <Link href={`/students/${a.studentId}`} className="font-medium text-brand-700 hover:underline">
                  {studentName(a.studentId)}
                </Link>
                <span className="ml-2 text-slate-500">{TYPE_LABEL[a.type]}</span>
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
      </Card>
    </div>
  );
}
