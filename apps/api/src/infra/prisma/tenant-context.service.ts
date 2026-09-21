import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  tenantId: string | null; // null só quando role = PLATFORM_ADMIN
  userId: string;
  role: string;
  isPlatformAdmin: boolean;
}

/**
 * Populado por um Guard logo na entrada da requisição, a partir das claims
 * do JWT (seção 11 do ARCHITECTURE.md). Flui implicitamente por toda a
 * call stack sem precisar ser passado manualmente em cada função — é o que
 * a Prisma Client Extension (tenant-scoped.extension.ts) consulta pra
 * injetar o filtro automaticamente.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.als.run(context, callback);
  }

  getContext(): RequestContext | undefined {
    return this.als.getStore();
  }

  hasTenant(): boolean {
    return !!this.getContext()?.tenantId;
  }

  getTenantId(): string {
    const ctx = this.getContext();
    if (!ctx?.tenantId) {
      throw new Error('TenantContext: nenhum tenantId no contexto atual da requisição.');
    }
    return ctx.tenantId;
  }

  isPlatformAdmin(): boolean {
    return this.getContext()?.isPlatformAdmin ?? false;
  }
}
