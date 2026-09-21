import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StudentCreatedEvent } from '../../../students/domain/events/student.events';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import { NotificationChannel } from '../../domain/value-objects/notification.value-objects';
import {
  ITenantOwnerRepository,
  TENANT_OWNER_REPOSITORY,
} from '../../domain/repositories/tenant-owner.repository.interface';

/**
 * StudentCreatedEvent não carrega o userId de ninguém (só tenantId + dados
 * do aluno recém-criado, que normalmente ainda não tem User vinculado —
 * ver StudentLinkedToUserEvent, que é outro evento). O destinatário aqui
 * é o próprio personal (dono do tenant): confirmação in-app de que o
 * cadastro foi concluído.
 */
@Injectable()
export class StudentEventsHandler {
  constructor(
    private readonly createNotification: CreateNotificationUseCase,
    @Inject(TENANT_OWNER_REPOSITORY) private readonly tenantOwners: ITenantOwnerRepository,
  ) {}

  @OnEvent(StudentCreatedEvent.name)
  async onStudentCreated(event: StudentCreatedEvent): Promise<void> {
    if (!event.tenantId) return;

    const ownerUserId = await this.tenantOwners.findOwnerUserId(event.tenantId);
    if (!ownerUserId) return;

    await this.createNotification.execute({
      tenantId: event.tenantId,
      recipientUserId: ownerUserId,
      channel: NotificationChannel.PUSH,
      type: 'STUDENT_CREATED',
      payload: { studentId: event.aggregateId, name: event.payload.name },
    });
  }
}
