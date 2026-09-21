import { Exercise } from '../../domain/entities/exercise.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export class ExerciseMapper {
  static toDomain(raw: any): Exercise {
    return Exercise.reconstitute(
      {
        tenantId: raw.tenantId ? TenantId.create(raw.tenantId).value : null,
        name: raw.name,
        muscleGroup: raw.muscleGroup,
        equipment: raw.equipment,
        description: raw.description ?? undefined,
        tags: raw.tags ?? [],
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(exercise: Exercise) {
    return {
      id: exercise.id.toString(),
      tenantId: exercise.tenantId?.value ?? null,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      description: exercise.description,
      tags: exercise.tags,
    };
  }
}
