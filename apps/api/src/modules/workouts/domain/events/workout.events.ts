import { DomainEvent } from '../../../../core/domain/domain-event';

export class WorkoutCreatedEvent extends DomainEvent {
  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class WorkoutVersionedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly previousVersionId: string,
    public readonly newVersion: number,
  ) {
    super(aggregateId, tenantId);
  }
}

export class WorkoutAssignedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly studentId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class WorkoutArchivedEvent extends DomainEvent {
  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}
