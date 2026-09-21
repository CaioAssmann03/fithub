import { DomainEvent } from '../../../../core/domain/domain-event';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string | null,
    public readonly payload: { email: string; role: string },
  ) {
    super(aggregateId, tenantId);
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(aggregateId: string, tenantId: string | null) {
    super(aggregateId, tenantId);
  }
}

/** Crítico: sinaliza possível roubo de token — o handler revoga a família inteira (RefreshTokenUseCase). */
export class RefreshTokenReuseDetectedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string | null,
    public readonly familyId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
