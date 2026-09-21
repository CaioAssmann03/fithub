import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { ITrainerProfileRepository } from '../../domain/repositories/trainer-profile.repository.interface';
import { TrainerProfile } from '../../domain/entities/trainer-profile.entity';
import { TrainerProfileMapper } from '../mappers/trainer-profile.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaTrainerProfileRepository implements ITrainerProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<TrainerProfile | null> {
    const raw = await this.prisma.currentClient.trainerProfile.findFirst({
      where: { userId: userId.toString(), tenantId: tenantId.value },
    });
    return raw ? TrainerProfileMapper.toDomain(raw) : null;
  }

  async save(profile: TrainerProfile): Promise<void> {
    const data = TrainerProfileMapper.toPersistence(profile);
    await this.prisma.currentClient.trainerProfile.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
