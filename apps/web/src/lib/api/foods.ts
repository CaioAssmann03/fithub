import type { Food, CreateFoodInput } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function listFoods() {
  return apiFetch<Food[]>('/foods');
}

export function createFood(input: CreateFoodInput) {
  return apiFetch<Food>('/foods', { method: 'POST', body: input });
}
