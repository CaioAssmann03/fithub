import { UniqueEntityId } from '../../../../core/domain/entity';
import { Food } from '../entities/food.entity';

export interface IFoodRepository {
  findById(id: UniqueEntityId): Promise<Food | null>;
  findAllVisibleToTenant(): Promise<Food[]>;
  save(food: Food): Promise<void>;
}

export const FOOD_REPOSITORY = Symbol('FOOD_REPOSITORY');
