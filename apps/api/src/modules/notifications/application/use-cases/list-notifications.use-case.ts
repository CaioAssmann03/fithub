import { Inject, Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';

@Injectable()
export class ListNotificationsUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository) {}

  async execute(recipientUserId: string): Promise<Notification[]> {
    return this.notifications.findAllByRecipient(new UniqueEntityId(recipientUserId));
  }
}
