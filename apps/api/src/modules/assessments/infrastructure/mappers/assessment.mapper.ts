import { Assessment as PrismaAssessment } from '@prisma/client';
import { Assessment } from '../../domain/entities/assessment.entity';
import {
  Bmi,
  BmiClassification,
  BodyFatPercentage,
  BodyFatMethod,
  Circumferences,
  Skinfolds,
  CircumferencePoint,
  SkinfoldPoint,
} from '../../domain/value-objects/assessment.value-objects';
import { UniqueEntityId } from '../../../../core/domain/entity';
import { TenantId, Measurement } from '../../../../core/domain/shared-value-objects';

export class AssessmentMapper {
  static toDomain(raw: PrismaAssessment): Assessment {
    const tenantId = TenantId.create(raw.tenantId).value;
    const weight = Measurement.create(Number(raw.weightKg), 'kg').value;
    const height = Measurement.create(Number(raw.heightCm), 'cm').value;
    const bmi = Bmi.fromPersistedValue(Number(raw.bmiValue), raw.bmiClassification as unknown as BmiClassification);
    const bodyFat = raw.bodyFatPercent
      ? BodyFatPercentage.create(Number(raw.bodyFatPercent), raw.bodyFatMethod as unknown as BodyFatMethod)
      : undefined;

    const circumferences = raw.circumferences
      ? Circumferences.create(fromJsonMeasurements(raw.circumferences as Record<string, number>, 'cm'))
      : undefined;
    const skinfolds = raw.skinfolds
      ? Skinfolds.create(fromJsonMeasurements(raw.skinfolds as Record<string, number>, 'mm'))
      : undefined;

    return Assessment.reconstitute(
      {
        tenantId,
        studentId: new UniqueEntityId(raw.studentId),
        date: raw.assessedAt,
        weight,
        height,
        bmi,
        bodyFat,
        circumferences,
        skinfolds: skinfolds as any,
        notes: raw.notes ?? undefined,
        photoIds: [], // fotos vêm de AssessmentPhoto (tabela própria) — carregadas à parte
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPersistence(assessment: Assessment) {
    return {
      id: assessment.id.toString(),
      tenantId: assessment.tenantId.value,
      studentId: assessment.studentId.toString(),
      assessedAt: assessment.date,
      weightKg: assessment.weight.value,
      heightCm: assessment.height.value,
      bmiValue: assessment.bmi.value,
      bmiClassification: assessment.bmi.classification,
      bodyFatPercent: assessment.bodyFat?.value ?? null,
      bodyFatMethod: assessment.bodyFat?.method ?? null,
      circumferences: assessment.circumferences ? toJsonMeasurements(assessment.circumferences.toRecord()) : undefined,
      skinfolds: assessment.skinfolds ? toJsonMeasurements(assessment.skinfolds.toRecord()) : undefined,
      notes: assessment.notes ?? null,
    };
  }
}

/** {"waist": 80.5} do JSONB -> {waist: Measurement} pro Value Object — unidade vem fixa por chamador (cm ou mm). */
function fromJsonMeasurements(
  json: Record<string, number>,
  unit: 'cm' | 'mm',
): Record<string, Measurement> {
  const result: Record<string, Measurement> = {};
  for (const [point, value] of Object.entries(json)) {
    result[point as CircumferencePoint & SkinfoldPoint] = Measurement.create(value, unit).value;
  }
  return result;
}

function toJsonMeasurements(record: Partial<Record<string, Measurement>>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [point, measurement] of Object.entries(record)) {
    if (measurement) result[point] = measurement.value;
  }
  return result;
}
