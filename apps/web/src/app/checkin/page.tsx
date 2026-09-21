'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { submitFeedback } from '@/lib/api/feedback';
import { listNotifications, markNotificationRead } from '@/lib/api/notifications';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const SCALES = [
  { key: 'generalRating', label: 'Como você se sente hoje, no geral?' },
  { key: 'muscleSoreness', label: 'Dor muscular' },
  { key: 'difficulty', label: 'Dificuldade do último treino' },
  { key: 'mood', label: 'Humor' },
  { key: 'energy', label: 'Energia' },
  { key: 'sleepQuality', label: 'Qualidade do sono' },
] as const;

const NOTIFICATION_LABEL: Record<string, string> = {
  WORKOUT_ASSIGNED: 'Você recebeu um novo treino!',
  APPOINTMENT_SCHEDULED: 'Você tem um novo compromisso agendado.',
};

export default function CheckinPage() {
  const { logout } = useAuth();
  const notifications = useApiData(listNotifications);
  const [scales, setScales] = useState<Record<string, number>>({});
  const [waterIntakeL, setWaterIntakeL] = useState('');
  const [selfReportedWeightKg, setSelfReportedWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await submitFeedback({
        ...scales,
        waterIntakeL: waterIntakeL ? Number(waterIntakeL) : undefined,
        selfReportedWeightKg: selfReportedWeightKg ? Number(selfReportedWeightKg) : undefined,
        notes: notes || undefined,
      });
      setSuccess(true);
      setScales({});
      setWaterIntakeL('');
      setSelfReportedWeightKg('');
      setNotes('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Check-in"
        description="Conte pro seu personal como você está"
        action={
          <Button variant="ghost" onClick={logout}>
            Sair
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert>{error}</Alert>
            {success && <Alert tone="success">Check-in enviado com sucesso!</Alert>}

            {SCALES.map(({ key, label }) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className="text-sm text-slate-500">{scales[key] ?? '—'}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={scales[key] ?? 5}
                  onChange={(e) => setScales((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full accent-brand-600"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Água ingerida hoje (L)">
                <Input type="number" step="0.1" value={waterIntakeL} onChange={(e) => setWaterIntakeL(e.target.value)} />
              </Field>
              <Field label="Peso (kg, opcional)">
                <Input
                  type="number"
                  step="0.1"
                  value={selfReportedWeightKg}
                  onChange={(e) => setSelfReportedWeightKg(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Alguma observação?">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Enviar check-in'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Avisos" />
        <CardBody>
          {notifications.data?.length === 0 && <p className="text-sm text-slate-400">Nenhum aviso novo.</p>}
          <ul className="divide-y divide-slate-100">
            {notifications.data?.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700">{NOTIFICATION_LABEL[n.type] ?? n.type}</span>
                {n.status !== 'READ' ? (
                  <button
                    onClick={() => markNotificationRead(n.id).then(notifications.refetch)}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Marcar como lida
                  </button>
                ) : (
                  <Badge>Lida</Badge>
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
