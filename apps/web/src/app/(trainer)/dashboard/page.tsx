'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { getDashboardStats } from '@/lib/api/dashboard';
import { listUpcomingAppointments } from '@/lib/api/appointments';
import { listNotifications } from '@/lib/api/notifications';

const APPOINTMENT_TYPE_LABEL: Record<string, string> = {
  ASSESSMENT: 'Avaliação',
  CONSULTATION: 'Consulta',
  WORKOUT_SESSION: 'Sessão de treino',
  OTHER: 'Outro',
};

export default function DashboardPage() {
  const stats = useApiData(getDashboardStats);
  const appointments = useApiData(() => listUpcomingAppointments(168));
  const notifications = useApiData(listNotifications);

  const unread = notifications.data?.filter((n) => n.status !== 'READ').length ?? 0;

  return (
    <div>
      <PageHeader title="Painel" description="Visão geral do seu negócio" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Alunos ativos</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.data?.activeStudentCount ?? '—'}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Compromissos nos próximos 7 dias</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{appointments.data?.length ?? '—'}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Notificações não lidas</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{unread}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Próximos compromissos"
          action={
            <Link href="/appointments" className="text-sm font-medium text-brand-600 hover:underline">
              Ver agenda
            </Link>
          }
        />
        <CardBody>
          {appointments.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
          {appointments.data?.length === 0 && (
            <p className="text-sm text-slate-400">Nenhum compromisso nos próximos 7 dias.</p>
          )}
          <ul className="divide-y divide-slate-100">
            {appointments.data?.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {APPOINTMENT_TYPE_LABEL[a.type] ?? a.type}
                  </p>
                  <p className="text-sm text-slate-500">{new Date(a.scheduledAt).toLocaleString('pt-BR')}</p>
                </div>
                <Badge tone="brand">{a.status}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
