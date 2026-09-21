import type { LifecycleStatus } from './workout';

export type QuantityUnit = 'g' | 'ml' | 'unidade';

export interface MealFoodInput {
  foodId: string;
  quantityValue: number;
  quantityUnit: QuantityUnit;
  notes?: string;
}

export interface MealInput {
  name: string;
  /** formato HH:mm */
  time: string;
  order: number;
  foods: MealFoodInput[];
  notes?: string;
}

export interface MealFood {
  id: string;
  foodId: string;
  quantityValue: number;
  quantityUnit: QuantityUnit;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  order: number;
  notes?: string;
  foods: MealFood[];
}

export interface Diet {
  id: string;
  studentId: string;
  name: string;
  version: number;
  status: LifecycleStatus;
  notes?: string;
  meals: Meal[];
}

export interface CreateDietInput {
  studentId: string;
  name: string;
  meals: MealInput[];
  notes?: string;
}
