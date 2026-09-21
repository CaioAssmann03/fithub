import { Inject, Injectable } from '@nestjs/common';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationChannel } from '../../domain/value-objects/notification.value-objects';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';

export interface CreateNotificationInput {
  tenantId: string;
  recipientUserId: string;
  channel: NotificationChannel;
  type: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class CreateNotificationUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository) {}

  async execute(input: CreateNotificationInput): Promise<void> {
    const tenantId = TenantId.create(input.tenantId).value;
    const notification = Notification.create({
      tenantId,
      recipientUserId: new UniqueEntityId(input.recipientUserId),
      channel: input.channel,
      type: input.type,
      payload: input.payload,
    });
    await this.notifications.save(notification);
    // NOTA (débito registrado, ver README.md): fica em status PENDING —
    // não existe worker BullMQ consumindo isso pra efetivamente enviar
    // push/e-mail/whatsapp ainda. O registro em si já é útil (aparece na
    // lista in-app), mas o envio externo é trabalho futuro.
  }
}
