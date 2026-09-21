import type { MyTenancy, UpdateTrainerProfileInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function getMyTenancy() {
  return apiFetch<MyTenancy>('/tenancy/me');
}

export function updateTrainerProfile(input: UpdateTrainerProfileInput) {
  return apiFetch<{ success: true }>('/tenancy/profile', { method: 'PUT', body: input });
}
