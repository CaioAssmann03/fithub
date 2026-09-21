import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { Food } from '../../domain/entities/food.entity';
import { IFoodRepository, FOOD_REPOSITORY } from '../../domain/repositories/food.repository.interface';

export interface CreateFoodInput {
  tenantId: string | null;
  name: string;
  caloriesPer100g?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

@Injectable()
export class CreateFoodUseCase {
  constructor(@Inject(FOOD_REPOSITORY) private readonly foods: IFoodRepository) {}

  async execute(input: CreateFoodInput): Promise<Result<Food>> {
    const tenantIdResult = input.tenantId ? TenantId.create(input.tenantId) : null;
    if (tenantIdResult && tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const foodResult = Food.create({ ...input, tenantId: tenantIdResult ? tenantIdResult.value : null });
    if (foodResult.isFailure) return foodResult;

    await this.foods.save(foodResult.value);
    return foodResult;
  }
}
