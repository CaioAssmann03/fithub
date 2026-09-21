import { Entity, UniqueEntityId } from './entity';
import { DomainEvent } from './domain-event';

/**
 * Toda Aggregate Root acumula os eventos que emite durante seu ciclo de
 * vida em memória. O Unit of Work (Etapa 5) chama pullDomainEvents() só
 * depois que a transação Prisma commitou, e então publica — isso evita
 * publicar um evento de uma mudança que acabou sendo revertida.
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: Props, id?: UniqueEntityId) {
    super(props, id);
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
