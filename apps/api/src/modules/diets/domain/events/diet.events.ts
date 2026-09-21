import { DomainEvent } from '../../../../core/domain/domain-event';

export class DietCreatedEvent extends DomainEvent {
  constructor(dietId: string, tenantId: string | null) {
    super(dietId, tenantId);
  }
}

export class DietPublishedEvent extends DomainEvent {
  constructor(
    dietId: string,
    tenantId: string | null,
    public readonly studentId: string,
  ) {
    super(dietId, tenantId);
  }
}

export class DietVersionedEvent extends DomainEvent {
  constructor(
    dietId: string,
    tenantId: string | null,
    public readonly previousVersionId: string,
    public readonly version: number,
  ) {
    super(dietId, tenantId);
  }
}

export class DietArchivedEvent extends DomainEvent {
  constructor(dietId: string, tenantId: string | null) {
    super(dietId, tenantId);
  }
}
