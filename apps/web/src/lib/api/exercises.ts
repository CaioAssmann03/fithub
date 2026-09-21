import type { Exercise, CreateExerciseInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function listExercises() {
  return apiFetch<Exercise[]>('/exercises');
}

export function createExercise(input: CreateExerciseInput) {
  return apiFetch<Exercise>('/exercises', { method: 'POST', body: input });
}
