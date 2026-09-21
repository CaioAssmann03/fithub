import { AggregateRoot } from '../../../../core/domain/aggregate-root';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { Result } from '../../../../core/domain/result';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { RatingScale } from '../value-objects/rating-scale.value-object';
import { FeedbackSubmittedEvent } from '../events/feedback.events';

export interface FeedbackProps {
  tenantId: TenantId;
  studentId: UniqueEntityId;
  workoutId?: UniqueEntityId;
  submittedAt: Date;
  generalRating?: RatingScale;
  muscleSoreness?: RatingScale;
  difficulty?: RatingScale;
  mood?: RatingScale;
  energy?: RatingScale;
  sleepQuality?: RatingScale;
  waterIntakeL?: number;
  selfReportedWeightKg?: number;
  notes?: string;
}

export class Feedback extends AggregateRoot<FeedbackProps> {
  private constructor(props: FeedbackProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: {
    tenantId: TenantId;
    studentId: UniqueEntityId;
    workoutId?: UniqueEntityId;
    generalRating?: number;
    muscleSoreness?: number;
    difficulty?: number;
    mood?: number;
    energy?: number;
    sleepQuality?: number;
    waterIntakeL?: number;
    selfReportedWeightKg?: number;
    notes?: string;
  }): Result<Feedback> {
    const scales: Record<string, RatingScale | undefined> = {};
    for (const key of ['generalRating', 'muscleSoreness', 'difficulty', 'mood', 'energy', 'sleepQuality'] as const) {
      const raw = props[key];
      if (raw === undefined) continue;
      const result = RatingScale.create(raw);
      if (result.isFailure) return Result.fail(result.error);
      scales[key] = result.value;
    }

    const feedback = new Feedback({
      tenantId: props.tenantId,
      studentId: props.studentId,
      workoutId: props.workoutId,
      submittedAt: new Date(),
      generalRating: scales.generalRating,
      muscleSoreness: scales.muscleSoreness,
      difficulty: scales.difficulty,
      mood: scales.mood,
      energy: scales.energy,
      sleepQuality: scales.sleepQuality,
      waterIntakeL: props.waterIntakeL,
      selfReportedWeightKg: props.selfReportedWeightKg,
      notes: props.notes,
    });

    // O limiar de dor/dificuldade que decide se isso vira alerta pro
    // personal NÃO é checado aqui — é política do Notifications
    // (Application layer), não invariante do agregado. Ver DDD-MODEL.md,
    // seção 5 "Feedback", e FeedbackEventsHandler.
    feedback.addDomainEvent(
      new FeedbackSubmittedEvent(feedback.id.toString(), props.tenantId.value, {
        studentId: props.studentId.toString(),
        generalRating: scales.generalRating?.value,
        muscleSoreness: scales.muscleSoreness?.value,
        difficulty: scales.difficulty?.value,
      }),
    );

    return Result.ok(feedback);
  }

  static reconstitute(props: FeedbackProps, id: UniqueEntityId): Feedback {
    return new Feedback(props, id);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get studentId(): UniqueEntityId {
    return this.props.studentId;
  }
  get workoutId(): UniqueEntityId | undefined {
    return this.props.workoutId;
  }
  get submittedAt(): Date {
    return this.props.submittedAt;
  }
  get generalRating(): RatingScale | undefined {
    return this.props.generalRating;
  }
  get muscleSoreness(): RatingScale | undefined {
    return this.props.muscleSoreness;
  }
  get difficulty(): RatingScale | undefined {
    return this.props.difficulty;
  }
  get mood(): RatingScale | undefined {
    return this.props.mood;
  }
  get energy(): RatingScale | undefined {
    return this.props.energy;
  }
  get sleepQuality(): RatingScale | undefined {
    return this.props.sleepQuality;
  }
  get waterIntakeL(): number | undefined {
    return this.props.waterIntakeL;
  }
  get selfReportedWeightKg(): number | undefined {
    return this.props.selfReportedWeightKg;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
}
