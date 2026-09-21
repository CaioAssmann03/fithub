import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FeedbackSubmittedEvent } from '../../../feedback/domain/events/feedback.events';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import { NotificationChannel } from '../../domain/value-objects/notification.value-objects';
import {
  ITenantOwnerRepository,
  TENANT_OWNER_REPOSITORY,
} from '../../domain/repositories/tenant-owner.repository.interface';

/**
 * "Alertar o personal se dor/dificuldade passar de um limiar" é política
 * de Application layer, não invariante do agregado Feedback (DDD-MODEL.md,
 * seção 5) — é exatamente esta checagem. O evento sempre é publicado; é
 * este handler que decide se vira notificação.
 */
const SORENESS_ALERT_THRESHOLD = 8;
const DIFFICULTY_ALERT_THRESHOLD = 8;

@Injectable()
export class FeedbackEventsHandler {
  constructor(
    private readonly createNotification: CreateNotificationUseCase,
    @Inject(TENANT_OWNER_REPOSITORY) private readonly tenantOwners: ITenantOwnerRepository,
  ) {}

  @OnEvent(FeedbackSubmittedEvent.name)
  async onFeedbackSubmitted(event: FeedbackSubmittedEvent): Promise<void> {
    if (!event.tenantId) return;

    const { muscleSoreness, difficulty } = event.payload;
    const exceedsThreshold =
      (muscleSoreness ?? 0) >= SORENESS_ALERT_THRESHOLD || (difficulty ?? 0) >= DIFFICULTY_ALERT_THRESHOLD;
    if (!exceedsThreshold) return;

    const ownerUserId = await this.tenantOwners.findOwnerUserId(event.tenantId);
    if (!ownerUserId) return;

    await this.createNotification.execute({
      tenantId: event.tenantId,
      recipientUserId: ownerUserId,
      channel: NotificationChannel.PUSH,
      type: 'FEEDBACK_THRESHOLD_ALERT',
      payload: { studentId: event.payload.studentId, muscleSoreness, difficulty },
    });
  }
}
