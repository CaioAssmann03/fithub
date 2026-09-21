import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestAssistedAccessDto {
  @IsUUID('4', { message: 'tenantId precisa ser um UUID válido' })
  tenantId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
