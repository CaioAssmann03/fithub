export interface Feedback {
  id: string;
  studentId: string;
  submittedAt: string;
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

export interface SubmitFeedbackInput {
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
