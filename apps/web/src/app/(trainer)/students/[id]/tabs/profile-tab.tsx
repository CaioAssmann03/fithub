'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { updateStudent, deactivateStudent, reactivateStudent } from '@/lib/api/students';
import { ApiError } from '@/lib/api-client';
import { formatDateOnly } from '@/lib/date-utils';
import type { Student, StudentGoalType } from '@fithub/shared-types';

const GOAL_LABEL: Record<string, string> = {
  WEIGHT_LOSS: 'Emagrecimento',
  MUSCLE_GAIN: 'Hipertrofia',
  CONDITIONING: 'Condicionamento',
  REHABILITATION: 'Reabilitação',
  GENERAL_HEALTH: 'Saúde geral',
  OTHER: 'Outro',
};

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', OTHER: 'Outro' };

export function ProfileTab({ student, onUpdated }: { student: Student; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [heightCm, setHeightCm] = useState(student.heightCm?.toString() ?? '');
  const [goalType, setGoalType] = useState<StudentGoalType | ''>(student.goalType ?? '');
  const [goalDetail, setGoalDetail] = useState(student.goalDetail ?? '');
  const [phone, setPhone] = useState(student.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(student.whatsapp ?? '');
  const [notes, setNotes] = useState(student.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await updateStudent(student.id, {
        name,
        heightCm: heightCm ? Number(heightCm) : undefined,
        goalType: goalType || undefined,
        goalDetail: goalDetail || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        notes: notes || undefined,
      });
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus() {
    setIsSubmitting(true);
    try {
      if (student.status === 'ACTIVE') await deactivateStudent(student.id);
      else await reactivateStudent(student.id);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível atualizar o status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <Card>
        <CardHeader title="Perfil" action={<Button onClick={() => setEditing(true)}>Editar</Button>} />
        <CardBody>
          <Alert>{error}</Alert>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Sexo</dt>
              <dd className="font-medium text-slate-900">{GENDER_LABEL[student.gender]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Nascimento</dt>
              <dd className="font-medium text-slate-900">{formatDateOnly(student.birthDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Altura</dt>
              <dd className="font-medium text-slate-900">{student.heightCm ? `${student.heightCm} cm` : '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Objetivo</dt>
              <dd className="font-medium text-slate-900">
                {student.goalType ? GOAL_LABEL[student.goalType] : '—'}
                {student.goalDetail ? ` — ${student.goalDetail}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Telefone</dt>
              <dd className="font-medium text-slate-900">{student.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">WhatsApp</dt>
              <dd className="font-medium text-slate-900">{student.whatsapp ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">E-mail</dt>
              <dd className="font-medium text-slate-900">{student.email ?? '—'}</dd>
            </div>
          </dl>
          {student.notes && (
            <div className="mt-4">
              <dt className="text-sm text-slate-500">Observações</dt>
              <dd className="mt-1 text-sm text-slate-900">{student.notes}</dd>
            </div>
          )}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <Button variant={student.status === 'ACTIVE' ? 'danger' : 'secondary'} onClick={handleToggleStatus} disabled={isSubmitting}>
              {student.status === 'ACTIVE' ? 'Desativar aluno' : 'Reativar aluno'}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Editar perfil" />
      <CardBody>
        <form onSubmit={handleSave} className="space-y-4">
          <Alert>{error}</Alert>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome">
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Altura (cm)">
              <Input type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </Field>
            <Field label="Objetivo">
              <Select value={goalType} onChange={(e) => setGoalType(e.target.value as StudentGoalType | '')}>
                <option value="">Selecione…</option>
                {Object.entries(GOAL_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Detalhe do objetivo">
              <Input value={goalDetail} onChange={(e) => setGoalDetail(e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </Field>
          </div>
          <Field label="Observações">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
