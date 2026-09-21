import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class RegisterTrainerDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha precisa de ao menos 8 caracteres' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Nome do negócio precisa de ao menos 2 caracteres' })
  tenantName: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  password: string;

  /** Obrigatório para login de STUDENT (mesmo e-mail pode existir em tenants diferentes); ausente para PERSONAL_TRAINER/PLATFORM_ADMIN. */
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
