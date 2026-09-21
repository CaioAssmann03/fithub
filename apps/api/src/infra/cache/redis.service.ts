import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Cliente único de Redis — cache de agregados do Dashboard (seção 15 do
 * ARCHITECTURE.md), invalidado por Domain Event, não por TTL cego. Nesta
 * etapa só o contador de alunos ativos; os agregados mais pesados
 * (avaliações pendentes, aniversariantes, próximas consultas) entram
 * quando os módulos correspondentes existirem (Assessments, Appointments).
 * Requer o pacote `ioredis`.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  async onModuleDestroy() {
    await this.client.quit();
  }
}
