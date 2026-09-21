import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Diet } from '../../domain/entities/diet.entity';
import { Meal } from '../../domain/entities/meal.entity';
import { MealFood } from '../../domain/entities/meal-food.entity';
import { DIET_REPOSITORY, IDietRepository } from '../../domain/repositories/diet.repository.interface';
import { IDomainEventPublisher, DOMAIN_EVENT_PUBLISHER } from '../../../../infra/events/domain-event-publisher.service';
import { MealDto } from '../dtos/diet.dtos';

export function buildMealsOrFail(mealDtos: MealDto[]): Result<Meal[]> {
  const meals: Meal[] = [];
  for (const dto of mealDtos) {
    const foods: MealFood[] = [];
    for (const foodDto of dto.foods) {
      const mealFoodResult = MealFood.create({
        foodId: new UniqueEntityId(foodDto.foodId),
        quantityValue: foodDto.quantityValue,
        quantityUnit: foodDto.quantityUnit,
        notes: foodDto.notes,
      });
      if (mealFoodResult.isFailure) return Result.fail(mealFoodResult.error);
      foods.push(mealFoodResult.value);
    }

    const mealResult = Meal.create({ name: dto.name, time: dto.time, order: dto.order, foods, notes: dto.notes });
    if (mealResult.isFailure) return Result.fail(mealResult.error);
    meals.push(mealResult.value);
  }
  return Result.ok(meals);
}

export interface CreateDietInput {
  tenantId: string;
  studentId: string;
  name: string;
  meals: MealDto[];
  notes?: string;
}

@Injectable()
export class CreateDietUseCase {
  constructor(
    @Inject(DIET_REPOSITORY) private readonly diets: IDietRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: CreateDietInput): Promise<Result<Diet>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const dietResult = Diet.create({
      tenantId: tenantIdResult.value,
      studentId: new UniqueEntityId(input.studentId),
      name: input.name,
      notes: input.notes,
    });
    if (dietResult.isFailure) return dietResult;
    const diet = dietResult.value;

    const mealsResult = buildMealsOrFail(input.meals);
    if (mealsResult.isFailure) return Result.fail(mealsResult.error);
    for (const meal of mealsResult.value) {
      const addResult = diet.addMeal(meal);
      if (addResult.isFailure) return Result.fail(addResult.error);
    }

    await this.diets.save(diet);
    this.events.publishAll(diet.pullDomainEvents());
    return Result.ok(diet);
  }
}
