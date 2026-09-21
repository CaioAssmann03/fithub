export interface Food {
  id: string;
  name: string;
  caloriesPer100g?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  isGlobal: boolean;
}

export interface CreateFoodInput {
  name: string;
  caloriesPer100g?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}
