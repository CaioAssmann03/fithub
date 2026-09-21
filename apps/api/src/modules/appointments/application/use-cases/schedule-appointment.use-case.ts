import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Appointment } from '../../domain/entities/appointment.entity';
import {
  IAppointmentRepository,
  APPOINTMENT_REPOSITORY,
} from '../../domain/repositories/appointment.repository.interface';
import { AppointmentType } from '../../domain/value-objects/appointment.value-objects';
import { IDomainEventPublisher, DOMAIN_EVENT_PUBLISHER } from '../../../../infra/events/domain-event-publisher.service';

export interface ScheduleAppointmentInput {
  tenantId: string;
  studentId: string;
  type: AppointmentType;
  scheduledAt: Date;
  durationMinutes?: number;
  notes?: string;
}

@Injectable()
export class ScheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointments: IAppointmentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: ScheduleAppointmentInput): Promise<Result<Appointment>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const appointmentResult = Appointment.create({
      tenantId: tenantIdResult.value,
      studentId: new UniqueEntityId(input.studentId),
      type: input.type,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
    });
    if (appointmentResult.isFailure) return appointmentResult;

    const appointment = appointmentResult.value;
    await this.appointments.save(appointment);
    this.events.publishAll(appointment.pullDomainEvents());

    return Result.ok(appointment);
  }
}
