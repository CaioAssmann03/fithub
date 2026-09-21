import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IExerciseRepository } from '../../domain/repositories/exercise.repository.interface';
import { Exercise } from '../../domain/entities/exercise.entity';
import { ExerciseMapper } from '../mappers/exercise.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class PrismaExerciseRepository implements IExerciseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId): Promise<Exercise | null> {
    const raw = await this.prisma.client.exercise.findUnique({ where: { id: id.toString() } });
    return raw ? ExerciseMapper.toDomain(raw) : null;
  }

  async findAllVisibleToTenant(): Promise<Exercise[]> {
    // Sem where explícito de tenant — a Prisma Extension (padrão B, catálogo
    // híbrido) já injeta `tenantId = atual OR tenantId IS NULL` sozinha.
    const rows = await this.prisma.client.exercise.findMany({ orderBy: { name: 'asc' } });
    return rows.map(ExerciseMapper.toDomain);
  }

  async save(exercise: Exercise): Promise<void> {
    const data = ExerciseMapper.toPersistence(exercise);
    await this.prisma.client.exercise.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
