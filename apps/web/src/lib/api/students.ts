import type {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  EnableStudentAccessInput,
  StudentStatus,
} from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function listStudents(filters?: { status?: StudentStatus; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  return apiFetch<Student[]>(`/students${qs ? `?${qs}` : ''}`);
}

export function getStudent(id: string) {
  return apiFetch<Student>(`/students/${id}`);
}

export function createStudent(input: CreateStudentInput) {
  return apiFetch<{ studentId: string }>('/students', { method: 'POST', body: input });
}

export function updateStudent(id: string, input: UpdateStudentInput) {
  return apiFetch<{ success: true }>(`/students/${id}`, { method: 'PUT', body: input });
}

export function deactivateStudent(id: string) {
  return apiFetch<{ success: true }>(`/students/${id}/deactivate`, { method: 'PATCH' });
}

export function reactivateStudent(id: string) {
  return apiFetch<{ success: true }>(`/students/${id}/reactivate`, { method: 'PATCH' });
}

export function enableStudentAccess(id: string, input: EnableStudentAccessInput) {
  return apiFetch<{ userId: string }>(`/students/${id}/enable-access`, { method: 'POST', body: input });
}
