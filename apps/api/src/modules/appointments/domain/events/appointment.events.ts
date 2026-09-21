import { DomainEvent } from '../../../../core/domain/domain-event';
import { UniqueEntityId } from '../../../../core/domain/entity';

export class AppointmentScheduledEvent extends DomainEvent {
  constructor(
    appointmentId: UniqueEntityId,
    tenantId: string | null,
    public readonly studentId: UniqueEntityId,
    public readonly scheduledAt: Date,
  ) {
    super(appointmentId.toString(), tenantId);
  }
}

export class AppointmentCancelledEvent extends DomainEvent {
  constructor(appointmentId: UniqueEntityId, tenantId: string | null) {
    super(appointmentId.toString(), tenantId);
  }
  // NOTA (débito registrado, ver README.md): sem studentId no payload —
  // por isso não existe handler de notificação pra este evento ainda.
}
