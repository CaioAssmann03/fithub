import { IsString, IsUUID, IsDateString, IsOptional, IsNumber, IsIn, IsObject } from 'class-validator';
import { BodyFatMethod } from '../../domain/value-objects/assessment.value-objects';

export class CreateAssessmentDto {
  @IsUUID()
  studentId: string;

  @IsDateString()
  assessedAt: string;

  @IsNumber()
  weightKg: number;

  @IsNumber()
  heightCm: number;

  @IsOptional()
  @IsNumber()
  bodyFatPercentManual?: number; // preenchido quando o método é MANUAL ou BIOIMPEDANCE

  @IsOptional()
  @IsIn(['MANUAL', 'BIOIMPEDANCE'] as BodyFatMethod[])
  bodyFatMethod?: BodyFatMethod;

  @IsOptional()
  @IsObject()
  skinfolds?: Record<string, number>; // se presente, calcula body fat via fórmula em vez do valor manual

  @IsOptional()
  @IsIn(['MALE', 'FEMALE'])
  biologicalSexForFormula?: 'MALE' | 'FEMALE';

  @IsOptional()
  @IsNumber()
  ageYears?: number;

  @IsOptional()
  @IsObject()
  circumferences?: Record<string, number>;

  @IsOptional()
  @IsString()
  notes?: string;
}
