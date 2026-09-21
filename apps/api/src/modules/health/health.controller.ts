import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health-indicator';

/**
 * Sem @UseGuards de propósito — load balancer e orquestrador de container
 * não têm JWT. Fica fora do prefixo /api/v1 (ver main.ts) e fora do
 * TenantContextMiddleware (ver app.module.ts).
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prismaHealth.isHealthy('database')]);
  }
}
