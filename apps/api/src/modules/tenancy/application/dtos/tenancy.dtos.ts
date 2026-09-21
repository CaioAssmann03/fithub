import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTrainerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'CREF deve ter no máximo 20 caracteres' })
  cref?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Especialidade deve ter no máximo 120 caracteres' })
  specialty?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
