import { AuditLog as PrismaAuditLog, Prisma } from '@prisma/client';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

export class AuditLogMapper {
  static toDomain(raw: PrismaAuditLog): AuditLog {
    return AuditLog.reconstitute(
      {
        tenantId: raw.tenantId ? TenantId.create(raw.tenantId).value : undefined,
        actorUserId: raw.actorUserId ? new UniqueEntityId(raw.actorUserId) : undefined,
        action: raw.action,
        targetType: raw.targetType ?? undefined,
        targetId: raw.targetId ?? undefined,
        metadata: (raw.metadata as Record<string, unknown>) ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(log: AuditLog) {
    return {
      id: log.id.toString(),
      tenantId: log.tenantId?.value ?? null,
      actorUserId: log.actorUserId?.toString() ?? null,
      action: log.action,
      targetType: log.targetType ?? null,
      targetId: log.targetId ?? null,
      metadata: (log.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    };
  }
}
