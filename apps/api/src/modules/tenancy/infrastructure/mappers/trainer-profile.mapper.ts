import { TrainerProfile as PrismaTrainerProfile } from '@prisma/client';
import { TrainerProfile } from '../../domain/entities/trainer-profile.entity';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId, PhoneNumber } from '../../../../core/domain/shared-value-objects';

export class TrainerProfileMapper {
  static toDomain(raw: PrismaTrainerProfile): TrainerProfile {
    const tenantId = TenantId.create(raw.tenantId).value;
    const phone = raw.phone ? PhoneNumber.create(raw.phone).value : undefined;

    return TrainerProfile.reconstitute(
      {
        userId: new UniqueEntityId(raw.userId),
        tenantId,
        cref: raw.cref ?? undefined,
        specialty: raw.specialty ?? undefined,
        bio: raw.bio ?? undefined,
        avatarFileId: raw.avatarFileId ?? undefined,
        phone,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(profile: TrainerProfile) {
    return {
      id: profile.id.toString(),
      userId: profile.userId.toString(),
      tenantId: profile.tenantId.value,
      cref: profile.cref ?? null,
      specialty: profile.specialty ?? null,
      bio: profile.bio ?? null,
      avatarFileId: profile.avatarFileId ?? null,
      phone: profile.phone?.value ?? null,
    };
  }
}
