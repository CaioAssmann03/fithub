import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkoutAssignedEvent } from '../../../workouts/domain/events/workout.events';
import { STUDENT_REPOSITORY, IStudentRepository } from '../../../students/domain/repositories/student.repository.interface';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import { NotificationChannel } from '../../domain/value-objects/notification.value-objects';

/**
 * Cross-module: injeta STUDENT_REPOSITORY diretamente pra resolver
 * studentId → userId (o aluno só recebe notificação in-app se já tiver
 * acesso ao app — ver Student.linkToUser). Mesma exceção pragmática já
 * documentada em CLAUDE.md (FeedbackModule faz o mesmo, pelo mesmo
 * motivo: precisa de leitura síncrona, não dá pra resolver por evento).
 */
@Injectable()
export class WorkoutEventsHandler {
  constructor(
    private readonly createNotification: CreateNotificationUseCase,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
  ) {}

  @OnEvent(WorkoutAssignedEvent.name)
  async onWorkoutAssigned(event: WorkoutAssignedEvent): Promise<void> {
    if (!event.tenantId) return;

    const tenantIdResult = TenantId.create(event.tenantId);
    if (tenantIdResult.isFailure) return;

    const student = await this.students.findById(new UniqueEntityId(event.studentId), tenantIdResult.value);
    if (!student?.userId) return; // aluno ainda sem acesso ao app — nada a notificar

    await this.createNotification.execute({
      tenantId: event.tenantId,
      recipientUserId: student.userId.toString(),
      channel: NotificationChannel.PUSH,
      type: 'WORKOUT_ASSIGNED',
      payload: { workoutId: event.aggregateId },
    });
  }
}
