import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result, DomainError } from '../../../../core/domain/result';
import { TenantId, Email } from '../../../../core/domain/shared-value-objects';
import { Role, PasswordHash } from '../value-objects/user.value-objects';
import { RefreshToken } from './refresh-token.entity';
import {
  UserRegisteredEvent,
  UserPasswordChangedEvent,
  RefreshTokenReuseDetectedEvent,
} from '../events/user.events';

export interface UserProps {
  tenantId: TenantId | null; // null só quando role = PLATFORM_ADMIN
  email: Email;
  passwordHash: PasswordHash;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export type CreateUserProps = Pick<UserProps, 'tenantId' | 'email' | 'passwordHash' | 'role'>;

/**
 * Aggregate Root do Generic Subdomain Identity (Etapa 2, seção 6).
 * Deliberadamente magro: não sabe assinar JWT nem chamar Argon2 — isso é
 * Infrastructure. O domínio só valida a invariante "admin não tem tenant,
 * o resto tem" e coordena o ciclo de vida de alto nível dos RefreshToken.
 */
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateUserProps, id?: UniqueEntityId): Result<User> {
    if (props.role === Role.PLATFORM_ADMIN && props.tenantId !== null) {
      return Result.fail(new DomainError('PLATFORM_ADMIN não pode ter tenantId', 'ADMIN_WITH_TENANT'));
    }
    if (props.role !== Role.PLATFORM_ADMIN && props.tenantId === null) {
      return Result.fail(new DomainError('Usuário não-admin precisa de tenantId', 'MISSING_TENANT'));
    }

    const isNew = !id;
    const user = new User({ ...props, isActive: true, createdAt: new Date() }, id);

    if (isNew) {
      user.addDomainEvent(
        new UserRegisteredEvent(user.id.toString(), props.tenantId?.value ?? null, {
          email: props.email.value,
          role: props.role,
        }),
      );
    }

    return Result.ok(user);
  }

  /** Reidratação a partir de dado já persistido — sem validação nem eventos, diferente de create(). */
  static reconstitute(props: UserProps, id: UniqueEntityId): User {
    return new User(props, id);
  }

  changePassword(newHash: PasswordHash): void {
    this.props.passwordHash = newHash;
    this.addDomainEvent(new UserPasswordChangedEvent(this.id.toString(), this.props.tenantId?.value ?? null));
  }

  /**
   * Um refresh token reapresentado depois de já revogado é indício de
   * roubo (Etapa 2, seção 6) — a resposta correta é revogar a família
   * inteira, não só o token individual. Quem detecta a reapresentação é o
   * RefreshTokenUseCase (Application layer, que consulta o repositório);
   * este método só formaliza o evento depois que a detecção já aconteceu.
   */
  detectRefreshTokenReuse(familyId: string): void {
    this.addDomainEvent(
      new RefreshTokenReuseDetectedEvent(this.id.toString(), this.props.tenantId?.value ?? null, familyId),
    );
  }

  get tenantId(): TenantId | null {
    return this.props.tenantId;
  }
  get email(): Email {
    return this.props.email;
  }
  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }
  get role(): Role {
    return this.props.role;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
}
