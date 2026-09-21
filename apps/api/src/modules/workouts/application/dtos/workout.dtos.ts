import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNumber,
  IsInt,
  IsIn,
  Min,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LoadType, SetTechnique } from '../../domain/value-objects/workout.value-objects';

export class SetBlockInputDto {
  @IsOptional()
  @IsIn(Object.values(SetTechnique))
  technique?: SetTechnique;

  @IsInt()
  @Min(1)
  sets: number;

  @IsNumber()
  repsMin: number;

  @IsNumber()
  repsMax: number;

  @IsIn(['FIXED_WEIGHT', 'BODYWEIGHT', 'PERCENTAGE_1RM'] as LoadType[])
  loadType: LoadType;

  @IsOptional()
  @IsNumber()
  loadValue?: number;

  @IsOptional()
  @IsInt()
  restSecondsMin?: number;

  @IsOptional()
  @IsInt()
  restSecondsMax?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WorkoutExerciseInputDto {
  @IsUUID()
  exerciseId: string;

  @IsNumber()
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetBlockInputDto)
  setBlocks: SetBlockInputDto[];

  @IsOptional()
  @IsInt()
  weeklyFrequencyMin?: number;

  @IsOptional()
  @IsInt()
  weeklyFrequencyMax?: number;

  @IsOptional()
  @IsString()
  freeformPrescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class CreateWorkoutDto {
  @IsUUID()
  studentId: string;

  @IsString()
  @MinLength(1, { message: 'Treino precisa de um nome (ex: "Treino A")' })
  label: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises: WorkoutExerciseInputDto[];

  @IsOptional()
  @IsInt()
  defaultRestSecondsMin?: number;

  @IsOptional()
  @IsInt()
  defaultRestSecondsMax?: number;

  @IsOptional()
  @IsUUID()
  microcycleId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VersionWorkoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseInputDto)
  exercises: WorkoutExerciseInputDto[];

  @IsOptional()
  @IsUUID()
  microcycleId?: string;

  @IsOptional()
  @IsInt()
  defaultRestSecondsMin?: number;

  @IsOptional()
  @IsInt()
  defaultRestSecondsMax?: number;
}
