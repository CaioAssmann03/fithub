'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { createDiet, listDietsByStudent, publishDiet } from '@/lib/api/diets';
import { listFoods } from '@/lib/api/foods';
import { ApiError } from '@/lib/api-client';
import type { MealInput, QuantityUnit } from '@fithub/shared-types';

function emptyMeal(order: number): MealInput {
  return { name: '', time: '08:00', order, foods: [] };
}

export function DietsTab({ studentId }: { studentId: string }) {
  const diets = useApiData(() => listDietsByStudent(studentId), [studentId]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish(id: string) {
    setError(null);
    try {
      await publishDiet(id);
      diets.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível publicar a dieta.');
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Dietas"
          action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : 'Nova dieta'}</Button>}
        />
        <CardBody>
          <Alert>{error}</Alert>
          {diets.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
          {diets.data?.length === 0 && <p className="text-sm text-slate-400">Nenhuma dieta criada.</p>}
          <ul className="divide-y divide-slate-100">
            {diets.data?.map((d) => (
              <li key={d.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{d.name}</span>
                    <span className="ml-2 text-slate-500">v{d.version}</span>
                    <span className="ml-2 text-slate-500">{d.meals.length} refeições</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={d.status === 'ACTIVE' ? 'success' : 'neutral'}>{d.status}</Badge>
                    {d.status === 'ACTIVE' && (
                      <Button variant="secondary" onClick={() => handlePublish(d.id)}>
                        Publicar pro aluno
                      </Button>
                    )}
                  </div>
                </div>
                {d.meals.length > 0 && (
                  <ul className="mt-2 pl-4 text-slate-500">
                    {d.meals.map((m) => (
                      <li key={m.id}>
                        {m.time} — {m.name} ({m.foods.length} itens)
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {showForm && (
        <NewDietForm
          studentId={studentId}
          onCreated={() => {
            setShowForm(false);
            diets.refetch();
          }}
        />
      )}
    </div>
  );
}

function NewDietForm({ studentId, onCreated }: { studentId: string; onCreated: () => void }) {
  const foods = useApiData(listFoods);
  const [name, setName] = useState('');
  const [meals, setMeals] = useState<MealInput[]>([emptyMeal(1)]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateMeal(index: number, changes: Partial<MealInput>) {
    setMeals((prev) => prev.map((m, i) => (i === index ? { ...m, ...changes } : m)));
  }

  function addMeal() {
    setMeals((prev) => [...prev, emptyMeal(prev.length + 1)]);
  }

  function removeMeal(index: number) {
    setMeals((prev) => prev.filter((_, i) => i !== index));
  }

  function addFoodToMeal(mealIndex: number) {
    updateMeal(mealIndex, {
      foods: [...meals[mealIndex].foods, { foodId: '', quantityValue: 100, quantityUnit: 'g' }],
    });
  }

  function updateMealFood(mealIndex: number, foodIndex: number, changes: Partial<MealInput['foods'][number]>) {
    const meal = meals[mealIndex];
    const nextFoods = meal.foods.map((f, i) => (i === foodIndex ? { ...f, ...changes } : f));
    updateMeal(mealIndex, { foods: nextFoods });
  }

  function removeMealFood(mealIndex: number, foodIndex: number) {
    updateMeal(mealIndex, { foods: meals[mealIndex].foods.filter((_, i) => i !== foodIndex) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createDiet({ studentId, name, meals });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a dieta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Nova dieta" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>{error}</Alert>
          <Field label="Nome da dieta">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Plano de cutting" />
          </Field>

          <div className="space-y-3">
            {meals.map((meal, mealIndex) => (
              <div key={mealIndex} className="rounded-md border border-slate-200 p-3">
                <div className="mb-3 grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <Field label="Refeição">
                      <Input
                        required
                        value={meal.name}
                        onChange={(e) => updateMeal(mealIndex, { name: e.target.value })}
                        placeholder="Café da manhã"
                      />
                    </Field>
                  </div>
                  <div className="col-span-3">
                    <Field label="Horário">
                      <Input
                        required
                        type="time"
                        value={meal.time}
                        onChange={(e) => updateMeal(mealIndex, { time: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="col-span-3 flex items-end">
                    <Button type="button" variant="ghost" onClick={() => removeMeal(mealIndex)}>
                      Remover refeição
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pl-3">
                  {meal.foods.map((food, foodIndex) => (
                    <div key={foodIndex} className="grid grid-cols-12 items-end gap-2">
                      <div className="col-span-5">
                        <Select
                          required
                          value={food.foodId}
                          onChange={(e) => updateMealFood(mealIndex, foodIndex, { foodId: e.target.value })}
                        >
                          <option value="">Selecione o alimento…</option>
                          {foods.data?.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={food.quantityValue}
                          onChange={(e) =>
                            updateMealFood(mealIndex, foodIndex, { quantityValue: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={food.quantityUnit}
                          onChange={(e) =>
                            updateMealFood(mealIndex, foodIndex, { quantityUnit: e.target.value as QuantityUnit })
                          }
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="unidade">unidade</option>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button type="button" variant="ghost" onClick={() => removeMealFood(mealIndex, foodIndex)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={() => addFoodToMeal(mealIndex)}>
                    + Adicionar alimento
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" onClick={addMeal}>
            + Adicionar refeição
          </Button>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Criar dieta'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
