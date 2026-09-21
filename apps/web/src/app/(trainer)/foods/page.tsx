'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { createFood, listFoods } from '@/lib/api/foods';
import { ApiError } from '@/lib/api-client';

export default function FoodsPage() {
  const foods = useApiData(listFoods);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="Alimentos"
        description="Catálogo global e alimentos customizados do seu negócio"
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fechar' : 'Novo alimento'}</Button>}
      />

      {showForm && (
        <div className="mb-6">
          <NewFoodForm
            onCreated={() => {
              setShowForm(false);
              foods.refetch();
            }}
          />
        </div>
      )}

      <Card>
        {foods.isLoading && <p className="p-5 text-sm text-slate-400">Carregando…</p>}
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Kcal/100g</th>
              <th className="px-5 py-3 font-medium">Proteína</th>
              <th className="px-5 py-3 font-medium">Carbo</th>
              <th className="px-5 py-3 font-medium">Gordura</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {foods.data?.map((f) => (
              <tr key={f.id}>
                <td className="px-5 py-2.5 font-medium text-slate-900">{f.name}</td>
                <td className="px-5 py-2.5 text-slate-600">{f.caloriesPer100g ?? '—'}</td>
                <td className="px-5 py-2.5 text-slate-600">{f.proteinG ?? '—'}g</td>
                <td className="px-5 py-2.5 text-slate-600">{f.carbsG ?? '—'}g</td>
                <td className="px-5 py-2.5 text-slate-600">{f.fatG ?? '—'}g</td>
                <td className="px-5 py-2.5">{f.isGlobal && <Badge tone="brand">Global</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function NewFoodForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [caloriesPer100g, setCalories] = useState('');
  const [proteinG, setProtein] = useState('');
  const [carbsG, setCarbs] = useState('');
  const [fatG, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createFood({
        name,
        caloriesPer100g: caloriesPer100g ? Number(caloriesPer100g) : undefined,
        proteinG: proteinG ? Number(proteinG) : undefined,
        carbsG: carbsG ? Number(carbsG) : undefined,
        fatG: fatG ? Number(fatG) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o alimento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Novo alimento" />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>{error}</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome">
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Calorias / 100g">
              <Input type="number" step="0.1" value={caloriesPer100g} onChange={(e) => setCalories(e.target.value)} />
            </Field>
            <Field label="Proteína (g)">
              <Input type="number" step="0.1" value={proteinG} onChange={(e) => setProtein(e.target.value)} />
            </Field>
            <Field label="Carboidrato (g)">
              <Input type="number" step="0.1" value={carbsG} onChange={(e) => setCarbs(e.target.value)} />
            </Field>
            <Field label="Gordura (g)">
              <Input type="number" step="0.1" value={fatG} onChange={(e) => setFat(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Criar alimento'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
