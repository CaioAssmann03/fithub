import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TenancyController } from './presentation/tenancy.controller';
import { GetMyTenancyUseCase } from './application/use-cases/get-my-tenancy.use-case';
import { UpdateTrainerProfileUseCase } from './application/use-cases/update-trainer-profile.use-case';
import { PrismaTenantRepository } from './infrastructure/persistence/prisma-tenant.repository';
import { PrismaTrainerProfileRepository } from './infrastructure/persistence/prisma-trainer-profile.repository';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository.interface';
import { TRAINER_PROFILE_REPOSITORY } from './domain/repositories/trainer-profile.repository.interface';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { TokenService } from '../../infra/security/token.service';

/**
 * Mesma nota do StudentsModule (BACKEND-STUDENTS.md): PrismaService,
 * TenantContextService e TransactionContextService repetidos aqui por
 * este módulo ainda ser autocontido — migram pra um InfraModule global
 * quando esse débito técnico (ver app.module.ts) for pago.
 */
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [TenancyController],
  providers: [
    GetMyTenancyUseCase,
    UpdateTrainerProfileUseCase,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    { provide: TRAINER_PROFILE_REPOSITORY, useClass: PrismaTrainerProfileRepository },
  ],
})
export class TenancyModule {}
