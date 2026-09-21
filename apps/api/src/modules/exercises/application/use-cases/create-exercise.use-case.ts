import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { Exercise } from '../../domain/entities/exercise.entity';
import { IExerciseRepository, EXERCISE_REPOSITORY } from '../../domain/repositories/exercise.repository.interface';
import { MuscleGroup, Equipment } from '../../domain/value-objects/exercise.value-objects';

export interface CreateExerciseInput {
  tenantId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment[];
  description?: string;
  tags?: string[];
}

@Injectable()
export class CreateExerciseUseCase {
  constructor(@Inject(EXERCISE_REPOSITORY) private readonly exercises: IExerciseRepository) {}

  async execute(input: CreateExerciseInput): Promise<Result<Exercise>> {
    const tenantIdResult = input.tenantId ? TenantId.create(input.tenantId) : null;
    if (tenantIdResult && tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const exerciseResult = Exercise.create({
      tenantId: tenantIdResult ? tenantIdResult.value : null,
      name: input.name,
      muscleGroup: input.muscleGroup,
      equipment: input.equipment,
      description: input.description,
      tags: input.tags,
    });
    if (exerciseResult.isFailure) return exerciseResult;

    await this.exercises.save(exerciseResult.value);
    return exerciseResult;
  }
}
