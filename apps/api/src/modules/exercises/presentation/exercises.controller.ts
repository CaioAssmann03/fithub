import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { CreateExerciseUseCase } from '../application/use-cases/create-exercise.use-case';
import { ListExercisesUseCase } from '../application/use-cases/list-exercises.use-case';
import { CreateExerciseDto } from '../application/dtos/exercise.dtos';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { RequestContext } from '../../../infra/prisma/tenant-context.service';
import { Exercise } from '../domain/entities/exercise.entity';

@Controller('exercises')
export class ExercisesController {
  constructor(
    private readonly createExercise: CreateExerciseUseCase,
    private readonly listExercises: ListExercisesUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateExerciseDto, @CurrentUser() user: RequestContext) {
    // PLATFORM_ADMIN cria item global (tenantId null); PERSONAL_TRAINER cria customizado do próprio tenant.
    const tenantId = user.role === 'PLATFORM_ADMIN' ? null : user.tenantId;
    const result = await this.createExercise.execute({ ...dto, tenantId });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return this.toResponse(result.value);
  }

  @Get()
  async list() {
    const exercises = await this.listExercises.execute();
    return exercises.map((e) => this.toResponse(e));
  }

  private toResponse(exercise: Exercise) {
    return {
      id: exercise.id.toString(),
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      description: exercise.description,
      tags: exercise.tags,
      isGlobal: exercise.isGlobal,
    };
  }
}
