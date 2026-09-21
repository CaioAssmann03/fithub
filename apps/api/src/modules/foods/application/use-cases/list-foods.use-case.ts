import { Inject, Injectable } from '@nestjs/common';
import { IFoodRepository, FOOD_REPOSITORY } from '../../domain/repositories/food.repository.interface';
import { Food } from '../../domain/entities/food.entity';

@Injectable()
export class ListFoodsUseCase {
  constructor(@Inject(FOOD_REPOSITORY) private readonly foods: IFoodRepository) {}

  async execute(): Promise<Food[]> {
    return this.foods.findAllVisibleToTenant();
  }
}
