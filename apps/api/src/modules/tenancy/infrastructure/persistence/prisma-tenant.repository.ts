import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { ITenantRepository } from '../../domain/repositories/tenant.repository.interface';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantMapper } from '../mappers/tenant.mapper';
import { TenantId } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: TenantId): Promise<Tenant | null> {
    const raw = await this.prisma.currentClient.tenant.findUnique({ where: { id: id.value } });
    return raw ? TenantMapper.toDomain(raw) : null;
  }
}
