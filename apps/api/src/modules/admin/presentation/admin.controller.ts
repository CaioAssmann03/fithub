import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { ListTenantsUseCase } from '../application/use-cases/list-tenants.use-case';
import { RequestAssistedAccessUseCase } from '../application/use-cases/request-assisted-access.use-case';
import { RequestAssistedAccessDto } from '../application/dtos/admin.dtos';

/**
 * Só Platform Admin — nunca tenant-scoped (é o único papel sem tenantId
 * fixo, ARCHITECTURE.md seção 11). Nenhuma rota aqui aceita tenantId vindo
 * do JWT porque Platform Admin não tem um; tenantId de destino sempre vem
 * explícito no corpo da requisição, como em /assisted-access.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class AdminController {
  constructor(
    private readonly listTenants: ListTenantsUseCase,
    private readonly requestAssistedAccess: RequestAssistedAccessUseCase,
  ) {}

  @Get('tenants')
  async tenants() {
    return this.listTenants.execute();
  }

  @Post('assisted-access')
  async assistedAccess(@Body() dto: RequestAssistedAccessDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.requestAssistedAccess.execute({
      adminUserId: user.sub,
      tenantId: dto.tenantId,
      reason: dto.reason,
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return result.value;
  }
}
