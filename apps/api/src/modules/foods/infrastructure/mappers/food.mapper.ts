import { Food } from '../../domain/entities/food.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export class FoodMapper {
  static toDomain(raw: any): Food {
    return Food.reconstitute(
      {
        tenantId: raw.tenantId ? TenantId.create(raw.tenantId).value : null,
        name: raw.name,
        caloriesPer100g: raw.caloriesPer100g ?? undefined,
        proteinG: raw.proteinG ?? undefined,
        carbsG: raw.carbsG ?? undefined,
        fatG: raw.fatG ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(food: Food) {
    return {
      id: food.id.toString(),
      tenantId: food.tenantId?.value ?? null,
      name: food.name,
      caloriesPer100g: food.caloriesPer100g,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
    };
  }
}
