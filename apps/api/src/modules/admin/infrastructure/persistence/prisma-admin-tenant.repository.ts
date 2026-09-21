import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IAdminTenantRepository, AdminTenantSummary } from '../../domain/repositories/admin-tenant.repository.interface';

@Injectable()
export class PrismaAdminTenantRepository implements IAdminTenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sem where — a Prisma Client Extension (tenant-scoped.extension.ts,
   * Padrão C) só filtra o model Tenant por id quando `!ctx.isPlatformAdmin`;
   * como AdminController exige @Roles('PLATFORM_ADMIN'), o contexto aqui
   * sempre chega com isPlatformAdmin=true, então a extension deixa passar
   * sem filtro — é assim que a listagem enxerga todos os tenants.
   */
  async findAll(): Promise<AdminTenantSummary[]> {
    const rows = await this.prisma.currentClient.tenant.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      plan: row.plan,
      status: row.status,
      ownerUserId: row.ownerUserId,
      createdAt: row.createdAt,
    }));
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.currentClient.tenant.count({ where: { id } });
    return count > 0;
  }
}
