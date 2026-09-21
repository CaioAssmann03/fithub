import { AuditLog } from '../entities/audit-log.entity';

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<void>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('IAuditLogRepository');
