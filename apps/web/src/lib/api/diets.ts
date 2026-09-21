import type { Diet, CreateDietInput, MealInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function createDiet(input: CreateDietInput) {
  return apiFetch<Diet>('/diets', { method: 'POST', body: input });
}

export function listDietsByStudent(studentId: string) {
  return apiFetch<Diet[]>(`/students/${studentId}/diets`);
}

export function publishDiet(id: string) {
  return apiFetch<{ success: true }>(`/diets/${id}/publish`, { method: 'PATCH' });
}

export function createDietVersion(id: string, meals: MealInput[]) {
  return apiFetch<Diet>(`/diets/${id}/versions`, { method: 'POST', body: { meals } });
}
