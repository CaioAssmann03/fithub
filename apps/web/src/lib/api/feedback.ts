import type { Feedback, SubmitFeedbackInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function submitFeedback(input: SubmitFeedbackInput) {
  return apiFetch<Feedback>('/feedback', { method: 'POST', body: input });
}

export function listFeedbackByStudent(studentId: string) {
  return apiFetch<Feedback[]>(`/students/${studentId}/feedback`);
}
