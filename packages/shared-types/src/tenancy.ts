export type TenantPlan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export interface MyTenancy {
  tenant: {
    id: string;
    name: string;
    plan: TenantPlan;
    status: TenantStatus;
  };
  profile: {
    cref?: string;
    specialty?: string;
    bio?: string;
    phone?: string;
  } | null;
}

export interface UpdateTrainerProfileInput {
  cref?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
}
