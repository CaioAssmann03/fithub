import type { DashboardStats } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function getDashboardStats() {
  return apiFetch<DashboardStats>('/dashboard/stats');
}
