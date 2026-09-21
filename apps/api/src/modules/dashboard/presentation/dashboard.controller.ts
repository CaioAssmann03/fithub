import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { RedisService } from '../../../infra/cache/redis.service';
import { AccessTokenPayload } from '../../../infra/security/token.service';

/**
 * Endpoint mínimo — só existe pra fechar a validação de ponta a ponta
 * desta etapa (é possível LER o que o handler escreveu). Os agregados
 * completos do painel do personal (seção "Painel do Personal" do
 * briefing original) vêm quando os módulos de origem existirem.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly redis: RedisService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: AccessTokenPayload) {
    const activeStudentCount = await this.redis.client.get(
      `tenant:${user.tenantId}:dashboard:activeStudentCount`,
    );
    return { activeStudentCount: Number(activeStudentCount ?? 0) };
  }
}
