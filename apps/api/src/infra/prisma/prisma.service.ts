import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';
import { TransactionContextService } from './transaction-context.service';
import { tenantScopedExtension } from './tenant-scoped.extension';

function buildExtendedClient(tenantContext: TenantContextService) {
  const base = new PrismaClient();
  const client = base.$extends(tenantScopedExtension(tenantContext));
  return { base, client };
}

/**
 * Client único da aplicação, já com a Prisma Client Extension de tenant
 * aplicada (Etapa 4). Todo repositório injeta isto e usa `.currentClient`
 * (não `.client` direto, e nunca `new PrismaClient()`) — é o que garante
 * tanto a camada 3 de defesa de tenant (seção 11 do ARCHITECTURE.md)
 * quanto a participação correta em transações do Unit of Work.
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly base: PrismaClient;
  public readonly client: ReturnType<typeof buildExtendedClient>['client'];

  constructor(
    tenantContext: TenantContextService,
    private readonly txContext: TransactionContextService,
  ) {
    const { base, client } = buildExtendedClient(tenantContext);
    this.base = base;
    this.client = client;
  }

  /**
   * Usa o client transacional se estivermos dentro de um uow.run(); senão,
   * o client normal. Tipo de retorno fixado em `typeof this.client`
   * (client estendido) em vez de deixar TypeScript inferir a união com
   * `Prisma.TransactionClient` — a união dos dois quebra a inferência de
   * `create`/`update` em várias operações (vira `never`) porque
   * `Prisma.TransactionClient` é o tipo genérico do client BASE, sem os
   * markers de extensão presentes no client estendido. Na prática o `tx`
   * que chega aqui sempre nasce de `this.client.$transaction(...)`
   * (PrismaUnitOfWork), então já é estruturalmente o client estendido —
   * o cast só corrige o tipo pra bater com o que já é verdade em runtime.
   */
  get currentClient(): typeof this.client {
    return (this.txContext.getCurrent() as typeof this.client | undefined) ?? this.client;
  }

  async onModuleDestroy() {
    await this.base.$disconnect();
  }
}
