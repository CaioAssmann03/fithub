import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { ITenantOwnerRepository } from '../../domain/repositories/tenant-owner.repository.interface';

@Injectable()
export class PrismaTenantOwnerRepository implements ITenantOwnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOwnerUserId(tenantId: string): Promise<string | null> {
    const tenant = await this.prisma.currentClient.tenant.findUnique({
      where: { id: tenantId },
      select: { ownerUserId: true },
    });
    return tenant?.ownerUserId ?? null;
  }
}
