import { DomainEvent } from '../../../../core/domain/domain-event';

export class FeedbackSubmittedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly payload: {
      studentId: string;
      generalRating?: number;
      muscleSoreness?: number;
      difficulty?: number;
    },
  ) {
    super(aggregateId, tenantId);
  }
}
