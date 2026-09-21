'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { useApiData } from '@/lib/use-api-data';
import { listStudents } from '@/lib/api/students';
import type { StudentStatus } from '@fithub/shared-types';

const GOAL_LABEL: Record<string, string> = {
  WEIGHT_LOSS: 'Emagrecimento',
  MUSCLE_GAIN: 'Hipertrofia',
  CONDITIONING: 'Condicionamento',
  REHABILITATION: 'Reabilitação',
  GENERAL_HEALTH: 'Saúde geral',
  OTHER: 'Outro',
};

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>('');
  const students = useApiData(() => listStudents({ search: search || undefined, status: status || undefined }), [
    search,
    status,
  ]);

  return (
    <div>
      <PageHeader
        title="Alunos"
        description="Gerencie os alunos cadastrados"
        action={
          <Link href="/students/new">
            <Button>Novo aluno</Button>
          </Link>
        }
      />

      <div className="mb-4 flex gap-3">
        <Input
          placeholder="Buscar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus | '')} className="max-w-40">
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
        </Select>
      </div>

      <Card>
        {students.isLoading && <p className="p-5 text-sm text-slate-400">Carregando…</p>}
        {students.error && <p className="p-5 text-sm text-danger-600">{students.error}</p>}
        {students.data?.length === 0 && <p className="p-5 text-sm text-slate-400">Nenhum aluno encontrado.</p>}
        {students.data && students.data.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Objetivo</th>
                <th className="px-5 py-3 font-medium">Acesso ao app</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.data.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/students/${s.id}`} className="font-medium text-brand-700 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.goalType ? GOAL_LABEL[s.goalType] : '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{s.hasAppAccess ? 'Sim' : 'Não'}</td>
                  <td className="px-5 py-3">
                    <Badge tone={s.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {s.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
