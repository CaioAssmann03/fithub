import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogMapper } from '../mappers/audit-log.mapper';

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * `create`, nunca `upsert` — audit_logs é append-only por convenção de
   * aplicação (ver schema.prisma), um registro de auditoria não é editado
   * depois de escrito.
   */
  async save(log: AuditLog): Promise<void> {
    const data = AuditLogMapper.toPersistence(log);
    await this.prisma.currentClient.auditLog.create({ data });
  }
}
