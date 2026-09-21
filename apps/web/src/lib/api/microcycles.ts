import type { Microcycle, CreateMicrocycleInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function listMicrocycles(studentId: string) {
  return apiFetch<Microcycle[]>(`/students/${studentId}/microcycles`);
}

export function createMicrocycle(studentId: string, input: CreateMicrocycleInput) {
  return apiFetch<{ microcycleId: string }>(`/students/${studentId}/microcycles`, { method: 'POST', body: input });
}
