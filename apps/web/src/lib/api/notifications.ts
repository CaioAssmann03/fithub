import type { Notification } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function listNotifications() {
  return apiFetch<Notification[]>('/notifications');
}

export function markNotificationRead(id: string) {
  return apiFetch<{ success: true }>(`/notifications/${id}/read`, { method: 'PATCH' });
}
