'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { createWorkout, listWorkoutsByStudent, publishWorkout } from '@/lib/api/workouts';
import { listExercises } from '@/lib/api/exercises';
import { listMicrocycles } from '@/lib/api/microcycles';
import { ApiError } from '@/lib/api-client';
import { MicrocycleManager } from './microcycle-manager';
import type { LoadType, SetBlockInput, SetTechnique, WorkoutExerciseInput } from '@fithub/shared-types';

const TECHNIQUE_LABEL: Record<SetTechnique, string> = {
  STANDARD: 'Padrão',
  FEEDER_SET: 'Feeder Set',
  WORKING_SET: 'Working Set',
  TOP_SET: 'Top Set',
  BACK_OFF_SET: 'Back Off Set',
  DROP_SET: 'Drop Set',
  REST_PAUSE: 'Rest-Pause',
  OTHER: 'Outra',
};

export function WorkoutsTab({ studentId }: { studentId: string }) {
  const workouts = useApiData(() => listWorkoutsByStudent(studentId), [studentId]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish(id: string) {
    setError(null);
    try {
      await publishWorkout(id);
      workouts.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível publicar o treino.');
    }
  }

  return (
    <div className="space-y-6">
      <MicrocycleManager studentId={studentId} />

      <Card>
        <CardHeader
          title="Treinos"
          action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : 'Novo treino'}</Button>}
        />
        <CardBody>
          <Alert>{error}</Alert>
          {workouts.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
          {workouts.data?.length === 0 && <p className="text-sm text-slate-400">Nenhum treino criado.</p>}
          <ul className="divide-y divide-slate-100">
            {workouts.data?.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{w.label}</span>
                  <span className="ml-2 text-slate-500">v{w.version}</span>
                  <span className="ml-2 text-slate-500">{w.exerciseCount} exercícios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={w.status === 'ACTIVE' ? 'success' : 'neutral'}>{w.status}</Badge>
                  {w.status === 'ACTIVE' && (
                    <Button variant="secondary" onClick={() => handlePublish(w.id)}>
                      Publicar pro aluno
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {showForm && (
        <NewWorkoutForm
          studentId={studentId}
          onCreated={() => {
            setShowForm(false);
            workouts.refetch();
          }}
        />
      )}
    </div>
  );
}

function emptySetBlock(): SetBlockInput {
  return { technique: 'STANDARD', sets: 3, repsMin: 8, repsMax: 12, loadType: 'FIXED_WEIGHT' };
}

interface ExerciseFormState {
  exerciseId: string;
  mode: 'blocks' | 'freeform';
  setBlocks: SetBlockInput[];
  freeformPrescription: string;
  weeklyFrequencyMin: string;
  weeklyFrequencyMax: string;
  notes: string;
}

function emptyExerciseForm(): ExerciseFormState {
  return {
    exerciseId: '',
    mode: 'blocks',
    setBlocks: [emptySetBlock()],
    freeformPrescription: '',
    weeklyFrequencyMin: '',
    weeklyFrequencyMax: '',
    notes: '',
  };
}

function NewWorkoutForm({ studentId, onCreated }: { studentId: string; onCreated: () => void }) {
  const exercisesCatalog = useApiData(listExercises);
  const microcycles = useApiData(() => listMicrocycles(studentId), [studentId]);

  const [label, setLabel] = useState('');
  const [microcycleId, setMicrocycleId] = useState('');
  const [defaultRestMin, setDefaultRestMin] = useState('');
  const [defaultRestMax, setDefaultRestMax] = useState('');
  const [items, setItems] = useState<ExerciseFormState[]>([emptyExerciseForm()]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateItem(index: number, changes: Partial<ExerciseFormState>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyExerciseForm()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBlock(itemIndex: number, blockIndex: number, changes: Partial<SetBlockInput>) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIndex
          ? { ...it, setBlocks: it.setBlocks.map((b, bi) => (bi === blockIndex ? { ...b, ...changes } : b)) }
          : it,
      ),
    );
  }

  function addBlock(itemIndex: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === itemIndex ? { ...it, setBlocks: [...it.setBlocks, emptySetBlock()] } : it)),
    );
  }

  function removeBlock(itemIndex: number, blockIndex: number) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIndex ? { ...it, setBlocks: it.setBlocks.filter((_, bi) => bi !== blockIndex) } : it,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const exercises: WorkoutExerciseInput[] = items.map((item, order) => ({
        exerciseId: item.exerciseId,
        order,
        setBlocks: item.mode === 'blocks' ? item.setBlocks : [],
        freeformPrescription: item.mode === 'freeform' ? item.freeformPrescription : undefined,
        weeklyFrequencyMin: item.weeklyFrequencyMin ? Number(item.weeklyFrequencyMin) : undefined,
        weeklyFrequencyMax: item.weeklyFrequencyMax ? Number(item.weeklyFrequencyMax) : undefined,
        notes: item.notes || undefined,
      }));

      await createWorkout({
        studentId,
        label,
        exercises,
        microcycleId: microcycleId || undefined,
        defaultRestSecondsMin: defaultRestMin ? Number(defaultRestMin) : undefined,
        defaultRestSecondsMax: defaultRestMax ? Number(defaultRestMax) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o treino.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Novo treino" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>{error}</Alert>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <Field label="Nome do treino">
                <Input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Treino A" />
              </Field>
            </div>
            <Field label="Fase (opcional)">
              <Select value={microcycleId} onChange={(e) => setMicrocycleId(e.target.value)}>
                <option value="">Sem fase</option>
                {microcycles.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Descanso min (s)">
                <Input type="number" value={defaultRestMin} onChange={(e) => setDefaultRestMin(e.target.value)} />
              </Field>
              <Field label="Descanso max (s)">
                <Input type="number" value={defaultRestMax} onChange={(e) => setDefaultRestMax(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, itemIndex) => (
              <div key={itemIndex} className="rounded-md border border-slate-200 p-3">
                <div className="mb-3 grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Field label="Exercício">
                      <Select
                        required
                        value={item.exerciseId}
                        onChange={(e) => updateItem(itemIndex, { exerciseId: e.target.value })}
                      >
                        <option value="">Selecione…</option>
                        {exercisesCatalog.data?.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="col-span-3">
                    <Field label="Tipo de prescrição">
                      <Select
                        value={item.mode}
                        onChange={(e) => updateItem(itemIndex, { mode: e.target.value as 'blocks' | 'freeform' })}
                      >
                        <option value="blocks">Séries</option>
                        <option value="freeform">Sem séries (cardio)</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Freq. semanal">
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="min"
                          value={item.weeklyFrequencyMin}
                          onChange={(e) => updateItem(itemIndex, { weeklyFrequencyMin: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="max"
                          value={item.weeklyFrequencyMax}
                          onChange={(e) => updateItem(itemIndex, { weeklyFrequencyMax: e.target.value })}
                        />
                      </div>
                    </Field>
                  </div>
                  <div className="col-span-2 flex items-end">
                    <Button type="button" variant="ghost" onClick={() => removeItem(itemIndex)}>
                      Remover
                    </Button>
                  </div>
                </div>

                {item.mode === 'freeform' ? (
                  <Field label="Prescrição (ex: 30min esteira 5-6km/h)">
                    <Input
                      required
                      value={item.freeformPrescription}
                      onChange={(e) => updateItem(itemIndex, { freeformPrescription: e.target.value })}
                    />
                  </Field>
                ) : (
                  <div className="space-y-2 pl-3">
                    {item.setBlocks.map((block, blockIndex) => (
                      <div key={blockIndex} className="grid grid-cols-12 items-end gap-2 rounded bg-slate-50 p-2">
                        <div className="col-span-2">
                          <Field label="Técnica">
                            <Select
                              value={block.technique}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { technique: e.target.value as SetTechnique })}
                            >
                              {Object.entries(TECHNIQUE_LABEL).map(([value, lbl]) => (
                                <option key={value} value={value}>
                                  {lbl}
                                </option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Field label="Séries">
                            <Input
                              type="number"
                              value={block.sets}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { sets: Number(e.target.value) })}
                            />
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Field label="Rep. min">
                            <Input
                              type="number"
                              value={block.repsMin}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { repsMin: Number(e.target.value) })}
                            />
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Field label="Rep. max">
                            <Input
                              type="number"
                              value={block.repsMax}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { repsMax: Number(e.target.value) })}
                            />
                          </Field>
                        </div>
                        <div className="col-span-2">
                          <Field label="Carga">
                            <Select
                              value={block.loadType}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { loadType: e.target.value as LoadType })}
                            >
                              <option value="FIXED_WEIGHT">Peso fixo</option>
                              <option value="BODYWEIGHT">Peso corporal</option>
                              <option value="PERCENTAGE_1RM">% de 1RM</option>
                            </Select>
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Field label="kg/%">
                            <Input
                              type="number"
                              value={block.loadValue ?? ''}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { loadValue: Number(e.target.value) })}
                            />
                          </Field>
                        </div>
                        <div className="col-span-2">
                          <Field label="Nota do bloco">
                            <Input
                              value={block.notes ?? ''}
                              onChange={(e) => updateBlock(itemIndex, blockIndex, { notes: e.target.value })}
                              placeholder="ex: reduz 40% do peso"
                            />
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Button type="button" variant="ghost" onClick={() => removeBlock(itemIndex, blockIndex)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={() => addBlock(itemIndex)}>
                      + Adicionar bloco (ex: Drop Set, Top Set…)
                    </Button>
                  </div>
                )}

                <div className="mt-2">
                  <Field label="Dica de execução (opcional)">
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(itemIndex, { notes: e.target.value })}
                      placeholder="ex: Com retração escapular"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" onClick={addItem}>
            + Adicionar exercício
          </Button>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? 'Salvando…' : 'Criar treino'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
