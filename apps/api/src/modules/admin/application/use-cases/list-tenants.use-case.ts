import { Injectable, Inject } from '@nestjs/common';
import {
  IAdminTenantRepository,
  ADMIN_TENANT_REPOSITORY,
  AdminTenantSummary,
} from '../../domain/repositories/admin-tenant.repository.interface';

@Injectable()
export class ListTenantsUseCase {
  constructor(@Inject(ADMIN_TENANT_REPOSITORY) private readonly tenants: IAdminTenantRepository) {}

  async execute(): Promise<AdminTenantSummary[]> {
    return this.tenants.findAll();
  }
}
