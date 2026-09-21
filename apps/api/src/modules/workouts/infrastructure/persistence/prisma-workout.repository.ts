import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IWorkoutRepository } from '../../domain/repositories/workout.repository.interface';
import { Workout } from '../../domain/entities/workout.entity';
import { WorkoutMapper } from '../mappers/workout.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { WorkoutStatus } from '../../domain/value-objects/workout.value-objects';

const INCLUDE_EXERCISES_WITH_BLOCKS = { exercises: { include: { setBlocks: true } } };

@Injectable()
export class PrismaWorkoutRepository implements IWorkoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Workout | null> {
    const raw = await this.prisma.currentClient.workout.findFirst({
      where: { id: id.toString(), tenantId: tenantId.value },
      include: INCLUDE_EXERCISES_WITH_BLOCKS,
    });
    return raw ? WorkoutMapper.toDomain(raw) : null;
  }

  async findActiveByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Workout[]> {
    const rows = await this.prisma.currentClient.workout.findMany({
      where: { studentId: studentId.toString(), tenantId: tenantId.value, status: 'ACTIVE' },
      include: INCLUDE_EXERCISES_WITH_BLOCKS,
      orderBy: { label: 'asc' },
    });
    return rows.map(WorkoutMapper.toDomain);
  }

  async findVersionHistory(studentId: UniqueEntityId, label: string, tenantId: TenantId): Promise<Workout[]> {
    const rows = await this.prisma.currentClient.workout.findMany({
      where: { studentId: studentId.toString(), label, tenantId: tenantId.value },
      include: INCLUDE_EXERCISES_WITH_BLOCKS,
      orderBy: { version: 'desc' },
    });
    return rows.map(WorkoutMapper.toDomain);
  }

  async findByStatus(tenantId: TenantId, status: WorkoutStatus): Promise<Workout[]> {
    const rows = await this.prisma.currentClient.workout.findMany({
      where: { tenantId: tenantId.value, status },
      include: INCLUDE_EXERCISES_WITH_BLOCKS,
    });
    return rows.map(WorkoutMapper.toDomain);
  }

  /**
   * Salva o agregado inteiro — Workout + WorkoutExercise + SetBlock
   * juntos, sempre via `currentClient` (participa da transação ativa do
   * Unit of Work, quando houver uma — nunca abre transação própria aqui,
   * ver docs do plano desta etapa: VersionWorkoutUseCase depende de duas
   * chamadas a save() commitando juntas dentro de um uow.run() externo).
   * Estratégia "apagar e recriar" agora em dois níveis: apaga bloco antes
   * de exercício (FK), cria exercício antes de bloco.
   */
  async save(workout: Workout): Promise<void> {
    const data = WorkoutMapper.toPersistence(workout);
    await this.prisma.currentClient.workout.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    await this.prisma.currentClient.setBlock.deleteMany({ where: { workoutExercise: { workoutId: data.id } } });
    await this.prisma.currentClient.workoutExercise.deleteMany({ where: { workoutId: data.id } });

    const exercisesData = WorkoutMapper.exercisesToPersistence(workout);
    if (exercisesData.length > 0) {
      await this.prisma.currentClient.workoutExercise.createMany({ data: exercisesData });
    }

    const setBlocksData = WorkoutMapper.setBlocksToPersistence(workout);
    if (setBlocksData.length > 0) {
      await this.prisma.currentClient.setBlock.createMany({ data: setBlocksData });
    }
  }
}
