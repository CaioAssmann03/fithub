import { Inject, Injectable } from '@nestjs/common';
import { IExerciseRepository, EXERCISE_REPOSITORY } from '../../domain/repositories/exercise.repository.interface';
import { Exercise } from '../../domain/entities/exercise.entity';

@Injectable()
export class ListExercisesUseCase {
  constructor(@Inject(EXERCISE_REPOSITORY) private readonly exercises: IExerciseRepository) {}

  async execute(): Promise<Exercise[]> {
    return this.exercises.findAllVisibleToTenant();
  }
}
