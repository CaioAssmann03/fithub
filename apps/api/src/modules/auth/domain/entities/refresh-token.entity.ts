import { Entity, UniqueEntityId } from '../../../../core/domain/entity';

export interface RefreshTokenProps {
  userId: UniqueEntityId;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

/**
 * Entity, não Aggregate Root: pertence ao ciclo de vida do User, mas tem
 * persistência própria — diferente de WorkoutExercise (filha embutida),
 * porque cresce sem limite (uma linha por login/rotação) e carregar todo
 * o histórico junto do User a cada leitura não faria sentido.
 */
export class RefreshToken extends Entity<RefreshTokenProps> {
  private constructor(props: RefreshTokenProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: Omit<RefreshTokenProps, 'createdAt'>, id?: UniqueEntityId): RefreshToken {
    return new RefreshToken({ ...props, createdAt: new Date() }, id);
  }

  isExpired(): boolean {
    return this.props.expiresAt.getTime() < Date.now();
  }

  isRevoked(): boolean {
    return !!this.props.revokedAt;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(): void {
    this.props.revokedAt = new Date();
  }

  get familyId(): string {
    return this.props.familyId;
  }
  get userId(): UniqueEntityId {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }
}
