import { Measurement } from '../../../../core/domain/shared-value-objects';

export enum BmiClassification {
  UNDERWEIGHT = 'UNDERWEIGHT',
  NORMAL = 'NORMAL',
  OVERWEIGHT = 'OVERWEIGHT',
  OBESE = 'OBESE',
}

/**
 * Sempre calculado e guardado como snapshot no momento da avaliação —
 * nunca recalculado depois a partir de altura "atual", porque isso
 * mudaria um registro histórico. Faixas de corte seguem a classificação
 * padrão da OMS para adultos.
 */
export class Bmi {
  private constructor(
    public readonly value: number,
    public readonly classification: BmiClassification,
  ) {}

  static fromWeightAndHeight(weightKg: number, heightCm: number): Bmi {
    const heightM = heightCm / 100;
    const value = Number((weightKg / (heightM * heightM)).toFixed(1));
    return new Bmi(value, Bmi.classify(value));
  }

  /** Reidratação a partir do banco — nunca recalcula, só reconstrói o snapshot já gravado. */
  static fromPersistedValue(value: number, classification: BmiClassification): Bmi {
    return new Bmi(value, classification);
  }

  private static classify(value: number): BmiClassification {
    if (value < 18.5) return BmiClassification.UNDERWEIGHT;
    if (value < 25) return BmiClassification.NORMAL;
    if (value < 30) return BmiClassification.OVERWEIGHT;
    return BmiClassification.OBESE;
  }
}

export enum BodyFatMethod {
  MANUAL = 'MANUAL',
  BIOIMPEDANCE = 'BIOIMPEDANCE',
  SKINFOLD_FORMULA = 'SKINFOLD_FORMULA',
}

export class BodyFatPercentage {
  private constructor(
    public readonly value: number,
    public readonly method: BodyFatMethod,
  ) {}

  static create(value: number, method: BodyFatMethod): BodyFatPercentage {
    return new BodyFatPercentage(value, method);
  }
}

export type CircumferencePoint =
  | 'waist' | 'hip' | 'chest' | 'neck'
  | 'rightArm' | 'leftArm' | 'rightThigh' | 'leftThigh' | 'rightCalf' | 'leftCalf';

export class Circumferences {
  private constructor(private readonly points: Partial<Record<CircumferencePoint, Measurement>>) {}

  static create(points: Partial<Record<CircumferencePoint, Measurement>>): Circumferences {
    return new Circumferences(points);
  }

  get(point: CircumferencePoint): Measurement | undefined {
    return this.points[point];
  }

  toRecord(): Partial<Record<CircumferencePoint, Measurement>> {
    return { ...this.points };
  }
}

export type SkinfoldPoint =
  | 'triceps' | 'subscapular' | 'suprailiac' | 'abdominal' | 'thigh' | 'chest' | 'midaxillary';

/** Protocolo padrão: 3 dobras (ver BodyMetricsCalculatorService) ou 7 dobras para maior precisão. */
export class Skinfolds {
  private constructor(private readonly points: Partial<Record<SkinfoldPoint, Measurement>>) {}

  static create(points: Partial<Record<SkinfoldPoint, Measurement>>): Skinfolds {
    return new Skinfolds(points);
  }

  get(point: SkinfoldPoint): Measurement | undefined {
    return this.points[point];
  }

  sumOfPoints(): number {
    return Object.values(this.points).reduce((sum: number, m) => sum + (m?.value ?? 0), 0);
  }

  toRecord(): Partial<Record<SkinfoldPoint, Measurement>> {
    return { ...this.points };
  }
}
