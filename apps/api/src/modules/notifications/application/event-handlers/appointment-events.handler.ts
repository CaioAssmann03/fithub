import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentScheduledEvent } from '../../../appointments/domain/events/appointment.events';
import { STUDENT_REPOSITORY, IStudentRepository } from '../../../students/domain/repositories/student.repository.interface';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import { NotificationChannel } from '../../domain/value-objects/notification.value-objects';

@Injectable()
export class AppointmentEventsHandler {
  constructor(
    private readonly createNotification: CreateNotificationUseCase,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
  ) {}

  @OnEvent(AppointmentScheduledEvent.name)
  async onAppointmentScheduled(event: AppointmentScheduledEvent): Promise<void> {
    if (!event.tenantId) return;

    const tenantIdResult = TenantId.create(event.tenantId);
    if (tenantIdResult.isFailure) return;

    // event.studentId já é UniqueEntityId aqui — diferente de
    // WorkoutAssignedEvent.studentId, que é string (payload de cada
    // evento reflete como o agregado de origem o construiu).
    const student = await this.students.findById(event.studentId, tenantIdResult.value);
    if (!student?.userId) return; // aluno ainda sem acesso ao app — nada a notificar

    await this.createNotification.execute({
      tenantId: event.tenantId,
      recipientUserId: student.userId.toString(),
      channel: NotificationChannel.PUSH,
      type: 'APPOINTMENT_SCHEDULED',
      payload: { appointmentId: event.aggregateId, scheduledAt: event.scheduledAt },
    });
  }
}
