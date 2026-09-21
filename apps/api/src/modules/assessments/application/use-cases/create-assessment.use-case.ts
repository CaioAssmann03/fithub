import { Injectable, Inject } from '@nestjs/common';
import { Result, DomainError } from '../../../../core/domain/result';
import {
  IAssessmentRepository,
  ASSESSMENT_REPOSITORY,
} from '../../domain/repositories/assessment.repository.interface';
import { Assessment } from '../../domain/entities/assessment.entity';
import { BodyMetricsCalculatorService } from '../../domain/services/body-metrics-calculator.service';
import { BodyFatPercentage, BodyFatMethod, Circumferences, Skinfolds } from '../../domain/value-objects/assessment.value-objects';
import { TenantId, Measurement } from '../../../../core/domain/shared-value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import {
  IDomainEventPublisher,
  DOMAIN_EVENT_PUBLISHER,
} from '../../../../infra/events/domain-event-publisher.service';

export interface CreateAssessmentInput {
  tenantId: string;
  studentId: string;
  assessedAt: Date;
  weightKg: number;
  heightCm: number;
  bodyFatPercentManual?: number;
  bodyFatMethod?: BodyFatMethod;
  skinfolds?: Record<string, number>;
  biologicalSexForFormula?: 'MALE' | 'FEMALE';
  ageYears?: number;
  circumferences?: Record<string, number>;
  notes?: string;
}

@Injectable()
export class CreateAssessmentUseCase {
  private readonly calculator = new BodyMetricsCalculatorService(); // domain service puro, sem DI necessária (Etapa 2)

  constructor(
    @Inject(ASSESSMENT_REPOSITORY) private readonly assessments: IAssessmentRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly events: IDomainEventPublisher,
  ) {}

  async execute(input: CreateAssessmentInput): Promise<Result<{ assessmentId: string }>> {
    const tenantIdResult = TenantId.create(input.tenantId);
    if (tenantIdResult.isFailure) return Result.fail(tenantIdResult.error);

    const weightResult = Measurement.create(input.weightKg, 'kg');
    if (weightResult.isFailure) return Result.fail(weightResult.error);

    const heightResult = Measurement.create(input.heightCm, 'cm');
    if (heightResult.isFailure) return Result.fail(heightResult.error);

    const bmi = this.calculator.calculateBmi(input.weightKg, input.heightCm);

    // Prioridade: se vieram dobras cutâneas, calcula via fórmula (Etapa 2,
    // seção "BodyMetricsCalculatorService"); senão usa o valor manual/
    // bioimpedância informado direto pelo personal.
    let bodyFat: BodyFatPercentage | undefined;
    let skinfoldsVO: Skinfolds | undefined;
    if (input.skinfolds && input.biologicalSexForFormula && input.ageYears) {
      const points = Object.fromEntries(
        Object.entries(input.skinfolds).map(([k, v]) => [k, Measurement.create(v, 'mm').value]),
      );
      skinfoldsVO = Skinfolds.create(points as any);
      bodyFat = this.calculator.calculateBodyFatFromSkinfolds(skinfoldsVO, input.biologicalSexForFormula, input.ageYears);
    } else if (input.bodyFatPercentManual !== undefined && input.bodyFatMethod) {
      bodyFat = BodyFatPercentage.create(input.bodyFatPercentManual, input.bodyFatMethod);
    }

    let circumferencesVO: Circumferences | undefined;
    if (input.circumferences) {
      const points = Object.fromEntries(
        Object.entries(input.circumferences).map(([k, v]) => [k, Measurement.create(v, 'cm').value]),
      );
      circumferencesVO = Circumferences.create(points as any);
    }

    const assessmentResult = Assessment.create({
      tenantId: tenantIdResult.value,
      studentId: new UniqueEntityId(input.studentId),
      date: input.assessedAt,
      weight: weightResult.value,
      height: heightResult.value,
      bmi,
      bodyFat,
      circumferences: circumferencesVO,
      skinfolds: skinfoldsVO,
      notes: input.notes,
    });
    if (assessmentResult.isFailure) return Result.fail(assessmentResult.error);

    const assessment = assessmentResult.value;
    await this.assessments.save(assessment);
    this.events.publishAll(assessment.pullDomainEvents());

    return Result.ok({ assessmentId: assessment.id.toString() });
  }
}
