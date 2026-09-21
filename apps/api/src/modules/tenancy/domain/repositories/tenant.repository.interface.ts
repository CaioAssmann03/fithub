import { Tenant } from '../entities/tenant.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

export interface ITenantRepository {
  findById(id: TenantId): Promise<Tenant | null>;
}

export const TENANT_REPOSITORY = Symbol('ITenantRepository');
