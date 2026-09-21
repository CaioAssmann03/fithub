import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RefreshTokenReuseDetectedEvent } from '../../../auth/domain/events/user.events';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import { NotificationChannel } from '../../domain/value-objects/notification.value-objects';

@Injectable()
export class AuthEventsHandler {
  constructor(private readonly createNotification: CreateNotificationUseCase) {}

  @OnEvent(RefreshTokenReuseDetectedEvent.name)
  async onRefreshTokenReuseDetected(event: RefreshTokenReuseDetectedEvent): Promise<void> {
    // Notification.tenantId é obrigatório no schema (ver schema.prisma) —
    // um PLATFORM_ADMIN (tenantId null) não pode receber notificação
    // in-app pelo mecanismo atual. Alerta de segurança pra esse caso fica
    // como débito registrado (mesmo padrão do restante do módulo).
    if (!event.tenantId) return;

    // event.aggregateId é o próprio userId (User.detectRefreshTokenReuse
    // publica com this.id.toString()) — o afetado é quem recebe o alerta,
    // sem precisar resolver nada.
    await this.createNotification.execute({
      tenantId: event.tenantId,
      recipientUserId: event.aggregateId,
      channel: NotificationChannel.PUSH,
      type: 'REFRESH_TOKEN_REUSE_DETECTED',
      payload: { familyId: event.familyId },
    });
  }
}
