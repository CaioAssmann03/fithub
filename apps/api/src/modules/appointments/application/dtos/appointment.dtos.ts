import { IsUUID, IsEnum, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AppointmentType } from '../../domain/value-objects/appointment.value-objects';

export class CreateAppointmentDto {
  @IsUUID()
  studentId: string;

  @IsEnum(AppointmentType)
  type: AppointmentType;

  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
