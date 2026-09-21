import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { Role, PasswordHash } from '../../domain/value-objects/user.value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId, Email } from '../../../../core/domain/shared-value-objects';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    const tenantId = raw.tenantId ? TenantId.create(raw.tenantId).value : null;
    const email = Email.create(raw.email).value;

    return User.reconstitute(
      {
        tenantId,
        email,
        passwordHash: PasswordHash.fromHash(raw.passwordHash),
        role: raw.role as unknown as Role,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(user: User) {
    return {
      id: user.id.toString(),
      tenantId: user.tenantId?.value ?? null,
      email: user.email.value,
      passwordHash: user.passwordHash.toString(),
      role: user.role as unknown as PrismaUserRole,
      isActive: user.isActive,
    };
  }
}
