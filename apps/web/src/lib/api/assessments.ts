import type { Assessment, CreateAssessmentInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function createAssessment(input: CreateAssessmentInput) {
  return apiFetch<{ id: string }>('/assessments', { method: 'POST', body: input });
}

export function listAssessmentsByStudent(studentId: string) {
  return apiFetch<Assessment[]>(`/students/${studentId}/assessments`);
}

export function getLatestAssessment(studentId: string) {
  return apiFetch<Assessment>(`/students/${studentId}/assessments/latest`);
}
