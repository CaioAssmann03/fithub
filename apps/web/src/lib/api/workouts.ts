import type { Workout, WorkoutDetail, CreateWorkoutInput, VersionWorkoutInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function createWorkout(input: CreateWorkoutInput) {
  return apiFetch<{ workoutId: string }>('/workouts', { method: 'POST', body: input });
}

export function getWorkout(id: string) {
  return apiFetch<WorkoutDetail>(`/workouts/${id}`);
}

export function listWorkoutsByStudent(studentId: string) {
  return apiFetch<Workout[]>(`/students/${studentId}/workouts`);
}

export function publishWorkout(id: string) {
  return apiFetch<{ success: true }>(`/workouts/${id}/publish`, { method: 'PATCH' });
}

export function createWorkoutVersion(id: string, input: VersionWorkoutInput) {
  return apiFetch<{ newWorkoutId: string }>(`/workouts/${id}/versions`, { method: 'POST', body: input });
}
