import { IsInt, IsOptional, Min, Max, IsString, IsNumber } from 'class-validator';

export class CreateFeedbackDto {
  @IsInt() @Min(0) @Max(10) @IsOptional() generalRating?: number;
  @IsInt() @Min(0) @Max(10) @IsOptional() muscleSoreness?: number;
  @IsInt() @Min(0) @Max(10) @IsOptional() difficulty?: number;
  @IsInt() @Min(0) @Max(10) @IsOptional() mood?: number;
  @IsInt() @Min(0) @Max(10) @IsOptional() energy?: number;
  @IsInt() @Min(0) @Max(10) @IsOptional() sleepQuality?: number;
  @IsNumber() @IsOptional() waterIntakeL?: number;
  @IsNumber() @IsOptional() selfReportedWeightKg?: number;
  @IsString() @IsOptional() notes?: string;
}
