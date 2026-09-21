import { Workout } from '../entities/workout.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { WorkoutStatus } from '../value-objects/workout.value-objects';

export interface IWorkoutRepository {
  findById(id: UniqueEntityId, tenantId: TenantId): Promise<Workout | null>;
  findActiveByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Workout[]>;
  findVersionHistory(studentId: UniqueEntityId, label: string, tenantId: TenantId): Promise<Workout[]>;
  save(workout: Workout): Promise<void>;
  findByStatus(tenantId: TenantId, status: WorkoutStatus): Promise<Workout[]>;
}

export const WORKOUT_REPOSITORY = Symbol('IWorkoutRepository');
