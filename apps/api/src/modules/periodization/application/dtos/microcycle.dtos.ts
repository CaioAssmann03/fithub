import { IsString, IsInt, IsOptional, Min, MinLength } from 'class-validator';

export class CreateMicrocycleDto {
  @IsString()
  @MinLength(1, { message: 'Nome do microciclo é obrigatório' })
  name: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsInt()
  @Min(1, { message: 'Microciclo precisa de ao menos 1 semana' })
  weeks: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
