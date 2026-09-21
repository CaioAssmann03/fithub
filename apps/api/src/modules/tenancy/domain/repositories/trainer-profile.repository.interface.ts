import { TrainerProfile } from '../entities/trainer-profile.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export interface ITrainerProfileRepository {
  findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<TrainerProfile | null>;
  save(profile: TrainerProfile): Promise<void>;
}

export const TRAINER_PROFILE_REPOSITORY = Symbol('ITrainerProfileRepository');
