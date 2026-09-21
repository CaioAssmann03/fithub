import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, MinLength, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MealFoodDto {
  @IsString() foodId: string;
  @IsNumber() @Min(0.01) quantityValue: number;
  @IsString() quantityUnit: 'g' | 'ml' | 'unidade';
  @IsString() @IsOptional() notes?: string;
}

export class MealDto {
  @IsString() @MinLength(2) name: string;
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/) time: string;
  @IsNumber() order: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealFoodDto) foods: MealFoodDto[];
  @IsString() @IsOptional() notes?: string;
}

export class CreateDietDto {
  @IsString() studentId: string;
  @IsString() @MinLength(2) name: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealDto) meals: MealDto[];
  @IsString() @IsOptional() notes?: string;
}

export class VersionDietDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => MealDto) meals: MealDto[];
}
