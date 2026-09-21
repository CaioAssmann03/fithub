export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type StudentGoalType =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'CONDITIONING'
  | 'REHABILITATION'
  | 'GENERAL_HEALTH'
  | 'OTHER';

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string;
  heightCm?: number;
  goalType?: StudentGoalType;
  goalDetail?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
  status: StudentStatus;
  hasAppAccess: boolean;
}

export interface CreateStudentInput {
  name: string;
  gender: Gender;
  birthDate: string;
  heightCm?: number;
  goalType?: StudentGoalType;
  goalDetail?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
}

export type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'gender' | 'birthDate'>>;

export interface EnableStudentAccessInput {
  email: string;
  password: string;
}
