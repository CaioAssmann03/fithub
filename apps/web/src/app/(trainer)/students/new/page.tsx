'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea, Field } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { createStudent } from '@/lib/api/students';
import { ApiError } from '@/lib/api-client';
import type { Gender, StudentGoalType } from '@fithub/shared-types';

export default function NewStudentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('MALE');
  const [birthDate, setBirthDate] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [goalType, setGoalType] = useState<StudentGoalType | ''>('');
  const [goalDetail, setGoalDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { studentId } = await createStudent({
        name,
        gender,
        birthDate,
        heightCm: heightCm ? Number(heightCm) : undefined,
        goalType: goalType || undefined,
        goalDetail: goalDetail || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        email: email || undefined,
        notes: notes || undefined,
      });
      router.push(`/students/${studentId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cadastrar o aluno.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Novo aluno" />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert>{error}</Alert>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome">
                <Input required value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Sexo">
                <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                  <option value="OTHER">Outro</option>
                </Select>
              </Field>
              <Field label="Data de nascimento">
                <Input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </Field>
              <Field label="Altura (cm)">
                <Input type="number" step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </Field>
              <Field label="Objetivo">
                <Select value={goalType} onChange={(e) => setGoalType(e.target.value as StudentGoalType | '')}>
                  <option value="">Selecione…</option>
                  <option value="WEIGHT_LOSS">Emagrecimento</option>
                  <option value="MUSCLE_GAIN">Hipertrofia</option>
                  <option value="CONDITIONING">Condicionamento</option>
                  <option value="REHABILITATION">Reabilitação</option>
                  <option value="GENERAL_HEALTH">Saúde geral</option>
                  <option value="OTHER">Outro</option>
                </Select>
              </Field>
              <Field label="Detalhe do objetivo">
                <Input value={goalDetail} onChange={(e) => setGoalDetail(e.target.value)} />
              </Field>
              <Field label="Telefone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11987654321" />
              </Field>
              <Field label="WhatsApp">
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="11987654321" />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </div>
            <Field label="Observações">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando…' : 'Cadastrar aluno'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
