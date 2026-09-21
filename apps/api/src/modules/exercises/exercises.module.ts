import { Module } from '@nestjs/common';
import { ExercisesController } from './presentation/exercises.controller';
import { CreateExerciseUseCase } from './application/use-cases/create-exercise.use-case';
import { ListExercisesUseCase } from './application/use-cases/list-exercises.use-case';
import { EXERCISE_REPOSITORY } from './domain/repositories/exercise.repository.interface';
import { PrismaExerciseRepository } from './infrastructure/persistence/prisma-exercise.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';
import { TransactionContextService } from '../../infra/prisma/transaction-context.service';

@Module({
  controllers: [ExercisesController],
  providers: [
    CreateExerciseUseCase,
    ListExercisesUseCase,
    { provide: EXERCISE_REPOSITORY, useClass: PrismaExerciseRepository },
    PrismaService,
    TenantContextService,
    TransactionContextService,
  ],
})
export class ExercisesModule {}
