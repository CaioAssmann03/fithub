import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UniqueEntityId): Promise<User | null> {
    const raw = await this.prisma.currentClient.user.findUnique({ where: { id: id.toString() } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmailInTenant(email: string, tenantId: TenantId): Promise<User | null> {
    const raw = await this.prisma.currentClient.user.findFirst({
      where: { email, tenantId: tenantId.value },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const raw = await this.prisma.currentClient.user.findFirst({
      where: { email, role: { in: ['PERSONAL_TRAINER', 'PLATFORM_ADMIN'] } },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.currentClient.user.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async saveRefreshToken(token: RefreshToken, tenantId: string | null): Promise<void> {
    const data = {
      tenantId,
      userId: token.userId.toString(),
      tokenHash: token.tokenHash,
      familyId: token.familyId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt ?? null,
    };
    // upsert, não create: o mesmo RefreshToken é salvo de novo depois de
    // `.revoke()` (RefreshTokenUseCase), então precisa aceitar update.
    await this.prisma.currentClient.refreshToken.upsert({
      where: { id: token.id.toString() },
      create: { id: token.id.toString(), ...data },
      update: data,
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const raw = await this.prisma.currentClient.refreshToken.findFirst({ where: { tokenHash } });
    if (!raw) return null;

    return RefreshToken.create(
      {
        userId: new UniqueEntityId(raw.userId),
        tokenHash: raw.tokenHash,
        familyId: raw.familyId,
        expiresAt: raw.expiresAt,
        revokedAt: raw.revokedAt ?? undefined,
      },
      new UniqueEntityId(raw.id),
    );
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    await this.prisma.currentClient.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
