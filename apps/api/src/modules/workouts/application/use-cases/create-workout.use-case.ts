import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { IWorkoutRepository, WORKOUT_REPOSITORY } from '../../domain/repositories/workout.repository.interface';
import { Workout } from '../../domain/entities/workout.entity';
import { WorkoutExercise } from '../../domain/entities/workout-exercise.entity';
import { SetBlock } from '../../domain/entities/set-block.entity';
import {
  Load,
  LoadType,
  RepRange,
  RestRange,
  WeeklyFrequency,
  SetTechnique,
} from '../../domain/value-objects/workout.value-objects';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { IUnitOfWork, UNIT_OF_WORK } from '../../../../core/domain/unit-of-work.interface';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface SetBlockInput {
  technique?: SetTechnique;
  sets: number;
  repsMin: number;
  repsMax: number;
  loadType: LoadType;
  loadValue?: number;
  restSecondsMin?: number;
  restSecondsMax?: number;
  notes?: string;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  order: number;
  setBlocks: SetBlockInput[];
  weeklyFrequencyMin?: number;
  weeklyFrequencyMax?: number;
  freeformPrescription?: string;
  notes?: string;
  videoUrl?: string;
}

export interface CreateWorkoutInput {
  tenantId: string;
  studentId: string;
  label: string;
  exercises: WorkoutExerciseInput[];
  defaultRestSecondsMin?: number;
  defaultRestSecondsMax?: number;
  microcycleId?: string;
  notes?: string;
}

/**
 * Constrói a lista de WorkoutExercise (com seus SetBlock já anexados) a
 * partir do input — não toca no Workout pai, quem decide se cada
 * exercício pode entrar no agregado (ordem única, EMPTY_PRESCRIPTION) é
 * sempre Workout.addExercise(), chamado pelo Use Case logo em seguida.
 * Mesmo padrão de buildMealsOrFail (módulo Diets).
 */
export function buildExercisesOrFail(inputs: WorkoutExerciseInput[]): Result<WorkoutExercise[]> {
  const exercises: WorkoutExercise[] = [];

  for (const input of inputs) {
    const exerciseResult = WorkoutExercise.create({
      exerciseId: new UniqueEntityId(input.exerciseId),
      order: input.order,
      weeklyFrequency: buildWeeklyFrequency(input.weeklyFrequencyMin, input.weeklyFrequencyMax),
      freeformPrescription: input.freeformPrescription,
      notes: input.notes,
      videoUrl: input.videoUrl,
    });
    if (exerciseResult.isFailure) return Result.fail(exerciseResult.error);
    const exercise = exerciseResult.value;

    for (const [index, blockInput] of input.setBlocks.entries()) {
      const blockResult = SetBlock.create({
        order: index,
        technique: blockInput.technique ?? SetTechnique.STANDARD,
        sets: blockInput.sets,
        reps: RepRange.range(blockInput.repsMin, blockInput.repsMax),
        load: buildLoad(blockInput.loadType, blockInput.loadValue),
        rest: buildRestRange(blockInput.restSecondsMin, blockInput.restSecondsMax),
        notes: blockInput.notes,
      });
      if (blockResult.isFailure) return Result.fail(blockResult.error);

      const addResult = exercise.addSetBlock(blockResult.value);
      if (addResult.isFailure) return Result.fail(addResult.error);
    }

    exercises.push(exercise);
  }

  return Result.ok(exercises);
}

export function buildLoad(type: LoadType, value?: number): Load {
  switch (type) {
    case 'FIXED_WEIGHT':
      return Load.fixedWeight(value ?? 0);
    case 'PERCENTAGE_1RM':
      return Load.percentageOf1RM(value ?? 0);
    default:
      return Load.bodyweight();
  }
}

export function buildRestRange(min?: number, max?: number): RestRange | undefined {
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && max !== undefined) return RestRange.range(min, max);
  return RestRange.fixed((min ?? max) as number);
}

export function buildWeeklyFrequency(min?: number, max?: number): WeeklyFrequency | undefined {
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && max !== undefined) return WeeklyFrequency.range(min, max);
  return WeeklyFrequency.fixed((min ?? max) as number);
}

@Injectable()
export class CreateWorkoutUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
    @Inject(WORKOUT_REPOSITORY) private readonly workouts: IWorkoutRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: CreateWorkoutInput): Promise<Result<{ workoutId: string }>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    return this.uow.run(async () => {
      const workoutResult = Workout.create({
        tenantId: tenantIdResult.value,
        studentId: new UniqueEntityId(input.studentId),
        label: input.label,
        notes: input.notes,
        microcycleId: input.microcycleId ? new UniqueEntityId(input.microcycleId) : undefined,
        defaultRest: buildRestRange(input.defaultRestSecondsMin, input.defaultRestSecondsMax),
      });
      if (workoutResult.isFailure) return Result.fail(workoutResult.error);
      const workout = workoutResult.value;

      const exercisesResult = buildExercisesOrFail(input.exercises);
      if (exercisesResult.isFailure) return Result.fail(exercisesResult.error);

      for (const exercise of exercisesResult.value) {
        const addResult = workout.addExercise(exercise);
        if (addResult.isFailure) return Result.fail(addResult.error);
      }

      await this.workouts.save(workout);
      this.events.publishAll(workout.pullDomainEvents());

      return Result.ok({ workoutId: workout.id.toString() });
    });
  }
}
