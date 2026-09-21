import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  IAdminTenantRepository,
  ADMIN_TENANT_REPOSITORY,
} from '../../domain/repositories/admin-tenant.repository.interface';
import { IAuditLogRepository, AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { TokenService } from '../../../../infra/security/token.service';

export interface RequestAssistedAccessInput {
  adminUserId: string;
  tenantId: string;
  reason?: string;
}

export interface RequestAssistedAccessOutput {
  accessToken: string;
  expiresAt: Date;
  tenantId: string;
}

/**
 * "Acesso assistido" (ARCHITECTURE.md, seção 11) — a única forma de um
 * Platform Admin operar dentro de um tenant específico: nunca um bypass
 * silencioso, sempre um token de vida curta emitido explicitamente e
 * logado em audit_logs *antes* de sair da função (se a emissão falhar
 * depois do save, preferimos um audit log "orfão" a um acesso não
 * auditado). O token carrega role=PLATFORM_ADMIN (o ator continua sendo
 * o admin, não uma identidade forjada de personal) e tenantId = tenant
 * alvo — os controllers tenant-scoped hoje exigem @Roles('PERSONAL_TRAINER')
 * e não aceitam esse token; torná-los cientes de acesso assistido é
 * trabalho futuro, registrado em docs/BACKEND-TENANCY-ADMIN-NOTIFICATIONS.md.
 */
@Injectable()
export class RequestAssistedAccessUseCase {
  constructor(
    @Inject(ADMIN_TENANT_REPOSITORY) private readonly tenants: IAdminTenantRepository,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogs: IAuditLogRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: RequestAssistedAccessInput): Promise<Result<RequestAssistedAccessOutput>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const exists = await this.tenants.existsById(input.tenantId);
    if (!exists) {
      return Result.fail(new DomainError('Tenant não encontrado', 'TENANT_NOT_FOUND'));
    }

    const issued = this.tokens.signAssistedAccessToken({
      sub: input.adminUserId,
      tenantId: input.tenantId,
      role: 'PLATFORM_ADMIN',
    });

    const auditLog = AuditLog.create({
      tenantId: tenantIdResult.value,
      actorUserId: new UniqueEntityId(input.adminUserId),
      action: 'ASSISTED_ACCESS_GRANTED',
      targetType: 'Tenant',
      targetId: input.tenantId,
      metadata: input.reason ? { reason: input.reason } : undefined,
    });
    await this.auditLogs.save(auditLog);

    return Result.ok({ accessToken: issued.token, expiresAt: issued.expiresAt, tenantId: input.tenantId });
  }
}
