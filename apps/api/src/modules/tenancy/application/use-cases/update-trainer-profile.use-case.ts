import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId, PhoneNumber } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  ITrainerProfileRepository,
  TRAINER_PROFILE_REPOSITORY,
} from '../../domain/repositories/trainer-profile.repository.interface';
import { TrainerProfile } from '../../domain/entities/trainer-profile.entity';

export interface UpdateTrainerProfileInput {
  userId: string;
  tenantId: string;
  cref?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
}

@Injectable()
export class UpdateTrainerProfileUseCase {
  constructor(@Inject(TRAINER_PROFILE_REPOSITORY) private readonly profiles: ITrainerProfileRepository) {}

  async execute(input: UpdateTrainerProfileInput): Promise<Result<void>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    let phone: PhoneNumber | undefined;
    if (input.phone) {
      const phoneResult = PhoneNumber.create(input.phone);
      if (phoneResult.isFailure) return Result.fail(phoneResult.error);
      phone = phoneResult.value;
    }

    const userId = new UniqueEntityId(input.userId);
    const tenantId = tenantIdResult.value;
    const changes = { cref: input.cref, specialty: input.specialty, bio: input.bio, phone };

    let profile = await this.profiles.findByUserId(userId, tenantId);
    if (profile) {
      profile.updateProfile(changes);
    } else {
      profile = TrainerProfile.create({ userId, tenantId, ...changes });
    }

    await this.profiles.save(profile);
    return Result.ok(undefined);
  }
}
