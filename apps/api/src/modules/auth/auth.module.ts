import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './presentation/auth.controller';
import { RegisterTrainerUseCase } from './application/use-cases/register-trainer.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PasswordHasherService } from '../../infra/security/password-hasher.service';
import { TokenService } from '../../infra/security/token.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { PrismaUnitOfWork } from '../../infra/prisma/prisma-unit-of-work';
import { UNIT_OF_WORK } from '../../core/domain/unit-of-work.interface';
import {
  DomainEventPublisherService,
  DOMAIN_EVENT_PUBLISHER,
} from '../../infra/events/domain-event-publisher.service';

/**
 * `TenantContextService`/`PrismaService`/`TransactionContextService` estão
 * declarados aqui pra este módulo ser autocontido nesta sub-etapa, mas na
 * Etapa 5 completa (AppModule) eles migram pra um `InfraModule` global —
 * módulos de domínio (Students, Assessments...) não deveriam recriar essas
 * instâncias, todos precisam compartilhar o mesmo client Prisma e o mesmo
 * contexto de tenant/transação.
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // troca por @nestjs/config + validação Zod na Etapa 5 completa
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterTrainerUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    PasswordHasherService,
    TokenService,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
  ],
  exports: [TenantContextService, PrismaService, TransactionContextService],
})
export class AuthModule {}
