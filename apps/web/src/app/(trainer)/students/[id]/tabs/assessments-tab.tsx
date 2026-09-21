'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { createAssessment, listAssessmentsByStudent } from '@/lib/api/assessments';
import { ApiError } from '@/lib/api-client';
import { formatDateOnly, todayDateOnly } from '@/lib/date-utils';

const BMI_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  NORMAL: 'success',
  UNDERWEIGHT: 'warning',
  OVERWEIGHT: 'warning',
  OBESE: 'danger',
};

export function AssessmentsTab({ studentId }: { studentId: string }) {
  const assessments = useApiData(() => listAssessmentsByStudent(studentId), [studentId]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Histórico de avaliações"
          action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : 'Nova avaliação'}</Button>}
        />
        <CardBody>
          {assessments.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
          {assessments.data?.length === 0 && <p className="text-sm text-slate-400">Nenhuma avaliação registrada.</p>}
          <ul className="divide-y divide-slate-100">
            {assessments.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-500">{formatDateOnly(a.date)}</span>
                <span className="font-medium text-slate-900">{a.weightKg} kg</span>
                <Badge tone={BMI_TONE[a.bmi.classification] ?? 'neutral'}>
                  IMC {a.bmi.value.toFixed(1)}
                </Badge>
                <span className="text-slate-600">{a.bodyFatPercent ? `${a.bodyFatPercent}% gordura` : '—'}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {showForm && (
        <NewAssessmentForm
          studentId={studentId}
          onCreated={() => {
            setShowForm(false);
            assessments.refetch();
          }}
        />
      )}
    </div>
  );
}

function NewAssessmentForm({ studentId, onCreated }: { studentId: string; onCreated: () => void }) {
  const [assessedAt, setAssessedAt] = useState(todayDateOnly());
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFatPercentManual, setBodyFatPercentManual] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createAssessment({
        studentId,
        assessedAt,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        bodyFatPercentManual: bodyFatPercentManual ? Number(bodyFatPercentManual) : undefined,
        bodyFatMethod: bodyFatPercentManual ? 'MANUAL' : undefined,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível registrar a avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Nova avaliação" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>{error}</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data">
              <Input type="date" required value={assessedAt} onChange={(e) => setAssessedAt(e.target.value)} />
            </Field>
            <Field label="Peso (kg)">
              <Input type="number" step="0.1" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </Field>
            <Field label="Altura (cm)">
              <Input type="number" step="0.1" required value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </Field>
            <Field label="% gordura (manual, opcional)">
              <Input
                type="number"
                step="0.1"
                value={bodyFatPercentManual}
                onChange={(e) => setBodyFatPercentManual(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Observações">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Registrar avaliação'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
