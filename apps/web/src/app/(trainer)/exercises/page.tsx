'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { createExercise, listExercises } from '@/lib/api/exercises';
import { ApiError } from '@/lib/api-client';
import type { Equipment, MuscleGroup } from '@fithub/shared-types';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST',
  'BACK',
  'LEGS',
  'SHOULDERS',
  'ARMS',
  'CORE',
  'FULL_BODY',
  'CARDIO',
  'GLUTES',
  'CALVES',
];
const EQUIPMENT_OPTIONS: Equipment[] = ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT', 'CABLE', 'BAND', 'KETTLEBELL'];

export default function ExercisesPage() {
  const exercises = useApiData(listExercises);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="Exercícios"
        description="Catálogo global e exercícios customizados do seu negócio"
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : 'Novo exercício'}</Button>}
      />

      {showForm && (
        <div className="mb-6">
          <NewExerciseForm
            onCreated={() => {
              setShowForm(false);
              exercises.refetch();
            }}
          />
        </div>
      )}

      <Card>
        {exercises.isLoading && <p className="p-5 text-sm text-slate-400">Carregando…</p>}
        <ul className="divide-y divide-slate-100">
          {exercises.data?.map((ex) => (
            <li key={ex.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{ex.name}</span>
                <span className="ml-2 text-slate-500">{ex.muscleGroup}</span>
                {ex.equipment.length > 0 && (
                  <span className="ml-2 text-slate-400">{ex.equipment.join(', ')}</span>
                )}
              </div>
              {ex.isGlobal && <Badge tone="brand">Global</Badge>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function NewExerciseForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('CHEST');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleEquipment(item: Equipment) {
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createExercise({ name, muscleGroup, equipment, description: description || undefined });
      setName('');
      setDescription('');
      setEquipment([]);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o exercício.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Novo exercício" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>{error}</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome">
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Grupo muscular">
              <Select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}>
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>
                    {mg}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Equipamento">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  type="button"
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    equipment.includes(eq)
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Descrição">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Criar exercício'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
