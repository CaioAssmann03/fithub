import { IsString, IsEnum, IsDateString, IsOptional, IsNumber, IsEmail, MinLength } from 'class-validator';
import { Gender, StudentGoalType } from '../../domain/value-objects/student.value-objects';

export class CreateStudentDto {
  @IsString()
  @MinLength(2, { message: 'Nome deve ter ao menos 2 caracteres' })
  name: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsEnum(StudentGoalType)
  goalType?: StudentGoalType;

  @IsOptional()
  @IsString()
  goalDetail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class EnableStudentAccessDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha precisa de ao menos 8 caracteres' })
  password: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsEnum(StudentGoalType)
  goalType?: StudentGoalType;

  @IsOptional()
  @IsString()
  goalDetail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
