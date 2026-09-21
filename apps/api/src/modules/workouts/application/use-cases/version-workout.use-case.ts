import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IWorkoutRepository, WORKOUT_REPOSITORY } from '../../domain/repositories/workout.repository.interface';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../core/domain/unit-of-work.interface';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';
import { WorkoutExerciseInput, buildExercisesOrFail, buildRestRange } from './create-workout.use-case';

export interface VersionWorkoutOptions {
  microcycleId?: string;
  defaultRestSecondsMin?: number;
  defaultRestSecondsMax?: number;
}

/**
 * Primeira aplicação real do PrismaUnitOfWork fora do fluxo de registro
 * de trainer (Etapa 5a): `createNewVersion()` (Etapa 2) gera DUAS linhas
 * de `workouts` — a atual, agora ARCHIVED, e a nova, ACTIVE — que
 * precisam ser persistidas atomicamente. Se a segunda `save()` falhar
 * depois da primeira, sem transação a versão antiga ficaria arquivada
 * sem substituta.
 */
@Injectable()
export class VersionWorkoutUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(WORKOUT_REPOSITORY) private readonly workouts: IWorkoutRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(
    workoutId: string,
    tenantId: string,
    newExercisesInput: WorkoutExerciseInput[],
    options?: VersionWorkoutOptions,
  ): Promise<Result<{ newWorkoutId: string }>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    return this.uow.run(async () => {
      const current = await this.workouts.findById(new UniqueEntityId(workoutId), tenantIdResult.value);
      if (!current) return Result.fail(new DomainError('Treino não encontrado', 'WORKOUT_NOT_FOUND'));

      const exercisesResult = buildExercisesOrFail(newExercisesInput);
      if (exercisesResult.isFailure) return Result.fail(exercisesResult.error);

      const versionResult = current.createNewVersion(exercisesResult.value, {
        microcycleId: options?.microcycleId ? new UniqueEntityId(options.microcycleId) : undefined,
        defaultRest: buildRestRange(options?.defaultRestSecondsMin, options?.defaultRestSecondsMax),
      });
      if (versionResult.isFailure) return Result.fail(versionResult.error);

      const newWorkout = versionResult.value;

      // Os dois `save()` usam PrismaService.currentClient, que dentro
      // deste uow.run() aponta pro `tx` da transação corrente — as duas
      // linhas commitam juntas ou nenhuma commita.
      await this.workouts.save(current);
      await this.workouts.save(newWorkout);

      this.events.publishAll([...current.pullDomainEvents(), ...newWorkout.pullDomainEvents()]);

      return Result.ok({ newWorkoutId: newWorkout.id.toString() });
    });
  }
}
