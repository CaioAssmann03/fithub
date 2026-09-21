import { Controller, Get, Post, Patch, Body, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { CreateWorkoutUseCase } from '../application/use-cases/create-workout.use-case';
import { PublishWorkoutUseCase } from '../application/use-cases/publish-workout.use-case';
import { VersionWorkoutUseCase } from '../application/use-cases/version-workout.use-case';
import { ListWorkoutsUseCase } from '../application/use-cases/list-workouts.use-case';
import { CreateWorkoutDto, VersionWorkoutDto } from '../application/dtos/workout.dtos';
import { Workout } from '../domain/entities/workout.entity';
import { WorkoutExercise } from '../domain/entities/workout-exercise.entity';
import { SetBlock } from '../domain/entities/set-block.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PERSONAL_TRAINER')
export class WorkoutsController {
  constructor(
    private readonly createWorkout: CreateWorkoutUseCase,
    private readonly publishWorkout: PublishWorkoutUseCase,
    private readonly versionWorkout: VersionWorkoutUseCase,
    private readonly listWorkouts: ListWorkoutsUseCase,
  ) {}

  @Post('workouts')
  async create(@Body() dto: CreateWorkoutDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.createWorkout.execute({ tenantId: user.tenantId!, ...dto });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Get('students/:studentId/workouts')
  async byStudent(@Param('studentId') studentId: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listWorkouts.activeByStudent(studentId, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value.map(toResponse);
  }

  /** Resposta aninhada completa (blocos de série inclusos) — a lista acima continua enxuta de propósito. */
  @Get('workouts/:id')
  async getById(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listWorkouts.byId(id, user.tenantId!);
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return toDetailResponse(result.value);
  }

  @Patch('workouts/:id/publish')
  async publish(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.publishWorkout.execute(id, user.tenantId!);
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }

  /** Cria uma nova versão (v+1) — não edita a atual. Ver Workout.createNewVersion(), Etapa 2. */
  @Post('workouts/:id/versions')
  async createVersion(
    @Param('id') id: string,
    @Body() dto: VersionWorkoutDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const result = await this.versionWorkout.execute(id, user.tenantId!, dto.exercises, {
      microcycleId: dto.microcycleId,
      defaultRestSecondsMin: dto.defaultRestSecondsMin,
      defaultRestSecondsMax: dto.defaultRestSecondsMax,
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }
}

function toResponse(workout: Workout) {
  return {
    id: workout.id.toString(),
    label: workout.label,
    version: workout.version,
    status: workout.status,
    exerciseCount: workout.exercises.length,
  };
}

function toDetailResponse(workout: Workout) {
  return {
    id: workout.id.toString(),
    studentId: workout.studentId.toString(),
    label: workout.label,
    version: workout.version,
    status: workout.status,
    notes: workout.notes,
    microcycleId: workout.microcycleId?.toString(),
    defaultRestSecondsMin: workout.defaultRest?.min,
    defaultRestSecondsMax: workout.defaultRest?.max,
    exercises: workout.exercises.map(toExerciseResponse),
  };
}

function toExerciseResponse(exercise: WorkoutExercise) {
  return {
    id: exercise.id.toString(),
    exerciseId: exercise.exerciseId.toString(),
    order: exercise.order,
    weeklyFrequencyMin: exercise.weeklyFrequency?.min,
    weeklyFrequencyMax: exercise.weeklyFrequency?.max,
    freeformPrescription: exercise.freeformPrescription,
    notes: exercise.notes,
    videoUrl: exercise.videoUrl,
    setBlocks: exercise.setBlocks.map(toSetBlockResponse),
  };
}

function toSetBlockResponse(block: SetBlock) {
  return {
    id: block.id.toString(),
    order: block.order,
    technique: block.technique,
    sets: block.sets,
    repsMin: block.reps.min,
    repsMax: block.reps.max,
    loadType: block.load.type,
    loadValue: block.load.value,
    restSecondsMin: block.rest?.min,
    restSecondsMax: block.rest?.max,
    notes: block.notes,
  };
}
