import { IsString, IsEnum, IsOptional, IsArray, MinLength } from 'class-validator';
import { MuscleGroup, Equipment } from '../../domain/value-objects/exercise.value-objects';

export class CreateExerciseDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;

  @IsArray()
  @IsEnum(Equipment, { each: true })
  @IsOptional()
  equipment?: Equipment[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
