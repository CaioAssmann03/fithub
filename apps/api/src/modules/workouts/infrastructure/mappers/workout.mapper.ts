import {
  Workout as PrismaWorkout,
  WorkoutExercise as PrismaWorkoutExercise,
  SetBlock as PrismaSetBlock,
} from '@prisma/client';
import { Workout } from '../../domain/entities/workout.entity';
import { WorkoutExercise } from '../../domain/entities/workout-exercise.entity';
import { SetBlock } from '../../domain/entities/set-block.entity';
import {
  WorkoutStatus,
  Load,
  LoadType,
  RepRange,
  RestRange,
  WeeklyFrequency,
  SetTechnique,
} from '../../domain/value-objects/workout.value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

type PrismaWorkoutExerciseWithBlocks = PrismaWorkoutExercise & { setBlocks: PrismaSetBlock[] };
type PrismaWorkoutWithExercises = PrismaWorkout & { exercises: PrismaWorkoutExerciseWithBlocks[] };

export class WorkoutMapper {
  static toDomain(raw: PrismaWorkoutWithExercises): Workout {
    const tenantId = TenantId.create(raw.tenantId).value;

    const exercises = [...raw.exercises]
      .sort((a, b) => a.order - b.order)
      .map((e) => {
        const setBlocks = [...e.setBlocks]
          .sort((a, b) => a.order - b.order)
          .map((b) =>
            SetBlock.reconstitute(
              {
                order: b.order,
                technique: b.technique as unknown as SetTechnique,
                sets: b.sets,
                reps: RepRange.range(b.repsMin, b.repsMax),
                load: buildLoad(b.loadType as unknown as LoadType, b.loadValue ? Number(b.loadValue) : undefined),
                rest: buildRestRange(b.restSecondsMin ?? undefined, b.restSecondsMax ?? undefined),
                notes: b.notes ?? undefined,
              },
              new UniqueEntityId(b.id),
            ),
          );

        // CORREÇÃO (descoberta expandindo o modelo pra blocos de série):
        // reidratar via create() em vez de reconstitute() era inofensivo
        // enquanto create() não validava nada — deixaria de ser, no
        // momento em que create() passasse a checar algo. reconstitute()
        // é o método certo pra dado que já veio do banco (regra 5 do
        // CLAUDE.md), sem rodar validação nem reemitir evento.
        return WorkoutExercise.reconstitute(
          {
            exerciseId: new UniqueEntityId(e.exerciseId),
            order: e.order,
            setBlocks,
            weeklyFrequency: buildWeeklyFrequency(e.weeklyFrequencyMin ?? undefined, e.weeklyFrequencyMax ?? undefined),
            freeformPrescription: e.freeformPrescription ?? undefined,
            notes: e.notes ?? undefined,
            videoUrl: e.videoUrl ?? undefined,
          },
          new UniqueEntityId(e.id),
        );
      });

    return Workout.reconstitute(
      {
        tenantId,
        studentId: new UniqueEntityId(raw.studentId),
        label: raw.label,
        version: raw.version,
        previousVersionId: raw.previousVersionId ? new UniqueEntityId(raw.previousVersionId) : undefined,
        status: raw.status as unknown as WorkoutStatus,
        exercises,
        notes: raw.notes ?? undefined,
        microcycleId: raw.microcycleId ? new UniqueEntityId(raw.microcycleId) : undefined,
        defaultRest: buildRestRange(raw.defaultRestSecondsMin ?? undefined, raw.defaultRestSecondsMax ?? undefined),
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(workout: Workout) {
    return {
      id: workout.id.toString(),
      tenantId: workout.tenantId.value,
      studentId: workout.studentId.toString(),
      label: workout.label,
      version: workout.version,
      previousVersionId: workout.previousVersionId?.toString() ?? null,
      status: workout.status,
      notes: workout.notes ?? null,
      microcycleId: workout.microcycleId?.toString() ?? null,
      defaultRestSecondsMin: workout.defaultRest?.min ?? null,
      defaultRestSecondsMax: workout.defaultRest?.max ?? null,
    };
  }

  /** Lista plana pronta pro createMany — chamador cuida do deleteMany anterior (repositório). */
  static exercisesToPersistence(workout: Workout) {
    return workout.exercises.map((e) => ({
      id: e.id.toString(),
      tenantId: workout.tenantId.value,
      workoutId: workout.id.toString(),
      exerciseId: e.exerciseId.toString(),
      order: e.order,
      weeklyFrequencyMin: e.weeklyFrequency?.min ?? null,
      weeklyFrequencyMax: e.weeklyFrequency?.max ?? null,
      freeformPrescription: e.freeformPrescription ?? null,
      videoUrl: e.videoUrl ?? null,
      notes: e.notes ?? null,
    }));
  }

  /** Lista plana pronta pro createMany — mesma estratégia apagar-e-recriar, um nível abaixo de exercisesToPersistence. */
  static setBlocksToPersistence(workout: Workout) {
    return workout.exercises.flatMap((e) =>
      e.setBlocks.map((b) => ({
        id: b.id.toString(),
        tenantId: workout.tenantId.value,
        workoutExerciseId: e.id.toString(),
        order: b.order,
        technique: b.technique,
        sets: b.sets,
        repsMin: b.reps.min,
        repsMax: b.reps.max,
        loadType: b.load.type,
        loadValue: b.load.value ?? null,
        restSecondsMin: b.rest?.min ?? null,
        restSecondsMax: b.rest?.max ?? null,
        notes: b.notes ?? null,
      })),
    );
  }
}

function buildLoad(type: LoadType, value?: number): Load {
  switch (type) {
    case 'FIXED_WEIGHT':
      return Load.fixedWeight(value ?? 0);
    case 'PERCENTAGE_1RM':
      return Load.percentageOf1RM(value ?? 0);
    default:
      return Load.bodyweight();
  }
}

function buildRestRange(min?: number, max?: number): RestRange | undefined {
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && max !== undefined) return RestRange.range(min, max);
  return RestRange.fixed((min ?? max) as number);
}

function buildWeeklyFrequency(min?: number, max?: number): WeeklyFrequency | undefined {
  if (min === undefined && max === undefined) return undefined;
  if (min !== undefined && max !== undefined) return WeeklyFrequency.range(min, max);
  return WeeklyFrequency.fixed((min ?? max) as number);
}
