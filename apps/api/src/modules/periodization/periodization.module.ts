import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MicrocyclesController } from './presentation/microcycles.controller';
import { CreateMicrocycleUseCase } from './application/use-cases/create-microcycle.use-case';
import { ListMicrocyclesUseCase } from './application/use-cases/list-microcycles.use-case';
import { PrismaMicrocycleRepository } from './infrastructure/persistence/prisma-microcycle.repository';
import { MICROCYCLE_REPOSITORY } from './domain/repositories/microcycle.repository.interface';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { TokenService } from '../../infra/security/token.service';
import {
  DomainEventPublisherService,
  DOMAIN_EVENT_PUBLISHER,
} from '../../infra/events/domain-event-publisher.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [MicrocyclesController],
  providers: [
    CreateMicrocycleUseCase,
    ListMicrocyclesUseCase,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    { provide: MICROCYCLE_REPOSITORY, useClass: PrismaMicrocycleRepository },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
  ],
})
export class PeriodizationModule {}
