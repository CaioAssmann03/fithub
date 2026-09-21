export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'LEGS'
  | 'SHOULDERS'
  | 'ARMS'
  | 'CORE'
  | 'FULL_BODY'
  | 'CARDIO'
  | 'GLUTES'
  | 'CALVES';

export type Equipment = 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'BODYWEIGHT' | 'CABLE' | 'BAND' | 'KETTLEBELL';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment[];
  description?: string;
  tags: string[];
  isGlobal: boolean;
}

export interface CreateExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment[];
  description?: string;
  tags?: string[];
}
