import { Prisma } from '@prisma/client';
import { Notification } from '../../domain/entities/notification.entity';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

export class NotificationMapper {
  static toDomain(raw: any): Notification {
    return Notification.reconstitute(
      {
        tenantId: TenantId.create(raw.tenantId).value,
        recipientUserId: new UniqueEntityId(raw.recipientUserId),
        channel: raw.channel,
        type: raw.type,
        payload: raw.payload ?? {},
        status: raw.status,
        sentAt: raw.sentAt ?? undefined,
        readAt: raw.readAt ?? undefined,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(notification: Notification) {
    return {
      id: notification.id.toString(),
      tenantId: notification.tenantId.value,
      recipientUserId: notification.recipientUserId.toString(),
      channel: notification.channel,
      type: notification.type,
      payload: notification.payload as Prisma.InputJsonValue,
      status: notification.status,
    };
  }
}
