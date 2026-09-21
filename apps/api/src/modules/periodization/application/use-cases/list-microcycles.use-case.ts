import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Microcycle } from '../../domain/entities/microcycle.entity';
import {
  IMicrocycleRepository,
  MICROCYCLE_REPOSITORY,
} from '../../domain/repositories/microcycle.repository.interface';

@Injectable()
export class ListMicrocyclesUseCase {
  constructor(@Inject(MICROCYCLE_REPOSITORY) private readonly microcycles: IMicrocycleRepository) {}

  async execute(studentId: string, tenantId: string): Promise<Result<Microcycle[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
    return Result.ok(
      await this.microcycles.findAllByStudent(new UniqueEntityId(studentId), tenantIdResult.value),
    );
  }
}
