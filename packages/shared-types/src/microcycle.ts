export interface Microcycle {
  id: string;
  studentId: string;
  name: string;
  order: number;
  weeks: number;
  notes?: string;
}

export interface CreateMicrocycleInput {
  name: string;
  order: number;
  weeks: number;
  notes?: string;
}
