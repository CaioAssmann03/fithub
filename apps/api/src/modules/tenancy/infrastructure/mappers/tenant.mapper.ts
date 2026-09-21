import { Tenant as PrismaTenant } from '@prisma/client';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantPlan, TenantStatus } from '../../domain/value-objects/tenancy.value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export class TenantMapper {
  static toDomain(raw: PrismaTenant): Tenant {
    return Tenant.reconstitute(
      {
        ownerUserId: raw.ownerUserId ? new UniqueEntityId(raw.ownerUserId) : undefined,
        name: raw.name,
        plan: raw.plan as unknown as TenantPlan,
        status: raw.status as unknown as TenantStatus,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }
}
