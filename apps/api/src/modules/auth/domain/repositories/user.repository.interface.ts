import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export interface IUserRepository {
  findById(id: UniqueEntityId): Promise<User | null>;

  /** STUDENT: busca escopada a um tenant específico. */
  findByEmailInTenant(email: string, tenantId: TenantId): Promise<User | null>;

  /** PERSONAL_TRAINER / PLATFORM_ADMIN: e-mail é único globalmente (ver database/schema.sql, uq_users_email_trainer_admin). */
  findByEmailGlobal(email: string): Promise<User | null>;

  save(user: User): Promise<void>;

  saveRefreshToken(token: RefreshToken, tenantId: string | null): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeTokenFamily(familyId: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
