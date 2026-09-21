import { UniqueEntityId } from '../../../../core/domain/entity';
import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findAllByRecipient(recipientUserId: UniqueEntityId): Promise<Notification[]>;
  findById(id: UniqueEntityId): Promise<Notification | null>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
