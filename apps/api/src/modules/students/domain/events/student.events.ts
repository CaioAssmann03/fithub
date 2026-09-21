import { DomainEvent } from '../../../../core/domain/domain-event';

export class StudentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly payload: { name: string; goal?: string },
  ) {
    super(aggregateId, tenantId);
  }
}

export class StudentProfileUpdatedEvent extends DomainEvent {
  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class StudentDeactivatedEvent extends DomainEvent {
  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class StudentReactivatedEvent extends DomainEvent {
  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class StudentLinkedToUserEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly userId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
