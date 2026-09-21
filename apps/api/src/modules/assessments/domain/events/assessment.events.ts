import { DomainEvent } from '../../../../core/domain/domain-event';

export class AssessmentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly payload: {
      studentId: string;
      date: Date;
      weightKg: number;
      bmiValue?: number;
      bodyFatPercent?: number;
    },
  ) {
    super(aggregateId, tenantId);
  }
}

export class AssessmentUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly studentId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
