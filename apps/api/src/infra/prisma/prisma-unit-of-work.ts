import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionContextService } from './transaction-context.service';
import { IUnitOfWork } from '../../core/domain/unit-of-work.interface';

/**
 * Implementado em cima de prisma.$transaction (Etapa 2, seção 8). O ponto
 * que quebra fácil em implementações ingênuas: só envolver o callback num
 * `$transaction(async () => work())` NÃO basta — se os repositórios
 * chamados dentro de `work()` usarem `this.prisma.client` direto (em vez
 * do `tx` da transação), a operação roda fora da transação, silenciosamente,
 * sem erro nenhum. Por isso o `tx` é propagado via TransactionContextService
 * (AsyncLocalStorage) e todo repositório deve ler `PrismaService.currentClient`,
 * nunca `.client` diretamente.
 */
@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
  ) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.client.$transaction((tx) => this.txContext.run(tx as any, work));
  }
}
