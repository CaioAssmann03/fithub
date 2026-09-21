import type { Appointment, CreateAppointmentInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function createAppointment(input: CreateAppointmentInput) {
  return apiFetch<Appointment>('/appointments', { method: 'POST', body: input });
}

export function listUpcomingAppointments(hours = 168) {
  return apiFetch<Appointment[]>(`/appointments/upcoming?hours=${hours}`);
}

export function cancelAppointment(id: string) {
  return apiFetch<{ success: true }>(`/appointments/${id}/cancel`, { method: 'PATCH' });
}

export function completeAppointment(id: string) {
  return apiFetch<{ success: true }>(`/appointments/${id}/complete`, { method: 'PATCH' });
}
