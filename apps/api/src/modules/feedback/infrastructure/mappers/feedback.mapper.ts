import { Feedback } from '../../domain/entities/feedback.entity';
import { RatingScale } from '../../domain/value-objects/rating-scale.value-object';
import { TenantId } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';

function toScale(value: number | null | undefined): RatingScale | undefined {
  if (value === null || value === undefined) return undefined;
  return RatingScale.create(value).value;
}

export class FeedbackMapper {
  static toDomain(raw: any): Feedback {
    return Feedback.reconstitute(
      {
        tenantId: TenantId.create(raw.tenantId).value,
        studentId: new UniqueEntityId(raw.studentId),
        workoutId: raw.workoutId ? new UniqueEntityId(raw.workoutId) : undefined,
        submittedAt: raw.submittedAt,
        generalRating: toScale(raw.generalRating),
        muscleSoreness: toScale(raw.muscleSoreness),
        difficulty: toScale(raw.difficulty),
        mood: toScale(raw.mood),
        energy: toScale(raw.energy),
        sleepQuality: toScale(raw.sleepQuality),
        waterIntakeL: raw.waterIntakeL ?? undefined,
        selfReportedWeightKg: raw.selfReportedWeightKg ?? undefined,
        notes: raw.notes ?? undefined,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(feedback: Feedback) {
    return {
      id: feedback.id.toString(),
      tenantId: feedback.tenantId.value,
      studentId: feedback.studentId.toString(),
      workoutId: feedback.workoutId?.toString(),
      submittedAt: feedback.submittedAt,
      generalRating: feedback.generalRating?.value,
      muscleSoreness: feedback.muscleSoreness?.value,
      difficulty: feedback.difficulty?.value,
      mood: feedback.mood?.value,
      energy: feedback.energy?.value,
      sleepQuality: feedback.sleepQuality?.value,
      waterIntakeL: feedback.waterIntakeL,
      selfReportedWeightKg: feedback.selfReportedWeightKg,
      notes: feedback.notes,
    };
  }
}
