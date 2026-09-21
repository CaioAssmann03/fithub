import { Diet } from '../../domain/entities/diet.entity';
import { Meal } from '../../domain/entities/meal.entity';
import { MealFood } from '../../domain/entities/meal-food.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { QuantityUnit } from '../../domain/value-objects/diet.value-objects';

/** Postgres TIME vem como Date com data fixa 1970-01-01 — extrai só HH:mm. */
function timeToString(date: Date): string {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

function stringToTime(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

export class DietMapper {
  static toDomain(raw: any): Diet {
    const meals = (raw.meals ?? [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((meal: any) =>
        Meal.reconstitute(
          {
            name: meal.name,
            time: timeToString(meal.time),
            order: meal.order,
            notes: meal.notes ?? undefined,
            foods: (meal.foods ?? []).map((mf: any) =>
              MealFood.reconstitute(
                {
                  foodId: new UniqueEntityId(mf.foodId),
                  quantityValue: Number(mf.quantityValue),
                  quantityUnit: mf.quantityUnit as QuantityUnit,
                  notes: mf.notes ?? undefined,
                },
                new UniqueEntityId(mf.id),
              ),
            ),
          },
          new UniqueEntityId(meal.id),
        ),
      );

    return Diet.reconstitute(
      {
        tenantId: TenantId.create(raw.tenantId).value,
        studentId: new UniqueEntityId(raw.studentId),
        name: raw.name,
        version: raw.version,
        previousVersionId: raw.previousVersionId ? new UniqueEntityId(raw.previousVersionId) : undefined,
        status: raw.status,
        meals,
        notes: raw.notes ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(diet: Diet) {
    return {
      id: diet.id.toString(),
      tenantId: diet.tenantId.value,
      studentId: diet.studentId.toString(),
      name: diet.name,
      version: diet.version,
      previousVersionId: diet.previousVersionId?.toString(),
      status: diet.status,
      notes: diet.notes,
    };
  }

  static mealsToPersistence(diet: Diet) {
    return diet.meals.map((meal) => ({
      id: meal.id.toString(),
      tenantId: diet.tenantId.value,
      dietId: diet.id.toString(),
      name: meal.name,
      time: stringToTime(meal.time),
      order: meal.order,
      notes: meal.notes,
    }));
  }

  static mealFoodsToPersistence(diet: Diet) {
    return diet.meals.flatMap((meal) =>
      meal.foods.map((mf) => ({
        id: mf.id.toString(),
        tenantId: diet.tenantId.value,
        mealId: meal.id.toString(),
        foodId: mf.foodId.toString(),
        quantityValue: mf.quantityValue,
        quantityUnit: mf.quantityUnit,
        notes: mf.notes,
      })),
    );
  }
}
