import { Inject, Injectable } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(@Inject(NOTIFICATION_REPOSITORY) private readonly notifications: INotificationRepository) {}

  /**
   * `recipientUserId` é o usuário autenticado fazendo a chamada — checado
   * contra o dono real da notificação antes de marcar como lida. Sem
   * isso, qualquer usuário autenticado poderia marcar como lida a
   * notificação de qualquer outro (basta acertar o UUID). Mesma
   * mensagem/código de erro pra "não existe" e "não é sua", de propósito
   * — não revela a existência de uma notificação de outro usuário (mesmo
   * raciocínio do LoginUseCase pra credenciais inválidas).
   */
  async execute(notificationId: string, recipientUserId: string): Promise<Result<void>> {
    const notification = await this.notifications.findById(new UniqueEntityId(notificationId));
    if (!notification || notification.recipientUserId.toString() !== recipientUserId) {
      return Result.fail(new DomainError('Notificação não encontrada', 'NOT_FOUND'));
    }

    notification.markRead();
    await this.notifications.save(notification);
    return Result.ok(undefined);
  }
}
