import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * `$queryRaw` não passa pelo `$allModels.$allOperations` da Prisma Client
 * Extension (Etapa 4) — só operações de model são interceptadas — então
 * este check funciona sem precisar de um TenantContext ativo, o que não
 * existiria de qualquer forma numa chamada de health check sem JWT.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Banco de dados indisponível', this.getStatus(key, false));
    }
  }
}
