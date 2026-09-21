import { Module } from '@nestjs/common';
import { DietsController } from './presentation/diets.controller';
import { CreateDietUseCase } from './application/use-cases/create-diet.use-case';
import { PublishDietUseCase } from './application/use-cases/publish-diet.use-case';
import { VersionDietUseCase } from './application/use-cases/version-diet.use-case';
import { ListDietsUseCase } from './application/use-cases/list-diets.use-case';
import { DIET_REPOSITORY } from './domain/repositories/diet.repository.interface';
import { PrismaDietRepository } from './infrastructure/persistence/prisma-diet.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { DomainEventPublisherService, DOMAIN_EVENT_PUBLISHER } from '../../infra/events/domain-event-publisher.service';

@Module({
  controllers: [DietsController],
  providers: [
    CreateDietUseCase,
    PublishDietUseCase,
    VersionDietUseCase,
    ListDietsUseCase,
    { provide: DIET_REPOSITORY, useClass: PrismaDietRepository },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
    PrismaService,
    TenantContextService,
    TransactionContextService,
  ],
})
export class DietsModule {}
