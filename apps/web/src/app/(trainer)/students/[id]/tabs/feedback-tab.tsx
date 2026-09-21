'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiData } from '@/lib/use-api-data';
import { listFeedbackByStudent } from '@/lib/api/feedback';

function scaleTone(value?: number): 'success' | 'warning' | 'danger' | 'neutral' {
  if (value === undefined) return 'neutral';
  if (value >= 8) return 'danger';
  if (value >= 5) return 'warning';
  return 'success';
}

export function FeedbackTab({ studentId }: { studentId: string }) {
  const feedback = useApiData(() => listFeedbackByStudent(studentId), [studentId]);

  return (
    <Card>
      <CardHeader title="Check-ins do aluno" />
      <CardBody>
        {feedback.isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
        {feedback.data?.length === 0 && (
          <p className="text-sm text-slate-400">O aluno ainda não enviou nenhum check-in.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {feedback.data?.map((f) => (
            <li key={f.id} className="py-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-slate-900">
                  {new Date(f.submittedAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {f.generalRating !== undefined && <Badge tone="brand">Geral {f.generalRating}/10</Badge>}
                {f.muscleSoreness !== undefined && (
                  <Badge tone={scaleTone(f.muscleSoreness)}>Dor muscular {f.muscleSoreness}/10</Badge>
                )}
                {f.difficulty !== undefined && (
                  <Badge tone={scaleTone(f.difficulty)}>Dificuldade {f.difficulty}/10</Badge>
                )}
                {f.mood !== undefined && <Badge>Humor {f.mood}/10</Badge>}
                {f.energy !== undefined && <Badge>Energia {f.energy}/10</Badge>}
                {f.sleepQuality !== undefined && <Badge>Sono {f.sleepQuality}/10</Badge>}
              </div>
              {f.notes && <p className="mt-2 text-slate-600">{f.notes}</p>}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
