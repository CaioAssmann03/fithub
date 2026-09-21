import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IMicrocycleRepository } from '../../domain/repositories/microcycle.repository.interface';
import { Microcycle } from '../../domain/entities/microcycle.entity';
import { MicrocycleMapper } from '../mappers/microcycle.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaMicrocycleRepository implements IMicrocycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByStudent(studentId: UniqueEntityId, tenantId: TenantId): Promise<Microcycle[]> {
    const rows = await this.prisma.currentClient.microcycle.findMany({
      where: { studentId: studentId.toString(), tenantId: tenantId.value },
      orderBy: { order: 'asc' },
    });
    return rows.map(MicrocycleMapper.toDomain);
  }

  async save(microcycle: Microcycle): Promise<void> {
    const data = MicrocycleMapper.toPersistence(microcycle);
    await this.prisma.currentClient.microcycle.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
