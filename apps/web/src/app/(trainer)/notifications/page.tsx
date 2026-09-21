'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApiData } from '@/lib/use-api-data';
import { listNotifications, markNotificationRead } from '@/lib/api/notifications';

const TYPE_LABEL: Record<string, string> = {
  STUDENT_CREATED: 'Novo aluno cadastrado',
  WORKOUT_ASSIGNED: 'Treino publicado',
  FEEDBACK_THRESHOLD_ALERT: 'Alerta de check-in',
  APPOINTMENT_SCHEDULED: 'Compromisso agendado',
  REFRESH_TOKEN_REUSE_DETECTED: 'Alerta de segurança',
};

export default function NotificationsPage() {
  const notifications = useApiData(listNotifications);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    notifications.refetch();
  }

  return (
    <div>
      <PageHeader title="Notificações" />
      <Card>
        {notifications.isLoading && <p className="p-5 text-sm text-slate-400">Carregando…</p>}
        {notifications.data?.length === 0 && <p className="p-5 text-sm text-slate-400">Nenhuma notificação.</p>}
        <ul className="divide-y divide-slate-100">
          {notifications.data?.map((n) => (
            <li key={n.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{TYPE_LABEL[n.type] ?? n.type}</span>
                <span className="ml-2 text-slate-400">{new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-500">
                  {JSON.stringify(n.payload, null, 0)}
                </pre>
              </div>
              <div className="flex items-center gap-2">
                {n.status !== 'READ' ? (
                  <>
                    <Badge tone="brand">Não lida</Badge>
                    <Button variant="secondary" onClick={() => handleMarkRead(n.id)}>
                      Marcar como lida
                    </Button>
                  </>
                ) : (
                  <Badge>Lida</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
