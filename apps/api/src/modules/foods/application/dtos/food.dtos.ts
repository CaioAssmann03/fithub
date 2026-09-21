import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateFoodDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsNumber()
  @IsOptional()
  caloriesPer100g?: number;

  @IsNumber()
  @IsOptional()
  proteinG?: number;

  @IsNumber()
  @IsOptional()
  carbsG?: number;

  @IsNumber()
  @IsOptional()
  fatG?: number;
}
