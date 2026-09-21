import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Feedback } from '../../domain/entities/feedback.entity';
import { IFeedbackRepository, FEEDBACK_REPOSITORY } from '../../domain/repositories/feedback.repository.interface';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface SubmitFeedbackInput {
  tenantId: string;
  studentId: string;
  generalRating?: number;
  muscleSoreness?: number;
  difficulty?: number;
  mood?: number;
  energy?: number;
  sleepQuality?: number;
  waterIntakeL?: number;
  selfReportedWeightKg?: number;
  notes?: string;
}

@Injectable()
export class SubmitFeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY) private readonly feedbacks: IFeedbackRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: SubmitFeedbackInput): Promise<Result<Feedback>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const feedbackResult = Feedback.create({
      tenantId: tenantIdResult.value,
      studentId: new UniqueEntityId(input.studentId),
      generalRating: input.generalRating,
      muscleSoreness: input.muscleSoreness,
      difficulty: input.difficulty,
      mood: input.mood,
      energy: input.energy,
      sleepQuality: input.sleepQuality,
      waterIntakeL: input.waterIntakeL,
      selfReportedWeightKg: input.selfReportedWeightKg,
      notes: input.notes,
    });
    if (feedbackResult.isFailure) return feedbackResult;

    const feedback = feedbackResult.value;
    await this.feedbacks.save(feedback);
    this.events.publishAll(feedback.pullDomainEvents());

    return feedbackResult;
  }
}
