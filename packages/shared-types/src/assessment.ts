export type BmiClassification = 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
export type BodyFatMethod = 'MANUAL' | 'BIOIMPEDANCE' | 'SKINFOLD_FORMULA';

export interface Assessment {
  id: string;
  studentId: string;
  date: string;
  weightKg: number;
  bmi: { value: number; classification: BmiClassification };
  bodyFatPercent?: number;
}

export interface CreateAssessmentInput {
  studentId: string;
  assessedAt: string;
  weightKg: number;
  heightCm: number;
  bodyFatPercentManual?: number;
  bodyFatMethod?: Extract<BodyFatMethod, 'MANUAL' | 'BIOIMPEDANCE'>;
  skinfolds?: Record<string, number>;
  biologicalSexForFormula?: 'MALE' | 'FEMALE';
  ageYears?: number;
  circumferences?: Record<string, number>;
  notes?: string;
}
