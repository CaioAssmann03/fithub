import { UniqueEntityId } from '../../../../core/domain/entity';
import { Exercise } from '../entities/exercise.entity';

export interface IExerciseRepository {
  findById(id: UniqueEntityId): Promise<Exercise | null>;
  /** Retorna itens globais (tenantId null) + itens do tenant atual — filtro híbrido já aplicado pela Prisma Extension. */
  findAllVisibleToTenant(): Promise<Exercise[]>;
  save(exercise: Exercise): Promise<void>;
}

export const EXERCISE_REPOSITORY = Symbol('EXERCISE_REPOSITORY');
