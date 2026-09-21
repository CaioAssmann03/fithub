'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { getStudent } from '@/lib/api/students';
import { ProfileTab } from './tabs/profile-tab';
import { AssessmentsTab } from './tabs/assessments-tab';
import { WorkoutsTab } from './tabs/workouts-tab';
import { DietsTab } from './tabs/diets-tab';
import { FeedbackTab } from './tabs/feedback-tab';
import { AppointmentsTab } from './tabs/appointments-tab';
import { AccessTab } from './tabs/access-tab';

const TABS = [
  { key: 'profile', label: 'Perfil' },
  { key: 'assessments', label: 'Avaliações' },
  { key: 'workouts', label: 'Treinos' },
  { key: 'diets', label: 'Dietas' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'appointments', label: 'Agenda' },
  { key: 'access', label: 'Acesso ao app' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<TabKey>('profile');
  const student = useApiData(() => getStudent(id), [id]);

  return (
    <div>
      <p className="mb-2">
        <Link href="/students" className="text-sm text-slate-500 hover:underline">
          ← Alunos
        </Link>
      </p>
      <PageHeader
        title={student.data?.name ?? 'Carregando…'}
        action={
          student.data ? (
            <Badge tone={student.data.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {student.data.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
            </Badge>
          ) : undefined
        }
      />

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {student.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
      {student.error && <p className="text-sm text-danger-600">{student.error}</p>}

      {student.data && (
        <>
          {tab === 'profile' && <ProfileTab student={student.data} onUpdated={student.refetch} />}
          {tab === 'assessments' && <AssessmentsTab studentId={id} />}
          {tab === 'workouts' && <WorkoutsTab studentId={id} />}
          {tab === 'diets' && <DietsTab studentId={id} />}
          {tab === 'feedback' && <FeedbackTab studentId={id} />}
          {tab === 'appointments' && <AppointmentsTab studentId={id} />}
          {tab === 'access' && <AccessTab student={student.data} onUpdated={student.refetch} />}
        </>
      )}
    </div>
  );
}
