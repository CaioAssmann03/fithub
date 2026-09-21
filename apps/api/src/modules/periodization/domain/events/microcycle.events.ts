import { DomainEvent } from '../../../../core/domain/domain-event';

export class MicrocycleCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly payload: { studentId: string; name: string; weeks: number },
  ) {
    super(aggregateId, tenantId);
  }
}
