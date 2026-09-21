import type { TenantPlan, TenantStatus } from './tenancy';

export interface AdminTenantSummary {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  ownerUserId: string | null;
  createdAt: string;
}

export interface AssistedAccessInput {
  tenantId: string;
  reason?: string;
}

export interface AssistedAccessOutput {
  accessToken: string;
  expiresAt: string;
  tenantId: string;
}
