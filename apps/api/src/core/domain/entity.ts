import { randomUUID } from 'crypto';

export class UniqueEntityId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value ?? randomUUID();
  }

  toString(): string {
    return this.value;
  }

  equals(other?: UniqueEntityId): boolean {
    if (!other) return false;
    if (!(other instanceof UniqueEntityId)) return false;
    return this.value === other.value;
  }
}

/**
 * Base para toda Entity do domínio. Igualdade por identidade (id), não por
 * valor — é o que diferencia Entity de Value Object (ver value-object.ts).
 */
export abstract class Entity<Props> {
  protected readonly _id: UniqueEntityId;
  protected readonly props: Props;

  protected constructor(props: Props, id?: UniqueEntityId) {
    this._id = id ?? new UniqueEntityId();
    this.props = props;
  }

  get id(): UniqueEntityId {
    return this._id;
  }

  equals(other?: Entity<Props>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    if (!(other instanceof Entity)) return false;
    return this._id.equals(other._id);
  }
}
