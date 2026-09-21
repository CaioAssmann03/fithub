import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../domain/repositories/tenant.repository.interface';
import {
  ITrainerProfileRepository,
  TRAINER_PROFILE_REPOSITORY,
} from '../../domain/repositories/trainer-profile.repository.interface';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TrainerProfile } from '../../domain/entities/trainer-profile.entity';

export interface GetMyTenancyOutput {
  tenant: Tenant;
  profile: TrainerProfile | null;
}

@Injectable()
export class GetMyTenancyUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
    @Inject(TRAINER_PROFILE_REPOSITORY) private readonly profiles: ITrainerProfileRepository,
  ) {}

  async execute(userId: string, tenantId: string): Promise<Result<GetMyTenancyOutput>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const tenant = await this.tenants.findById(tenantIdResult.value);
    if (!tenant) {
      return Result.fail(new DomainError('Tenant não encontrado', 'TENANT_NOT_FOUND'));
    }

    const profile = await this.profiles.findByUserId(new UniqueEntityId(userId), tenantIdResult.value);

    return Result.ok({ tenant, profile });
  }
}
