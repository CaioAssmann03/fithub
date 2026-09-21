import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHash } from 'crypto';

export interface AccessTokenPayload {
  sub: string; // userId
  tenantId: string | null;
  role: string;
  /** true só num token de acesso assistido (AdminModule) — nunca num login normal. */
  assistedAccess?: boolean;
}

export interface IssuedRefreshToken {
  rawToken: string; // devolvido ao cliente uma única vez, nunca persistido
  tokenHash: string; // o que fica salvo no banco
  familyId: string;
  expiresAt: Date;
}

/**
 * Access token: ~15min, JWT assinado, nunca persistido (seção 14 do
 * ARCHITECTURE.md). Refresh token: valor aleatório opaco (não JWT) — só o
 * hash SHA-256 vai pro banco, então um vazamento do banco não expõe o
 * token em si, só o hash (que sozinho não autentica nada).
 */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload, { expiresIn: '15m' });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify<AccessTokenPayload>(token);
  }

  /**
   * Token de acesso assistido (ARCHITECTURE.md, seção 11): Platform Admin
   * pedindo visão temporária de um tenant específico. Vida curta de
   * propósito (5min, bem menor que o access token normal de 15min) — o
   * fluxo de emissão (AdminModule) já grava o grant em audit_logs antes de
   * devolver o token, nunca depois.
   */
  signAssistedAccessToken(payload: Omit<AccessTokenPayload, 'assistedAccess'>): { token: string; expiresAt: Date } {
    const token = this.jwt.sign({ ...payload, assistedAccess: true }, { expiresIn: '5m' });
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    return { token, expiresAt };
  }

  /** `existingFamilyId` é passado numa rotação — a família só muda quando é revogada por inteiro. */
  issueRefreshToken(existingFamilyId?: string): IssuedRefreshToken {
    const rawToken = randomUUID() + randomUUID();
    const tokenHash = this.hashRefreshToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    return { rawToken, tokenHash, familyId: existingFamilyId ?? randomUUID(), expiresAt };
  }

  hashRefreshToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
