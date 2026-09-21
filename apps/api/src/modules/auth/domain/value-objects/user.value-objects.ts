export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  PERSONAL_TRAINER = 'PERSONAL_TRAINER',
  STUDENT = 'STUDENT',
}

/**
 * Opaco de propósito: o domínio guarda e compara o hash, mas nunca gera
 * um — isso é Argon2, uma chamada de Infrastructure (ver
 * infra/security/password-hasher.service.ts). O VO só existe pra deixar
 * explícito, no tipo, que essa string não é a senha em texto puro.
 */
export class PasswordHash {
  private constructor(private readonly value: string) {}

  static fromHash(hash: string): PasswordHash {
    return new PasswordHash(hash);
  }

  toString(): string {
    return this.value;
  }
}
