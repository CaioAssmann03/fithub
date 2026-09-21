import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../infra/security/token.service';
import { TenantContextService } from '../../infra/prisma/tenant-context.service';

/**
 * Deliberadamente um Middleware, não um Guard. Um Guard.canActivate()
 * retorna um boolean e sai — o `TenantContextService.run(ctx, callback)`
 * chamado ali dentro encerraria o contexto do AsyncLocalStorage antes do
 * handler da rota sequer rodar, porque o handler roda DEPOIS do guard
 * retornar, fora da chamada de `run()`. Só o Middleware tem acesso a
 * `next()`, que encadeia o resto do pipeline (guards, interceptors,
 * controller) inteiro dentro da mesma chamada — por isso o `run()`
 * envolve `next()`, não um valor já resolvido. Rotas públicas (login,
 * register) pulam isso via `MiddlewareConsumer.exclude()` no AppModule.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tokens: TokenService,
    private readonly tenantContext: TenantContextService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente');
    }

    try {
      const payload = this.tokens.verifyAccessToken(authHeader.slice('Bearer '.length));
      (req as Request & { user?: unknown }).user = payload;

      this.tenantContext.run(
        {
          userId: payload.sub,
          tenantId: payload.tenantId,
          role: payload.role,
          isPlatformAdmin: payload.role === 'PLATFORM_ADMIN',
        },
        () => {
          next();
          return undefined as never;
        },
      );
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
