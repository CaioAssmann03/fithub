import { Controller, Get, Patch, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/auth.decorators';
import { AccessTokenPayload } from '../../../infra/security/token.service';
import { ListNotificationsUseCase } from '../application/use-cases/list-notifications.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import { Notification } from '../domain/entities/notification.entity';

/**
 * Sem @Roles — tanto PERSONAL_TRAINER quanto STUDENT recebem notificação
 * (o tipo de evento que gerou cada uma já resolve quem é o destinatário,
 * ver os handlers em application/event-handlers/). Cada usuário só vê e
 * só marca como lida a própria notificação — reforçado no Use Case, não
 * só aqui no controller.
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly markNotificationRead: MarkNotificationReadUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AccessTokenPayload) {
    const notifications = await this.listNotifications.execute(user.sub);
    return notifications.map(toResponse);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.markNotificationRead.execute(id, user.sub);
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return { success: true };
  }
}

function toResponse(notification: Notification) {
  return {
    id: notification.id.toString(),
    channel: notification.channel,
    type: notification.type,
    payload: notification.payload,
    status: notification.status,
    createdAt: notification.createdAt,
  };
}
