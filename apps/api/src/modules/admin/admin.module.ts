import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './presentation/admin.controller';
import { ListTenantsUseCase } from './application/use-cases/list-tenants.use-case';
import { RequestAssistedAccessUseCase } from './application/use-cases/request-assisted-access.use-case';
import { PrismaAdminTenantRepository } from './infrastructure/persistence/prisma-admin-tenant.repository';
import { PrismaAuditLogRepository } from './infrastructure/persistence/prisma-audit-log.repository';
import { ADMIN_TENANT_REPOSITORY } from './domain/repositories/admin-tenant.repository.interface';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { TokenService } from '../../infra/security/token.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [AdminController],
  providers: [
    ListTenantsUseCase,
    RequestAssistedAccessUseCase,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    { provide: ADMIN_TENANT_REPOSITORY, useClass: PrismaAdminTenantRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
  ],
})
export class AdminModule {}
