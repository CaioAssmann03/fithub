import type { AdminTenantSummary, AssistedAccessInput, AssistedAccessOutput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function listTenants() {
  return apiFetch<AdminTenantSummary[]>('/admin/tenants');
}

export function requestAssistedAccess(input: AssistedAccessInput) {
  return apiFetch<AssistedAccessOutput>('/admin/assisted-access', { method: 'POST', body: input });
}
