import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { IUserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { PasswordHasherService } from '../../../../infra/security/password-hasher.service';
import { TokenService } from '../../../../infra/security/token.service';

export interface LoginInput {
  email: string;
  password: string;
  tenantId?: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly hasher: PasswordHasherService,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginOutput>> {
    let user: User | null = null;
    if (input.tenantId) {
      const tenantIdResult = TenantId.create(input.tenantId);
      if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);
      user = await this.users.findByEmailInTenant(input.email, tenantIdResult.value);
    } else {
      user = await this.users.findByEmailGlobal(input.email);
    }

    if (!user || !user.isActive) {
      // Mensagem genérica de propósito — não revela se o e-mail existe (evita enumeração de contas)
      return Result.fail(new DomainError('E-mail ou senha inválidos', 'INVALID_CREDENTIALS'));
    }

    const passwordMatches = await this.hasher.verify(user.passwordHash.toString(), input.password);
    if (!passwordMatches) {
      return Result.fail(new DomainError('E-mail ou senha inválidos', 'INVALID_CREDENTIALS'));
    }

    const accessToken = this.tokens.signAccessToken({
      sub: user.id.toString(),
      tenantId: user.tenantId?.value ?? null,
      role: user.role,
    });

    const issued = this.tokens.issueRefreshToken();
    const refreshTokenEntity = RefreshToken.create({
      userId: user.id,
      tokenHash: issued.tokenHash,
      familyId: issued.familyId,
      expiresAt: issued.expiresAt,
    });
    await this.users.saveRefreshToken(refreshTokenEntity, user.tenantId?.value ?? null);

    return Result.ok({ accessToken, refreshToken: issued.rawToken });
  }
}
