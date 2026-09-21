import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { AppointmentType, AppointmentStatus } from '../value-objects/appointment.value-objects';
import { AppointmentScheduledEvent, AppointmentCancelledEvent } from '../events/appointment.events';

export interface AppointmentProps {
  tenantId: TenantId;
  studentId: UniqueEntityId;
  type: AppointmentType;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
}

export class Appointment extends AggregateRoot<AppointmentProps> {
  private constructor(props: AppointmentProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: {
    tenantId: TenantId;
    studentId: UniqueEntityId;
    type: AppointmentType;
    scheduledAt: Date;
    durationMinutes?: number;
    notes?: string;
  }): Result<Appointment> {
    if (props.scheduledAt.getTime() < Date.now()) {
      return Result.fail({ code: 'INVALID_SCHEDULE', message: 'Não é possível agendar no passado.' });
    }

    const appointment = new Appointment({
      tenantId: props.tenantId,
      studentId: props.studentId,
      type: props.type,
      scheduledAt: props.scheduledAt,
      durationMinutes: props.durationMinutes ?? 60,
      status: AppointmentStatus.SCHEDULED,
      notes: props.notes,
      createdAt: new Date(),
    });

    appointment.addDomainEvent(
      new AppointmentScheduledEvent(appointment.id, props.tenantId.value, props.studentId, props.scheduledAt),
    );

    return Result.ok(appointment);
  }

  static reconstitute(props: AppointmentProps, id: UniqueEntityId): Appointment {
    return new Appointment(props, id);
  }

  cancel(): Result<void> {
    if (this.props.status !== AppointmentStatus.SCHEDULED) {
      return Result.fail({ code: 'INVALID_TRANSITION', message: 'Só é possível cancelar um agendamento pendente.' });
    }
    this.props.status = AppointmentStatus.CANCELLED;
    this.addDomainEvent(new AppointmentCancelledEvent(this.id, this.props.tenantId.value));
    return Result.ok(undefined);
  }

  complete(): Result<void> {
    if (this.props.status !== AppointmentStatus.SCHEDULED) {
      return Result.fail({ code: 'INVALID_TRANSITION', message: 'Só é possível concluir um agendamento pendente.' });
    }
    this.props.status = AppointmentStatus.COMPLETED;
    return Result.ok(undefined);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get studentId(): UniqueEntityId {
    return this.props.studentId;
  }
  get type(): AppointmentType {
    return this.props.type;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  get durationMinutes(): number {
    return this.props.durationMinutes;
  }
  get status(): AppointmentStatus {
    return this.props.status;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
}
