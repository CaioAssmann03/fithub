import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkoutsController } from './presentation/workouts.controller';
import { CreateWorkoutUseCase } from './application/use-cases/create-workout.use-case';
import { PublishWorkoutUseCase } from './application/use-cases/publish-workout.use-case';
import { VersionWorkoutUseCase } from './application/use-cases/version-workout.use-case';
import { ListWorkoutsUseCase } from './application/use-cases/list-workouts.use-case';
import { PrismaWorkoutRepository } from './infrastructure/persistence/prisma-workout.repository';
import { WORKOUT_REPOSITORY } from './domain/repositories/workout.repository.interface';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';
import { PrismaUnitOfWork } from '../../infra/prisma/prisma-unit-of-work';
import { UNIT_OF_WORK } from '../../core/domain/unit-of-work.interface';
import {
  DomainEventPublisherService,
  DOMAIN_EVENT_PUBLISHER,
} from '../../infra/events/domain-event-publisher.service';
import { TokenService } from '../../infra/security/token.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [WorkoutsController],
  providers: [
    CreateWorkoutUseCase,
    PublishWorkoutUseCase,
    VersionWorkoutUseCase,
    ListWorkoutsUseCase,
    PrismaService,
    TenantContextService,
    TransactionContextService,
    TokenService,
    { provide: WORKOUT_REPOSITORY, useClass: PrismaWorkoutRepository },
    { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: DomainEventPublisherService },
  ],
})
export class WorkoutsModule {}
