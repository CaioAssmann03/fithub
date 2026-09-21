import { Microcycle as PrismaMicrocycle } from '@prisma/client';
import { Microcycle } from '../../domain/entities/microcycle.entity';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

export class MicrocycleMapper {
  static toDomain(raw: PrismaMicrocycle): Microcycle {
    return Microcycle.reconstitute(
      {
        tenantId: TenantId.create(raw.tenantId).value,
        studentId: new UniqueEntityId(raw.studentId),
        name: raw.name,
        order: raw.order,
        weeks: raw.weeks,
        notes: raw.notes ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(microcycle: Microcycle) {
    return {
      id: microcycle.id.toString(),
      tenantId: microcycle.tenantId.value,
      studentId: microcycle.studentId.toString(),
      name: microcycle.name,
      order: microcycle.order,
      weeks: microcycle.weeks,
      notes: microcycle.notes ?? null,
    };
  }
}
