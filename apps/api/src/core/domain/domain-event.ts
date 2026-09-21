export interface IDomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly tenantId: string | null; // null só em evento de PLATFORM_ADMIN (sem tenant)
}

/**
 * Toda regra de negócio relevante que outro módulo possa precisar reagir
 * vira um evento aqui. Publicados via EventEmitter2 na Etapa 5 — esta
 * interface é o único contrato que o domínio conhece; trocar o publisher
 * por um message broker no futuro não toca em nenhuma entidade.
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly occurredAt: Date;

  protected constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string | null,
  ) {
    this.occurredAt = new Date();
  }
}

export interface IDomainEventPublisher {
  publish(event: DomainEvent): void;
  publishAll(events: DomainEvent[]): void;
}
