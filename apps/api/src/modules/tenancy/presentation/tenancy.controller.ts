import { Controller, Get, Put, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../../../shared/guards/jwt-auth.guard';
import { Roles, CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { GetMyTenancyUseCase } from '../application/use-cases/get-my-tenancy.use-case';
import { UpdateTrainerProfileUseCase } from '../application/use-cases/update-trainer-profile.use-case';
import { UpdateTrainerProfileDto } from '../application/dtos/tenancy.dtos';
import { Tenant } from '../domain/entities/tenant.entity';
import { TrainerProfile } from '../domain/entities/trainer-profile.entity';

/**
 * Auto-gestão do personal sobre o próprio tenant — nunca cria nem lista
 * outros tenants (isso é Platform Admin, ver AdminModule). tenantId e
 * userId vêm sempre do JWT via @CurrentUser(), nunca de parâmetro de rota.
 */
@Controller('tenancy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PERSONAL_TRAINER')
export class TenancyController {
  constructor(
    private readonly getMyTenancy: GetMyTenancyUseCase,
    private readonly updateTrainerProfile: UpdateTrainerProfileUseCase,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AccessTokenPayload) {
    const result = await this.getMyTenancy.execute(user.sub, user.tenantId!);
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return toResponse(result.value.tenant, result.value.profile);
  }

  @Put('profile')
  async updateProfile(@Body() dto: UpdateTrainerProfileDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.updateTrainerProfile.execute({
      userId: user.sub,
      tenantId: user.tenantId!,
      ...dto,
    });
    if (result.isFailure) throw new BadRequestException(result.error.message);
    return { success: true };
  }
}

function toResponse(tenant: Tenant, profile: TrainerProfile | null) {
  return {
    tenant: {
      id: tenant.id.toString(),
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
    },
    profile: profile
      ? {
          cref: profile.cref,
          specialty: profile.specialty,
          bio: profile.bio,
          phone: profile.phone?.toDisplay(),
        }
      : null,
  };
}
