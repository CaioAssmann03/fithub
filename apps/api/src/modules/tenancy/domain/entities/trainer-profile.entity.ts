import { Entity, UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId, PhoneNumber } from '../../../../core/domain/shared-value-objects';

export interface TrainerProfileProps {
  userId: UniqueEntityId;
  tenantId: TenantId;
  cref?: string;
  specialty?: string;
  bio?: string;
  avatarFileId?: string;
  phone?: PhoneNumber;
  createdAt: Date;
}

export type CreateTrainerProfileProps = Pick<
  TrainerProfileProps,
  'userId' | 'tenantId' | 'cref' | 'specialty' | 'bio' | 'phone'
>;

/**
 * Entity, não AggregateRoot — sem nenhum domain event catalogado
 * (DDD-MODEL.md, seção 8) para mudança de perfil de personal. `create()`
 * não devolve Result porque não há nenhuma invariante própria pra checar
 * aqui: cref/specialty/bio são texto livre, e `phone` já chega validado
 * como PhoneNumber (mesmo padrão de Student — validação acontece no Use
 * Case, que monta o VO antes de chamar create/updateProfile).
 */
export class TrainerProfile extends Entity<TrainerProfileProps> {
  private constructor(props: TrainerProfileProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateTrainerProfileProps, id?: UniqueEntityId): TrainerProfile {
    return new TrainerProfile({ ...props, createdAt: new Date() }, id);
  }

  /** Reidratação a partir de dado já persistido — sem eventos, diferente de create(). */
  static reconstitute(props: TrainerProfileProps, id: UniqueEntityId): TrainerProfile {
    return new TrainerProfile(props, id);
  }

  updateProfile(changes: Partial<Pick<TrainerProfileProps, 'cref' | 'specialty' | 'bio' | 'phone'>>): void {
    Object.assign(this.props, changes);
  }

  get userId(): UniqueEntityId {
    return this.props.userId;
  }
  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get cref(): string | undefined {
    return this.props.cref;
  }
  get specialty(): string | undefined {
    return this.props.specialty;
  }
  get bio(): string | undefined {
    return this.props.bio;
  }
  get avatarFileId(): string | undefined {
    return this.props.avatarFileId;
  }
  get phone(): PhoneNumber | undefined {
    return this.props.phone;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
