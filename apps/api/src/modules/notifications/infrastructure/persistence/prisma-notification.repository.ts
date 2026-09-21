import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationMapper } from '../mappers/notification.mapper';
import { UniqueEntityId } from '../../../../core/domain/entity';

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: Notification): Promise<void> {
    const data = NotificationMapper.toPersistence(notification);
    await this.prisma.currentClient.notification.upsert({ where: { id: data.id }, create: data, update: data });
  }

  async findAllByRecipient(recipientUserId: UniqueEntityId): Promise<Notification[]> {
    const rows = await this.prisma.currentClient.notification.findMany({
      where: { recipientUserId: recipientUserId.toString() },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(NotificationMapper.toDomain);
  }

  async findById(id: UniqueEntityId): Promise<Notification | null> {
    const raw = await this.prisma.currentClient.notification.findUnique({ where: { id: id.toString() } });
    return raw ? NotificationMapper.toDomain(raw) : null;
  }
}
