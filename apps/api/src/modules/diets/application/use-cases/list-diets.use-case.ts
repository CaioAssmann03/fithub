import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { DIET_REPOSITORY, IDietRepository } from '../../domain/repositories/diet.repository.interface';
import { Diet } from '../../domain/entities/diet.entity';

@Injectable()
export class ListDietsUseCase {
  constructor(@Inject(DIET_REPOSITORY) private readonly diets: IDietRepository) {}

  async execute(studentId: string, tenantId: string): Promise<Result<Diet[]>> {
    const tenantIdResult = TenantId.create(tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const diets = await this.diets.findAllByStudent(new UniqueEntityId(studentId), tenantIdResult.value);
    return Result.ok(diets);
  }
}
