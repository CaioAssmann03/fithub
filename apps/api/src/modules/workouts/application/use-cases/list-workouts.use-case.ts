import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IWorkoutRepository, WORKOUT_REPOSITORY } from '../../domain/repositories/workout.repository.interface';
import { Workout } from '../../domain/entities/workout.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class ListWorkoutsUseCase {
  constructor(@Inject(WORKOUT_REPOSITORY) private readonly workouts: IWorkoutRepository) {}

  async byId(workoutId: string, tenantId: string): Promise<Result<Workout>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const workout = await this.workouts.findById(new UniqueEntityId(workoutId), tenantIdResult.value);
    if (!workout) return Result.fail(new DomainError('Treino não encontrado', 'WORKOUT_NOT_FOUND'));

    return Result.ok(workout);
  }

  async activeByStudent(studentId: string, tenantId: string): Promise<Result<Workout[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    return Result.ok(await this.workouts.findActiveByStudent(new UniqueEntityId(studentId), tenantIdResult.value));
  }

  async versionHistory(studentId: string, label: string, tenantId: string): Promise<Result<Workout[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    return Result.ok(
      await this.workouts.findVersionHistory(new UniqueEntityId(studentId), label, tenantIdResult.value),
    );
  }
}
