'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { useApiData } from '@/lib/use-api-data';
import { createMicrocycle, listMicrocycles } from '@/lib/api/microcycles';
import { ApiError } from '@/lib/api-client';
import type { Microcycle } from '@fithub/shared-types';

/** Gerenciador compacto de fases de periodização (ex: "Base" 9 semanas, "Deload" 1 semana) — vive dentro da aba de Treinos, não é aba própria. */
export function MicrocycleManager({
  studentId,
  onChanged,
}: {
  studentId: string;
  onChanged?: (microcycles: Microcycle[]) => void;
}) {
  const microcycles = useApiData(() => listMicrocycles(studentId), [studentId]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const nextOrder = microcycles.data?.length ?? 0;
      await createMicrocycle(studentId, { name, order: nextOrder, weeks: Number(weeks) });
      setName('');
      setWeeks('1');
      setShowForm(false);
      microcycles.refetch();
      if (microcycles.data) onChanged?.(microcycles.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o microciclo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader
        title="Fases (microciclos)"
        action={<Button variant="secondary" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : '+ Fase'}</Button>}
      />
      <CardBody>
        {microcycles.data?.length === 0 && !showForm && (
          <p className="text-sm text-slate-400">Nenhuma fase criada — opcional, use se quiser periodizar (ex: Base/Deload).</p>
        )}
        {microcycles.data && microcycles.data.length > 0 && (
          <ol className="mb-3 flex flex-wrap gap-2">
            {[...microcycles.data]
              .sort((a, b) => a.order - b.order)
              .map((m) => (
                <li key={m.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  {m.name} <span className="text-slate-400">({m.weeks}sem)</span>
                </li>
              ))}
          </ol>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <Alert>{error}</Alert>
            <Field label="Nome da fase">
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Base" className="w-40" />
            </Field>
            <Field label="Semanas">
              <Input type="number" min={1} required value={weeks} onChange={(e) => setWeeks(e.target.value)} className="w-24" />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando…' : 'Criar fase'}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
