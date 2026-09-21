export type LoadType = 'FIXED_WEIGHT' | 'BODYWEIGHT' | 'PERCENTAGE_1RM';
export type LifecycleStatus = 'ACTIVE' | 'ARCHIVED';

export type SetTechnique =
  | 'STANDARD'
  | 'FEEDER_SET'
  | 'WORKING_SET'
  | 'TOP_SET'
  | 'BACK_OFF_SET'
  | 'DROP_SET'
  | 'REST_PAUSE'
  | 'OTHER';

export interface SetBlockInput {
  technique?: SetTechnique;
  sets: number;
  repsMin: number;
  repsMax: number;
  loadType: LoadType;
  loadValue?: number;
  restSecondsMin?: number;
  restSecondsMax?: number;
  notes?: string;
}

export interface SetBlock extends SetBlockInput {
  id: string;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  order: number;
  setBlocks: SetBlockInput[];
  weeklyFrequencyMin?: number;
  weeklyFrequencyMax?: number;
  /** Só pra itens sem sets/reps de verdade (cardio puro). */
  freeformPrescription?: string;
  /** Dica de execução — diferente de freeformPrescription, que é a prescrição em si. */
  notes?: string;
  videoUrl?: string;
}

export interface WorkoutExerciseDetail extends Omit<WorkoutExerciseInput, 'setBlocks'> {
  id: string;
  setBlocks: SetBlock[];
}

/** Shape enxuto — usado na listagem por aluno. */
export interface Workout {
  id: string;
  label: string;
  version: number;
  status: LifecycleStatus;
  exerciseCount: number;
}

/** Shape completo, com blocos aninhados — usado em GET /workouts/:id. */
export interface WorkoutDetail {
  id: string;
  studentId: string;
  label: string;
  version: number;
  status: LifecycleStatus;
  notes?: string;
  microcycleId?: string;
  defaultRestSecondsMin?: number;
  defaultRestSecondsMax?: number;
  exercises: WorkoutExerciseDetail[];
}

export interface CreateWorkoutInput {
  studentId: string;
  label: string;
  exercises: WorkoutExerciseInput[];
  defaultRestSecondsMin?: number;
  defaultRestSecondsMax?: number;
  microcycleId?: string;
  notes?: string;
}

export interface VersionWorkoutInput {
  exercises: WorkoutExerciseInput[];
  microcycleId?: string;
  defaultRestSecondsMin?: number;
  defaultRestSecondsMax?: number;
}
