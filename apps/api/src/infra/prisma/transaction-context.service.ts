import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import type { Prisma } from '@prisma/client';

/**
 * Espelha o TenantContextService (tenant-context.service.ts), mas pro
 * cliente transacional do Prisma. `PrismaUnitOfWork` popula isso durante
 * `$transaction()`; `PrismaService.currentClient` consulta aqui antes de
 * cair pro client base — é o que faz uma operação chamada de dentro de
 * `uow.run()`, várias camadas de repositório abaixo, realmente participar
 * da transação em vez de rodar solta e silenciosamente fora dela.
 */
@Injectable()
export class TransactionContextService {
  private readonly als = new AsyncLocalStorage<Prisma.TransactionClient>();

  run<T>(tx: Prisma.TransactionClient, callback: () => Promise<T>): Promise<T> {
    return this.als.run(tx, callback);
  }

  getCurrent(): Prisma.TransactionClient | undefined {
    return this.als.getStore();
  }
}
