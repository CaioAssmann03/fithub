import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { TokenService } from '../../../../infra/security/token.service';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

/**
 * Rotação com detecção de reuso (Etapa 2, seção 6): todo refresh consome
 * o token atual e emite um novo, da mesma família. Se o token
 * apresentado já estiver revogado, é sinal de token roubado sendo
 * reaproveitado — revoga a família inteira e publica
 * RefreshTokenReuseDetectedEvent em vez de simplesmente negar o acesso.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly tokens: TokenService,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(rawToken: string): Promise<Result<RefreshTokenOutput>> {
    const tokenHash = this.tokens.hashRefreshToken(rawToken);
    const existing = await this.users.findRefreshTokenByHash(tokenHash);

    if (!existing) {
      return Result.fail(new DomainError('Refresh token inválido', 'INVALID_REFRESH_TOKEN'));
    }

    if (existing.isRevoked()) {
      await this.users.revokeTokenFamily(existing.familyId);
      const compromisedUser = await this.users.findById(existing.userId);
      if (compromisedUser) {
        compromisedUser.detectRefreshTokenReuse(existing.familyId);
        this.events.publishAll(compromisedUser.pullDomainEvents());
      }
      return Result.fail(new DomainError('Refresh token comprometido — sessão revogada', 'TOKEN_REUSE_DETECTED'));
    }

    if (existing.isExpired()) {
      return Result.fail(new DomainError('Refresh token expirado', 'EXPIRED_REFRESH_TOKEN'));
    }

    const user = await this.users.findById(existing.userId);
    if (!user) {
      return Result.fail(new DomainError('Usuário não encontrado', 'USER_NOT_FOUND'));
    }

    existing.revoke();
    await this.users.saveRefreshToken(existing, user.tenantId?.value ?? null);

    const accessToken = this.tokens.signAccessToken({
      sub: user.id.toString(),
      tenantId: user.tenantId?.value ?? null,
      role: user.role,
    });

    const issued = this.tokens.issueRefreshToken(existing.familyId);
    const newRefreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: issued.tokenHash,
      familyId: issued.familyId,
      expiresAt: issued.expiresAt,
    });
    await this.users.saveRefreshToken(newRefreshToken, user.tenantId?.value ?? null);

    return Result.ok({ accessToken, refreshToken: issued.rawToken });
  }
}
